import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const userId = claimsData.claims.sub;

    const body = await req.json();
    const { group_id, member_ids, invoice_amount, invoice_currency, invoice_notes } = body;

    if (!group_id) {
      return new Response(JSON.stringify({ error: "group_id is required" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Use service role for admin operations
    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify user is admin or organizer
    const { data: userRoles } = await serviceSupabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const isAdmin = userRoles?.some((r) => r.role === "admin");

    if (!isAdmin) {
      // Check if they are organizer of this group
      const { data: group } = await serviceSupabase
        .from("trip_groups")
        .select("organizer_user_id")
        .eq("id", group_id)
        .single();

      if (!group || group.organizer_user_id !== userId) {
        return new Response(
          JSON.stringify({ error: "Forbidden: not admin or organizer" }),
          { status: 403, headers: corsHeaders }
        );
      }
    }

    // Build query for members to update
    let query = serviceSupabase
      .from("trip_members")
      .update({
        invoice_sent_at: new Date().toISOString(),
        ...(invoice_amount !== undefined && { invoice_amount }),
        ...(invoice_currency && { invoice_currency }),
        ...(invoice_notes && { invoice_notes }),
      })
      .eq("group_id", group_id);

    if (member_ids && member_ids.length > 0) {
      query = query.in("id", member_ids);
    }

    const { data: updated, error: updateError } = await query.select();

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // In a real implementation, send emails here
    console.log(
      `[send-group-invoice] Invoice sent to ${updated?.length ?? 0} members for group ${group_id}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        updated_count: updated?.length ?? 0,
        members: updated,
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
