// travelconnection-book — hold, confirm, release and track supplier tickets.
//
// Auth: authenticated admin.
//
// Body, one of:
//   { action: "reserve", event_id, lines: [{ ticket_option_id, qty }],
//     order_id?, booking_id? }
//   { action: "confirm", tc_booking_id, lead: { first_name, last_name,
//     email?, phone? } }
//   { action: "cancel",  tc_booking_id }
//   { action: "refresh", tc_booking_id }
//   { action: "fulfil",  order_id }        retry a paid website order whose
//                                          tickets could not be booked
//
// A reservation holds the tickets for 10 minutes. Confirming turns it into a
// supplier order and an invoice Kaisen must pay within 14 days (immediately
// if the match is sooner), so every call that holds or buys goes through
// assertOrderingAllowed(): the sandbox is always allowed, production only with
// TRAVELCONNECTION_ORDERS_ENABLED=true.
//
// Every call is written to public.tc_bookings, request and response included,
// so there's a record of what was held or bought even when a step fails.

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  TravelConnectionClient,
  TravelConnectionError,
  assertOrderingAllowed,
  type TcGuest,
} from "../_shared/travelconnection.ts";
import { fulfilOrder } from "../_shared/tc_orders.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Admin = SupabaseClient<any, "public", any>;

interface BookingRow {
  id: string;
  status: string;
  environment: string;
  event_id: string | null;
  order_id: string | null;
  reservation_num: string | null;
  reservation_expires_at: string | null;
  order_num: string | null;
  agent_reference: string | null;
  lines: { ticket_option_id: number; qty: number; name?: string; price?: number }[];
}

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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const epochToIso = (s: number | null | undefined) =>
  s ? new Date(Number(s) * 1000).toISOString() : null;

async function loadBooking(admin: Admin, id: unknown): Promise<BookingRow> {
  if (!id || typeof id !== "string") throw new Error("tc_booking_id required");
  const { data, error } = await admin.from("tc_bookings").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Bokningen hittades inte");
  return data as BookingRow;
}

async function reserve(admin: Admin, tc: TravelConnectionClient, userId: string, body: any) {
  const env = assertOrderingAllowed();
  const { event_id, order_id, booking_id } = body;
  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (!event_id) throw new Error("event_id required");
  const wanted = lines
    .map((l: any) => ({ ticket_option_id: Number(l.ticket_option_id), qty: Math.floor(Number(l.qty)) }))
    .filter((l: any) => l.ticket_option_id > 0 && l.qty > 0);
  if (!wanted.length) throw new Error("Välj minst en biljett");

  const { data: link } = await admin
    .from("tc_product_links")
    .select("tc_product_id")
    .eq("event_id", event_id)
    .in("match_method", ["auto", "manual"])
    .maybeSingle();
  if (!link) throw new Error("Matchen är inte kopplad till Travel Connection");

  // Check against live stock first, so the admin gets a clear Swedish reason
  // instead of the supplier's validation error.
  const inv = (await tc.inventory([link.tc_product_id])).get(link.tc_product_id);
  const byId = new Map((inv?.ticket_options ?? []).map((o) => [o.id, o]));
  const described = wanted.map((l: { ticket_option_id: number; qty: number }) => {
    const o = byId.get(l.ticket_option_id);
    if (!o) throw new Error(`Biljettalternativ ${l.ticket_option_id} finns inte längre`);
    if (!o.available || o.max_purchase_qty < l.qty) {
      throw new Error(`${o.name}: bara ${o.available ? o.max_purchase_qty : 0} kvar att köpa just nu`);
    }
    return { ...l, name: o.name, price: o.price };
  });

  const { data: row, error: insErr } = await admin
    .from("tc_bookings")
    .insert({
      event_id,
      order_id: order_id ?? null,
      booking_id: booking_id ?? null,
      environment: env,
      status: "failed",
      lines: described,
      created_by: userId,
    })
    .select("id")
    .single();
  if (insErr) throw new Error(`tc_bookings insert: ${insErr.message}`);

  // Our id in their system, so a supplier invoice can always be traced back.
  const agentReference = `KAISEN-${row.id.slice(0, 8).toUpperCase()}`;
  const request = {
    agent_reference: agentReference,
    products: described.map((l: { ticket_option_id: number; qty: number }) => ({ ticket_option: l.ticket_option_id, quantity: l.qty })),
  };

  try {
    const res = await tc.createReservation(request.products, agentReference);
    const update = {
      status: "reserved",
      agent_reference: agentReference,
      reservation_num: res.reservation_num,
      reservation_expires_at: epochToIso(res.expires_at),
      supplier_total: res.price_total,
      supplier_currency: res.currency,
      supplier_status: res.status,
      request_payload: request,
      response_payload: res,
    };
    await admin.from("tc_bookings").update(update).eq("id", row.id);
    return { tc_booking_id: row.id, environment: env, ...update };
  } catch (e) {
    await admin.from("tc_bookings").update({
      agent_reference: agentReference,
      request_payload: request,
      response_payload: (e as TravelConnectionError).details ?? null,
      error_message: (e as Error).message,
    }).eq("id", row.id);
    throw e;
  }
}

