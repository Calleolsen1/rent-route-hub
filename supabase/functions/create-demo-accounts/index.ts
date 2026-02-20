import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const accounts = [
    {
      email: "papa.admin@kaisengroup.se",
      password: "KaisenDemo2025!",
      first_name: "Papa",
      last_name: "Admin",
      role: "admin",
    },
    {
      email: "papa.host@kaisengroup.se",
      password: "KaisenDemo2025!",
      first_name: "Papa",
      last_name: "Arrangör",
      role: "host",
    },
    {
      email: "papa.guest@kaisengroup.se",
      password: "KaisenDemo2025!",
      first_name: "Papa",
      last_name: "Resenär",
      role: "guest",
    },
  ];

  const results = [];

  for (const account of accounts) {
    try {
      // Check if user already exists
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      const exists = existingUsers?.users?.find(
        (u) => u.email === account.email
      );

      if (exists) {
        results.push({ email: account.email, status: "already_exists", id: exists.id });
        continue;
      }

      // Create the user with email_confirm: true so they can log in immediately
      const { data: created, error: createError } =
        await adminClient.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            first_name: account.first_name,
            last_name: account.last_name,
          },
        });

      if (createError || !created?.user) {
        results.push({ email: account.email, status: "error", error: createError?.message });
        continue;
      }

      const userId = created.user.id;

      // Create profile
      const { error: profileError } = await adminClient.from("profiles").upsert({
        id: userId,
        email: account.email,
        first_name: account.first_name,
        last_name: account.last_name,
        status: "active",
      });

      if (profileError) {
        results.push({ email: account.email, status: "profile_error", error: profileError.message, id: userId });
        continue;
      }

      // Assign role
      const { error: roleError } = await adminClient.from("user_roles").upsert({
        user_id: userId,
        role: account.role,
      });

      if (roleError) {
        results.push({ email: account.email, status: "role_error", error: roleError.message, id: userId });
        continue;
      }

      results.push({ email: account.email, status: "created", role: account.role, id: userId });
    } catch (err) {
      results.push({ email: account.email, status: "exception", error: String(err) });
    }
  }

  return new Response(JSON.stringify({ success: true, results }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
