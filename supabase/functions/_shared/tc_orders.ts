// Travel Connection side of a website order.
//
//   draft     travelconnection-checkout priced the tickets and created the
//             order; nothing is held with the supplier yet
//   reserved  holdForPayment() ran as the customer clicked through to Stripe:
//             tickets held for 10 minutes
//   confirmed fulfilOrder() ran from the payment webhook: supplier order and
//             invoice exist
//   failed    the tickets could not be secured after payment — an admin
//             decides (other tickets, or refund); ops is emailed
//
// Why hold at "go to payment" and not when tickets are picked: the supplier
// hold is 10 minutes and a Stripe session lives at least 30. Starting the
// clock at the last moment gives the card form the whole 10 minutes. If the
// payment still lands after the hold lapsed, fulfilOrder re-reserves — but
// only at the same or a lower supplier price than the customer was quoted.

import {
  TravelConnectionClient,
  TravelConnectionError,
  type TcGuest,
} from "./travelconnection.ts";
import { OPS_EMAIL, escapeHtml, sendEmail } from "./email.ts";

// deno-lint-ignore no-explicit-any
type Db = any;

export interface BookingLine {
  product_id: number;
  ticket_option_id: number;
  qty: number;
  name: string;
  /** Supplier price per ticket, in supplier currency, when the order was made. */
  price: number;
}

interface BookingRow {
  id: string;
  order_id: string;
  status: "draft" | "reserved" | "confirmed" | "cancelled" | "expired" | "failed";
  reservation_num: string | null;
  reservation_expires_at: string | null;
  order_num: string | null;
  agent_reference: string | null;
  lines: BookingLine[];
  supplier_currency: string | null;
}

/** Thrown when the supplier now wants more than the customer was quoted. */
export class PriceChangedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PriceChangedError";
  }
}

/** Thrown when there are no longer enough tickets. */
export class SoldOutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SoldOutError";
  }
}

async function bookingFor(db: Db, orderId: string): Promise<BookingRow | null> {
  const { data, error } = await db.from("tc_bookings").select("*").eq("order_id", orderId).maybeSingle();
  if (error) throw new Error(`tc_bookings read: ${error.message}`);
  return data as BookingRow | null;
}

const holdAlive = (b: BookingRow, marginMs: number) =>
  b.status === "reserved" &&
  !!b.reservation_expires_at &&
  new Date(b.reservation_expires_at).getTime() - marginMs > Date.now();

/**
 * Check live stock and price for every line, then reserve. Throws
 * SoldOutError / PriceChangedError with a customer-readable Swedish message.
 */
async function reserveLines(db: Db, tc: TravelConnectionClient, b: BookingRow) {
  const productIds = [...new Set(b.lines.map((l) => l.product_id))];
  const inv = await tc.inventory(productIds);
  for (const l of b.lines) {
    const opt = inv.get(l.product_id)?.ticket_options.find((o) => o.id === l.ticket_option_id);
    if (!opt || !opt.available || opt.max_purchase_qty < l.qty) {
      throw new SoldOutError(`${l.name}: det finns inte längre ${l.qty} biljetter kvar.`);
    }
    // A cent of tolerance for float noise; anything more is a real rise.
    if (opt.price > l.price + 0.01) {
      throw new PriceChangedError(`${l.name}: priset har ändrats sedan du valde biljetterna.`);
    }
  }

  const agentReference = b.agent_reference ?? `KAISEN-${b.order_id.slice(0, 8).toUpperCase()}`;
  const request = b.lines.map((l) => ({ ticket_option: l.ticket_option_id, quantity: l.qty }));
  const res = await tc.createReservation(request, agentReference);
  const update = {
    status: "reserved",
    agent_reference: agentReference,
    reservation_num: res.reservation_num,
    reservation_expires_at: new Date(res.expires_at * 1000).toISOString(),
    supplier_total: res.price_total,
    supplier_currency: res.currency,
    supplier_status: res.status,
    request_payload: { agent_reference: agentReference, products: request },
    response_payload: res,
    error_message: null,
  };
  await db.from("tc_bookings").update(update).eq("id", b.id);
  return { ...b, ...update } as BookingRow;
}

/**
 * Called by create-checkout just before a Stripe session is made. Holds the
 * order's tickets unless a hold with a few minutes left already exists.
 * Returns when the order holds no supplier tickets at all.
 */
