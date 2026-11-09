// p1-sync — link P1 Travel events onto our fixtures.
//
// Body: none. Auth: authenticated admin, or the nightly pg_cron job.
//
// Scope (decided with KAISEN): only football fixtures and F1 races we already
// list. Football matches onto our schedule fixtures by team pair + date (same
// matcher as Travel Connection). F1 matches onto our race events by weekend;
// when a race in our F1 menu has no event row yet (e.g. next season before
// Jolpica publishes it), the race is created from the menu entry so its page
// can show P1 tickets.
//
// Prices and stock are NOT stored here — p1-tickets fetches them live.
// Admin decisions are sticky: 'manual' links and 'ignored' events stay.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdminOrCron } from "../_shared/auth.ts";
import { FootballMatcher, matchF1, type OurEvent, type MatchResult } from "../_shared/tc_match.ts";
import { P1Client, isP1F1, isP1Football, type P1Event } from "../_shared/p1.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// deno-lint-ignore no-explicit-any
type Admin = SupabaseClient<any, "public", any>;

const DAY_MS = 86_400_000;
const F1_WINDOW_DAYS = 4;
const MONTHS_SV: Record<string, number> = {
  januari: 0, februari: 1, mars: 2, april: 3, maj: 4, juni: 5,
  juli: 6, augusti: 7, september: 8, oktober: 9, november: 10, december: 11,
};

/** "6 juni 2027" / "01 augusti 2027" -> Date (UTC midday), else null. */
export function parseSwedishDate(text: string | null | undefined): Date | null {
  const m = (text ?? "").toLowerCase().match(/(\d{1,2})\s+([a-zåäö]+)\s+(20\d{2})/);
  if (!m || MONTHS_SV[m[2]] === undefined) return null;
  return new Date(Date.UTC(Number(m[3]), MONTHS_SV[m[2]], Number(m[1]), 12));
}

/** Race day for a P1 F1 event: the weekend's end when given, else its start. */
const raceDay = (e: P1Event): Date => new Date(e.end ?? e.start);

interface NavRace {
  name: string;
  date: Date;
  city: string | null;
  venue: string | null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin: Admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let logId: string | null = null;

