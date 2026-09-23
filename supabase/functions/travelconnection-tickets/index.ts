// travelconnection-tickets — live ticket options for one of our fixtures.
//
// Body: { event_id: string }   // our internal event UUID
//
// Public (verify_jwt = false): browsing needs no login. What comes back
// depends on who asks:
//   - anyone:  which ticket categories exist and whether they're available
//   - prices:  only when public_prices_enabled is on, or the caller is admin
//   - cost:    supplier price, currency, FX rate and markup — admin only
//
// Prices come live from Travel Connection — the supplier's guidance is that
// price and stock change too fast to store. The only reuse is a one-minute
// per-instance cache for public views (see PUBLIC_CACHE_MS). The
// ticket_categories rows written here exist to give each option a stable id
// for order_items and to carry an admin markup override.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  TravelConnectionClient,
  type TcInventory,
  type TcTicketOption,
} from "../_shared/travelconnection.ts";
import { rateToSek } from "../_shared/fx.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Admin = SupabaseClient<any, "public", any>;

interface CategoryRow {
  id: string;
  external_category_id: string;
  markup_pct: number;
  markup_fixed_sek: number;
}

const tcCategoryId = (optionId: number) => `tc_${optionId}`;

// Public page views share the supplier's 60 requests/minute with the sync and
// with bookings. A popular fixture must not be able to starve those, so the
// public view reuses a lookup for up to a minute per warm instance. Admins
// always get a fresh one, and a reservation re-checks stock with the supplier
// anyway, so a minute-old figure can never oversell.
const PUBLIC_CACHE_MS = 60_000;
const inventoryCache = new Map<number, { at: number; inv: TcInventory | undefined }>();

/** Percentage markup then a fixed addition, rounded to whole kronor. */
function applyMarkup(baseSek: number, pct: number, fixed: number): number {
  return Math.round(baseSek * (1 + (Number(pct) || 0) / 100) + (Number(fixed) || 0));
}

async function callerIsAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization");
  if (!auth) return false;
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  // The anon key is also sent as a bearer token; getUser() simply fails for it.
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return false;
  const { data } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
  return data === true;
}

