// f1-sync — pull the Formula 1 calendar from Jolpica into `events`.
//
// Body: { trigger?: "manual" | "cron" }
// Auth: authenticated admin.
//
// Games only. F1 rows carry no ticket_categories and no prices — the site
// sells trips on request, so a race page needs the race, the circuit and a
// date, nothing more.
//
// Jolpica is free and keyless, so this costs one or two HTTP calls per run.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  JolpicaClient,
  jolpicaExternalId,
  raceNameSv,
  raceStartsAt,
  weekendStartsAt,
  type JolpicaRace,
} from "../_shared/jolpica.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Admin = SupabaseClient<any, "public", any>;

async function requireAdmin(req: Request): Promise<string> {
  const auth = req.headers.get("Authorization");
  if (!auth) throw new Error("Missing Authorization header");

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data: isAdmin, error } = await userClient.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (error || !isAdmin) throw new Error("Admin role required");
  return user.id;
}

function mapRaceRow(race: JolpicaRace) {
  const loc = race.Circuit?.Location;
  return {
    source: "jolpica",
    external_event_id: jolpicaExternalId(race),
    external_tournament_id: race.season,
    sport: "formula1" as const,
    tournament_name: `Formel 1 ${race.season}`,
    home_team: null,
    away_team: null,
    race_name: raceNameSv(race.raceName),
    venue_name: race.Circuit?.circuitName ?? null,
    city: loc?.locality ?? null,
    country: loc?.country ?? null,
    // starts_at is the race itself — it drives ordering and the "upcoming"
    // filter, so it has to be the headline moment, not the weekend opening.
    starts_at: raceStartsAt(race),
    // ends_at doubles as the weekend window for the trip copy: first practice
    // through the race. Null when the FIA hasn't published session times.
    ends_at: null,
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
    await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const trigger = body.trigger === "cron" ? "cron" : "manual";

    const { data: logRow } = await admin
      .from("supplier_sync_log")
      .insert({ source: "jolpica", resource_type: "events", trigger, status: "running" })
      .select("id")
      .single();
    logId = logRow?.id ?? null;

    const races = await new JolpicaClient().listUpcoming();
    const rows = races.map(mapRaceRow);

    let upserted = 0;
    if (rows.length) {
      const { data, error } = await admin
        .from("events")
        .upsert(rows, { onConflict: "external_event_id", ignoreDuplicates: false })
        .select("id");
      if (error) throw new Error(`events upsert failed: ${error.message}`);
      upserted = data?.length ?? 0;
    }

    // Races that fell off the calendar (cancelled, renumbered) must stop
    // showing. Only touches jolpica rows, so nothing else is affected.
    const liveIds = new Set(rows.map((r) => r.external_event_id));
    const { data: existing } = await admin
      .from("events")
      .select("id, external_event_id")
      .eq("source", "jolpica")
      .eq("status", "upcoming");
    const stale = (existing ?? [])
      .filter((r: { external_event_id: string | null }) =>
        r.external_event_id != null && !liveIds.has(r.external_event_id))
      .map((r: { id: string }) => r.id);
    if (stale.length) {
      await admin.from("events").update({ status: "cancelled" }).in("id", stale);
    }

    if (logId) {
      await admin.from("supplier_sync_log").update({
        finished_at: new Date().toISOString(),
        status: "success",
        records_fetched: races.length,
        records_upserted: upserted,
      }).eq("id", logId);
    }

    return new Response(
      JSON.stringify({
        fetched: races.length,
        upserted,
        retired: stale.length,
        races: rows.map((r) => ({ race_name: r.race_name, starts_at: r.starts_at })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[f1-sync]", message);
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
