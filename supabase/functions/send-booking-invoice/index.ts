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

const sek = (n: number) =>
  new Intl.NumberFormat("sv-SE", { style: "currency", currency: "SEK", maximumFractionDigits: 0 })
    .format(Number(n || 0));

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

    const { invoice_id, preview } = await req.json();
    if (!invoice_id || typeof invoice_id !== "string") {
      return json({ error: "invoice_id krävs" }, 400);
    }

    const { data: invoice } = await admin
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .maybeSingle();
    if (!invoice) return json({ error: "Fakturan hittades inte" }, 404);

    const [{ data: customer }, { data: items }] = await Promise.all([
      admin.from("customers").select("*").eq("id", invoice.customer_id).maybeSingle(),
      admin.from("invoice_items").select("*").eq("invoice_id", invoice_id).order("sort_order"),
    ]);

    const to = customer?.billing_email || customer?.email;
    if (!to && !preview) return json({ error: "Kunden saknar e-postadress" }, 400);

    const rows = (items ?? [])
      .map(
        (i: any) => `<tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb">${i.description}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${i.qty}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${sek(i.unit_price_sek)}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${sek(Number(i.unit_price_sek) * Number(i.qty))}</td>
        </tr>`,
      )
      .join("");

    const html = `<!doctype html><html><body style="font-family:Helvetica,Arial,sans-serif;background:#f6f7f9;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
        <p style="letter-spacing:.2em;font-size:12px;color:#64748b;margin:0 0 4px">KAISEN TRAVEL GROUP</p>
        <h1 style="font-size:22px;color:#0f172a;margin:0 0 4px">Faktura ${invoice.invoice_number ?? ""}</h1>
        <p style="color:#64748b;margin:0 0 16px">Fakturadatum ${invoice.issue_date} · Förfaller ${invoice.due_date}</p>
        <p style="color:#334155">${customer?.company_name ?? customer?.contact_name ?? ""}<br/>${customer?.billing_address ?? customer?.address_line1 ?? ""}</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#0f172a;margin-top:12px">${rows}</table>
        <table style="width:100%;margin-top:12px;color:#0f172a">
          <tr><td style="color:#64748b">Netto</td><td style="text-align:right">${sek(invoice.subtotal_sek)}</td></tr>
          <tr><td style="color:#64748b">Moms ${invoice.vat_rate}%</td><td style="text-align:right">${sek(invoice.vat_sek)}</td></tr>
          <tr><td><strong>Att betala</strong></td><td style="text-align:right"><strong>${sek(invoice.total_sek)}</strong></td></tr>
        </table>
        ${invoice.notes ? `<p style="color:#334155;white-space:pre-wrap">${invoice.notes}</p>` : ""}
        <p style="color:#64748b;font-size:13px;margin-top:24px">Kaisen Travel Group · info@kaisengroup.se</p>
      </div></body></html>`;

    const subject = `Faktura ${invoice.invoice_number ?? ""} från Kaisen Travel Group`;

    if (preview) return json({ html, subject, to: to ?? null });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    let status = "sent";
    let errorMessage: string | null = null;

    if (!resendKey) {
      status = "failed";
      errorMessage = "RESEND_API_KEY saknas";
    } else {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Kaisen Travel Group <info@kaisengroup.se>",
          to: [to],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        status = "failed";
        errorMessage = await res.text();
      }
    }

    await admin.from("booking_documents").insert({
      booking_id: invoice.booking_id,
      invoice_id,
      customer_id: invoice.customer_id,
      doc_type: "invoice",
      recipient_email: to,
      subject,
      status,
      error_message: errorMessage,
      html,
    });

    if (status === "failed") return json({ error: errorMessage }, 500);

    if (invoice.status === "draft") {
      await admin
        .from("invoices")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", invoice_id);
    }

    return json({ success: true, to });
  } catch (err) {
    console.error("send-booking-invoice error", err);
    return json({ error: "Internal server error" }, 500);
  }
});
