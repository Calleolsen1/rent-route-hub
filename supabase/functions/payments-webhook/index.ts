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

  // Atomically decrement ticket availability
  const { data: items } = await getSupabase()
    .from("order_items")
    .select("id, category_id, qty")
    .eq("order_id", orderId);
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

  // Auto-create Mitt Kaisen account for guest checkouts and link to order
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
