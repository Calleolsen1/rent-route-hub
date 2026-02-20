import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin using their token
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const callerId = claimsData.claims.sub;

    // Check if caller has admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const { email, first_name, last_name } = await req.json();

    if (!email || !first_name || !last_name) {
      return new Response(
        JSON.stringify({ error: "email, first_name och last_name krävs" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.find(
      (u) => u.email === email.toLowerCase().trim()
    );
    if (alreadyExists) {
      return new Response(
        JSON.stringify({ error: "En användare med denna e-post finns redan." }),
        { status: 409, headers: corsHeaders }
      );
    }

    // Generate a secure invite link (inviteUserByEmail creates user + sends email)
    const siteUrl = req.headers.get("origin") || "https://rent-route-hub.lovable.app";
    const redirectTo = `${siteUrl}/mitt-kaisen/aterstall-losenord`;

    // Create user with inviteUserByEmail — this creates the account AND sends an invite
    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(email.toLowerCase().trim(), {
        data: {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
        },
        redirectTo,
      });

    if (inviteError) {
      console.error("inviteUserByEmail error:", inviteError);
      return new Response(
        JSON.stringify({ error: inviteError.message }),
        { status: 500, headers: corsHeaders }
      );
    }

    const newUserId = inviteData.user.id;

    // Create profile
    await adminClient.from("profiles").upsert({
      id: newUserId,
      email: email.toLowerCase().trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      status: "active",
    });

    // Assign guest role
    await adminClient.from("user_roles").upsert({
      user_id: newUserId,
      role: "guest",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Konto skapat och välkomstmejl skickat till ${email}`,
        user_id: newUserId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
