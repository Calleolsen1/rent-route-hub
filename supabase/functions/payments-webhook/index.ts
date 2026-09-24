import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook, createStripeClient } from "../_shared/stripe.ts";
import { TravelConnectionClient } from "../_shared/travelconnection.ts";
import { fulfilOrder } from "../_shared/tc_orders.ts";
import { sendEmailOrError } from "../_shared/email.ts";

type DbClient = SupabaseClient<any, "public", any>;

let _supabase: DbClient | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}


/**
 * Structured error logging. Writes a row to public.system_errors so admins
 * can review failures in /admin/diagnostics. Falls back to console.error
 * only when even the DB insert fails — we never re-throw so the webhook
 * keeps processing.
 */
async function logSystemError(
  kind: string,
  message: string,
  opts: { orderId?: string | null; details?: unknown } = {},
) {
  console.error(`[system_error:${kind}]`, message, opts.details ?? "");
  try {
    await getSupabase().from("system_errors").insert({
      kind,
      message: message.slice(0, 1000),
      order_id: opts.orderId ?? null,
      details: opts.details
        ? JSON.parse(JSON.stringify(opts.details, (_, v) => v instanceof Error ? { name: v.name, message: v.message, stack: v.stack } : v))
        : null,
    });
  } catch (e) {
    console.error("[system_error] DB insert itself failed", e);
  }
}

async function sendOrderConfirmationEmail(orderId: string) {
  const supabase = getSupabase();
  const { data: order } = await supabase
    .from("orders")
    .select("id, customer_email, customer_name, total_sek, currency, quote_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || !order.customer_email) return;

  // If a ticket file has already been attached to the order, include a
  // download button in the confirmation email. Otherwise the copy promises a
  // follow-up, which admin fulfilment satisfies when the tickets are uploaded.
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
        const date = new Date(it.events?.starts_at).toLocaleDateString("sv-SE", { timeZone: "Europe/Stockholm",
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

  const error = await sendEmailOrError({
    to: order.customer_email,
    subject: `Orderbekräftelse · ${order.id.slice(0, 8).toUpperCase()}`,
    html,
  });
  if (error) await logSystemError("order_confirmation_email_failed", error, { orderId });

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

      // Password-setup email
      const actionLink = linkData.properties?.action_link;
      if (actionLink) {
        const html = `<!DOCTYPE html><html><body style="font-family:Georgia,serif;background:#0f1929;padding:32px;color:#c9d6e8;">
          <div style="max-width:560px;margin:0 auto;background:#162035;padding:32px;border:1px solid #1e2d4a;">
            <h1 style="color:#c9d6e8;font-weight:400;">Tack för ditt köp, ${firstName || ""}!</h1>
            <p>Vi har skapat ett konto på Mitt Kaisen så att du kan se din order, fakturor och biljetter.</p>
            <p><a href="${actionLink}" style="display:inline-block;background:#1e3a5f;color:#fff;padding:14px 32px;text-decoration:none;letter-spacing:.15em;text-transform:uppercase;font-size:13px;">Sätt ditt lösenord</a></p>
            <p style="color:#4a5d75;font-size:12px;">Om knappen inte fungerar: <a href="${actionLink}" style="color:#c9d6e8;">${actionLink}</a></p>
          </div></body></html>`;
        const error = await sendEmailOrError({
          to: email,
          subject: "Välkommen till Mitt Kaisen – sätt ditt lösenord",
          html,
        });
        if (error) await logSystemError("welcome_email_failed", error, { orderId });
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
  // a retry would double-decrement stock and duplicate ticket_deliveries
  // rows, leaving a misleading trail on an otherwise successful order.
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

  const { data: items } = await getSupabase()
    .from("order_items")
    .select("id, category_id, qty, external_ticket_ids")
    .eq("order_id", orderId);

  // Decrement local stock and open a delivery row per line.
  //
  // The delivery rows are the queue in the admin Tickets page where the
  // actual e-tickets are uploaded. Travel Connection tickets are booked just
  // below, but the club's e-tickets still reach Kaisen close to the match
  // and are forwarded from that queue.
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

  // Supplier tickets: confirm the hold made at checkout (or re-take the same
  // tickets if it lapsed during payment). A failure never fails the webhook —
  // the customer has paid either way — it flags the booking and emails ops.
  const { data: tcBooking } = await getSupabase()
    .from("tc_bookings")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (tcBooking) {
    try {
      const r = await fulfilOrder(getSupabase(), new TravelConnectionClient(), orderId);
      console.log("[payments-webhook] travelconnection fulfilment", { orderId, ...r });
    } catch (e) {
      await logSystemError("tc_fulfilment_threw", e instanceof Error ? e.message : String(e), { orderId, details: e });
    }
  }

  // Auto-create Mitt Kaisen account for guest checkouts and link to order
  await ensureUserForGuestOrder(orderId);

  await sendOrderConfirmationEmail(orderId);
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
    await logSystemError("webhook_handler_failed", e instanceof Error ? e.message : String(e), { details: e });
    return new Response("Webhook error", { status: 400 });
  }
});
