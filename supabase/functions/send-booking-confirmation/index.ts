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

const ITEM_LABEL: Record<string, string> = {
  hotel: "Hotell",
  flight: "Flyg",
  ticket: "Biljetter",
  transfer: "Transfer",
  other: "Övrigt",
};

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

    const { booking_id, preview } = await req.json();
    if (!booking_id || typeof booking_id !== "string") {
      return json({ error: "booking_id krävs" }, 400);
    }

    const { data: booking } = await admin
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .maybeSingle();
    if (!booking) return json({ error: "Bokningen hittades inte" }, 404);

    const [{ data: customer }, { data: items }, { data: travellers }] = await Promise.all([
      admin.from("customers").select("*").eq("id", booking.customer_id).maybeSingle(),
      admin.from("booking_items").select("*").eq("booking_id", booking_id).order("sort_order"),
      admin.from("booking_travellers").select("full_name").eq("booking_id", booking_id),
    ]);

    const to = customer?.email;
    if (!to) return json({ error: "Kunden saknar e-postadress" }, 400);

    const subtotal = (items ?? []).reduce(
      (s: number, i: any) => s + Number(i.sale_sek) * Number(i.qty),
      0,
    );
    const vatRate = booking.vat_enabled ? Number(booking.vat_rate ?? 0) : 0;
    const vatAmount = Math.round(subtotal * (vatRate / 100));
    const total = subtotal + vatAmount;

    const rows = (items ?? [])
      .map(
        (i: any) => `<tr>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb">${ITEM_LABEL[i.item_type] ?? i.item_type}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb">${i.description}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${i.qty}</td>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;text-align:right">${sek(Number(i.sale_sek) * Number(i.qty))}</td>
        </tr>`,
      )
      .join("");

    const html = `<!doctype html><html><body style="font-family:Helvetica,Arial,sans-serif;background:#f6f7f9;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px">
        <p style="letter-spacing:.2em;font-size:12px;color:#64748b;margin:0 0 4px">KAISEN TRAVEL GROUP</p>
        <h1 style="font-size:22px;color:#0f172a;margin:0 0 16px">Bokningsbekräftelse ${booking.booking_number ?? ""}</h1>
        <p style="color:#334155">Hej ${customer?.contact_name ?? ""},</p>
        <p style="color:#334155">Här kommer bekräftelsen på er resa <strong>${booking.title}</strong>${booking.destination ? ` till ${booking.destination}` : ""}.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;color:#0f172a">
          <tr><td style="padding:4px 0;color:#64748b">Avresa</td><td style="text-align:right">${booking.depart_date ?? "—"}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b">Hemkomst</td><td style="text-align:right">${booking.return_date ?? "—"}</td></tr>
          <tr><td style="padding:4px 0;color:#64748b">Antal resenärer</td><td style="text-align:right">${travellers?.length || booking.travellers_count || 0}</td></tr>
        </table>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#0f172a">${rows}</table>
        <p style="text-align:right;font-size:16px;margin-top:12px;color:#0f172a"><strong>Totalt: ${sek(total)}</strong></p>
        ${booking.notes ? `<p style="color:#334155;white-space:pre-wrap">${booking.notes}</p>` : ""}
        <p style="color:#64748b;font-size:13px;margin-top:24px">Kaisen Travel Group · info@kaisengroup.se</p>
      </div></body></html>`;

    const subject = `Bokningsbekräftelse ${booking.booking_number ?? ""} – ${booking.title}`;

    if (preview === true) return json({ preview: true, html, subject, to });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    let status = "sent";
    let errorMessage: string | null = null;

    if (!resendKey) {
      status = "failed";
      errorMessage = "RESEND_API_KEY saknas";
    } else {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
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
      booking_id,
      customer_id: booking.customer_id,
      doc_type: "confirmation",
      recipient_email: to,
      subject,
      status,
      error_message: errorMessage,
      html,
    });

    if (status === "failed") return json({ error: errorMessage }, 500);

    if (booking.status === "draft") {
      await admin.from("bookings").update({ status: "confirmed" }).eq("id", booking_id);
    }

    return json({ success: true, to });
  } catch (err) {
    console.error("send-booking-confirmation error", err);
    return json({ error: "Internal server error" }, 500);
  }
});
