const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const body = await req.json();
    const { categoryId, environment } = body;
    if (!categoryId || typeof categoryId !== "string") throw new Error("categoryId required");
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: aerr } = await supabase.auth.getClaims(token);
    if (aerr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const userId = claims.claims.sub as string;
    const { data: isAdminRow } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdminRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { data: cat } = await admin
      .from("ticket_categories")
      .select("id, name, description, unit_price_sek, currency, event_id, events(home_team, away_team, race_name, tournament_name)")
      .eq("id", categoryId)
      .maybeSingle();
    if (!cat) throw new Error("Category not found");

    const ev: any = (cat as any).events;
    const eventTitle = ev?.home_team
      ? `${ev.home_team} vs ${ev.away_team}`
      : ev?.race_name ?? ev?.tournament_name ?? "Kaisen event";
    const productName = `${eventTitle} – ${(cat as any).name}`;
    const lookupKey = `cat_${categoryId.replace(/-/g, "").slice(0, 20)}`;
    const env: StripeEnv = environment;
    const stripe = createStripeClient(env);

    // Find or create product
    const existingProducts = await stripe.products.search({
      query: `metadata['categoryId']:'${categoryId}'`,
      limit: 1,
    });
    let product = existingProducts.data[0];
    if (!product) {
      product = await stripe.products.create({
        name: productName,
        tax_code: "txcd_90020001",
        metadata: { categoryId, eventId: (cat as any).event_id },
      });
    }

    // Look up existing price by lookup_key
    const existing = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
    const desiredAmount = Math.round(Number((cat as any).unit_price_sek) * 100);
    const desiredCurrency = ((cat as any).currency ?? "sek").toLowerCase();

    let priceOk = existing.data[0];
    if (
      priceOk &&
      (priceOk.unit_amount !== desiredAmount || priceOk.currency !== desiredCurrency || priceOk.product !== product.id)
    ) {
      // Deactivate the stale price and create a new one with the same lookup_key
      await stripe.prices.update(priceOk.id, { active: false, lookup_key: null as any });
      priceOk = undefined as any;
    }
    if (!priceOk) {
      priceOk = await stripe.prices.create({
        product: product.id,
        unit_amount: desiredAmount,
        currency: desiredCurrency,
        lookup_key: lookupKey,
        transfer_lookup_key: true,
        tax_behavior: "inclusive",
      });
    }

    await admin.rpc("admin_set_ticket_stripe_price", {
      p_category_id: categoryId,
      p_lookup_key: lookupKey,
    });

    return new Response(JSON.stringify({ lookupKey, priceId: priceOk.id, productId: product.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("sync-stripe-price error", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
