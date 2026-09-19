// admin-refund-order — issue a Stripe refund + record it in our DB.
//
// Body: {
//   order_id: string,
//   amount_sek: number,           // partial or full; validated against remaining
//   reason?: string,              // free-text, surfaced to customer email
//   environment: "sandbox" | "live",
//   notify_customer?: boolean     // default true
// }
//
// Flow:
//   1. Admin-only auth
//   2. Load order; refuse if not paid/fulfilled or no stripe_payment_intent_id
//   3. Compute remaining refundable; validate amount
//   4. Stripe refunds.create against the payment_intent
//   5. Insert refunds row, bump orders.refunded_sek + last_refund_reason
//   6. Update orders.status to 'refunded' if fully refunded (else leave it)
//   7. (Optional) email customer via Resend
//
// Does NOT cancel any supplier booking — that is arranged directly with
// booking-cancellation endpoint. The admin UI surfaces this so ops contacts
// the supplier when needed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SENDER = "Kaisen Travel Group <info@kaisengroup.se>";

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
  const { data: isAdmin } = await userClient.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Admin role required");
  return user.id;
}

async function emailRefundNotice(
  to: string,
  customerName: string | null,
  amountSek: number,
  reason: string | null,
  orderRef: string,
) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.warn("RESEND_API_KEY missing — skipping refund email");
    return;
  }
  const fmt = new Intl.NumberFormat("sv-SE").format(amountSek);
  const firstName = (customerName ?? "").split(/\s+/)[0] ?? "";
  const html = `
<div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <div style="background:#0f172a;color:#ffffff;padding:28px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:24px;letter-spacing:.05em;">KAISEN</div>
      <div style="font-size:10px;letter-spacing:.3em;text-transform:uppercase;opacity:.7;margin-top:4px;">Travel Group</div>
    </div>
    <div style="padding:28px;color:#0f172a;">
      <p style="margin:0 0 16px;font-size:15px;">Hej ${firstName},</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
        Vi har genomfört en återbetalning på <strong>${fmt} SEK</strong> till samma kort du betalade med. Det brukar synas på kontoutdraget inom 5&nbsp;–&nbsp;10 arbetsdagar, beroende på bank.
      </p>
      ${reason ? `
      <div style="background:#f8fafc;border-left:3px solid #0f172a;padding:14px 16px;margin:16px 0;font-size:13px;line-height:1.6;">
        <div style="color:#64748b;text-transform:uppercase;letter-spacing:.15em;font-size:11px;margin-bottom:6px;">Anledning</div>
        ${reason.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c] ?? c))}
      </div>` : ""}
      <p style="margin:16px 0 0;font-size:13px;color:#64748b;">
        Beställning: ${orderRef}<br/>
        Frågor? Svara på detta mejl.
      </p>
    </div>
  </div>
</div>`.trim();

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: SENDER,
      to: [to],
      subject: `Återbetalning genomförd — ${fmt} SEK`,
      html,
      reply_to: "info@kaisengroup.se",
    }),
  }).catch((e) => console.error("refund email send failed", e));
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
    const adminUserId = await requireAdmin(req);

    const body = await req.json();
    const {
      order_id,
      amount_sek,
      reason,
      notify_customer = true,
    } = body as {
      order_id: string;
      amount_sek: number;
      reason?: string;
      notify_customer?: boolean;
    };

    if (!order_id) throw new Error("order_id required");
    if (!Number.isFinite(amount_sek) || amount_sek <= 0) throw new Error("amount_sek must be positive");
    // Stripe env is server-controlled (see create-checkout for rationale).
    const envFromSecret = Deno.env.get("STRIPE_ENV");
    const environment: "sandbox" | "live" = envFromSecret === "live" ? "live" : "sandbox";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: oErr } = await supabase
      .from("orders")
      .select("id, status, total_paid_sek, total_sek, refunded_sek, stripe_payment_intent_id, customer_email, customer_name, invoice_number")
      .eq("id", order_id)
      .maybeSingle();
    if (oErr || !order) throw new Error("Order not found");
    if (!["paid", "fulfilled"].includes(order.status)) {
      throw new Error("Endast betalda eller levererade beställningar kan återbetalas");
    }
    if (!order.stripe_payment_intent_id) {
      throw new Error("Saknar Stripe-betalning — ingen återbetalning möjlig");
    }

    const paid = Number(order.total_paid_sek ?? order.total_sek);
    const alreadyRefunded = Number(order.refunded_sek ?? 0);
    const remaining = paid - alreadyRefunded;
    // Floating-point tolerance: allow a tiny over-shoot before rejecting.
    if (amount_sek > remaining + 0.01) {
      throw new Error(`Belopp överstiger återbetalningsbart kvar (${remaining.toFixed(2)} SEK)`);
    }

    const stripe = createStripeClient(environment);
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent_id,
      amount: Math.round(amount_sek * 100),
      reason: "requested_by_customer",
      metadata: {
        orderId: order.id,
        ...(reason && { reason: reason.slice(0, 480) }),
      },
    });

    const newRefundedSek = Math.round((alreadyRefunded + amount_sek) * 100) / 100;
    const fullyRefunded = Math.abs(newRefundedSek - paid) < 0.01;

    const { error: insErr } = await supabase.from("refunds").insert({
      order_id: order.id,
      amount_sek,
      reason: reason ?? null,
      stripe_refund_id: refund.id,
      processed_by: adminUserId,
    });
    if (insErr) throw new Error(`refund record insert: ${insErr.message}`);

    const orderUpdates: Record<string, unknown> = {
      refunded_sek: newRefundedSek,
      last_refund_reason: reason ?? null,
    };
    if (fullyRefunded) orderUpdates.status = "refunded";
    await supabase.from("orders").update(orderUpdates).eq("id", order.id);

    if (notify_customer && order.customer_email) {
      const orderRef = order.invoice_number ?? order.id.slice(0, 8).toUpperCase();
      await emailRefundNotice(
        order.customer_email,
        order.customer_name,
        amount_sek,
        reason ?? null,
        orderRef,
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        refund_id: refund.id,
        refunded_sek_total: newRefundedSek,
        fully_refunded: fullyRefunded,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("admin-refund-order:", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
