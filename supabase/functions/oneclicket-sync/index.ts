// oneclicket-sync — pull OneClicket products into our events/ticket_categories.
//
// Body: { sports?: ("soccer"|"formula1")[], max_pages?: number,
//         trigger?: "manual" | "cron" }
//
// Auth: authenticated admin.
//
// OneClicket has no "events" resource. It has 62k *products*, of which only ~8% carry a purchasable version, and
// the versions ride along inside the product payload. So one crawl produces
// both the event rows and the ticket_category rows, and the crawl is bounded
// by max_pages so a sync can't run away against the full catalogue.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  OneClicketClient,
  OC_CATEGORY_SOCCER,
  OC_CATEGORY_FORMULA1,
  allowedQuantities,
  canonicalRaceName,
  canonicalTeamName,
  minVersionPriceEur,
  pickWeekendPasses,
  normaliseSplitType,
  ocBool,
  ocExternalEventId,
  ocExternalVersionId,
  ocInt,
  ocNum,
  ocStr,
  parseTixstock,
  splitTeams,
  tournamentName,
  venueName,
  versionDisplayName,
  type OcProduct,
  type OcVersion,
} from "../_shared/oneclicket.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Sport = "soccer" | "formula1";

const CATEGORY_BY_SPORT: Record<Sport, number> = {
  soccer: OC_CATEGORY_SOCCER,
  formula1: OC_CATEGORY_FORMULA1,
};

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

/**
 * PostgREST payload guard. A full-season sync is ~900 events and ~2,600
 * categories; sending those as one request risks a body-size or statement
 * timeout, and a failure mid-way would leave the catalogue half-written.
 * Chunking keeps each request small and makes a partial failure obvious.
 */
const CHUNK = 250;