async function confirm(admin: Admin, tc: TravelConnectionClient, body: any) {
  assertOrderingAllowed();
  const b = await loadBooking(admin, body.tc_booking_id);
  if (b.status !== "reserved" || !b.reservation_num) {
    throw new Error(`Bokningen är ${b.status}, inte reserverad`);
  }
  if (b.reservation_expires_at && new Date(b.reservation_expires_at).getTime() < Date.now()) {
    await admin.from("tc_bookings").update({ status: "expired" }).eq("id", b.id);
    throw new Error("Reservationen har gått ut (10 minuter). Reservera igen.");
  }

  const lead = body.lead ?? {};
  const first = String(lead.first_name ?? "").trim();
  const last = String(lead.last_name ?? "").trim();
  if (!first || !last) throw new Error("För- och efternamn på huvudresenären krävs");

  // Only the lead guest is required; the supplier lists the rest as TBA and
  // asks for names later if the club needs them.
  const guests: TcGuest[] = [{
    first_name: first,
    last_name: last,
    email: lead.email ? String(lead.email).trim() : null,
    phone: lead.phone ? String(lead.phone).trim() : null,
    ticket_option_id: b.lines[0].ticket_option_id,
    lead: true,
  }];

  try {
    const res = await tc.confirmReservation(b.reservation_num, guests, b.agent_reference ?? undefined);
    const update = {
      status: "confirmed",
      order_num: res.order_no,
      supplier_total: Number(res.total),
      supplier_currency: res.currency,
      supplier_status: res.status,
      response_payload: res,
      error_message: null,
    };
    await admin.from("tc_bookings").update(update).eq("id", b.id);
    // Pull invoice number and vouchers straight away.
    const refreshed = await refresh(admin, tc, { tc_booking_id: b.id }).catch(() => null);
    return { tc_booking_id: b.id, ...update, ...(refreshed ?? {}) };
  } catch (e) {
    await admin.from("tc_bookings").update({ error_message: (e as Error).message }).eq("id", b.id);
    throw e;
  }
}

async function cancel(admin: Admin, tc: TravelConnectionClient, body: any) {
  assertOrderingAllowed();
  const b = await loadBooking(admin, body.tc_booking_id);
  if (b.status === "confirmed") {
    throw new Error("En bekräftad order kan inte avbokas via API:t - kontakta Travel Connection.");
  }
  if (b.status !== "reserved" || !b.reservation_num) {
    return { tc_booking_id: b.id, status: b.status };
  }
  try {
    await tc.cancelReservation(b.reservation_num);
  } catch (e) {
    // Already expired or gone at the supplier: the hold is released either way.
    if (!(e instanceof TravelConnectionError && e.status === 404)) throw e;
  }
  await admin.from("tc_bookings").update({ status: "cancelled" }).eq("id", b.id);
  return { tc_booking_id: b.id, status: "cancelled" };
}

async function refresh(admin: Admin, tc: TravelConnectionClient, body: any) {
  const b = await loadBooking(admin, body.tc_booking_id);
  const num = b.order_num ?? b.reservation_num;
  if (!num) return { tc_booking_id: b.id, status: b.status };

  if (b.status === "reserved") {
    const r = await tc.getReservation(num);
    const expired = !r || (r.expires_at && r.expires_at * 1000 < Date.now());
    if (expired) {
      await admin.from("tc_bookings").update({ status: "expired" }).eq("id", b.id);
      return { tc_booking_id: b.id, status: "expired" };
    }
    return { tc_booking_id: b.id, status: b.status, supplier_status: r!.status };
  }

  const order = await tc.getOrder(num);
  const update = {
    supplier_status: order.status,
    invoice_url: order.invoice?.invoice ?? null,
    voucher_urls: order.invoice?.vouchers ?? [],
    response_payload: order,
  };
  await admin.from("tc_bookings").update(update).eq("id", b.id);
  return {
    tc_booking_id: b.id,
    status: b.status,
    invoice_num: order.invoice?.invoice_num ?? null,
    due_date: order.invoice?.due_date ?? null,
    amount_due: order.invoice?.amount_due ?? null,
    ...update,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const userId = await requireAdmin(req);
    const body = await req.json().catch(() => ({}));
    const admin: Admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const tc = new TravelConnectionClient();

    switch (body.action) {
      case "reserve":
        return json(await reserve(admin, tc, userId, body));
      case "confirm":
        return json(await confirm(admin, tc, body));
      case "cancel":
        return json(await cancel(admin, tc, body));
      case "refresh":
        return json(await refresh(admin, tc, body));
      case "fulfil": {
        if (!body.order_id || typeof body.order_id !== "string") throw new Error("order_id required");
        const { data: order } = await admin.from("orders").select("status").eq("id", body.order_id).maybeSingle();
        if (order?.status !== "paid" && order?.status !== "fulfilled") {
          throw new Error("Ordern är inte betald - inget att boka");
        }
        const r = await fulfilOrder(admin, tc, body.order_id);
        if (r.status === "failed") throw new Error(r.reason);
        return json(r);
      }
      default:
        throw new Error("action must be reserve, confirm, cancel, refresh or fulfil");
    }
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[travelconnection-book]", message);
    const status = e instanceof TravelConnectionError && e.status === 403 ? 403 : 400;
    return json({ error: message }, status);
  }
});