  try {
    const caller = await requireAdminOrCron(req, admin);
    const trigger = caller.kind === "cron" ? "cron" : "manual";
    const { data: log } = await admin
      .from("supplier_sync_log")
      .insert({ source: "p1", resource_type: "events", trigger, status: "running" })
      .select("id")
      .single();
    logId = log?.id ?? null;

    const p1 = new P1Client();
    const now = new Date();
    const till = new Date(now.getTime() + 540 * DAY_MS);
    const p1Events = await p1.searchEvents({ from: now.toISOString(), till: till.toISOString() });

    // Our upcoming fixtures (schedule sources, supplier-seeded cups, and races
    // this sync created earlier).
    const { data: ours, error: oursErr } = await admin
      .from("events")
      .select("id, sport, home_team, away_team, race_name, starts_at, external_tournament_id")
      .eq("status", "upcoming")
      .gte("starts_at", new Date(now.getTime() - DAY_MS).toISOString());
    if (oursErr) throw new Error(`events: ${oursErr.message}`);
    const ourEvents = (ours ?? []) as OurEvent[];

    // The F1 races in our menu (for creating missing race events).
    const { data: f1Sport } = await admin.from("nav_sports").select("id").eq("slug", "f1").maybeSingle();
    const { data: navRows } = f1Sport
      ? await admin.from("nav_menu_entries").select("name, date_text, city, venue").eq("sport_id", f1Sport.id).eq("is_active", true)
      : { data: [] };
    const navRaces: NavRace[] = ((navRows ?? []) as { name: string; date_text: string | null; city: string | null; venue: string | null }[])
      .map((r) => ({ name: r.name, date: parseSwedishDate(r.date_text), city: r.city, venue: r.venue }))
      .filter((r): r is NavRace => r.date !== null);

    // Sticky admin decisions.
    const { data: existing } = await admin.from("p1_event_links").select("p1_event_id, event_id, match_method");
    const sticky = new Map<string, { event_id: string | null; match_method: string }>();
    for (const r of (existing ?? []) as { p1_event_id: string; event_id: string | null; match_method: string }[]) {
      if (r.match_method === "manual" || r.match_method === "ignored") sticky.set(r.p1_event_id, r);
    }
    const taken = new Set<string>([...sticky.values()].map((s) => s.event_id).filter((id): id is string => !!id));

    const matcher = new FootballMatcher(ourEvents);
    const stats = { fetched: p1Events.length, football: 0, f1: 0, other: 0, matched: 0, created: 0, unmatched: 0, kept_manual: 0 };
    const rows: Record<string, unknown>[] = [];

    for (const e of p1Events) {
      const kind = isP1Football(e) ? "football" : isP1F1(e) ? "f1" : "other";
      stats[kind]++;
      const base = {
        p1_event_id: e.id,
        in_scope: kind !== "other",
        p1_kind: kind,
        p1_title: e.title,
        p1_series: e.series?.name ?? null,
        p1_home_team: e.homeTeam?.name ?? null,
        p1_away_team: e.awayTeam?.name ?? null,
        p1_starts_at: e.start,
        p1_venue: e.venue?.name ?? null,
        p1_date_confirmed: e.isDateConfirmed,
        last_seen_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const keep = sticky.get(e.id);
      if (keep) {
        stats.kept_manual++;
        rows.push({ ...base, event_id: keep.event_id, match_method: keep.match_method, match_note: null });
        continue;
      }
      if (kind === "other") {
        rows.push({ ...base, event_id: null, match_method: "none", match_note: "Utanför sortimentet (inte fotboll/F1)" });
        continue;
      }

      let result: MatchResult;
      let method = "auto";
      if (kind === "football") {
        result = matcher.match(e.homeTeam!.name, e.awayTeam!.name, new Date(e.start), taken);
      } else {
        result = matchF1(ourEvents, raceDay(e), taken);
        if (!result.eventId) {
          // No race row yet: create it from our F1 menu when the weekend lines up.
          const day = raceDay(e).getTime();
          const nav = navRaces.find((r) => Math.abs(r.date.getTime() - day) / DAY_MS <= F1_WINDOW_DAYS);
          if (nav) {
            const [city, country] = (nav.city ?? "").split(",").map((s) => s.trim());
            const year = new Date(day).getUTCFullYear();
            const { data: created, error } = await admin
              .from("events")
              .upsert({
                source: "p1",
                external_event_id: `p1_${e.id}`,
                external_tournament_id: String(year),
                sport: "formula1",
                tournament_name: `Formel 1 ${year}`,
                home_team: null,
                away_team: null,
                race_name: nav.name,
                venue_name: nav.venue ?? e.venue?.name ?? null,
                city: city || null,
                country: country || null,
                starts_at: e.end ?? e.start,
                ends_at: null,
                cover_image_url: null,
                status: "upcoming",
                description: null,
                last_synced_at: now.toISOString(),
              }, { onConflict: "external_event_id" })
              .select("id")
              .single();
            if (error) throw new Error(`create race ${nav.name}: ${error.message}`);
            result = { eventId: created.id, note: null };
            method = "created";
            stats.created++;
          }
        }
      }

      if (result.eventId) {
        taken.add(result.eventId);
        stats.matched++;
        rows.push({ ...base, event_id: result.eventId, match_method: method, match_note: null });
      } else {
        stats.unmatched++;
        rows.push({ ...base, event_id: null, match_method: "none", match_note: result.note });
      }
    }

    // Release event ids first so a re-match can't trip the unique index.
    const autoIds = rows.filter((r) => r.match_method !== "manual" && r.match_method !== "ignored").map((r) => r.p1_event_id as string);
    for (let i = 0; i < autoIds.length; i += 200) {
      const { error } = await admin.from("p1_event_links").update({ event_id: null }).in("p1_event_id", autoIds.slice(i, i + 200));
      if (error) throw new Error(`release links: ${error.message}`);
    }
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await admin.from("p1_event_links").upsert(rows.slice(i, i + 200), { onConflict: "p1_event_id" });
      if (error) throw new Error(`p1_event_links upsert: ${error.message}`);
    }

    if (logId) {
      await admin.from("supplier_sync_log").update({
        finished_at: new Date().toISOString(),
        status: "success",
        records_fetched: stats.fetched,
        records_upserted: stats.matched + stats.kept_manual,
      }).eq("id", logId);
    }
    return json({ environment: p1.environment, stats });
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[p1-sync]", message);
    if (logId) {
      await admin.from("supplier_sync_log").update({
        finished_at: new Date().toISOString(),
        status: "failed",
        error_message: message.slice(0, 1000),
      }).eq("id", logId);
    }
    return json({ error: message }, 400);
  }
});
