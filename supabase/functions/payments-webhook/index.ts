import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook, createStripeClient } from "../_shared/stripe.ts";
import { Xs2Client, Xs2Error } from "../_shared/xs2event.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendOrderConfirmationEmail(orderId: string) {
  if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
    console.warn("Resend not configured; skipping email");
    return;
  }
  const supabase = getSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_email, customer_name, total_sek, currency, quote_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || !order.customer_email) return;

  // If xs2 already returned a ticket bundle URL (delivered at confirm time),
  // include a download button in the confirmation email. Otherwise the copy
  // promises a follow-up — fired by xs2-retry-pending once tickets issue.
  let ticketFileUrl: string | null = null;
  if (!order.quote_id) {
    const { data: deliveries } = await supabase
      .from("ticket_deliveries")
      .select("file_url, order_items!inner(order_id)")
      .eq("order_items.order_id", orderId)
      .not("file_url", "is", null)
      .limit(1);
    ticketFileUrl = (deliveries?.[0] as any)?.file_url ?? null;
  }

  // Ticket orders have order_items; quote orders have line items on quote_items.
  let rows = "";
  if (order.quote_id) {
    const { data: qitems } = await supabase
      .from("quote_items")
      .select("description, qty, unit_price_sek, sort_order")
      .eq("quote_id", order.quote_id)
      .order("sort_order");
    rows = (qitems ?? [])
      .map((it: any) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:600;color:#0f172a;">${it.description}</div>
            <div style="font-size:13px;color:#475569;">${it.qty} × ${new Intl.NumberFormat("sv-SE").format(Number(it.unit_price_sek))} SEK</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#0f172a;">
            ${new Intl.NumberFormat("sv-SE").format(Number(it.unit_price_sek) * it.qty)} SEK
          </td>
        </tr>`)
      .join("");
  } else {
    const { data: items } = await supabase
      .from("order_items")
      .select(
        "qty, unit_price_sek, events(home_team, away_team, race_name, venue_name, city, starts_at), ticket_categories(name)",
      )
      .eq("order_id", orderId);
    rows = (items ?? [])
      .map((it: any) => {
        const title = it.events?.home_team
          ? `${it.events.home_team} vs ${it.events.away_team}`
          : it.events?.race_name ?? "Evenemang";
        const date = new Date(it.events?.starts_at).toLocaleDateString("sv-SE", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        return `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
            <div style="font-weight:600;color:#0f172a;">${title}</div>
            <div style="font-size:13px;color:#475569;">${date} · ${it.events?.venue_name ?? ""}${it.events?.city ? ", " + it.events.city : ""}</div>
            <div style="font-size:13px;color:#475569;">${it.ticket_categories?.name ?? ""} × ${it.qty}</div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#0f172a;">
            ${new Intl.NumberFormat("sv-SE").format(Number(it.unit_price_sek) * it.qty)} SEK
          </td>
        </tr>`;
      })
      .join("");
  }

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#fff;color:#0f172a;">
    <div style="background:#0f172a;color:#fff;padding:32px;text-align:center;">
      <div style="font-size:22px;font-weight:700;letter-spacing:0.04em;">KAISEN TRAVEL GROUP</div>
    </div>
    <div style="padding:32px;">
      <h1 style="font-size:24px;margin:0 0 8px;">Tack för din beställning!</h1>
      <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
        Hej ${order.customer_name ?? ""},<br/>
        ${ticketFileUrl
          ? "Vi har tagit emot din betalning. Biljetterna ligger redan klara — ladda ner dem nedan."
          : "Vi har tagit emot din betalning. Biljetterna släpps från arrangören närmare evenemanget och mejlas till dig så snart de är klara — du behöver inte göra något."}
      </p>
      ${ticketFileUrl ? `
      <p style="text-align:center;margin:24px 0;">
        <a href="${ticketFileUrl}" style="display:inline-block;background:#0f172a;color:#fff;padding:14px 32px;text-decoration:none;letter-spacing:.1em;text-transform:uppercase;font-size:13px;border-radius:6px;">
          Hämta dina biljetter
        </a>
      </p>` : ""}
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">${rows}</table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <tr><td style="padding:12px 0;font-weight:700;">Totalt</td>
        <td style="padding:12px 0;text-align:right;font-weight:700;font-size:18px;">
          ${new Intl.NumberFormat("sv-SE").format(Number(order.total_sek))} SEK
        </td></tr>
      </table>
      <p style="color:#475569;font-size:13px;margin-top:32px;">
        Order-ID: ${order.id}<br/>
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
        to: [order.customer_email],
        subject: `Orderbekräftelse · ${order.id.slice(0, 8).toUpperCase()}`,
        html,
      }),
    });
    if (!res.ok) console.error("Resend error", await res.text());
  } catch (e) {
    console.error("Email send failed", e);
  }
}

async function ensureUserForGuestOrder(orderId: string) {
  const supabase = getSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, user_id, customer_email, customer_name")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.user_id || !order.customer_email) return;

  const email = String(order.customer_email).toLowerCase().trim();
  const [firstName, ...rest] = String(order.customer_name ?? "").trim().split(/\s+/);
  const lastName = rest.join(" ");

  // Find or create the auth user
  let userId: string | null = null;
  const { data: existing } = await supabase.auth.admin.listUsers();
  const found = existing?.users?.find((u: any) => u.email === email);
  if (found) {
    userId = found.id;
  } else {
    const redirectTo = `${Deno.env.get("SITE_URL") ?? "https://rent-route-hub.lovable.app"}/mitt-kaisen`;
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "invite",
      email,
      options: { data: { first_name: firstName, last_name: lastName }, redirectTo },
    });
    if (linkData?.user) {
      userId = linkData.user.id;
      await supabase.from("profiles").upsert({
        id: userId,
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        status: "active",
      });
      await supabase.from("user_roles").upsert({ user_id: userId, role: "guest" });

      // Send password-setup email via Resend gateway
      const actionLink = linkData.properties?.action_link;
      if (LOVABLE_API_KEY && RESEND_API_KEY && actionLink) {
        const html = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#0f1929;padding:32px;color:#c9d6e8;">
          <div style="max-width:560px;margin:0 auto;background:#162035;padding:32px;border:1px solid #1e2d4a;">
            <h1 style="color:#c9d6e8;font-weight:400;">Tack för ditt köp, ${firstName || ""}!</h1>
            <p>Vi har skapat ett konto på Mitt Kaisen så att du kan se din order, fakturor och biljetter.</p>
            <p><a href="${actionLink}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:14px 32px;text-decoration:none;letter-spacing:.15em;text-transform:uppercase;font-size:13px;">Sätt ditt lösenord</a></p>
            <p style="color:#4a5d75;font-size:12px;">Om knappen inte fungerar: <a href="${actionLink}" style="color:#c9d6e8;">${actionLink}</a></p>
          </div></body></html>`;
        await fetch(`${GATEWAY_URL}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "X-Connection-Api-Key": RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: "Kaisen Travel Group <info@kaisengroup.se>",
            to: [email],
            subject: "Välkommen till Mitt Kaisen – sätt ditt lösenord",
            html,
          }),
        }).catch((e) => console.error("Welcome email failed", e));
      }
    }
  }

  if (userId) {
    await supabase.from("orders").update({ user_id: userId }).eq("id", orderId);
  }
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  // Two paths share this webhook: ticket orders (metadata.orderId) and quote
  // payments (metadata.quoteId). Branch up front.
  const quoteId = session.metadata?.quoteId;
  if (quoteId) {
    await handleQuotePaid(quoteId, session);
    return;
  }

  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.warn("checkout.session.completed without orderId or quoteId metadata");
    return;
  }

  // Idempotency: Stripe retries webhooks on any non-2xx. Without this guard
  // a retry would double-decrement stock, duplicate ticket_deliveries rows,
  // and re-call xs2 confirmBooking (which would fail on an already-confirmed
  // reservation and stamp a misleading error on a successful order).
  const { data: existing } = await getSupabase()
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  if (existing?.status === "paid" || existing?.status === "fulfilled") {
    console.log("ticket order already paid/fulfilled — skipping duplicate webhook", {
      orderId,
      status: existing.status,
    });
    return;
  }

  const stripe = createStripeClient(env);
  // Pull amounts (sek minor units → major)
  const totalSek = session.amount_total ? Number(session.amount_total) / 100 : null;

  const updates: Record<string, unknown> = {
    status: "paid",
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id: session.payment_intent ?? null,
  };
  if (totalSek != null) updates.total_paid_sek = totalSek;

  await getSupabase().from("orders").update(updates).eq("id", orderId);

  // Pull the order back to branch on xs2 vs manual inventory
  const { data: order } = await getSupabase()
    .from("orders")
    .select("id, customer_email, xs2_reservation_id")
    .eq("id", orderId)
    .maybeSingle();

  const { data: items } = await getSupabase()
    .from("order_items")
    .select("id, category_id, qty, external_ticket_ids")
    .eq("order_id", orderId);

  if (order?.xs2_reservation_id) {
    // xs2-sourced order — confirm with xs2event so suppliers ship tickets,
    // then fetch the e-ticket bundle URL and record it for delivery.
    await confirmXs2Booking(orderId, order, items ?? []);
  } else {
    // Manual/Stripe-product inventory — decrement local stock per category
    for (const it of items ?? []) {
      await getSupabase().rpc("decrement_ticket_qty", {
        p_category_id: (it as any).category_id,
        p_qty: Number((it as any).qty),
      });
      await getSupabase().from("ticket_deliveries").insert({
        order_item_id: (it as any).id,
        delivery_method: "email",
      });
    }
  }

  // Auto-create Mitt Kaisen account for guest checkouts and link to order
  await ensureUserForGuestOrder(orderId);

  await sendOrderConfirmationEmail(orderId);
}

// Auto-refund for orders where xs2 confirm is terminally impossible (hold
// expired or reservation unknown). Stripe charged the customer; we can't
// deliver tickets; the only honest response is to give the money back
// immediately + tell the customer what happened.
//
// Uses sandbox/live based on env var STRIPE_ENV (set per project). Records
// the refund in `refunds` table so it shows up in admin reporting alongside
// manual refunds.
async function autoRefundForFailedBooking(orderId: string, reasonDetail: string) {
  const supabase = getSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, total_paid_sek, total_sek, refunded_sek, stripe_payment_intent_id, customer_email, customer_name, invoice_number")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || !order.stripe_payment_intent_id) {
    console.error("auto-refund: order or PI missing", { orderId });
    return;
  }
  if (!["paid", "fulfilled"].includes(order.status as string)) {
    console.log("auto-refund: order not in refundable state", { orderId, status: order.status });
    return;
  }
  const paid = Number(order.total_paid_sek ?? order.total_sek);
  const alreadyRefunded = Number(order.refunded_sek ?? 0);
  const refundable = Math.max(0, paid - alreadyRefunded);
  if (refundable <= 0) {
    console.log("auto-refund: nothing left to refund", { orderId });
    return;
  }

  const env: StripeEnv = (Deno.env.get("STRIPE_ENV") === "live" ? "live" : "sandbox") as StripeEnv;
  const stripe = createStripeClient(env);
  const refund = await stripe.refunds.create({
    payment_intent: order.stripe_payment_intent_id as string,
    amount: Math.round(refundable * 100),
    reason: "requested_by_customer",
    metadata: { orderId, auto_refund_reason: `xs2_confirm_terminal: ${reasonDetail.slice(0, 200)}` },
  });
  await supabase.from("refunds").insert({
    order_id: orderId,
    amount_sek: refundable,
    reason: `Automatisk: xs2 kunde inte fullfölja bokningen (${reasonDetail.slice(0, 240)})`,
    stripe_refund_id: refund.id,
    processed_by: null,
  });
  await supabase
    .from("orders")
    .update({
      refunded_sek: alreadyRefunded + refundable,
      last_refund_reason: "xs2 reservation expired before booking could be confirmed",
      status: "refunded",
    })
    .eq("id", orderId);

  // Customer email
  if (LOVABLE_API_KEY && RESEND_API_KEY && order.customer_email) {
    const orderRef = order.invoice_number ?? (order.id as string).slice(0, 8).toUpperCase();
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#fff;color:#0f172a;">
        <div style="background:#0f172a;color:#fff;padding:32px;text-align:center;">
          <div style="font-size:22px;font-weight:700;letter-spacing:0.04em;">KAISEN TRAVEL GROUP</div>
        </div>
        <div style="padding:32px;">
          <h1 style="font-size:22px;margin:0 0 12px;">Vi kunde tyvärr inte slutföra din bokning</h1>
          <p style="color:#475569;line-height:1.6;">
            Hej ${order.customer_name ?? ""},<br/><br/>
            Vi har tyvärr inte kunnat säkra biljetterna för din beställning <strong>${orderRef}</strong>.
            Det här händer ibland när biljetterna säljs slut i samma ögonblick som betalningen behandlas.
          </p>
          <p style="color:#475569;line-height:1.6;">
            Vi har redan återbetalat hela beloppet på <strong>${new Intl.NumberFormat("sv-SE").format(refundable)} SEK</strong> till samma kort du betalade med. Det tar normalt 3–10 bankdagar innan beloppet syns på ditt konto.
          </p>
          <p style="color:#475569;line-height:1.6;">
            Vill du försöka boka igen finns evenemanget kvar på vår sida — biljetter kan ha släppts på nytt.
            Behöver du hjälp att hitta motsvarande biljett? Svara på det här mejlet så löser vi det åt dig.
          </p>
          <p style="color:#94a3b8;font-size:12px;margin-top:32px;">
            Order-ID: ${order.id}<br/>
            Återbetalnings-ID: ${refund.id}
          </p>
        </div>
        <div style="background:#f8fafc;padding:20px;text-align:center;color:#64748b;font-size:12px;">
          Kaisen Travel Group · info@kaisengroup.se
        </div>
      </div>`;
    await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: "Kaisen Travel Group <info@kaisengroup.se>",
        to: [order.customer_email],
        subject: `Återbetalning genomförd · ${orderRef}`,
        html,
        reply_to: "info@kaisengroup.se",
      }),
    }).catch((e) => console.error("auto-refund email failed", e));
  }
}

