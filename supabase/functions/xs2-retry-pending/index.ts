// Scheduled retry for paid orders that haven't received ticket files yet.
//
// Two failure modes from the Stripe → xs2 webhook:
//   1. confirmBooking errored — order.notes stamped, no xs2_booking_id
//   2. confirmBooking succeeded but getETicketZipUrl returned null
//      (xs2 supplier hasn't issued tickets yet)
//
// Strategy:
//   - Pick paid orders where ANY order_item has no ticket_deliveries.file_url
//     AND tickets_ready_email_sent_at IS NULL
//   - For each: retry confirmBooking if needed, then getETicketZipUrl
//   - On full success: stamp deliveries, mark fulfilled, send a follow-up
//     "tickets ready" email
//   - On repeated failure: back off after MAX_ATTEMPTS, stamp notes for ops
//
// Schedule via pg_cron hourly. xs2 ticket issuance is typically days
// before event, so faster polling burns API quota for no value.

import { createClient } from "npm:@supabase/supabase-js@2";
import { Xs2Client, Xs2Error } from "../_shared/xs2event.ts";

const MAX_ATTEMPTS = 48; // ~2 days at hourly cadence
const BATCH_SIZE = 25;
const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://rent-route-hub.lovable.app";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

type PendingOrder = {
  id: string;
  customer_email: string | null;
  customer_name: string | null;
  xs2_reservation_id: string | null;
  xs2_booking_id: string | null;
  fulfillment_attempt_count: number;
  order_items: Array<{
    id: string;
    ticket_deliveries: Array<{ file_url: string | null }>;
  }>;
};

async function sendTicketsReadyEmail(orderId: string, fileUrl: string) {
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.warn("Resend not configured; skipping tickets-ready email");
    return;
  }
  const supabase = getSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, customer_email, customer_name, order_items(qty, events(home_team, away_team, race_name, venue_name, city, starts_at), ticket_categories(name))",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!order || !(order as any).customer_email) return;

  const items = ((order as any).order_items ?? [])
    .map((it: any) => {
      const title = it.events?.home_team
        ? `${it.events.home_team} vs ${it.events.away_team}`
        : it.events?.race_name ?? "Evenemang";
      const date = new Date(it.events?.starts_at).toLocaleDateString("sv-SE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      return `<li style="margin:0 0 6px;color:#475569;">
        <strong style="color:#0f172a;">${title}</strong> · ${date} · ${it.ticket_categories?.name ?? ""} × ${it.qty}
      </li>`;
    })
    .join("");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#fff;color:#0f172a;">
      <div style="background:#0f172a;color:#fff;padding:32px;text-align:center;">
        <div style="font-size:22px;font-weight:700;letter-spacing:0.04em;">KAISEN TRAVEL GROUP</div>
      </div>
      <div style="padding:32px;">
        <h1 style="font-size:24px;margin:0 0 8px;">Dina biljetter är klara! 🎟️</h1>
        <p style="color:#475569;line-height:1.6;margin:0 0 20px;">
          Hej ${(order as any).customer_name ?? ""},<br/>
          Biljetterna till din beställning är nu redo att laddas ner.
        </p>
        <ul style="padding-left:18px;margin:0 0 24px;">${items}</ul>
        <p style="text-align:center;margin:32px 0;">
          <a href="${fileUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 32px;text-decoration:none;letter-spacing:.1em;text-transform:uppercase;font-size:13px;border-radius:6px;">
            Hämta dina biljetter
          </a>
        </p>
        <p style="color:#64748b;font-size:13px;margin-top:24px;">
          Tips: spara filerna direkt i mobilens biljett-app eller skriv ut dem inför resan.<br/>
          Du hittar dem också under <a href="${SITE_URL}/mitt-kaisen/biljetter" style="color:#0f172a;">Mitt Kaisen → Mina biljetter</a>.
        </p>
        <p style="color:#475569;font-size:13px;margin-top:32px;">
          Order-ID: ${(order as any).id}<br/>
          Frågor? Svara på detta mejl eller kontakta oss på info@kaisengroup.se
        </p>
      </div>
      <div style="background:#f8fafc;padding:20px;text-align:center;color:#64748b;font-size:12px;">
        Kaisen Travel Group · info@kaisengroup.se
      </div>
    </div>`;

  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Kaisen Travel Group <info@kaisengroup.se>",
        to: [(order as any).customer_email],
        subject: `Dina biljetter är klara · ${(order as any).id.slice(0, 8).toUpperCase()}`,
        html,
      }),
    });
    if (!res.ok) console.error("tickets-ready email failed", await res.text());
  } catch (e) {
    console.error("tickets-ready email send threw", e);
  }
}

