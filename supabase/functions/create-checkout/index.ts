import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { orderId, environment, returnUrl } = await req.json();
    if (!orderId || typeof orderId !== "string") throw new Error("orderId required");
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");

    const env: StripeEnv = environment;
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, user_id, customer_email, customer_name, status")
      .eq("id", orderId)
      .maybeSingle();
    if (orderErr || !order) throw new Error("Order not found");
    if (order.status === "paid") throw new Error("Order already paid");

    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("qty, ticket_categories(stripe_price_id, name)")
      .eq("order_id", orderId);
    if (itemsErr || !items?.length) throw new Error("No items on order");

    const stripe = createStripeClient(env);

    // Resolve lookup_keys → Stripe price IDs
    const lookupKeys = items
      .map((i: any) => i.ticket_categories?.stripe_price_id)
      .filter(Boolean);
    if (lookupKeys.length === 0) throw new Error("Missing stripe price mapping");
    const prices = await stripe.prices.list({ lookup_keys: lookupKeys, limit: 100 });
    const priceByKey = new Map(prices.data.map((p) => [p.lookup_key as string, p.id]));

    const line_items = items.map((i: any) => {
      const key = i.ticket_categories?.stripe_price_id;
      const priceId = priceByKey.get(key);
      if (!priceId) throw new Error(`Price not found for ${key}`);
      return { price: priceId, quantity: i.qty };
    });

    // Resolve / create customer with userId metadata
    let customerId: string | undefined;
    if (order.customer_email || order.user_id) {
      if (order.user_id) {
        const found = await stripe.customers.search({
          query: `metadata['userId']:'${order.user_id}'`,
          limit: 1,
        });
        if (found.data.length) customerId = found.data[0].id;
      }
      if (!customerId && order.customer_email) {
        const existing = await stripe.customers.list({ email: order.customer_email, limit: 1 });
        if (existing.data.length) {
          customerId = existing.data[0].id;
          if (order.user_id && existing.data[0].metadata?.userId !== order.user_id) {
            await stripe.customers.update(customerId, {
              metadata: { ...existing.data[0].metadata, userId: order.user_id },
            });
          }
        }
      }
      if (!customerId) {
        const created = await stripe.customers.create({
          ...(order.customer_email && { email: order.customer_email }),
          ...(order.customer_name && { name: order.customer_name }),
          ...(order.user_id && { metadata: { userId: order.user_id } }),
        });
        customerId = created.id;
      }
    }

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      ...(customerId && { customer: customerId }),
      automatic_tax: { enabled: true },
      payment_intent_data: { description: `Kaisen biljetter – order ${orderId.slice(0, 8)}` },
      metadata: { orderId, ...(order.user_id && { userId: order.user_id }) },
    });

    // Save session id on order for tracking
    await supabase
      .from("orders")
      .update({ stripe_checkout_session_id: session.id, status: "awaiting_payment" })
      .eq("id", orderId);

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("create-checkout error:", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
