// xs2-sync — refresh cached xs2event data into our DB.
//
// Per xs2event cache guidance: events daily, categories weekly, tournaments/
// venues/teams monthly. Tickets are NEVER cached (always live).
//
// Body: { resource: "events" | "categories" | "all", sport_types?: string[],
//         trigger?: "manual" | "cron" }
//
// Auth: caller must be an authenticated admin (has_role 'admin'). The function
// runs against the user's JWT for the role check, then switches to service
// role for the writes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Xs2Client, type Xs2Event, today, pickLocalized } from "../_shared/xs2event.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Current event_sport enum values — restrict sync to sports the DB accepts.
// When the enum is extended (basketball/tennis/etc.) update this list.
const SUPPORTED_SPORTS = ["soccer", "formula1"] as const;
type SupportedSport = (typeof SUPPORTED_SPORTS)[number];

async function requireAdmin(req: Request): Promise<string> {
  const auth = req.headers.get("Authorization");
  if (!auth) throw new Error("Missing Authorization header");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: auth } },
  });

  const { data: { user } } = await userClient.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data: isAdmin, error } = await userClient.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (error || !isAdmin) throw new Error("Admin role required");
  return user.id;
}

type SyncResult = { fetched: number; upserted: number };

async function syncEvents(
  admin: ReturnType<typeof createClient>,
  xs2: Xs2Client,
  sportTypes: readonly SupportedSport[],
): Promise<SyncResult> {
  const events = await xs2.listEvents({
    sport_type: sportTypes.length === 1 ? sportTypes[0] : sportTypes,
    date_stop_ge: today(),
    page_size: 200,
  });

  if (events.length === 0) return { fetched: 0, upserted: 0 };

  const rows = events.map((e) => mapEventRow(e));
  const { error, count } = await admin
    .from("events")
    .upsert(rows, {
      onConflict: "external_event_id",
      ignoreDuplicates: false,
      count: "exact",
    });
  if (error) throw new Error(`events upsert failed: ${error.message}`);

  return { fetched: events.length, upserted: count ?? rows.length };
}

function mapEventRow(e: Xs2Event) {
  const isSoccer = e.sport_type === "soccer";
  return {
    source: "xs2event",
    external_event_id: e.event_id,
    external_tournament_id: e.tournament_id ?? null,
    sport: e.sport_type as SupportedSport,
    tournament_name: e.tournament_name ?? "Unknown tournament",
    home_team: isSoccer ? (e.hometeam_name ?? null) : null,
    away_team: isSoccer ? (e.visiting_name ?? null) : null,
    // F1 events: xs2event may use the tournament name as race identifier; we
    // refine the mapping once real F1 payloads land.
    race_name: isSoccer ? null : (e.tournament_name ?? null),
    venue_name: e.venue_name ?? null,
    city: (e.venue_city as string | undefined) ?? null,
    country: (e.venue_country as string | undefined) ?? null,
    starts_at: e.date_start,
    ends_at: e.date_stop ?? null,
    last_synced_at: new Date().toISOString(),
  };
}

/**
 * Categories+sub_category combinations are discovered by joining live tickets
 * with categories — `xs2-get-event-tickets` already does this on the first
 * customer view of each event (lazy backfill via `ensureCategoryRows`). We
 * mirror that approach here so sync and lookup produce identical rows and we
 * don't insert headless category rows with NULL sub_category that conflict
 * with the lookup-path rows.
 */
