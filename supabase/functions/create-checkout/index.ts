import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

function computeFinalSek(baseSek: number, markupPct: number, markupFixed: number): number {
  const withPct = baseSek * (1 + (Number(markupPct) || 0) / 100);
  return Math.round(withPct + (Number(markupFixed) || 0));
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
      .select("id, user_id, customer_email, customer_name, status, currency, xs2_reservation_id, reservation_expires_at")
      .eq("id", orderId)
      .maybeSingle();
    if (orderErr || !order) throw new Error("Order not found");
    if (order.status === "paid") throw new Error("Order already paid");

    // xs2 orders have a 10-minute hold — refuse checkout if expired so the
    // customer doesn't pay for tickets we can no longer claim.
    if (order.xs2_reservation_id && order.reservation_expires_at) {
      const expiresAt = new Date(order.reservation_expires_at).getTime();
      if (Date.now() >= expiresAt) {
        throw new Error("Reservation expired — please reserve again");
      }
    }

    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("qty, unit_price_sek, ticket_categories(id, name, stripe_price_id), events(tournament_name, home_team, away_team, race_name)")
      .eq("order_id", orderId);
    if (itemsErr || !items?.length) throw new Error("No items on order");

    const stripe = createStripeClient(env);
    const currency = ((order.currency ?? "sek") as string).toLowerCase();
    let newOrderTotal = 0;

    // Two paths: xs2 orders use inline price_data (we don't pre-create Stripe
    // products for inventory we don't own). Manual/Stripe-product orders use
    // the existing lookup_key flow.
    let line_items: Array<{
      price_data: Record<string, unknown>;
      quantity: number;
    }>;

    if (order.xs2_reservation_id) {
      line_items = items.map((i: any) => {
        const finalSek = Number(i.unit_price_sek);
        if (!finalSek || finalSek <= 0) throw new Error("Invalid order item price");
        newOrderTotal += finalSek * i.qty;
        const ev = i.events;
        const productName = ev?.home_team
          ? `${ev.home_team} vs ${ev.away_team}`
          : ev?.race_name ?? ev?.tournament_name ?? "Biljett";
        const categoryName = i.ticket_categories?.name ?? "";
        return {
          price_data: {
            currency,
            product_data: {
              name: categoryName ? `${productName} — ${categoryName}` : productName,
              // Required by automatic_tax. txcd_20030000 = Admission to sporting events.
              tax_code: "txcd_20030000",
            },
            unit_amount: Math.round(finalSek * 100),
            tax_behavior: "inclusive" as const,
          },
          quantity: i.qty,
        };
      });
    } else {
      // Pre-existing flow for Stripe-managed prices (manual inventory)
      const lookupKeys = Array.from(
        new Set(items.map((i: any) => i.ticket_categories?.stripe_price_id).filter(Boolean)),
      ) as string[];
      if (lookupKeys.length === 0) throw new Error("Missing stripe price mapping");
      const stripePrices = await stripe.prices.list({ lookup_keys: lookupKeys, limit: 100 });
      const productByKey = new Map(
        stripePrices.data.map((p) => [
          p.lookup_key as string,
          typeof p.product === "string" ? p.product : (p.product as any)?.id,
        ]),
      );

      line_items = items.map((i: any) => {
        const cat = i.ticket_categories;
        const productId = productByKey.get(cat?.stripe_price_id);
        if (!productId) throw new Error(`Stripe product not found for ${cat?.stripe_price_id}`);
        const finalSek = Number(i.unit_price_sek);
        if (!finalSek || finalSek <= 0) throw new Error("Invalid order item price");
        newOrderTotal += finalSek * i.qty;
        return {
          price_data: {
            currency,
            product: productId,
            unit_amount: Math.round(finalSek * 100),
            tax_behavior: "inclusive" as const,
          },
          quantity: i.qty,
        };
      });
    }


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
      // automatic_tax requires a customer billing address. Collect it during
      // checkout and merge onto the Stripe customer for repeat purchases.
      automatic_tax: { enabled: true },
      billing_address_collection: "required",
      ...(customerId && {
        customer_update: { address: "auto", name: "auto" },
      }),
      payment_intent_data: { description: `Kaisen biljetter – order ${orderId.slice(0, 8)}` },
      metadata: { orderId, ...(order.user_id && { userId: order.user_id }) },
    });

    // Persist freshly computed total + session id so the summary stays consistent
    await supabase
      .from("orders")
      .update({
        stripe_checkout_session_id: session.id,
        status: "awaiting_payment",
        total_sek: newOrderTotal,
      })
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
