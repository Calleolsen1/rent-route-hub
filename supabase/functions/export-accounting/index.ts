import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Returns invoice rows formatted for the Spiris accounting import and marks
 * them as exported. Pass { include_exported: true } to re-export everything.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const anon = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: claims } = await anon.auth.getClaims(authHeader.replace("Bearer ", ""));
    const userId = claims?.claims?.sub;
    if (!userId) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch (_) {
      body = {};
    }
    const includeExported = body.include_exported === true;

    let query = admin
      .from("invoices")
      .select("*")
      .neq("status", "draft")
      .neq("status", "cancelled")
      .order("issue_date");
    if (!includeExported) query = query.is("exported_at", null);

    const { data: invoices, error } = await query;
    if (error) return json({ error: error.message }, 500);
    if (!invoices || invoices.length === 0) return json({ rows: [] });

    const customerIds = [...new Set(invoices.map((i: any) => i.customer_id))];
    const { data: customers } = await admin
      .from("customers")
      .select("id, customer_number, company_name, contact_name, org_number")
      .in("id", customerIds);
    const byId = new Map((customers ?? []).map((c: any) => [c.id, c]));

    const rows = invoices.map((i: any) => {
      const c = byId.get(i.customer_id);
      return {
        invoice_number: i.invoice_number,
        customer_number: c?.customer_number ?? "",
        customer_name: c?.company_name || c?.contact_name || "",
        org_number: c?.org_number ?? "",
        issue_date: i.issue_date,
        due_date: i.due_date,
        subtotal_sek: i.subtotal_sek,
        vat_rate: i.vat_rate,
        vat_sek: i.vat_sek,
        total_sek: i.total_sek,
        paid_sek: i.paid_sek,
        paid_at: i.paid_at,
        accounting_account: i.accounting_account,
        status: i.status,
      };
    });

    if (!includeExported) {
      await admin
        .from("invoices")
        .update({ exported_at: new Date().toISOString() })
        .in(
          "id",
          invoices.map((i: any) => i.id),
        );
    }

    return json({ rows });
  } catch (err) {
    console.error("export-accounting error", err);
    return json({ error: "Internal server error" }, 500);
  }
});
