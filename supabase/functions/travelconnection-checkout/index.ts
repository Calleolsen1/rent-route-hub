// travelconnection-checkout — turn picked tickets into an order.
//
// Body: { event_id: string, lines: [{ category_id: string, qty: number }] }
// Returns: { order_id }
//
// Public (verify_jwt = false), but only open when public_prices_enabled is on
// or the caller is an admin previewing the shop.
//
// The browser sends WHICH tickets and HOW MANY — never a price. Prices are
// computed here from a fresh supplier lookup with the same code that renders
// the page (_shared/tc_pricing.ts).
//
// Nothing is held with the supplier yet: the booking is created as 'draft'
// and create-checkout holds the tickets when the customer clicks through to
// Stripe, so the supplier's 10-minute hold covers the payment itself.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { TravelConnectionClient, tcEnvironment, dbTokenStore } from "../_shared/travelconnection.ts";
import { priceEvent } from "../_shared/tc_pricing.ts";
import { callerIdentity } from "../_shared/auth.ts";
import type { BookingLine } from "../_shared/tc_orders.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** More than this in one order goes through a group enquiry instead. */
const MAX_TICKETS_PER_ORDER = 10;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json().catch(() => ({}));
    const eventId = body.event_id;
    if (!eventId || typeof eventId !== "string") throw new Error("event_id required");

    const [who, { data: pricesPublic }] = await Promise.all([
      callerIdentity(req),
      db.rpc("get_platform_bool", { p_key: "public_prices_enabled", p_default: false }),
    ]);
    if (pricesPublic !== true && !who?.isAdmin) {
      return json({ error: "Onlineköp är inte öppet ännu - skicka en förfrågan så återkommer vi.", code: "checkout_disabled" }, 403);
    }

    // Merge duplicate categories and drop zero lines.
    const wanted = new Map<string, number>();
    for (const l of Array.isArray(body.lines) ? body.lines : []) {
      const qty = Math.floor(Number(l?.qty));
      if (typeof l?.category_id === "string" && qty > 0) {
        wanted.set(l.category_id, (wanted.get(l.category_id) ?? 0) + qty);
      }
    }
    if (!wanted.size) throw new Error("Välj minst en biljett");
    const totalQty = [...wanted.values()].reduce((a, b) => a + b, 0);
    if (totalQty > MAX_TICKETS_PER_ORDER) {
      throw new Error(`Max ${MAX_TICKETS_PER_ORDER} biljetter per köp - skicka en gruppförfrågan för fler.`);
    }

    const tc = new TravelConnectionClient({ store: dbTokenStore(db) });
    const priced = await priceEvent(db, tc, eventId, { fresh: true });
    if (!priced) throw new Error("Det finns inga biljetter att köpa till den här matchen.");

    const lines = [...wanted.entries()].map(([categoryId, qty]) => {
      const o = priced.options.find((p) => p.category_id === categoryId);
      if (!o) throw new Error("En av biljetterna finns inte längre - ladda om sidan.");
      if (!o.available || o.max_qty < qty) {
        throw new Error(`${o.name}: bara ${o.max_qty} kvar just nu.`);
      }
      return { o, qty };
    });

    const total = lines.reduce((s, l) => s + l.o.final_sek * l.qty, 0);

    const { data: order, error: orderErr } = await db
      .from("orders")
      .insert({
        user_id: who?.userId ?? null,
        status: "pending",
        total_sek: total,
        currency: "SEK",
        customer_email: who?.email ?? "",
      })
      .select("id")
      .single();
    if (orderErr) throw new Error(`orders insert: ${orderErr.message}`);

    try {
      const { error: itemsErr } = await db.from("order_items").insert(
        lines.map((l) => ({
          order_id: order.id,
          event_id: eventId,
          category_id: l.o.category_id,
          qty: l.qty,
          unit_price_sek: l.o.final_sek,
        })),
      );
      if (itemsErr) throw new Error(`order_items insert: ${itemsErr.message}`);

      const bookingLines: BookingLine[] = lines.map((l) => ({
        product_id: priced.tc_product_id,
        ticket_option_id: l.o.ticket_option_id,
        qty: l.qty,
        name: l.o.name,
        price: l.o.supplier_price,
      }));
      const { error: bookErr } = await db.from("tc_bookings").insert({
        order_id: order.id,
        event_id: eventId,
        environment: tcEnvironment(),
        status: "draft",
        lines: bookingLines,
        supplier_currency: priced.currency,
        supplier_total: bookingLines.reduce((s, l) => s + l.price * l.qty, 0),
        created_by: who?.userId ?? null,
      });
      if (bookErr) throw new Error(`tc_bookings insert: ${bookErr.message}`);
    } catch (e) {
      // No half-made orders: without items or a booking it can't be paid.
      await db.from("orders").delete().eq("id", order.id);
      throw e;
    }

    return json({ order_id: order.id });
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[travelconnection-checkout]", message);
    return json({ error: message }, 400);
  }
});
