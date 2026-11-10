// event-tickets — the match page's ticket list from BOTH suppliers, merged.
//
// Body: { event_id: string }
//
// Asks Travel Connection and P1 Travel in parallel (either may fail or have
// nothing without taking the other down), then merges them through KAISEN's
// seat categories (_shared/ticket_merge.ts): one row per seat, sold through
// the better offer. Prices are compared here, server-side, so the choice is
// right even while prices are hidden from the public.
//
// Visibility is the same as the single-supplier functions:
//   - anyone: categories, descriptions, availability
//   - prices: when public_prices_enabled is on, or the caller is admin
//   - cost, supplier and the losing offer: admin only
//
// Every supplier category seen is recorded in supplier_category_links (after
// the response), so admin can link it to a seat category.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { callerIsAdmin } from "../_shared/auth.ts";
import { background } from "../_shared/background.ts";
import { TravelConnectionClient, dbTokenStore } from "../_shared/travelconnection.ts";
import { priceEvent } from "../_shared/tc_pricing.ts";
import { planForHomeTeam } from "../_shared/tc_venues.ts";
import { guessTier, priceP1Event } from "../_shared/p1_pricing.ts";
import { mergeOffers, venueKey, type Link, type Offer, type SeatCategory } from "../_shared/ticket_merge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

const settle = async <T>(label: string, p: Promise<T>): Promise<T | null> => {
  try {
    return await p;
  } catch (e) {
    console.error(`[event-tickets] ${label}:`, (e as Error).message);
    return null;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { event_id } = await req.json().catch(() => ({}));
    if (!event_id || typeof event_id !== "string") throw new Error("event_id required");

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [isAdmin, { data: pricesPublic }, { data: ev }] = await Promise.all([
      callerIsAdmin(req),
      db.rpc("get_platform_bool", { p_key: "public_prices_enabled", p_default: false }),
      db.from("events").select("tournament_name, venue_name, race_name, home_team").eq("id", event_id).maybeSingle(),
    ]);
    const showPrices = isAdmin || pricesPublic === true;
    const venue = ev ? venueKey(ev) : null;

    const tc = new TravelConnectionClient({ store: dbTokenStore(db) });
    const [tcPriced, p1Priced] = await Promise.all([
      // One retry: a hiccup (slow answer, token just rotated) shouldn't
      // swap the real tickets for the generic tiers.
      settle("travelconnection", priceEvent(db, tc, event_id, { fresh: isAdmin })
        .catch(() => priceEvent(db, tc, event_id, { fresh: isAdmin }))),
      settle("p1", priceP1Event(db, event_id, ev?.tournament_name ?? null)),
    ]);

    const offers: Offer[] = [
      ...(tcPriced?.options ?? []).map((o): Offer => ({
        supplier: "travelconnection",
        supplier_category_id: String(o.tc_category_id),
        category_id: o.category_id,
        name: o.name,
        description: o.description,
        color: o.color,
        image_url: null,
        tier: guessTier(o.name, o.description),
        available: o.available,
        max_qty: o.max_qty,
        final_sek: o.final_sek,
        request_only: false,
        admin: {
          ticket_option_id: o.ticket_option_id, tc_category_id: o.tc_category_id,
          supplier_price: o.supplier_price, supplier_currency: o.supplier_currency, base_sek: o.base_sek,
          markup_pct: o.markup.pct, markup_fixed_sek: o.markup.fixed, markup_source: o.markup.source,
        },
      })),
      ...(p1Priced?.offers ?? []).map((o): Offer => ({
        supplier: "p1",
        supplier_category_id: o.p1_category_id ?? o.p1_product_id,
        category_id: o.category_id,
        name: o.name,
        description: o.description,
        color: null,
        image_url: o.image_url,
        tier: o.tier,
        available: o.available,
        max_qty: o.max_qty,
        final_sek: o.final_sek,
        request_only: true, // P1 is request-only for now (decided with KAISEN)
        admin: {
          p1_product_id: o.p1_product_id, p1_category_id: o.p1_category_id,
          supplier_price: o.supplier_price, supplier_currency: o.supplier_currency, base_sek: o.base_sek,
          markup_pct: o.markup.pct, markup_fixed_sek: o.markup.fixed, markup_source: o.markup.source,
        },
      })),
    ];

    let links: Link[] = [];
    let seats: SeatCategory[] = [];
    if (venue && offers.length) {
      const [{ data: l }, { data: s }] = await Promise.all([
        db.from("supplier_category_links").select("supplier, supplier_category_id, seat_category_id, hidden").eq("venue_key", venue),
        db.from("seat_categories").select("id, name, description, tier, color, sort_order").eq("venue_key", venue),
      ]);
      links = (l ?? []) as Link[];
      seats = (s ?? []) as SeatCategory[];

      // Record what we saw, for the admin linking list. Only the "seen"
      // columns are written, so admin choices (seat category, hidden) stay.
      const seen = new Map<string, Record<string, unknown>>();
      for (const o of offers) {
        const k = `${o.supplier}:${o.supplier_category_id}`;
        if (seen.has(k)) continue;
        seen.set(k, {
          supplier: o.supplier,
          supplier_category_id: o.supplier_category_id,
          venue_key: venue,
          supplier_name: o.name,
          supplier_description: o.description.slice(0, 6),
          supplier_color: o.color,
          tier_guess: o.tier,
          sample_price_sek: o.final_sek,
          sample_event_id: event_id,
          last_seen_at: new Date().toISOString(),
        });
      }
      // Promise.resolve: the query builder's .then() is a PromiseLike, and
      // background() needs a real Promise to attach its catch/waitUntil to.
      background("category links", Promise.resolve(db.from("supplier_category_links").upsert([...seen.values()], { onConflict: "supplier,supplier_category_id,venue_key" }).then(({ error }: { error: { message: string } | null }) => {
        if (error) console.error("[event-tickets] links upsert:", error.message);
      })));
    }

    const merged = mergeOffers(offers, links, seats);
    const groups = merged.map((g) => ({
      category_id: g.category_id,
      name: g.name,
      description: g.description,
      color: g.color,
      image_url: g.image_url,
      tier: g.tier,
      available: g.available,
      max_qty: g.max_qty,
      request_only: g.request_only,
      ...(showPrices && g.final_sek != null && { final_sek: g.final_sek }),
      ...(isAdmin && { supplier: g.supplier, seat_category_id: g.seat_category_id, auto_paired: !!g.auto_paired, alternatives: g.alternatives ?? [], ...g.admin }),
    }));

    const supplier = merged.some((g) => g.supplier === "travelconnection")
      ? "travelconnection"
      : merged.length ? "p1" : null;

    return json({
      supplier,
      prices_visible: showPrices,
      preview: isAdmin && pricesPublic !== true,
      guest_details_required: !!tcPriced?.guest_details_required || !!p1Priced?.guest_details_required,
      plan_url: tcPriced?.plan_url ?? (await settle("plan", planForHomeTeam(db, event_id))),
      ...(isAdmin && {
        venue_key: venue,
        suppliers: {
          travelconnection: tcPriced ? { environment: tc.environment, tc_product_id: tcPriced.tc_product_id, options: tcPriced.options.length } : null,
          p1: p1Priced ? { environment: p1Priced.environment, p1_event_id: p1Priced.p1_event_id, offers: p1Priced.offers.length } : null,
        },
      }),
      groups,
    });
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[event-tickets]", message);
    return json({ error: message }, 400);
  }
});
