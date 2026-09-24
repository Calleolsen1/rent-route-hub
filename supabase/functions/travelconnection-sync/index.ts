// travelconnection-sync — link Travel Connection products onto our fixtures.
//
// Body: none. A run is logged as "cron" when the nightly job made it.
// Auth: authenticated admin, or the nightly pg_cron job (see _shared/auth.ts).
//
// Never creates events. Fixtures come from football-data.org and Jolpica;
// this only records, per supplier product, which of those fixtures it sells
// tickets for (public.tc_product_links). Prices and stock are NOT stored here
// — they move too fast and are fetched live by travelconnection-tickets.
//
// Admin decisions are sticky: a link set by hand ('manual') or a product
// marked 'ignored' is never touched by the matcher.
//
// Cost: teams (~4 pages) + competitions (1) + products (1 per 100) calls,
// paced at 60/min. The sandbox catalogue is ~10 calls, about 10 seconds.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireAdminOrCron } from "../_shared/auth.ts";
import {
  TravelConnectionClient,
  productStart,
  type TcProduct,
} from "../_shared/travelconnection.ts";
import {
  FootballMatcher,
  TC_COMPETITION_CODES,
  isF1Product,
  matchF1,
  type MatchResult,
  type OurEvent,
} from "../_shared/tc_match.ts";
import { syncVenuePlans, type VenueSyncResult } from "../_shared/tc_venues.ts";

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


/**
 * Upcoming fixtures from the schedule sources only. OneClicket and 'mock'
 * rows may still be live if their retirement migration hasn't been applied,
 * and linking onto those would sell tickets on the duplicate copy.
 */
async function loadFixtures(admin: Admin): Promise<OurEvent[]> {
  const out: OurEvent[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("events")
      .select("id, sport, home_team, away_team, race_name, starts_at, external_tournament_id")
      .in("source", ["football-data", "jolpica"])
      .eq("status", "upcoming")
      .order("starts_at")
      .range(from, from + 999);
    if (error) throw new Error(`events read: ${error.message}`);
    out.push(...((data ?? []) as OurEvent[]));
    if (!data || data.length < 1000) break;
  }
  return out;
}

interface ExistingLink {
  tc_product_id: number;
  event_id: string | null;
  match_method: "auto" | "manual" | "ignored" | "none";
  tc_currency: string | null;
}

