// xs2-reserve — place a 10-minute hold on tickets and create the local order.
//
// Body: {
//   event_id: string,           // our internal UUID
//   qty: number,                // total tickets requested
//   reserve_lines: Array<{      // from xs2-get-event-tickets, sorted cheapest-first
//     ticket_id, net_rate, currency_code, stock
//   }>,
//   customer_email?: string,
//   customer_name?: string,
//   customer_phone?: string,
// }
//
// Flow:
//   1. Validate, resolve event row, confirm xs2 source
//   2. Walk reserve_lines cheapest-first, allocate quantity across one-or-more
//      suppliers. Different ticket_ids = different suppliers; per xs2 docs
//      sitting-together not guaranteed across suppliers.
//   3. POST /v1/reservations  (net_rate + currency_code must match exactly)
//   4. Insert orders row with reservation_id + expires_at
//   5. Insert one order_items row per supplier with external_ticket_ids JSONB
//   6. Return { order_id, reservation_expires_at }
//
// Public endpoint — guests can reserve. Customer details collected later in
// Checkout.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Xs2Client, applyMarkup, eurCentsToSek, Xs2Error } from "../_shared/xs2event.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReserveLine = {
  ticket_id: string;
  net_rate: number;
  currency_code: string;
  stock: number;
};

type Allocation = {
  ticket_id: string;
  quantity: number;
  net_rate: number;
  currency_code: string;
};

function allocateTickets(lines: readonly ReserveLine[], qty: number): Allocation[] {
  const sorted = [...lines].sort((a, b) => a.net_rate - b.net_rate);
  const allocations: Allocation[] = [];
  let remaining = qty;
  for (const line of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(line.stock, remaining);
    if (take <= 0) continue;
    allocations.push({
      ticket_id: line.ticket_id,
      quantity: take,
      net_rate: line.net_rate,
      currency_code: line.currency_code,
    });
    remaining -= take;
  }
  if (remaining > 0) {
    throw new Error(`Insufficient stock — needed ${qty}, only ${qty - remaining} available`);
  }
  return allocations;
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
    const body = await req.json();
    const {
      event_id,
      qty,
      reserve_lines,
      customer_email,
      customer_name,
      customer_phone,
    } = body as {
      event_id: string;
      qty: number;
      reserve_lines: ReserveLine[];
      customer_email?: string;
      customer_name?: string;
      customer_phone?: string;
    };

    if (!event_id || typeof event_id !== "string") throw new Error("event_id required");
    if (!Number.isInteger(qty) || qty < 1 || qty > 50) throw new Error("qty must be 1-50");
    if (!Array.isArray(reserve_lines) || reserve_lines.length === 0) {
      throw new Error("reserve_lines required");
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Authenticated user (optional — guests allowed)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const userClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    }

    // Resolve the local event + the ticket_category row (we need its UUID
    // for the FK on order_items and its markup config for pricing).
    const { data: event } = await admin
      .from("events")
      .select("id, source, external_event_id")
      .eq("id", event_id)
      .maybeSingle();
    if (!event) throw new Error("Event not found");
    if (event.source !== "xs2event") throw new Error("Event is not xs2-sourced");

    // All reserve_lines share the same (category_id, sub_category) because
    // they came from a single group in xs2-get-event-tickets. Fetch the
    // ticket_categories row that matches the first line's external_ticket_id.
    // Simpler: client should also pass external_category_id + external_sub_category.
    // For MVP we re-derive: look up the ticket on xs2 to get its category info.
    // Actually — we trust the prior xs2-get-event-tickets sync. Fetch any
    // ticket_categories row that has the same external_category_id and
    // external_sub_category as one of these tickets. We need that info from
    // the request.
    const { external_category_id, external_sub_category } = body as {
      external_category_id?: string;
      external_sub_category?: string;
    };
    if (!external_category_id || !external_sub_category) {
      throw new Error("external_category_id and external_sub_category required");
    }

    const { data: category } = await admin
      .from("ticket_categories")
      .select("id, markup_pct, markup_fixed_sek, name")
      .eq("event_id", event.id)
      .eq("external_category_id", external_category_id)
      .eq("external_sub_category", external_sub_category)
      .maybeSingle();
    if (!category) {
      throw new Error("Category not found — run xs2-get-event-tickets first");
    }

    const allocations = allocateTickets(reserve_lines, qty);

    // Call xs2event to create the reservation
    const xs2 = new Xs2Client();
    let reservation;
    try {
      reservation = await xs2.createReservation({
        tickets: allocations.map((a) => ({
          ticket_id: a.ticket_id,
          quantity: a.quantity,
          net_rate: a.net_rate,
          currency_code: a.currency_code,
        })),
      });
    } catch (e: unknown) {
      const status = e instanceof Xs2Error ? e.status : 502;
      throw new Error(
        e instanceof Error ? `xs2event reservation failed: ${e.message}` : "xs2event reservation failed",
        { cause: { status } },
      );
    }

    // EUR → SEK rate (xs2 prices come in EUR cents; we charge in SEK)
    const { data: rateRaw } = await admin.rpc("get_platform_decimal", {
      p_key: "eur_to_sek_rate",
      p_default: 11.5,
    });
    const eurToSek = Number(rateRaw ?? 11.5);

    // Compute order total with markup
    let totalSek = 0;
    const itemRows = allocations.map((a) => {
      const baseSek = a.currency_code === "EUR"
        ? eurCentsToSek(a.net_rate, eurToSek)
        : Number(a.net_rate);
      const finalUnit = applyMarkup(baseSek, category.markup_pct, category.markup_fixed_sek);
      const subtotal = finalUnit * a.quantity;
      totalSek += subtotal;
      return {
        event_id: event.id,
        category_id: category.id,
        qty: a.quantity,
        unit_price_sek: finalUnit,
        sub_category: external_sub_category,
        // Store the raw xs2 values so xs2-renew-reservation can reconstruct
        // the reservation payload (net_rate + currency_code must match xs2's
        // price-drift guard).
        external_ticket_ids: [{
          ticket_id: a.ticket_id,
          quantity: a.quantity,
          net_rate: a.net_rate,
          currency_code: a.currency_code,
        }],
      };
    });

    // Insert order + items
    const { data: order, error: orderErr } = await admin
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        total_sek: totalSek,
        currency: "SEK",
        customer_email: customer_email ?? "",
        customer_name: customer_name ?? null,
        customer_phone: customer_phone ?? null,
        xs2_reservation_id: reservation.reservation_id,
        reservation_expires_at: reservation.expires_at,
      })
      .select("id, reservation_expires_at")
      .single();
    if (orderErr) throw new Error(`order insert: ${orderErr.message}`);

    const { error: itemsErr } = await admin
      .from("order_items")
      .insert(itemRows.map((r) => ({ ...r, order_id: order.id })));
    if (itemsErr) {
      // Best-effort rollback the order so we don't leave orphaned reservations
      await admin.from("orders").delete().eq("id", order.id);
      throw new Error(`order_items insert: ${itemsErr.message}`);
    }

    return new Response(
      JSON.stringify({
        order_id: order.id,
        reservation_expires_at: order.reservation_expires_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("xs2-reserve:", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
