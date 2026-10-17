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

    const { invoice_id, preview, message } = await req.json();
    if (!invoice_id || typeof invoice_id !== "string") {
      return json({ error: "invoice_id krävs" }, 400);
    }

    const { data: invoice } = await admin
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .maybeSingle();
    if (!invoice) return json({ error: "Fakturan hittades inte" }, 404);

    const { data: customer } = await admin
      .from("customers")
      .select("*")
      .eq("id", invoice.customer_id)
      .maybeSingle();

    const to = customer?.billing_email || customer?.email;
    if (!to && !preview) return json({ error: "Kunden saknar e-postadress" }, 400);

    const extra = typeof message === "string" && message.trim() ? message.trim() : "";

    const html = `<!doctype html><html><body style="font-family:Helvetica,Arial,sans-serif;background:#f6f7f9;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
        <p style="letter-spacing:.2em;font-size:12px;color:#64748b;margin:0 0 4px">KAISEN TRAVEL GROUP</p>
        <h1 style="font-size:22px;color:#0f172a;margin:0 0 4px">Faktura ${invoice.invoice_number ?? ""} är makulerad</h1>
        <p style="color:#334155;margin:0 0 16px">Hej ${customer?.contact_name ?? ""},</p>
        <p style="color:#334155;margin:0 0 16px">
          Fakturan ${invoice.invoice_number ?? ""} på ${sek(invoice.total_sek)} har makulerats och ska inte betalas.
          Har du redan betalat hör av dig så återbetalar vi beloppet.
        </p>
        ${extra ? `<p style="color:#334155;white-space:pre-wrap">${extra}</p>` : ""}
        <p style="color:#64748b;font-size:13px;margin-top:24px">KAISEN TRAVEL GROUP · info@kaisengroup.se</p>
      </div></body></html>`;

    const subject = `Faktura ${invoice.invoice_number ?? ""} är makulerad`;

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
          from: "KAISEN TRAVEL GROUP <info@kaisengroup.se>",
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
      doc_type: "invoice_cancelled",
      recipient_email: to,
      subject,
      status,
      error_message: errorMessage,
      html,
    });

    if (status === "failed") return json({ error: errorMessage }, 500);

    await admin.from("invoices").update({ status: "cancelled" }).eq("id", invoice_id);

    return json({ success: true, to });
  } catch (err) {
    console.error("send-invoice-cancellation error", err);
    return json({ error: "Internal server error" }, 500);
  }
});
