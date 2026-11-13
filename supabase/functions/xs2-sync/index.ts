// xs2-sync — link XS2Event events onto our fixtures (read-only supplier).
//
// Body: none. Auth: authenticated admin, or the nightly pg_cron job.
//
// Scope (same as P1): only football fixtures and F1 races we already list.
// Football matches by team pair + date (the Travel Connection matcher), F1
// by race weekend. XS2 never creates events — every game it sells that we
// don't list stays unlinked.
//
// Prices and stock are NOT stored here — event-tickets fetches them live.
// Admin decisions are sticky: 'manual' links and 'ignored' events stay.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdminOrCron } from "../_shared/auth.ts";
import { FootballMatcher, matchF1, type OurEvent, type MatchResult } from "../_shared/tc_match.ts";
import { Xs2Client, type Xs2Event } from "../_shared/xs2.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// deno-lint-ignore no-explicit-any
type Admin = SupabaseClient<any, "public", any>;

const DAY_MS = 86_400_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

/** Race day: the main event when given, else the end of the weekend, else its start. */
const raceDay = (e: Xs2Event): Date => new Date(e.date_start_main_event ?? e.date_stop ?? e.date_start);

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
      .insert({ source: "xs2", resource_type: "events", trigger, status: "running" })
      .select("id")
      .single();
    logId = log?.id ?? null;

    const xs2 = new Xs2Client();
    const now = new Date();
    const [football, f1] = await Promise.all([xs2.events("soccer", now), xs2.events("formula1", now)]);

    const { data: ours, error: oursErr } = await admin
      .from("events")
      .select("id, sport, home_team, away_team, race_name, starts_at, external_tournament_id")
      .eq("status", "upcoming")
      .gte("starts_at", new Date(now.getTime() - DAY_MS).toISOString());
    if (oursErr) throw new Error(`events: ${oursErr.message}`);
    const ourEvents = (ours ?? []) as OurEvent[];

    const { data: existing } = await admin.from("xs2_event_links").select("xs2_event_id, event_id, match_method");
    const sticky = new Map<string, { event_id: string | null; match_method: string }>();
    for (const r of (existing ?? []) as { xs2_event_id: string; event_id: string | null; match_method: string }[]) {
      if (r.match_method === "manual" || r.match_method === "ignored") sticky.set(r.xs2_event_id, r);
    }
    const taken = new Set<string>([...sticky.values()].map((s) => s.event_id).filter((id): id is string => !!id));

    const matcher = new FootballMatcher(ourEvents);
    const stats = { fetched: football.length + f1.length, football: 0, f1: 0, matched: 0, unmatched: 0, kept_manual: 0, skipped: 0 };
    const rows: Record<string, unknown>[] = [];
    const seen = new Set<string>();

    const all: [Xs2Event, "football" | "f1"][] = [
      ...football.map((e) => [e, "football"] as [Xs2Event, "football"]),
      ...f1.map((e) => [e, "f1"] as [Xs2Event, "f1"]),
    ];
    for (const [e, kind] of all) {
      if (seen.has(e.event_id)) continue;
      seen.add(e.event_id);
      // Football without both teams (tournament placeholders like "Final") can't be matched.
      if (kind === "football" && !(e.hometeam_name && e.visiting_name)) {
        stats.skipped++;
        continue;
      }
      stats[kind]++;
      const base = {
        xs2_event_id: e.event_id,
        xs2_kind: kind,
        xs2_title: e.event_name,
        xs2_tournament: e.tournament_name,
        xs2_home_team: e.hometeam_name,
        xs2_away_team: e.visiting_name,
        xs2_starts_at: kind === "f1" ? raceDay(e).toISOString() : e.date_start,
        xs2_venue: e.venue_name,
        xs2_date_confirmed: !!e.date_confirmed,
        xs2_has_tickets: (e.number_of_tickets ?? 0) > 0,
        last_seen_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      const keep = sticky.get(e.event_id);
      if (keep) {
        stats.kept_manual++;
        rows.push({ ...base, event_id: keep.event_id, match_method: keep.match_method, match_note: null });
        continue;
      }

      const result: MatchResult = kind === "football"
        ? matcher.match(e.hometeam_name!, e.visiting_name!, new Date(e.date_start), taken)
        : matchF1(ourEvents, raceDay(e), taken);
      if (result.eventId) {
        taken.add(result.eventId);
        stats.matched++;
        rows.push({ ...base, event_id: result.eventId, match_method: "auto", match_note: null });
      } else {
        stats.unmatched++;
        rows.push({ ...base, event_id: null, match_method: "none", match_note: result.note });
      }
    }

    // Release automatic links first so a re-match can't trip the
    // one-XS2-event-per-fixture index. Admin decisions keep theirs.
    {
      const { error } = await admin
        .from("xs2_event_links")
        .update({ event_id: null })
        .not("match_method", "in", "(manual,ignored)")
        .not("event_id", "is", null);
      if (error) throw new Error(`release links: ${error.message}`);
    }
    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await admin.from("xs2_event_links").upsert(rows.slice(i, i + 200), { onConflict: "xs2_event_id" });
      if (error) throw new Error(`xs2_event_links upsert: ${error.message}`);
    }
    // Not seen this run: played, cancelled or withdrawn at XS2.
    await admin
      .from("xs2_event_links")
      .update({ match_method: "none", event_id: null, match_note: "Finns inte längre hos XS2" })
      .lt("last_seen_at", now.toISOString())
      .not("match_method", "in", "(manual,ignored)");

    if (logId) {
      await admin.from("supplier_sync_log").update({
        finished_at: new Date().toISOString(),
        status: "success",
        records_fetched: stats.fetched,
        records_upserted: stats.matched + stats.kept_manual,
      }).eq("id", logId);
    }
    return json({ environment: xs2.environment, stats });
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[xs2-sync]", message);
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
