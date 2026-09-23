// travelconnection-tickets — live ticket options for one of our fixtures.
//
// Body: { event_id: string }   // our internal event UUID
//
// Public (verify_jwt = false): browsing needs no login. What comes back
// depends on who asks:
//   - anyone:  categories, what they are (stand, rules) and availability
//   - prices:  when public_prices_enabled is on, or the caller is admin
//              (admins preview the shop before it opens)
//   - cost:    supplier price, currency, FX rate and markup — admin only
//
// Prices come live from Travel Connection via _shared/tc_pricing.ts, which
// the checkout uses too, so the page and the order can't disagree.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { TravelConnectionClient } from "../_shared/travelconnection.ts";
import { priceEvent } from "../_shared/tc_pricing.ts";
import { callerIsAdmin } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { event_id } = await req.json().catch(() => ({}));
    if (!event_id || typeof event_id !== "string") throw new Error("event_id required");

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [isAdmin, { data: pricesPublic }] = await Promise.all([
      callerIsAdmin(req),
      db.rpc("get_platform_bool", { p_key: "public_prices_enabled", p_default: false }),
    ]);
    const showPrices = isAdmin || pricesPublic === true;

    const tc = new TravelConnectionClient();
    // Admins always see a fresh lookup; the public may get a minute-old one.
    const priced = await priceEvent(db, tc, event_id, { fresh: isAdmin });

    // No supplier product for this fixture — a normal answer, not an error.
    if (!priced) return json({ supplier: null, groups: [] });

    const groups = priced.options.map((o) => ({
      category_id: o.category_id,
      name: o.name,
      description: o.description,
      color: o.color,
      available: o.available,
      max_qty: o.max_qty,
      ...(showPrices && { final_sek: o.final_sek }),
      ...(isAdmin && {
        ticket_option_id: o.ticket_option_id,
        supplier_price: o.supplier_price,
        supplier_currency: o.supplier_currency,
        base_sek: o.base_sek,
        markup_pct: o.markup.pct,
        markup_fixed_sek: o.markup.fixed,
        markup_source: o.markup.source,
      }),
    }));

    return json({
      supplier: "travelconnection",
      environment: tc.environment,
      guest_details_required: priced.guest_details_required,
      prices_visible: showPrices,
      // Tells the page it is showing an admin-only preview of the shop.
      preview: isAdmin && pricesPublic !== true,
      ...(isAdmin && {
        tc_product_id: priced.tc_product_id,
        league: priced.league,
        fx: {
          currency: priced.fx.currency,
          rate_to_sek: priced.fx.rateToSek,
          rate_date: priced.fx.rateDate,
          source: priced.fx.source,
          stale: priced.fx.stale,
        },
      }),
      groups,
    });
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[travelconnection-tickets]", message);
    return json({ error: message }, 400);
  }
});
