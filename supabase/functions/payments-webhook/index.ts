import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook, createStripeClient } from "../_shared/stripe.ts";

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
    .select("id, customer_email, customer_name, total_sek, currency")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || !order.customer_email) return;

  const { data: items } = await supabase
    .from("order_items")
    .select(
      "qty, unit_price_sek, events(home_team, away_team, race_name, venue_name, city, starts_at), ticket_categories(name)",
    )
    .eq("order_id", orderId);

  const rows = (items ?? [])
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

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;background:#fff;color:#0f172a;">
    <div style="background:#0f172a;color:#fff;padding:32px;text-align:center;">
      <div style="font-size:22px;font-weight:700;letter-spacing:0.04em;">KAISEN TRAVEL GROUP</div>
    </div>
    <div style="padding:32px;">
      <h1 style="font-size:24px;margin:0 0 8px;">Tack för din beställning!</h1>
      <p style="color:#475569;line-height:1.6;margin:0 0 24px;">
        Hej ${order.customer_name ?? ""},<br/>
        Vi har tagit emot din betalning. Biljetter och fullständig reseinformation skickas separat så snart de är klara.
      </p>
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

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.warn("checkout.session.completed without orderId metadata");
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

  // Decrement ticket availability
  const { data: items } = await getSupabase()
    .from("order_items")
    .select("category_id, qty")
    .eq("order_id", orderId);
  for (const it of items ?? []) {
    const { data: cat } = await getSupabase()
      .from("ticket_categories")
      .select("qty_available")
      .eq("id", (it as any).category_id)
      .maybeSingle();
    if (cat) {
      const next = Math.max(0, Number((cat as any).qty_available) - Number((it as any).qty));
      await getSupabase()
        .from("ticket_categories")
        .update({ qty_available: next })
        .eq("id", (it as any).category_id);
    }
  }

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
