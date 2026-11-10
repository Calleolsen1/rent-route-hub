// admin-check-config — diagnostics endpoint, returns presence (boolean only)
// of every secret the rest of the system depends on. Never returns the values
// themselves, so it's safe to expose to authenticated admins.

import { translateCategoryStrict } from "../_shared/translate.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function requireAdmin(req: Request): Promise<void> {
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
}

const has = (key: string): boolean => {
  const v = Deno.env.get(key);
  return v != null && v !== "";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    await requireAdmin(req);

    return new Response(
      JSON.stringify({
        // football-data.org — the fixtures source
        football_data_api_key: has("FOOTBALL_DATA_API_KEY"),

        // Travel Connection — the ticket supplier. The environment is derived
        // from the base URL (unset = sandbox); only the name is returned.
        travelconnection_username: has("TRAVELCONNECTION_USERNAME"),
        travelconnection_password: has("TRAVELCONNECTION_PASSWORD"),
        travelconnection_environment: /sandbox/i.test(
          Deno.env.get("TRAVELCONNECTION_BASE_URL") ?? "sandbox",
        )
          ? "sandbox"
          : "production",
        travelconnection_orders_enabled:
          Deno.env.get("TRAVELCONNECTION_ORDERS_ENABLED") === "true",

        // DPA Sports Travel — hotels. Unset base URL = the test API (dummy hotels).
        dpa_api_key: has("DPA_API_KEY"),
        dpa_environment: /\/\/dev\./.test(Deno.env.get("DPA_BASE_URL") ?? "//dev.")
          ? "test"
          : "live",

        // stripe
        stripe_sandbox: has("STRIPE_SANDBOX_API_KEY"),
        stripe_live: has("STRIPE_LIVE_API_KEY"),
        payments_sandbox_webhook: has("PAYMENTS_SANDBOX_WEBHOOK_SECRET"),
        payments_live_webhook: has("PAYMENTS_LIVE_WEBHOOK_SECRET"),
        lovable_api_key: has("LOVABLE_API_KEY"),

        // email
        resend_api_key: has("RESEND_API_KEY"),

        // Claude: translates supplier ticket descriptions to Swedish
        anthropic_api_key: has("ANTHROPIC_API_KEY"),
        // A real one-line translation, so a broken key or call shows here.
        translation_test: await translateCategoryStrict("Long side", ["Padded seats, block 102"])
          .then((r) => `ok: ${r.lines[0]}`)
          .catch((e: { status?: number; message?: string }) => `fel: ${e?.status ? `${e.status} ` : ""}${e?.message ?? String(e)}`),

        // misc
        site_url: Deno.env.get("SITE_URL") ?? null,

        // derived
        football_data_configured: has("FOOTBALL_DATA_API_KEY"),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