async function confirmXs2Booking(
  orderId: string,
  order: { customer_email: string | null; xs2_reservation_id: string | null },
  items: Array<{ id: string; external_ticket_ids: unknown }>,
) {
  if (!order.xs2_reservation_id || !order.customer_email) {
    console.error("xs2 confirm skipped — missing reservation_id or email", { orderId });
    return;
  }

  const paymentMethod = Deno.env.get("XS2_PAYMENT_METHOD") ?? "invoice";
  let booking;
  try {
    const xs2 = new Xs2Client();
    booking = await xs2.confirmBooking({
      reservation_id: order.xs2_reservation_id,
      invoice_reference: orderId,
      booking_email: order.customer_email,
      payment_method: paymentMethod,
    });
  } catch (e) {
    const status = e instanceof Xs2Error ? e.status : "unknown";
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("xs2 confirmBooking failed", { orderId, status, error: e });
    await getSupabase()
      .from("orders")
      .update({ notes: `xs2 confirm failed (${status}): ${msg}` })
      .eq("id", orderId);

    // Terminal "reservation gone" responses — xs2 can't fulfill no matter how
    // many times we retry. Auto-refund instead of leaving the customer
    // charged and waiting on ops.
    //
    // 422 with "no items" / "quantities are 0" → hold expired between Stripe
    // payment and our confirm. 410 Gone → reservation_id literally
    // unrecognized. Either way, the booking will never succeed.
    const isTerminalHoldGone =
      status === 422 ||
      status === 410 ||
      /reservation has no items|quantities are 0|reservation .* (expired|not found)/i.test(msg);
    if (isTerminalHoldGone) {
      await autoRefundForFailedBooking(orderId, msg).catch((err) =>
        console.error("auto-refund failed", { orderId, err }),
      );
    }
    return;
  }

  // Store the booking id in a dedicated column for support / refund traceability
  await getSupabase()
    .from("orders")
    .update({ status: "fulfilled", xs2_booking_id: booking.booking_id })
    .eq("id", orderId);

  // Fetch the e-ticket bundle and stamp each order_item with the same URL.
  // (xs2's zip endpoint returns ALL tickets in a booking — one URL covers
  // every supplier in the order.)
  let zipUrl: string | null = null;
  try {
    const xs2 = new Xs2Client();
    const r = await xs2.getETicketZipUrl({ booking_id: booking.booking_id });
    zipUrl = r.url;
  } catch (e) {
    console.error("xs2 getETicketZipUrl failed", { orderId, error: e });
  }

  for (const it of items) {
    await getSupabase().from("ticket_deliveries").insert({
      order_item_id: it.id,
      delivery_method: "email",
      file_url: zipUrl,
      delivered_at: zipUrl ? new Date().toISOString() : null,
    });
  }
}

async function handleQuotePaid(quoteId: string, session: any) {
  const supabase = getSupabase();
  // The orders row was pre-created by create-quote-checkout; metadata.orderId
  // links them.
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.error("quote payment without orderId metadata", { quoteId });
    return;
  }

  // Idempotency — same reason as the ticket path; without this the
  // confirmation email + ensureUserForGuestOrder would re-run on every retry.
  const { data: existing } = await supabase
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();
  if (existing?.status === "fulfilled") {
    console.log("quote order already fulfilled — skipping duplicate webhook", { orderId });
    return;
  }

  const totalSek = session.amount_total ? Number(session.amount_total) / 100 : null;

  const updates: Record<string, unknown> = {
    status: "fulfilled",
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id: session.payment_intent ?? null,
  };
  if (totalSek != null) updates.total_paid_sek = totalSek;
  await supabase.from("orders").update(updates).eq("id", orderId);

  await supabase
    .from("quotes")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      order_id: orderId,
    })
    .eq("id", quoteId);

  await ensureUserForGuestOrder(orderId);
  await sendOrderConfirmationEmail(orderId);
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
