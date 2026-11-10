// p1-tickets — live P1 Travel ticket options for one of our fixtures, alone.
//
// Body: { event_id: string }   // our internal event UUID
//
// The match page uses event-tickets (both suppliers, merged); this one is
// kept for checking P1 on its own. Same visibility rules:
//   - anyone: categories, descriptions, availability
//   - prices: when public_prices_enabled is on, or the caller is admin
//   - cost:   supplier price, currency, FX and markup — admin only
// P1 is request-only for now: every group has request_only = true.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { callerIsAdmin } from "../_shared/auth.ts";
import { priceP1Event } from "../_shared/p1_pricing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { event_id } = await req.json().catch(() => ({}));
    if (!event_id || typeof event_id !== "string") throw new Error("event_id required");

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [{ data: ev }, isAdmin, { data: pricesPublic }] = await Promise.all([
      db.from("events").select("tournament_name").eq("id", event_id).maybeSingle(),
      callerIsAdmin(req),
      db.rpc("get_platform_bool", { p_key: "public_prices_enabled", p_default: false }),
    ]);
    const priced = await priceP1Event(db, event_id, ev?.tournament_name ?? null);
    // No P1 event for this fixture — a normal answer, not an error.
    if (!priced) return json({ supplier: null, groups: [] });

    const showPrices = isAdmin || pricesPublic === true;
    const groups = [...priced.offers]
      .sort((a, b) => Number(b.available) - Number(a.available) || (a.final_sek ?? Infinity) - (b.final_sek ?? Infinity))
      .map((o) => ({
        category_id: o.category_id,
        name: o.name,
        ...(o.short_name && { short_name: o.short_name }),
        ...(o.section && { section: o.section }),
        description: o.description,
        color: null,
        image_url: o.image_url,
        tier: o.tier,
        available: o.available,
        max_qty: o.max_qty,
        request_only: true,
        ...(showPrices && o.final_sek != null && { final_sek: o.final_sek }),
        ...(isAdmin && {
          supplier: "p1",
          p1_product_id: o.p1_product_id,
          p1_category_id: o.p1_category_id,
          supplier_price: o.supplier_price,
          supplier_currency: o.supplier_currency,
          base_sek: o.base_sek,
          markup_pct: o.markup.pct,
          markup_fixed_sek: o.markup.fixed,
          markup_source: o.markup.source,
        }),
      }));

    return json({
      supplier: "p1",
      environment: priced.environment,
      prices_visible: showPrices,
      preview: isAdmin && pricesPublic !== true,
      guest_details_required: priced.guest_details_required,
      ...(isAdmin && { p1_event_id: priced.p1_event_id, fx: { currency: "EUR", rate_to_sek: priced.fx.rateToSek, stale: priced.fx.stale } }),
      groups,
    });
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[p1-tickets]", message);
    return json({ error: message }, 400);
  }
});