function chunked<T>(rows: readonly T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

/** Today in ISO — products before this are filtered out upstream anyway. */
const today = (): string => new Date().toISOString().slice(0, 10);

type Admin = ReturnType<typeof createClient>;

interface SyncCounts {
  fetched: number;
  events_upserted: number;
  categories_upserted: number;
  skipped_unresolved: number;
}

/**
 * OneClicket quotes EUR major units. Convert to SEK with the same platform
 * rate + default markup, so "Från X kr" on the listing pages matches.
 */
async function loadPricing(admin: Admin) {
  const { data: rateRaw } = await admin.rpc("get_platform_decimal", {
    p_key: "eur_to_sek_rate",
    p_default: 11.5,
  });
  const { data: mkRaw } = await admin.rpc("get_platform_decimal", {
    p_key: "default_markup_pct",
    p_default: 15,
  });
  const eurToSek = Number(rateRaw ?? 11.5);
  const markupPct = Number(mkRaw ?? 15);
  return {
    eurToSek,
    markupPct,
    /** EUR major units -> SEK with default markup, rounded to whole krona. */
    toSek: (eur: number | null | undefined): number | null => {
      if (eur == null) return null;
      const n = Number(eur);
      if (!Number.isFinite(n) || n <= 0) return null;
      return Math.round(n * eurToSek * (1 + markupPct / 100));
    },
  };
}

function mapEventRow(
  p: OcProduct,
  sport: Sport,
  toSek: (eur: number | null | undefined) => number | null,
) {
  const isSoccer = sport === "soccer";
  const raw = splitTeams(p);
  // Fold the supplier's naming variants onto the site's canonical names, or
  // the team landing pages (which match on exact equality) miss the fixture.
  const home = canonicalTeamName(raw.home);
  const away = canonicalTeamName(raw.away);
  const minEur = minVersionPriceEur(p);
  const maxEur = (p.versions ?? []).length
    ? Math.max(...(p.versions ?? []).map((v) => ocNum(v.price_final)))
    : null;

  // The supplier's date has no timezone. Events are European venues and the
  // column is timestamptz, so anchor to UTC rather than the function's locale.
  const startsAt = `${(p.date ?? "").replace(" ", "T")}Z`;

  return {
    source: "oneclicket",
    external_event_id: ocExternalEventId(p.id),
    external_tournament_id: ocStr(p.category_id),
    sport,
    tournament_name: tournamentName(p),
    home_team: isSoccer ? home : null,
    away_team: isSoccer ? away : null,
    race_name: isSoccer ? null : canonicalRaceName(p.name ?? ""),
    venue_name: venueName(p),
    city: ocStr(p.city_name),
    country: null,
    starts_at: startsAt,
    ends_at: null,
    cover_image_url: ocBool(p.has_image) ? ocStr(p.image_src) : null,
    status: "upcoming" as const,
    description: ocStr(p.description),
    min_price_sek: toSek(minEur),
    max_price_sek: toSek(maxEur),
    last_synced_at: new Date().toISOString(),
  };
}

function mapCategoryRow(
  eventId: string,
  p: OcProduct,
  v: OcVersion,
  toSek: (eur: number | null | undefined) => number | null,
) {
  const tix = parseTixstock(v);
  const seat = tix?.seat_details;
  const seatParts = [seat?.section && `Section ${seat.section}`, seat?.row && `Row ${seat.row}`]
    .filter(Boolean)
    .join(" · ");

  const split = normaliseSplitType(v.extra_data?.split_type);
  const quantities = allowedQuantities(v);

  return {
    event_id: eventId,
    external_category_id: ocExternalVersionId(v.id),
    // Non-null: the unique constraint is (event_id, external_category_id,
    // external_sub_category) and Postgres treats NULLs as distinct, which
    // would make every upsert insert a duplicate row.
    external_sub_category: ocStr(seat?.category) ?? "",
    name: versionDisplayName(v),
    description: seatParts || null,
    // `party_size_together` is the UI's minimum-purchase hint. The supplier's
    // real constraint is richer (see supplier_split_*), but the smallest
    // legal quantity is the honest value for this column.
    party_size_together: quantities.length ? quantities[0] : 1,
    unit_price_sek: toSek(ocNum(v.price_final)) ?? 0,
    currency: "SEK",
    qty_available: ocInt(v.stock),
    supplier_version_id: String(v.id),
    supplier_buy_multiplier: Math.max(1, ocInt(v.buy_multipler, 1)),
    supplier_split_type: split,
    supplier_split_quantity: Math.max(0, ocInt(v.extra_data?.split_quantity)),
    supplier_display_quantity: Math.max(0, ocInt(v.extra_data?.display_quantity)),
    last_synced_at: new Date().toISOString(),
  };
}

async function syncSport(
  admin: Admin,
  oc: OneClicketClient,
  sport: Sport,
  maxPages: number,
  toSek: (eur: number | null | undefined) => number | null,
): Promise<SyncCounts> {
  const { products: fetched } = await oc.getBuyableProducts({
    categoryId: CATEGORY_BY_SPORT[sport],
    dateFrom: today(),
    maxPages,
  });

  // F1 arrives as up to seven products per Grand Prix (2/3/4-day passes plus
  // single Friday/Saturday/Sunday tickets). Kaisen sells the weekend, so
  // collapse each race to one pass.
  const products = sport === "formula1" ? pickWeekendPasses(fetched) : fetched;
  if (sport === "formula1") {
    console.log(`[oneclicket-sync] F1: ${fetched.length} products -> ${products.length} weekend passes`);
  }

  const counts: SyncCounts = {
    fetched: products.length,
    events_upserted: 0,
    categories_upserted: 0,
    skipped_unresolved: 0,
  };
  if (!products.length) return counts;

  // A soccer fixture we couldn't resolve to two teams would render as
  // "X vs null" and drop out of the team pages. Skipping is the correct
  // outcome — see splitTeams for why the supplier data can't be trusted here.
  const usable = products.filter((p) => {
    if (sport !== "soccer") return true;
    const { home, away } = splitTeams(p);
    if (home && away) return true;
    counts.skipped_unresolved += 1;
    console.warn(`[oneclicket-sync] unresolved fixture, skipping: ${p.id} "${p.name}"`);
    return false;
  });
  if (!usable.length) return counts;

  const eventRows = usable.map((p) => mapEventRow(p, sport, toSek));
  const idByExternal = new Map<string, string>();

  for (const batch of chunked(eventRows)) {
    const { data: upserted, error } = await admin
      .from("events")
      .upsert(batch, { onConflict: "external_event_id", ignoreDuplicates: false })
      .select("id, external_event_id");
    if (error) throw new Error(`events upsert failed: ${error.message}`);
    for (const r of (upserted ?? []) as { id: string; external_event_id: string }[]) {
      idByExternal.set(r.external_event_id, r.id);
    }
    counts.events_upserted += upserted?.length ?? 0;
  }

  const categoryRows = usable.flatMap((p) => {
    const eventId = idByExternal.get(ocExternalEventId(p.id));
    if (!eventId) return [];
    return (p.versions ?? []).map((v) => mapCategoryRow(eventId, p, v, toSek));
  });

  // ignoreDuplicates=false updates price/stock on re-sync while leaving
  // markup_pct / markup_fixed_sek untouched — they aren't in the row, so
  // admin overrides survive.
  for (const batch of chunked(categoryRows)) {
    const { error: catErr, count } = await admin
      .from("ticket_categories")
      .upsert(batch, {
        onConflict: "event_id,external_category_id,external_sub_category",
        ignoreDuplicates: false,
        count: "exact",
      });
    if (catErr) throw new Error(`ticket_categories upsert failed: ${catErr.message}`);
    counts.categories_upserted += count ?? batch.length;
  }

  // Versions that vanished upstream must stop being sellable. Zeroing stock
  // rather than deleting keeps any order_items FK intact.
  const eventIds = [...idByExternal.values()];
  const liveExternalIds = new Set(
    usable.flatMap((p) => (p.versions ?? []).map((v) => ocExternalVersionId(v.id))),
  );
  const stale: string[] = [];
  for (const batch of chunked(eventIds)) {
    const { data: existing } = await admin
      .from("ticket_categories")
      .select("id, external_category_id")
      .in("event_id", batch)
      .gt("qty_available", 0);
    for (const r of (existing ?? []) as { id: string; external_category_id: string | null }[]) {
      if (r.external_category_id != null && !liveExternalIds.has(r.external_category_id)) {
        stale.push(r.id);
      }
    }
  }
  for (const batch of chunked(stale)) {
    await admin.from("ticket_categories")
      .update({ qty_available: 0, last_synced_at: new Date().toISOString() })
      .in("id", batch);
  }
  if (stale.length) {
    console.log(`[oneclicket-sync] zeroed ${stale.length} stale ${sport} versions`);
  }

  return counts;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  let logId: string | null = null;

  try {
    await requireAdmin(req);

    const body = await req.json().catch(() => ({}));
    const sports: Sport[] = Array.isArray(body.sports) && body.sports.length
      ? body.sports.filter((s: string): s is Sport => s === "soccer" || s === "formula1")
      : ["soccer", "formula1"];
    // The soccer catalogue is ~50 pages of 100 (4,913 products) and grows
    // through the season, so the default must clear it with room to spare —
    // at 20 it silently truncated to the earliest fixtures and dropped 556
    // buyable products. The crawl stops as soon as the supplier runs out of
    // pages, so a generous default costs nothing on smaller categories.
    const maxPages = Math.min(Math.max(1, ocInt(body.max_pages, 80)), 200);
    const trigger = body.trigger === "cron" ? "cron" : "manual";

    const { data: logRow } = await admin
      .from("supplier_sync_log")
      .insert({ source: "oneclicket", resource_type: "products", trigger, status: "running" })
      .select("id")
      .single();
    logId = logRow?.id ?? null;

    const oc = new OneClicketClient();
    const { toSek, eurToSek, markupPct } = await loadPricing(admin);

    const summary: Record<string, SyncCounts> = {};
    for (const sport of sports) {
      summary[sport] = await syncSport(admin, oc, sport, maxPages, toSek);
    }

    const totals = Object.values(summary).reduce(
      (a, c) => ({
        fetched: a.fetched + c.fetched,
        events_upserted: a.events_upserted + c.events_upserted,
        categories_upserted: a.categories_upserted + c.categories_upserted,
        skipped_unresolved: a.skipped_unresolved + c.skipped_unresolved,
      }),
      { fetched: 0, events_upserted: 0, categories_upserted: 0, skipped_unresolved: 0 },
    );

    if (logId) {
      // A handful of unresolvable fixtures is normal — the supplier always
      // ships some rows whose teams can't be trusted, and skipping them is
      // the designed behaviour. Flagging every run 'partial' for that made a
      // healthy sync look broken in the admin list, so only an unusually
      // high skip rate (>10% of what we fetched) is worth the warning.
      const skipRate = totals.fetched > 0
        ? totals.skipped_unresolved / totals.fetched
        : 0;
      await admin.from("supplier_sync_log").update({
        finished_at: new Date().toISOString(),
        status: skipRate > 0.1 ? "partial" : "success",
        records_fetched: totals.fetched,
        records_upserted: totals.events_upserted,
        error_message: totals.skipped_unresolved
          ? `${totals.skipped_unresolved} av ${totals.fetched} produkter hoppades över (laguppgifter gick inte att tolka)`
          : null,
      }).eq("id", logId);
    }

    return new Response(
      JSON.stringify({ summary, totals, rate: { eurToSek, markupPct } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[oneclicket-sync]", message);
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
