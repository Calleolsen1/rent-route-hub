const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

export function computeFinalSek(baseSek: number, markupPct: number, markupFixed: number): number {
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
    const { event_id, category_ids, environment } = await req.json();
    if (environment !== "sandbox" && environment !== "live") throw new Error("Invalid environment");
    const env: StripeEnv = environment;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let query = admin
      .from("ticket_categories")
      .select("id, event_id, currency, stripe_price_id, unit_price_sek, markup_pct, markup_fixed_sek");
    if (event_id) query = query.eq("event_id", event_id);
    else if (Array.isArray(category_ids) && category_ids.length) query = query.in("id", category_ids);
    else throw new Error("event_id or category_ids required");

    const { data: cats, error } = await query;
    if (error) throw error;
    if (!cats?.length) {
      return new Response(JSON.stringify({ prices: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = createStripeClient(env);
    const lookupKeys = Array.from(
      new Set(cats.map((c: any) => c.stripe_price_id).filter(Boolean)),
    ) as string[];

    const priceByKey = new Map<string, { amount: number; currency: string }>();
    if (lookupKeys.length) {
      const stripePrices = await stripe.prices.list({ lookup_keys: lookupKeys, limit: 100 });
      for (const p of stripePrices.data) {
        if (p.lookup_key && p.unit_amount != null) {
          priceByKey.set(p.lookup_key, { amount: p.unit_amount / 100, currency: p.currency });
        }
      }
    }

    const result = cats.map((c: any) => {
      const live = c.stripe_price_id ? priceByKey.get(c.stripe_price_id) : undefined;
      const baseSek = live ? live.amount : Number(c.unit_price_sek ?? 0);
      const finalSek = computeFinalSek(baseSek, c.markup_pct ?? 0, c.markup_fixed_sek ?? 0);
      return {
        category_id: c.id,
        event_id: c.event_id,
        base_sek: baseSek,
        final_sek: finalSek,
        currency: (live?.currency ?? c.currency ?? "sek").toUpperCase(),
        stripe_synced: !!live,
      };
    });

    // Best-effort: update cached unit_price_sek so DB stays roughly in sync
    Promise.all(
      result
        .filter((r) => r.stripe_synced)
        .map((r) =>
          admin.from("ticket_categories").update({ unit_price_sek: r.final_sek }).eq("id", r.category_id),
        ),
    ).catch((e) => console.error("price cache update failed", e));

    return new Response(JSON.stringify({ prices: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("get-ticket-prices error:", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