async function syncCategoriesForEvent(
  admin: ReturnType<typeof createClient>,
  xs2: Xs2Client,
  ourEventId: string,
  xs2EventId: string,
): Promise<SyncResult> {
  const [tickets, cats] = await Promise.all([
    xs2.listTickets({ event_id: xs2EventId, stock_gt: 0 }),
    xs2.listCategories({ event_id: xs2EventId }),
  ]);
  if (tickets.length === 0) return { fetched: 0, upserted: 0 };

  const catByExternal = new Map(cats.map((c) => [c.category_id, c]));

  // Dedupe by (category_id, sub_category) — multiple ticket_ids per group are
  // suppliers, not distinct logical categories.
  const seen = new Map<string, { external_category_id: string; external_sub_category: string; stock: number }>();
  for (const t of tickets) {
    const key = `${t.category_id}|${t.sub_category}`;
    const prev = seen.get(key);
    if (prev) {
      prev.stock += t.stock;
    } else {
      seen.set(key, {
        external_category_id: t.category_id,
        external_sub_category: t.sub_category,
        stock: t.stock,
      });
    }
  }

  const rows = Array.from(seen.values()).map((g) => {
    const c = catByExternal.get(g.external_category_id);
    return {
      event_id: ourEventId,
      external_category_id: g.external_category_id,
      external_sub_category: g.external_sub_category,
      name: c?.category_name ?? "Unknown",
      description: pickLocalized(c?.description) || null,
      party_size_together: c?.party_size_together ?? 1,
      unit_price_sek: 0,
      currency: "SEK",
      qty_available: g.stock,
      last_synced_at: new Date().toISOString(),
    };
  });

  const { error, count } = await admin
    .from("ticket_categories")
    .upsert(rows, {
      onConflict: "event_id,external_category_id,external_sub_category",
      ignoreDuplicates: false,
      count: "exact",
    });
  if (error) throw new Error(`categories upsert failed: ${error.message}`);

  return { fetched: rows.length, upserted: count ?? rows.length };
}

async function logRun(
  admin: ReturnType<typeof createClient>,
  resource: string,
  trigger: string,
): Promise<string> {
  const { data, error } = await admin
    .from("xs2_sync_log")
    .insert({ resource_type: resource, trigger, status: "running" })
    .select("id")
    .single();
  if (error) throw new Error(`sync log insert failed: ${error.message}`);
  return data.id as string;
}

async function finishLog(
  admin: ReturnType<typeof createClient>,
  id: string,
  status: "success" | "partial" | "failed",
  result: Partial<SyncResult>,
  errorMessage?: string,
) {
  await admin
    .from("xs2_sync_log")
    .update({
      finished_at: new Date().toISOString(),
      status,
      records_fetched: result.fetched ?? 0,
      records_upserted: result.upserted ?? 0,
      error_message: errorMessage ?? null,
    })
    .eq("id", id);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    await requireAdmin(req);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const body = await req.json().catch(() => ({} as Record<string, unknown>));
  const resource = (body.resource as string) ?? "events";
  const trigger = (body.trigger as string) ?? "manual";
  const sportTypes = Array.isArray(body.sport_types) && body.sport_types.length
    ? (body.sport_types as string[]).filter(
        (s): s is SupportedSport => SUPPORTED_SPORTS.includes(s as SupportedSport),
      )
    : [...SUPPORTED_SPORTS];

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const xs2 = new Xs2Client();

  const summary: Record<string, SyncResult> = {};

  // events
  if (resource === "events" || resource === "all") {
    const logId = await logRun(admin, "events", trigger);
    try {
      const result = await syncEvents(admin, xs2, sportTypes);
      summary.events = result;
      await finishLog(admin, logId, "success", result);
    } catch (e: any) {
      await finishLog(admin, logId, "failed", {}, e.message);
      return new Response(JSON.stringify({ error: e.message, summary }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // categories — only for events synced in this run (or all xs2 events if
  // events sync wasn't requested in this run)
  if (resource === "categories" || resource === "all") {
    const logId = await logRun(admin, "categories", trigger);
    try {
      const { data: events } = await admin
        .from("events")
        .select("id, external_event_id")
        .eq("source", "xs2event")
        .eq("status", "upcoming")
        .gte("starts_at", new Date().toISOString());
      const list = events ?? [];

      let fetched = 0;
      let upserted = 0;
      for (const ev of list) {
        if (!ev.external_event_id) continue;
        const r = await syncCategoriesForEvent(admin, xs2, ev.id, ev.external_event_id);
        fetched += r.fetched;
        upserted += r.upserted;
      }
      summary.categories = { fetched, upserted };
      await finishLog(admin, logId, "success", { fetched, upserted });
    } catch (e: any) {
      await finishLog(admin, logId, "failed", {}, e.message);
      return new Response(JSON.stringify({ error: e.message, summary }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ ok: true, summary }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