export async function holdForPayment(db: Db, tc: TravelConnectionClient, orderId: string): Promise<void> {
  const b = await bookingFor(db, orderId);
  if (!b || b.status === "confirmed") return;
  // Reuse a hold with at least 3 minutes left; otherwise start a fresh one.
  if (holdAlive(b, 3 * 60_000)) return;
  if (b.status === "reserved" && b.reservation_num) {
    await tc.cancelReservation(b.reservation_num).catch(() => {});
  }
  await reserveLines(db, tc, b);
}

function splitName(full: string | null): { first: string; last: string } {
  const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "KAISEN", last: "Kund" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

async function confirm(db: Db, tc: TravelConnectionClient, b: BookingRow, lead: TcGuest) {
  const res = await tc.confirmReservation(b.reservation_num!, [lead], b.agent_reference ?? undefined);
  await db.from("tc_bookings").update({
    status: "confirmed",
    order_num: res.order_no,
    supplier_total: Number(res.total),
    supplier_currency: res.currency,
    supplier_status: res.status,
    error_message: null,
  }).eq("id", b.id);
  // Invoice number and any vouchers straight away; the hourly poll retries.
  try {
    const order = await tc.getOrder(res.order_no);
    await db.from("tc_bookings").update({
      supplier_status: order.status,
      invoice_url: order.invoice?.invoice ?? null,
      voucher_urls: order.invoice?.vouchers ?? [],
      response_payload: order,
    }).eq("id", b.id);
  } catch (e) {
    console.warn("[tc_orders] order refresh after confirm failed:", (e as Error).message);
  }
  return res.order_no;
}

export type FulfilResult =
  | { status: "none" }
  | { status: "confirmed"; order_num: string }
  | { status: "failed"; reason: string };

/**
 * Turn a paid order's tickets into a supplier booking. Safe to call again:
 * a confirmed booking is left alone. On failure the booking is marked
 * 'failed', the error is logged to system_errors and ops is emailed — the
 * customer has paid, so a person must decide what happens next.
 */
export async function fulfilOrder(db: Db, tc: TravelConnectionClient, orderId: string): Promise<FulfilResult> {
  let b = await bookingFor(db, orderId);
  if (!b) return { status: "none" };
  if (b.status === "confirmed") return { status: "confirmed", order_num: b.order_num! };

  const { data: order } = await db
    .from("orders")
    .select("customer_name, customer_email, customer_phone")
    .eq("id", orderId)
    .maybeSingle();
  const name = splitName(order?.customer_name ?? null);
  const lead: TcGuest = {
    first_name: name.first,
    last_name: name.last,
    email: order?.customer_email || null,
    phone: order?.customer_phone || null,
    ticket_option_id: b.lines[0].ticket_option_id,
    lead: true,
  };

  try {
    if (holdAlive(b, 15_000)) {
      try {
        return { status: "confirmed", order_num: await confirm(db, tc, b, lead) };
      } catch (e) {
        // The hold can lapse between our check and their answer. Anything
        // else is a real error.
        if (!(e instanceof TravelConnectionError) || ![404, 410, 422].includes(e.status)) throw e;
        console.warn("[tc_orders] confirm on live hold failed, re-reserving:", e.message);
      }
    }
    // Hold lapsed while the customer paid: take the same tickets again, at
    // no more than they were quoted.
    b = await reserveLines(db, tc, b);
    return { status: "confirmed", order_num: await confirm(db, tc, b, lead) };
  } catch (e) {
    const reason = (e as Error).message ?? "okänt fel";
    await db.from("tc_bookings").update({ status: "failed", error_message: reason }).eq("id", b.id);
    await db.from("system_errors").insert({
      kind: "tc_fulfilment_failed",
      message: reason.slice(0, 1000),
      order_id: orderId,
      details: { tc_booking_id: b.id, lines: b.lines },
    });
    await sendEmail({
      to: OPS_EMAIL,
      subject: `Biljetter kunde inte bokas - order ${orderId.slice(0, 8).toUpperCase()}`,
      html: `<p>En kund har betalat men biljetterna kunde inte bokas hos Travel Connection.</p>
        <p><strong>Orsak:</strong> ${escapeHtml(reason)}</p>
        <p><strong>Biljetter:</strong><br/>${b.lines.map((l) => `${l.qty} × ${escapeHtml(l.name)}`).join("<br/>")}</p>
        <p>Öppna Admin → Biljettleverantör → Bokningar för att försöka igen, eller återbetala ordern under Admin → Ordrar.</p>`,
    });
    return { status: "failed", reason };
  }
}