async function loadLinks(admin: Admin): Promise<Map<number, ExistingLink>> {
  const out = new Map<number, ExistingLink>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await admin
      .from("tc_product_links")
      .select("tc_product_id, event_id, match_method, tc_currency")
      .range(from, from + 999);
    if (error) throw new Error(`tc_product_links read: ${error.message}`);
    for (const r of (data ?? []) as ExistingLink[]) out.set(r.tc_product_id, r);
    if (!data || data.length < 1000) break;
  }
  return out;
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
    const trigger = caller.kind === "cron" ? "cron" : "manual";

    const { data: logRow } = await admin
      .from("supplier_sync_log")
      .insert({ source: "travelconnection", resource_type: "product_links", trigger, status: "running" })
      .select("id")
      .single();
    logId = logRow?.id ?? null;

    const tc = new TravelConnectionClient();
    const [teams, competitions, products] = [
      await tc.teamsById(),
      await tc.competitionsById(),
      await tc.listProducts(),
    ];
    const [fixtures, existing] = await Promise.all([loadFixtures(admin), loadLinks(admin)]);

    const football = new FootballMatcher(fixtures);
    const now = new Date().toISOString();

    // Admin decisions first, so the matcher can't hand their fixture to
    // another product.
    const taken = new Set<string>();
    for (const l of existing.values()) {
      if (l.match_method === "manual" && l.event_id) taken.add(l.event_id);
    }

    const rows: Record<string, unknown>[] = [];
    const stats = { products: products.length, matched: 0, unmatched_in_scope: 0, out_of_scope: 0, kept_manual: 0, ignored: 0 };

    // Earliest games first: if two supplier products ever claim the same
    // fixture, the one closest in date should win, and this makes ties
    // deterministic between runs.
    const ordered = [...products].sort(
      (a, b) => (productStart(a)?.getTime() ?? 0) - (productStart(b)?.getTime() ?? 0),
    );

    for (const p of ordered) {
      const prev = existing.get(p.id);
      const starts = productStart(p);
      const home = p.match ? teams.get(p.match.home) ?? null : null;
      const away = p.match ? teams.get(p.match.away) ?? null : null;
      const compId = p.match?.competition ?? null;
      const f1 = p.type === "event" && isF1Product(p.name);
      const inScope = f1 || (p.type === "football_match" && compId != null && compId in TC_COMPETITION_CODES);

      let eventId: string | null = null;
      let method: ExistingLink["match_method"] = "none";
      let note: string | null = null;

      if (prev?.match_method === "manual" || prev?.match_method === "ignored") {
        eventId = prev.event_id;
        method = prev.match_method;
        if (method === "manual") stats.kept_manual++;
        else stats.ignored++;
      } else if (!inScope) {
        note = p.type === "football_match"
          ? `Tävlingen säljs inte (${competitions.get(compId ?? -1) ?? compId})`
          : "Inte fotboll eller F1";
        stats.out_of_scope++;
      } else if (!starts) {
        note = "Leverantören saknar datum";
        stats.unmatched_in_scope++;
      } else {
        const r: MatchResult = f1
          ? matchF1(fixtures, starts, taken)
          : football.match(home ?? "", away ?? "", starts, taken);
        if (r.eventId) {
          eventId = r.eventId;
          method = "auto";
          taken.add(r.eventId);
          stats.matched++;
        } else {
          note = r.note;
          stats.unmatched_in_scope++;
        }
      }

      rows.push(linkRow(p, {
        eventId,
        method,
        note,
        inScope,
        home,
        away,
        competition: compId != null ? competitions.get(compId) ?? null : null,
        currency: prev?.tc_currency ?? null,
        now,
      }));
    }

    // uq_tc_product_links_event allows one product per fixture. When a
    // fixture changes hands between runs (a supplier duplicate was removed,
    // a date moved), the old holder must let go before the new one upserts
    // in, or the batch fails on the constraint.
    // Products gone from the catalogue (played, withdrawn) let go of their
    // fixture too, unless an admin linked them by hand.
    const seen = new Set(products.map((p) => p.id));
    const gone = [...existing.values()]
      .filter((l) => !seen.has(l.tc_product_id) && l.event_id && l.match_method === "auto")
      .map((l) => l.tc_product_id);
    const moving = rows
      .filter((r) => {
        const prev = existing.get(r.tc_product_id as number);
        return prev?.event_id && prev.event_id !== r.event_id;
      })
      .map((r) => r.tc_product_id as number);
    for (const batch of chunked(gone)) {
      const { error } = await admin
        .from("tc_product_links")
        .update({ event_id: null, match_method: "none", match_note: "Finns inte längre hos leverantören" })
        .in("tc_product_id", batch);
      if (error) throw new Error(`release gone links: ${error.message}`);
    }
    for (const batch of chunked(moving)) {
      const { error } = await admin.from("tc_product_links").update({ event_id: null }).in("tc_product_id", batch);
      if (error) throw new Error(`release links: ${error.message}`);
    }

    let upserted = 0;
    for (const batch of chunked(rows)) {
      const { error, count } = await admin
        .from("tc_product_links")
        .upsert(batch, { onConflict: "tc_product_id", ignoreDuplicates: false, count: "exact" });
      if (error) throw new Error(`tc_product_links upsert: ${error.message}`);
      upserted += count ?? batch.length;
    }

    // Seating plans for the stadiums we actually sell. A failure here must
    // not fail the sync: links are what matter, plans are a nicety.
    let plans: VenueSyncResult | { error: string };
    try {
      const venueIds = new Set(
        rows
          .filter((r) => r.event_id && r.tc_venue_id != null)
          .map((r) => r.tc_venue_id as number),
      );
      plans = await syncVenuePlans(admin, tc, venueIds);
    } catch (e) {
      console.error("[travelconnection-sync] venue plans:", (e as Error).message);
      plans = { error: (e as Error).message };
    }

    if (logId) {
      await admin.from("supplier_sync_log").update({
        finished_at: new Date().toISOString(),
        status: "success",
        records_fetched: products.length,
        records_upserted: stats.matched + stats.kept_manual,
        error_message: stats.unmatched_in_scope
          ? `${stats.unmatched_in_scope} matcher behöver granskas`
          : null,
      }).eq("id", logId);
    }

    return new Response(
      JSON.stringify({ environment: tc.environment, upserted, stats, plans }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[travelconnection-sync]", message);
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

function linkRow(
  p: TcProduct,
  o: {
    eventId: string | null;
    method: string;
    note: string | null;
    inScope: boolean;
    home: string | null;
    away: string | null;
    competition: string | null;
    currency: string | null;
    now: string;
  },
) {
  return {
    tc_product_id: p.id,
    event_id: o.eventId,
    match_method: o.method,
    match_note: o.note,
    in_scope: o.inScope,
    tc_type: p.type,
    tc_name: p.name,
    tc_competition_id: p.match?.competition ?? null,
    tc_competition: o.competition,
    tc_home_team: o.home,
    tc_away_team: o.away,
    tc_starts_at: productStart(p)?.toISOString() ?? null,
    tc_date_confirmed: p.match?.date_confirmed ?? false,
    tc_time_confirmed: p.match?.time_confirmed ?? false,
    tc_venue_id: p.venue ?? null,
    // The catalogue list carries no currency; travelconnection-tickets fills
    // it from the product detail on first lookup. Keep what we have.
    tc_currency: o.currency,
    tc_status: p.match?.status ?? p.event?.event?.status ?? null,
    guest_details_required: p.all_guests_details_required ?? false,
    last_seen_at: o.now,
  };
}
