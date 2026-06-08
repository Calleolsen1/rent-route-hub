// xs2-renew-reservation — replace an expired 10-minute hold with a fresh one.
//
// Body: { order_id: string }
//
// Flow:
//   1. Load order + items + each item's category + event external_event_id
//   2. Refuse if order is already paid/fulfilled or has no xs2_reservation_id
//   3. For each item: re-fetch live xs2 tickets for that event, filter to the
//      same (external_category_id, external_sub_category) group, re-allocate
//      cheapest-first to satisfy item.qty
//   4. POST one /v1/reservations with all line items combined
//   5. Apply per-category markup to fresh prices, sum new total
//   6. Update orders (reservation_id, expires_at, total_sek) + each
//      order_items.unit_price_sek if price drifted
//   7. Return new expires_at + price_changed flag + new_total_sek
//
// Refuses politely if stock is insufficient — caller should redirect the user
// back to the event page to pick again.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Xs2Client, applyMarkup, groupTickets, type Xs2Ticket } from "../_shared/xs2event.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ItemRow = {
  id: string;
  qty: number;
  unit_price_sek: number;
  sub_category: string | null;
  events: { id: string; source: string; external_event_id: string | null };
  ticket_categories: {
    id: string;
    external_category_id: string | null;
    external_sub_category: string | null;
    markup_pct: number;
    markup_fixed_sek: number;
  };
};

type Allocation = {
  ticket_id: string;
  quantity: number;
  net_rate: number;
  currency_code: string;
};

function allocate(tickets: readonly Xs2Ticket[], qty: number): Allocation[] {
  const sorted = [...tickets].sort((a, b) => a.net_rate - b.net_rate);
  const out: Allocation[] = [];
  let remaining = qty;
  for (const t of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(t.stock, remaining);
    if (take <= 0) continue;
    out.push({
      ticket_id: t.ticket_id,
      quantity: take,
      net_rate: t.net_rate,
      currency_code: t.currency_code,
    });
    remaining -= take;
  }
  if (remaining > 0) {
    throw new Error(
      `Otillräckligt lager — behövde ${qty}, hittade ${qty - remaining}`,
    );
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

  try {
    const { order_id } = await req.json();
    if (!order_id || typeof order_id !== "string") {
      throw new Error("order_id required");
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, status, xs2_reservation_id, currency")
      .eq("id", order_id)
      .maybeSingle();
    if (orderErr) throw orderErr;
    if (!order) throw new Error("Order not found");
    if (order.status === "paid" || order.status === "fulfilled") {
      throw new Error("Order är redan betald — ingen ombokning behövs");
    }
    if (!order.xs2_reservation_id) {
      throw new Error("Inte en xs2event-reservation — kan inte förnya");
    }

    const { data: items, error: itemsErr } = await admin
      .from("order_items")
      .select(
        "id, qty, unit_price_sek, sub_category, events!inner(id, source, external_event_id), ticket_categories!inner(id, external_category_id, external_sub_category, markup_pct, markup_fixed_sek)",
      )
      .eq("order_id", order_id);
    if (itemsErr) throw itemsErr;
    if (!items?.length) throw new Error("Inga rader på ordern");

    const itemRows = items as unknown as ItemRow[];

    // Group items by event so we can batch the listTickets call per event
    // (orders may span events in theory, though MVP only creates single-event
    // orders).
    const eventIds = Array.from(
      new Set(
        itemRows
          .map((i) => i.events.external_event_id)
          .filter((id): id is string => !!id),
      ),
    );

    const xs2 = new Xs2Client();
    const ticketsByEvent = new Map<string, Xs2Ticket[]>();
    for (const evId of eventIds) {
      const tickets = await xs2.listTickets({ event_id: evId, stock_gt: 0 });
      ticketsByEvent.set(evId, tickets);
    }

    // Allocate per item against current live inventory
    const allAllocations: Allocation[] = [];
    const perItem: Array<{
      itemId: string;
      allocations: Allocation[];
      markup_pct: number;
      markup_fixed_sek: number;
      old_unit_price_sek: number;
      qty: number;
    }> = [];

    for (const item of itemRows) {
      const extEventId = item.events.external_event_id;
      const extCatId = item.ticket_categories.external_category_id;
      const extSub = item.ticket_categories.external_sub_category;
      if (!extEventId || !extCatId || !extSub) {
        throw new Error("Order rad saknar xs2-koppling");
      }
      const eventTickets = ticketsByEvent.get(extEventId) ?? [];
      const groups = groupTickets(eventTickets);
      const match = groups.find(
        (g) => g.category_id === extCatId && g.sub_category === extSub,
      );
      if (!match) {
        throw new Error(`Kategori ${extCatId} ${extSub} ej tillgänglig`);
      }
      const allocations = allocate(match.tickets, item.qty);
      allAllocations.push(...allocations);
      perItem.push({
        itemId: item.id,
        allocations,
        markup_pct: item.ticket_categories.markup_pct,
        markup_fixed_sek: item.ticket_categories.markup_fixed_sek,
        old_unit_price_sek: Number(item.unit_price_sek),
        qty: item.qty,
      });
    }

    // Single combined reservation call
    const reservation = await xs2.createReservation({ tickets: allAllocations });

    // Compute new per-item unit_price_sek (weighted average across suppliers)
    // and the new order total. Surface a price_changed flag if any item moved.
    let priceChanged = false;
    let newTotalSek = 0;
    const itemUpdates: Array<{ id: string; unit_price_sek: number }> = [];
    for (const it of perItem) {
      let itemSubtotal = 0;
      for (const a of it.allocations) {
        const finalUnit = applyMarkup(a.net_rate, it.markup_pct, it.markup_fixed_sek);
        itemSubtotal += finalUnit * a.quantity;
      }
      const newUnit = Math.round(itemSubtotal / it.qty);
      newTotalSek += itemSubtotal;
      if (newUnit !== it.old_unit_price_sek) priceChanged = true;
      itemUpdates.push({ id: it.itemId, unit_price_sek: newUnit });
    }

    // Persist new reservation + (possibly) new pricing
    const { error: updErr } = await admin
      .from("orders")
      .update({
        xs2_reservation_id: reservation.reservation_id,
        reservation_expires_at: reservation.expires_at,
        total_sek: newTotalSek,
      })
      .eq("id", order_id);
    if (updErr) throw updErr;

    if (priceChanged) {
      for (const u of itemUpdates) {
        await admin
          .from("order_items")
          .update({ unit_price_sek: u.unit_price_sek })
          .eq("id", u.id);
      }
    }

    return new Response(
      JSON.stringify({
        reservation_expires_at: reservation.expires_at,
        price_changed: priceChanged,
        new_total_sek: newTotalSek,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("xs2-renew-reservation:", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
