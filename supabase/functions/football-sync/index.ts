// football-sync — pull fixtures from football-data.org into `events`.
//
// Body: { competitions?: string[] }. A run is logged as "cron" when the nightly job made it.
// Auth: authenticated admin, or the nightly pg_cron job (see _shared/auth.ts).
//
// Games only: no ticket_categories, no prices. Every fixture is somebody's
// home game, and the team pages filter on home_team, so syncing whole
// competitions is what makes "all home games for every team" work.
//
// Cost: 2 calls per competition (teams for venue+crest, then matches). Six
// competitions is 12 calls against a 10/min limit, so the client paces itself
// and a full run takes ~80s.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdminOrCron } from "../_shared/auth.ts";
import {
  FootballDataClient,
  COMPETITIONS,
  COMPETITION_NAMES,
  canonicalTeam,
  type FdMatch,
  type FdTeam,
} from "../_shared/footballdata.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Admin = SupabaseClient<any, "public", any>;

const CHUNK = 250;
function chunked<T>(rows: readonly T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}


function mapMatchRow(m: FdMatch, code: string, teams: Map<number, FdTeam>) {
  const home = teams.get(m.homeTeam.id);
  return {
    source: "football-data",
    // Stable across seasons and never renumbered.
    external_event_id: `fd_${m.id}`,
    external_tournament_id: code,
    sport: "soccer" as const,
    tournament_name: m.competition?.name ?? COMPETITION_NAMES[code] ?? code,
    home_team: canonicalTeam(m.homeTeam.name),
    away_team: canonicalTeam(m.awayTeam.name),
    race_name: null,
    // Matches carry no venue — it comes from the home team's record.
    venue_name: home?.venue ?? null,
    city: null,
    country: home?.area?.name ?? null,
    starts_at: m.utcDate,
    ends_at: null,
    // The home club's crest. EventImage prefers an uploaded stadium photo,
    // so this is the automatic floor rather than an override.
    cover_image_url: null,
    status: "upcoming" as const,
    description: null,
    last_synced_at: new Date().toISOString(),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin: Admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  let logId: string | null = null;

  try {
    const caller = await requireAdminOrCron(req, admin);
    const body = await req.json().catch(() => ({}));
    const codes: string[] = Array.isArray(body.competitions) && body.competitions.length
      ? body.competitions.filter((c: unknown) => typeof c === "string")
      : [...COMPETITIONS];
    const trigger = caller.kind === "cron" ? "cron" : "manual";

    const { data: logRow } = await admin
      .from("supplier_sync_log")
      .insert({ source: "football-data", resource_type: "events", trigger, status: "running" })
      .select("id")
      .single();
    logId = logRow?.id ?? null;

    const fd = new FootballDataClient();
    const summary: Record<string, { fetched: number; upserted: number; error?: string }> = {};
    const liveIds = new Set<string>();
    let totalFetched = 0;
    let totalUpserted = 0;
    const crests: { team: string; crest: string }[] = [];

    for (const code of codes) {
      try {
        const teams = await fd.teamsByIdFor(code);
        // Crest per canonical team name, so EventImage can show a real badge
        // for clubs with no uploaded stadium photo.
        for (const t of teams.values()) {
          if (t.crest) crests.push({ team: canonicalTeam(t.name), crest: t.crest });
        }

        const matches = await fd.upcomingMatches(code);
        const rows = matches.map((m) => mapMatchRow(m, code, teams));
        for (const r of rows) liveIds.add(r.external_event_id);

        let upserted = 0;
        for (const batch of chunked(rows)) {
          const { data, error } = await admin
            .from("events")
            .upsert(batch, { onConflict: "external_event_id", ignoreDuplicates: false })
            .select("id");
          if (error) throw new Error(error.message);
          upserted += data?.length ?? 0;
        }

        summary[code] = { fetched: matches.length, upserted };
        totalFetched += matches.length;
        totalUpserted += upserted;
      } catch (e) {
        // One competition failing (rate limit, outage) must not lose the rest.
        const msg = (e as Error).message ?? "unknown";
        console.error(`[football-sync] ${code}:`, msg);
        summary[code] = { fetched: 0, upserted: 0, error: msg };
      }
    }

    // Store crests keyed by canonical team so the site can render a badge
    // without another API call. Upsert, never delete: a club missing from
    // this run (competition errored) must keep the crest it already has.
    const uniqueCrests = [...new Map(crests.map((c) => [c.team, c])).values()];
    if (uniqueCrests.length) {
      await admin.from("team_crests").upsert(
        uniqueCrests.map((c) => ({ team_name: c.team, crest_url: c.crest })),
        { onConflict: "team_name", ignoreDuplicates: false },
      );
    }

    // Fixtures that vanished (postponed, rescheduled out of the window) stop
    // showing. Scoped to this source and only the competitions actually
    // synced, so a failed competition can't wipe its own fixtures.
    const syncedOk = codes.filter((c) => !summary[c]?.error);
    let retired = 0;
    if (syncedOk.length) {
      const { data: existing } = await admin
        .from("events")
        .select("id, external_event_id, external_tournament_id")
        .eq("source", "football-data")
        .eq("status", "upcoming")
        .in("external_tournament_id", syncedOk);
      const stale = (existing ?? [])
        .filter((r: { external_event_id: string | null }) =>
          r.external_event_id != null && !liveIds.has(r.external_event_id))
        .map((r: { id: string }) => r.id);
      for (const batch of chunked(stale)) {
        await admin.from("events").update({ status: "cancelled" }).in("id", batch);
      }
      retired = stale.length;
    }

    const failed = Object.values(summary).filter((s) => s.error).length;
    if (logId) {
      await admin.from("supplier_sync_log").update({
        finished_at: new Date().toISOString(),
        status: failed === 0 ? "success" : failed === codes.length ? "failed" : "partial",
        records_fetched: totalFetched,
        records_upserted: totalUpserted,
        error_message: failed
          ? `${failed} av ${codes.length} ligor misslyckades`
          : null,
      }).eq("id", logId);
    }

    return new Response(
      JSON.stringify({ summary, totals: { fetched: totalFetched, upserted: totalUpserted, retired, crests: uniqueCrests.length } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[football-sync]", message);
    if (logId) {
      await admin.from("supplier_sync_log").update({
        finished_at: new Date().toISOString(),
        status: "failed",
        error_message: message,
      }).eq("id", logId);
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
