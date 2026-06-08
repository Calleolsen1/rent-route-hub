// send-quote-email — emails the customer their quote with a pay link.
//
// Body: { quote_id: string }
//
// Auth: admin only. Reads the quote + items + public_token from DB, composes
// a Swedish HTML email, sends via Resend, marks quote.sent_at = now() and
// status = 'sent' on the first send.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SENDER = "Kaisen Travel Group <info@kaisengroup.se>";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://rent-route-hub.lovable.app";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!),
  );

const formatSek = (n: number) => new Intl.NumberFormat("sv-SE").format(n);

async function requireAdmin(req: Request): Promise<string> {
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
  return user.id;
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
    await requireAdmin(req);

    const { quote_id } = await req.json();
    if (!quote_id) throw new Error("quote_id required");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: quote }, { data: items }] = await Promise.all([
      admin.from("quotes").select("*").eq("id", quote_id).maybeSingle(),
      admin.from("quote_items").select("*").eq("quote_id", quote_id).order("sort_order"),
    ]);
    if (!quote) throw new Error("Quote not found");
    if (quote.status === "cancelled") throw new Error("Quote är avbruten");

    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) throw new Error("RESEND_API_KEY missing");

    const link = `${SITE_URL.replace(/\/+$/, "")}/quote/${quote.public_token}`;
    const expiresFmt = new Date(quote.expires_at).toLocaleDateString("sv-SE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const firstName = (quote.customer_name ?? "").split(/\s+/)[0] ?? "";

    const itemsHtml = (items ?? [])
      .map((it: any) => {
        const subtotal = Number(it.unit_price_sek) * Number(it.qty);
        return `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#0f172a;">
              ${escapeHtml(it.description)}<br/>
              <span style="font-size:12px;color:#64748b;">${it.qty} × ${formatSek(Number(it.unit_price_sek))} SEK</span>
            </td>
            <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-size:14px;color:#0f172a;">
              ${formatSek(subtotal)} SEK
            </td>
          </tr>`;
      })
      .join("");

    const html = `
<div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <div style="background:#0f172a;color:#ffffff;padding:32px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:24px;letter-spacing:.05em;">KAISEN</div>
      <div style="font-size:10px;letter-spacing:.3em;text-transform:uppercase;opacity:.7;margin-top:4px;">Travel Group</div>
    </div>
    <div style="padding:32px 28px;color:#0f172a;">
      <p style="margin:0 0 16px;font-size:15px;">Hej ${escapeHtml(firstName)},</p>
      <h1 style="font-size:22px;margin:0 0 12px;font-weight:600;">${escapeHtml(quote.title)}</h1>
      ${quote.intro_message
        ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;white-space:pre-wrap;">${escapeHtml(quote.intro_message)}</p>`
        : ""}
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">${itemsHtml}</table>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:14px 0;font-weight:700;font-size:15px;">Totalt</td>
          <td style="padding:14px 0;text-align:right;font-weight:700;font-size:20px;">
            ${formatSek(Number(quote.total_sek))} ${escapeHtml(quote.currency)}
          </td>
        </tr>
      </table>
      <p style="margin:24px 0 8px;font-size:13px;color:#64748b;">Offerten gäller till och med ${expiresFmt}.</p>
      <div style="margin:24px 0;text-align:center;">
        <a href="${link}"
           style="display:inline-block;background:#0f172a;color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:9999px;font-size:14px;letter-spacing:0.05em;font-weight:600;">
          Granska och betala
        </a>
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:#64748b;text-align:center;">
        Eller kopiera länken: <a href="${link}" style="color:#0f172a;">${link}</a>
      </p>
    </div>
    <div style="background:#f1f5f9;padding:16px 28px;font-size:12px;color:#64748b;text-align:center;">
      Frågor? Svara på detta mejl. · info@kaisengroup.se
    </div>
  </div>
</div>`.trim();

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SENDER,
        to: [quote.customer_email],
        subject: `Din offert från Kaisen Travel Group — ${quote.title}`,
        html,
        reply_to: "info@kaisengroup.se",
      }),
    });
    if (!res.ok) {
      throw new Error(`Resend ${res.status}: ${await res.text()}`);
    }

    // First-send bookkeeping
    const updates: Record<string, unknown> = { status: "sent" };
    if (!quote.sent_at) updates.sent_at = new Date().toISOString();
    await admin.from("quotes").update(updates).eq("id", quote_id);

    // Optional: link the inquiry to quoted status
    if (quote.inquiry_id) {
      await admin
        .from("inquiries")
        .update({ status: "quoted" })
        .eq("id", quote.inquiry_id);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-quote-email:", e);
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
