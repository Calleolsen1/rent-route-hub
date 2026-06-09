// create-quote-checkout — public endpoint, customer pays a quote.
//
// Body: { public_token: string, environment: "sandbox" | "live", returnBase: string }
//
// Flow:
//   1. Look up quote by token (service role bypasses RLS; quote is identified
//      by an unguessable UUID so this is safe public access)
//   2. Refuse if expired, accepted, cancelled, or draft
//   3. Pre-create the orders row in `pending` state so the return URL can
//      point to /order/:orderId — reuses the existing OrderConfirmation page.
//      The webhook later marks the same row `fulfilled` and the quote
//      `accepted`. Idempotent: if a pending order already exists for this
//      quote, we reuse it instead of creating duplicates on retry.
//   4. Build Stripe line_items with price_data inline (no Stripe products
//      pre-created for one-off custom trips)
//   5. Create Embedded Checkout session, return { clientSecret, orderId }
//   6. Store stripe_checkout_session_id on quote + order for webhook correlation

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";
import { checkRateLimit } from "../_shared/rate_limit.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rl = await checkRateLimit(req, "create-quote-checkout", { max: 30, windowSec: 600 });
  if (!rl.allowed) return rl.response;

  try {
    const { public_token, returnBase } = await req.json();
    if (!public_token) throw new Error("public_token required");
    if (!returnBase) throw new Error("returnBase required");
    // Stripe env is server-controlled (see create-checkout for rationale).
    const envFromSecret = Deno.env.get("STRIPE_ENV");
    const env: StripeEnv = envFromSecret === "live" ? "live" : "sandbox";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: quote, error: qErr } = await supabase
      .from("quotes")
      .select("*")
      .eq("public_token", public_token)
      .maybeSingle();
    if (qErr || !quote) throw new Error("Offerten hittades inte");

    if (quote.status === "cancelled") throw new Error("Offerten är avbruten");
    if (quote.status === "accepted") throw new Error("Offerten är redan betald");
    if (quote.status === "draft") throw new Error("Offerten har inte skickats än");

    const expired = new Date(quote.expires_at).getTime() < Date.now();
    if (expired || quote.status === "expired") {
      // Lazy-mark as expired so the badge updates on the next /quote/:token view
      if (quote.status !== "expired") {
        await supabase.from("quotes").update({ status: "expired" }).eq("id", quote.id);
      }
      throw new Error("Offerten har gått ut");
    }

    const { data: items, error: iErr } = await supabase
      .from("quote_items")
      .select("description, qty, unit_price_sek")
      .eq("quote_id", quote.id)
      .order("sort_order");
    if (iErr || !items?.length) throw new Error("Offerten saknar rader");

    const currency = ((quote.currency ?? "sek") as string).toLowerCase();
    const stripe = createStripeClient(env);

    const line_items = items.map((it: any) => {
      const unit = Number(it.unit_price_sek);
      if (!unit || unit <= 0) throw new Error("Ogiltigt pris på offertrad");
      return {
        price_data: {
          currency,
          product_data: {
            name: it.description,
          },
          unit_amount: Math.round(unit * 100),
          tax_behavior: "inclusive" as const,
        },
        quantity: it.qty,
      };
    });

    // Resolve / create Stripe customer by email (no auth user context here)
    let customerId: string | undefined;
    if (quote.customer_email) {
      const existing = await stripe.customers.list({ email: quote.customer_email, limit: 1 });
      if (existing.data.length) {
        customerId = existing.data[0].id;
      } else {
        const created = await stripe.customers.create({
          email: quote.customer_email,
          ...(quote.customer_name && { name: quote.customer_name }),
        });
        customerId = created.id;
      }
    }

    // Reuse a still-pending order for this quote on retry, otherwise create one.
    const computedTotal = items.reduce(
      (sum: number, it: any) => sum + Number(it.unit_price_sek) * Number(it.qty),
      0,
    );

    let orderId: string | null = null;
    const { data: existingOrder } = await supabase
      .from("orders")
      .select("id, status")
      .eq("quote_id", quote.id)
      .in("status", ["pending", "awaiting_payment"])
      .maybeSingle();
    if (existingOrder) {
      orderId = existingOrder.id as string;
    } else {
      const { data: newOrder, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: null,
          status: "pending",
          total_sek: computedTotal,
          currency: quote.currency ?? "SEK",
          customer_email: quote.customer_email,
          customer_name: quote.customer_name,
          quote_id: quote.id,
          notes: `Custom trip: ${quote.title}`,
        })
        .select("id")
        .single();
      if (orderErr || !newOrder) throw new Error(`order insert: ${orderErr?.message}`);
      orderId = newOrder.id as string;
    }

    const returnUrl = `${returnBase.replace(/\/+$/, "")}/order/${orderId}?session_id={CHECKOUT_SESSION_ID}`;

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      ...(customerId && { customer: customerId }),
      // automatic_tax needs a customer address. Collect during checkout and
      // sync onto the Stripe customer so we have it for future refunds /
      // tax reports.
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      ...(customerId && {
        customer_update: { address: "auto", name: "auto" },
      }),
      payment_intent_data: {
        description: `Kaisen offert ${quote.id.slice(0, 8).toUpperCase()}`,
      },
      metadata: {
        quoteId: quote.id,
        orderId,
        publicToken: quote.public_token,
      },
    });

    await Promise.all([
      supabase.from("quotes").update({ stripe_checkout_session_id: session.id }).eq("id", quote.id),
      supabase
        .from("orders")
        .update({
          stripe_checkout_session_id: session.id,
          status: "awaiting_payment",
        })
        .eq("id", orderId),
    ]);

    return new Response(JSON.stringify({ clientSecret: session.client_secret, orderId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("create-quote-checkout:", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
