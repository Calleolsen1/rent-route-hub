// admin-check-config — diagnostics endpoint, returns presence (boolean only)
// of every secret the rest of the system depends on. Never returns the values
// themselves, so it's safe to expose to authenticated admins.

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

    const xs2Configured = has("XS2_API_KEY") && has("XS2_BASE_URL");

    return new Response(
      JSON.stringify({
        // xs2event
        xs2_api_key: has("XS2_API_KEY"),
        xs2_base_url: has("XS2_BASE_URL"),
        xs2_payment_method: has("XS2_PAYMENT_METHOD"),
        xs2_auth_header_custom: has("XS2_AUTH_HEADER"),
        xs2_auth_scheme_custom: has("XS2_AUTH_SCHEME"),

        // stripe
        stripe_sandbox: has("STRIPE_SANDBOX_API_KEY"),
        stripe_live: has("STRIPE_LIVE_API_KEY"),
        payments_sandbox_webhook: has("PAYMENTS_SANDBOX_WEBHOOK_SECRET"),
        payments_live_webhook: has("PAYMENTS_LIVE_WEBHOOK_SECRET"),
        lovable_api_key: has("LOVABLE_API_KEY"),

        // email
        resend_api_key: has("RESEND_API_KEY"),

        // misc
        site_url: Deno.env.get("SITE_URL") ?? null,

        // derived
        mock_mode_active: !xs2Configured,
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
