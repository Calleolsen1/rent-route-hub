// p1-tickets — live P1 Travel ticket options for one of our fixtures.
//
// Body: { event_id: string }   // our internal event UUID
//
// Public (verify_jwt = false), mirroring travelconnection-tickets:
//   - anyone: categories, descriptions, availability
//   - prices: when public_prices_enabled is on, or the caller is admin
//   - cost:   supplier price, currency, FX and markup — admin only
//
// P1 is request-only for now (decided with KAISEN): every group is returned
// with request_only = true, so the page never offers checkout for it; the
// customer sends a request and KAISEN books in the P1 portal.
//
// Prices: P1 EUR -> SEK at the shared FX rate, then the same markup rules
// and rounding as Travel Connection (_shared/tc_pricing.ts).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { callerIsAdmin } from "../_shared/auth.ts";
import { rateToSek } from "../_shared/fx.ts";
import { customerPrice, loadContext, resolveMarkup } from "../_shared/tc_pricing.ts";
import { P1Client, p1MaxQty, type P1Product } from "../_shared/p1.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

/** "Category – product" unless they say the same thing; booking option appended when there are several. */
export function groupName(p: P1Product, optionName: string | null): string {
  const cat = (p.categoryName ?? "").trim();
  const prod = (p.productName ?? "").trim();
  let name = cat && prod && !prod.toLowerCase().includes(cat.toLowerCase()) ? `${cat} – ${prod}` : prod || cat || "Biljett";
  if (optionName) name = `${name} (${optionName})`;
  return name;
}

/** Readable lines from product properties ("Seat Type: Covered"), skipping empties. */
export function describe(p: P1Product): string[] {
  return (p.properties ?? [])
    .filter((x) => x.value && x.value.trim())
    .map((x) => `${x.productPropertyKey.replace(/([a-z])([A-Z])/g, "$1 $2")}: ${x.value!.trim()}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { event_id } = await req.json().catch(() => ({}));
    if (!event_id || typeof event_id !== "string") throw new Error("event_id required");

    const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const [{ data: link }, { data: ev }, isAdmin, { data: pricesPublic }] = await Promise.all([
      db.from("p1_event_links").select("p1_event_id").eq("event_id", event_id).neq("match_method", "ignored").maybeSingle(),
      db.from("events").select("tournament_name").eq("id", event_id).maybeSingle(),
      callerIsAdmin(req),
      db.rpc("get_platform_bool", { p_key: "public_prices_enabled", p_default: false }),
    ]);
    // No P1 event for this fixture — a normal answer, not an error.
    if (!link?.p1_event_id) return json({ supplier: null, groups: [] });

    const showPrices = isAdmin || pricesPublic === true;
    const p1 = new P1Client();
    const [p1Event] = await p1.searchEvents({ eventIds: [link.p1_event_id], currency: "EUR" });
    if (!p1Event) return json({ supplier: null, groups: [] });

    const options = p1Event.bookingOptionProducts ?? [];
    const several = options.length > 1;
    const [fx, ctx] = await Promise.all([
      rateToSek(db, "EUR"),
      loadContext(db, event_id, ev?.tournament_name ?? null),
    ]);
    const markup = resolveMarkup(ctx, undefined);

    const groups = options
      .flatMap((o) =>
        (o.products ?? []).map((p) => {
          const supplierPrice = Number(p.price?.amount ?? 0);
          const baseSek = Math.round(supplierPrice * fx.rateToSek);
          const finalSek = supplierPrice > 0 ? customerPrice(baseSek, markup, ctx.rounding) : null;
          const maxQty = p1MaxQty(p);
          return {
            category_id: `p1:${p.id}`,
            name: groupName(p, several ? o.bookingOption.name : null),
            description: describe(p),
            color: null,
            available: p.available && maxQty > 0,
            max_qty: Math.max(maxQty, 1),
            request_only: true,
            sort_sek: finalSek ?? Number.MAX_SAFE_INTEGER,
            ...(showPrices && finalSek != null && { final_sek: finalSek }),
            ...(isAdmin && {
              supplier: "p1",
              p1_product_id: p.id,
              supplier_price: supplierPrice,
              supplier_currency: p.price?.currency ?? "EUR",
              base_sek: baseSek,
              markup_pct: markup.pct,
              markup_fixed_sek: markup.fixed,
              markup_source: markup.source,
            }),
          };
        })
      )
      .sort((a, b) => a.sort_sek - b.sort_sek)
      .map(({ sort_sek: _s, ...g }) => g);

    return json({
      supplier: "p1",
      environment: p1.environment,
      prices_visible: showPrices,
      preview: isAdmin && pricesPublic !== true,
      guest_details_required: (p1Event.requiredTicketHolderFields ?? []).length > 0,
      ...(isAdmin && { p1_event_id: p1Event.id, fx: { currency: "EUR", rate_to_sek: fx.rateToSek, stale: fx.stale } }),
      groups,
    });
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[p1-tickets]", message);
    return json({ error: message }, 400);
  }
});