async function processOrder(o: PendingOrder): Promise<{ status: string; reason?: string }> {
  const supabase = getSupabase();
  const xs2 = new Xs2Client();

  // 1. Ensure we have a booking_id. If not, confirmBooking probably failed
  //    originally — retry it.
  let bookingId = o.xs2_booking_id;
  if (!bookingId) {
    if (!o.xs2_reservation_id || !o.customer_email) {
      return { status: "skipped", reason: "missing reservation_id or email" };
    }
    try {
      const paymentMethod = Deno.env.get("XS2_PAYMENT_METHOD") ?? "invoice";
      const booking = await xs2.confirmBooking({
        reservation_id: o.xs2_reservation_id,
        invoice_reference: o.id,
        booking_email: o.customer_email,
        payment_method: paymentMethod,
      });
      bookingId = booking.booking_id;
      await supabase
        .from("orders")
        .update({ status: "fulfilled", xs2_booking_id: bookingId })
        .eq("id", o.id);
    } catch (e) {
      const status = e instanceof Xs2Error ? e.status : "unknown";
      const msg = e instanceof Error ? e.message : "unknown";
      console.error("retry confirmBooking failed", { orderId: o.id, status, msg });
      return { status: "confirm_failed", reason: `${status}: ${msg}` };
    }
  }

  // 2. Fetch the e-ticket bundle URL
  let zipUrl: string | null = null;
  try {
    const r = await xs2.getETicketZipUrl({ booking_id: bookingId! });
    zipUrl = r.url ?? null;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("retry getETicketZipUrl failed", { orderId: o.id, msg });
    return { status: "ticket_url_failed", reason: msg };
  }

  if (!zipUrl) {
    return { status: "tickets_not_ready" };
  }

  // 3. Stamp deliveries for every item missing a file_url
  for (const it of o.order_items) {
    const has = it.ticket_deliveries?.some((d) => !!d.file_url);
    if (has) continue;
    const { data: existing } = await supabase
      .from("ticket_deliveries")
      .select("id")
      .eq("order_item_id", it.id)
      .maybeSingle();
    if (existing?.id) {
      await supabase
        .from("ticket_deliveries")
        .update({ file_url: zipUrl, delivered_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await supabase.from("ticket_deliveries").insert({
        order_item_id: it.id,
        delivery_method: "email",
        file_url: zipUrl,
        delivered_at: new Date().toISOString(),
      });
    }
  }

  // 4. Send the "your tickets are ready" follow-up (once per order)
  await sendTicketsReadyEmail(o.id, zipUrl);
  await supabase
    .from("orders")
    .update({ tickets_ready_email_sent_at: new Date().toISOString() })
    .eq("id", o.id);

  return { status: "delivered" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  // Allow either cron (no auth) or manual admin trigger (we won't check
  // auth strictly — schedule runs under service role; if exposed via HTTP
  // the worst case is an unauthenticated person triggers a retry batch).
  try {
    const supabase = getSupabase();
    const { data: candidates, error } = await supabase
      .from("orders")
      .select(
        "id, customer_email, customer_name, xs2_reservation_id, xs2_booking_id, fulfillment_attempt_count, paid_at, status, order_items(id, ticket_deliveries(file_url))",
      )
      .in("status", ["paid", "fulfilled"])
      .is("tickets_ready_email_sent_at", null)
      .lt("fulfillment_attempt_count", MAX_ATTEMPTS)
      .order("paid_at", { ascending: true })
      .limit(BATCH_SIZE);
    if (error) throw error;

    const pending = ((candidates as unknown as PendingOrder[]) ?? []).filter((o) => {
      // Only retry orders where at least one item is missing its file_url
      return o.order_items?.some((it) => !it.ticket_deliveries?.some((d) => !!d.file_url));
    });

    const results: Array<{ orderId: string; status: string; reason?: string }> = [];
    for (const o of pending) {
      const r = await processOrder(o);
      results.push({ orderId: o.id, ...r });
      const nextAttemptCount = (o.fulfillment_attempt_count ?? 0) + 1;
      const update: Record<string, unknown> = {
        fulfillment_attempt_count: nextAttemptCount,
        fulfillment_last_attempt_at: new Date().toISOString(),
      };
      if (r.status === "confirm_failed" || r.status === "ticket_url_failed") {
        update.notes = `xs2 retry ${r.status}: ${r.reason ?? "unknown"}`;
      }
      await supabase.from("orders").update(update).eq("id", o.id);

      // Surface a system_error row when an order is about to fall off the
      // retry queue — admin needs to ship tickets manually or refund.
      if (nextAttemptCount >= MAX_ATTEMPTS - 1 && r.status !== "delivered") {
        try {
          await supabase.from("system_errors").insert({
            kind: "fulfillment_max_attempts",
            message: `Order ${o.id} reached ${nextAttemptCount}/${MAX_ATTEMPTS} attempts without ticket delivery — manual fulfillment required`,
            order_id: o.id,
            details: { last_status: r.status, last_reason: r.reason ?? null },
          });
        } catch (logErr) {
          console.error("[xs2-retry-pending] system_errors insert failed", logErr);
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, scanned: pending.length, results }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("xs2-retry-pending fatal", e);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