/** "Friday 25 September 2026 - Session 2 (Fri 25/09)" style names stay as-is. */
function optionName(o: TcTicketOption): string {
  return o.name?.trim() || `Kategori ${o.ticket_category}`;
}

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

    const admin: Admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [isAdmin, { data: pricesPublic }, { data: link, error: linkErr }] = await Promise.all([
      callerIsAdmin(req),
      admin.rpc("get_platform_bool", { p_key: "public_prices_enabled", p_default: false }),
      admin
        .from("tc_product_links")
        .select("tc_product_id, tc_currency, guest_details_required")
        .eq("event_id", event_id)
        .in("match_method", ["auto", "manual"])
        .maybeSingle(),
    ]);
    if (linkErr) throw new Error(linkErr.message);

    // No supplier product for this fixture — a normal answer, not an error.
    if (!link) return json({ supplier: null, groups: [] });

    const showPrices = isAdmin || pricesPublic === true;
    const tc = new TravelConnectionClient();

    // The catalogue list has no currency; fetch it once and keep it.
    let currency: string | null = link.tc_currency;
    if (!currency) {
      const product = await tc.getProduct(link.tc_product_id);
      currency = (product.currency ?? "EUR").toUpperCase();
      await admin
        .from("tc_product_links")
        .update({ tc_currency: currency })
        .eq("tc_product_id", link.tc_product_id);
    }

    const cached = inventoryCache.get(link.tc_product_id);
    let inv: TcInventory | undefined;
    if (!isAdmin && cached && Date.now() - cached.at < PUBLIC_CACHE_MS) {
      inv = cached.inv;
    } else {
      inv = (await tc.inventory([link.tc_product_id])).get(link.tc_product_id);
      inventoryCache.set(link.tc_product_id, { at: Date.now(), inv });
    }
    const options = inv && inv.status !== "Expired" ? inv.ticket_options : [];
    if (!options.length) {
      return json({ supplier: "travelconnection", environment: tc.environment, groups: [] });
    }

    const fx = await rateToSek(admin, currency);

    // Existing rows carry any admin markup override; new options get the
    // platform defaults from /admin/markup-defaults, once, on insert.
    const { data: existingRows, error: readErr } = await admin
      .from("ticket_categories")
      .select("id, external_category_id, markup_pct, markup_fixed_sek")
      .eq("event_id", event_id)
      .like("external_category_id", "tc_%");
    if (readErr) throw new Error(`ticket_categories read: ${readErr.message}`);
    const byExternal = new Map<string, CategoryRow>(
      ((existingRows ?? []) as CategoryRow[]).map((r) => [r.external_category_id, r]),
    );

    const [{ data: pctRaw }, { data: fixedRaw }] = await Promise.all([
      admin.rpc("get_platform_decimal", { p_key: "default_markup_pct", p_default: 15 }),
      admin.rpc("get_platform_decimal", { p_key: "default_markup_fixed_sek", p_default: 0 }),
    ]);
    const defaultPct = Number(pctRaw ?? 15);
    const defaultFixed = Number(fixedRaw ?? 0);
    const now = new Date().toISOString();

    const priceFields = (o: TcTicketOption, pct: number, fixed: number) => ({
      name: optionName(o),
      unit_price_sek: applyMarkup(o.price * fx.rateToSek, pct, fixed),
      currency: "SEK",
      qty_available: o.available ? o.max_purchase_qty : 0,
      max_purchase_qty: o.available ? o.max_purchase_qty : 0,
      supplier_price: o.price,
      supplier_currency: currency,
      last_synced_at: now,
    });

    const inserts = options
      .filter((o) => !byExternal.has(tcCategoryId(o.id)))
      .map((o) => ({
        event_id,
        external_category_id: tcCategoryId(o.id),
        external_sub_category: "",
        party_size_together: 1,
        markup_pct: defaultPct,
        markup_fixed_sek: defaultFixed,
        ...priceFields(o, defaultPct, defaultFixed),
      }));
    if (inserts.length) {
      const { data: created, error } = await admin
        .from("ticket_categories")
        .upsert(inserts, {
          onConflict: "event_id,external_category_id,external_sub_category",
          ignoreDuplicates: true,
        })
        .select("id, external_category_id, markup_pct, markup_fixed_sek");
      if (error) throw new Error(`ticket_categories insert: ${error.message}`);
      for (const r of (created ?? []) as CategoryRow[]) byExternal.set(r.external_category_id, r);
    }

    // Refresh price/stock on the rest without touching their markup.
    await Promise.all(
      options
        .filter((o) => byExternal.has(tcCategoryId(o.id)) && !inserts.some((i) => i.external_category_id === tcCategoryId(o.id)))
        .map((o) => {
          const row = byExternal.get(tcCategoryId(o.id))!;
          return admin
            .from("ticket_categories")
            .update(priceFields(o, row.markup_pct, row.markup_fixed_sek))
            .eq("id", row.id);
        }),
    );

    const groups = options.map((o) => {
      const row = byExternal.get(tcCategoryId(o.id));
      const pct = row?.markup_pct ?? defaultPct;
      const fixed = row?.markup_fixed_sek ?? defaultFixed;
      const baseSek = o.price * fx.rateToSek;
      const available = o.available && o.max_purchase_qty > 0;
      return {
        category_id: row?.id ?? null,
        name: optionName(o),
        available,
        max_qty: available ? o.max_purchase_qty : 0,
        ...(showPrices && { final_sek: applyMarkup(baseSek, pct, fixed) }),
        ...(isAdmin && {
          ticket_option_id: o.id,
          supplier_price: o.price,
          supplier_currency: currency,
          base_sek: Math.round(baseSek),
          markup_pct: pct,
          markup_fixed_sek: fixed,
          delivery_methods: o.delivery_methods,
        }),
      };
    });

    // Cheapest first, sold-out last.
    groups.sort((a, b) =>
      Number(b.available) - Number(a.available) ||
      ((a as { final_sek?: number }).final_sek ?? 0) - ((b as { final_sek?: number }).final_sek ?? 0)
    );

    // Keep the listing "från"-price current for when prices go public.
    const cheapest = options
      .filter((o) => o.available && o.max_purchase_qty > 0)
      .map((o) => {
        const row = byExternal.get(tcCategoryId(o.id));
        return applyMarkup(o.price * fx.rateToSek, row?.markup_pct ?? defaultPct, row?.markup_fixed_sek ?? defaultFixed);
      });
    await admin
      .from("events")
      .update({
        min_price_sek: cheapest.length ? Math.min(...cheapest) : null,
        max_price_sek: cheapest.length ? Math.max(...cheapest) : null,
      })
      .eq("id", event_id);

    return json({
      supplier: "travelconnection",
      environment: tc.environment,
      guest_details_required: link.guest_details_required,
      prices_visible: showPrices,
      ...(isAdmin && {
        tc_product_id: link.tc_product_id,
        fx: { currency, rate_to_sek: fx.rateToSek, rate_date: fx.rateDate, source: fx.source, stale: fx.stale },
      }),
      groups,
    });
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[travelconnection-tickets]", message);
    return json({ error: message }, 400);
  }
});
