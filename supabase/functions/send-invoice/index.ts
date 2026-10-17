const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "KAISEN TRAVEL GROUP <info@kaisengroup.se>";

function invoiceTemplate(data: {
  invoiceNumber: string;
  guestName: string;
  guestEmail: string;
  tripTitle: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  paymentDueDate?: string;
  paymentMethod?: string;
  breakdown: Array<{ label: string; amount: number }>;
  total: number;
  currency: string;
  invoiceNotes?: string;
}): string {
  const {
    invoiceNumber, guestName, guestEmail, tripTitle, destination,
    startDate, endDate, paymentDueDate, paymentMethod,
    breakdown, total, currency, invoiceNotes,
  } = data;

  const formatAmount = (n: number) =>
    n.toLocaleString("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const formatDate = (iso?: string) => {
    if (!iso) return "–";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("sv-SE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Stockholm" });
    } catch { return iso; }
  };

  const paymentMethodLabel: Record<string, string> = {
    invoice: "Faktura",
    card: "Kortbetalning",
    bank_transfer: "Banköverföring",
    split: "Delad betalning",
    included: "Ingår i paketet",
  };

  const breakdownRows = breakdown.length > 0
    ? breakdown.map(r => `
      <tr>
        <td style="padding:10px 0;color:#8a9bb5;font-size:14px;border-bottom:1px solid #1e2d4a;">${r.label}</td>
        <td style="padding:10px 0;color:#c9d6e8;font-size:14px;text-align:right;border-bottom:1px solid #1e2d4a;font-family:monospace;">${formatAmount(r.amount)} ${currency}</td>
      </tr>`).join("")
    : `<tr><td colspan="2" style="padding:10px 0;color:#4a5d75;font-size:13px;">Ingen specificering tillgänglig</td></tr>`;

  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Faktura ${invoiceNumber} – KAISEN TRAVEL GROUP</title>
</head>
<body style="margin:0;padding:0;background:#0a1220;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a1220;padding:48px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#0f1929;border:1px solid #1e2d4a;max-width:600px;width:100%;">

          <!-- ── HEADER ── -->
          <tr>
            <td style="padding:36px 48px 28px;background:linear-gradient(135deg,#0f1929 0%,#162035 100%);border-bottom:2px solid #8B6914;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <img src="https://itaefkyfuvwicvarnfke.supabase.co/storage/v1/object/public/email-assets/kaisen-logo.png" alt="KAISEN TRAVEL GROUP" style="height:52px;display:block;" />
                  </td>
                  <td align="right">
                    <div style="color:#4a5d75;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:4px;">Faktura</div>
                    <div style="color:#d4a84b;font-size:22px;letter-spacing:0.1em;font-family:monospace;">${invoiceNumber}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── HERO STRIP ── -->
          <tr>
            <td style="background:#8B6914;padding:12px 48px;">
              <span style="color:#fff;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;">Resebekräftelse &amp; Faktura</span>
            </td>
          </tr>

          <!-- ── TRIP INFO ── -->
          <tr>
            <td style="padding:36px 48px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Guest info -->
                  <td width="50%" style="vertical-align:top;padding-right:20px;">
                    <div style="color:#4a5d75;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:8px;">Faktureras till</div>
                    <div style="color:#c9d6e8;font-size:16px;font-family:Georgia,serif;margin-bottom:4px;">${guestName}</div>
                    <div style="color:#8a9bb5;font-size:13px;">${guestEmail}</div>
                  </td>
                  <!-- Trip summary -->
                  <td width="50%" style="vertical-align:top;">
                    <div style="color:#4a5d75;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:8px;">Resa</div>
                    <div style="color:#d4a84b;font-size:15px;font-family:Georgia,serif;margin-bottom:4px;">${tripTitle}</div>
                    <div style="color:#8a9bb5;font-size:13px;">${destination}</div>
                    ${startDate ? `<div style="color:#8a9bb5;font-size:12px;margin-top:6px;">${formatDate(startDate)}${endDate ? " – " + formatDate(endDate) : ""}</div>` : ""}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── DIVIDER ── -->
          <tr><td style="padding:0 48px;"><div style="height:1px;background:#1e2d4a;"></div></td></tr>

          <!-- ── PRICE BREAKDOWN ── -->
          <tr>
            <td style="padding:28px 48px;">
              <div style="color:#4a5d75;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:16px;">Prisspecifikation</div>
              <table width="100%" cellpadding="0" cellspacing="0">
                ${breakdownRows}
                <!-- Total row -->
                <tr>
                  <td style="padding:16px 0 0;color:#d4a84b;font-size:16px;font-family:Georgia,serif;font-weight:bold;">Totalt att betala</td>
                  <td style="padding:16px 0 0;text-align:right;">
                    <span style="background:#8B6914;color:#fff;font-size:18px;font-family:monospace;padding:6px 16px;display:inline-block;letter-spacing:0.05em;">${formatAmount(total)} ${currency}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── PAYMENT INFO ── -->
          <tr>
            <td style="padding:0 48px 28px;">
              <div style="background:#162035;border:1px solid #1e2d4a;padding:20px 24px;">
                <div style="color:#4a5d75;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:12px;">Betalningsinformation</div>
                <table cellpadding="0" cellspacing="0">
                  ${paymentDueDate ? `
                  <tr>
                    <td style="color:#8a9bb5;font-size:13px;padding:3px 0;width:160px;">Förfallodatum</td>
                    <td style="color:#e8a020;font-size:13px;font-weight:bold;padding:3px 0;">${formatDate(paymentDueDate)}</td>
                  </tr>` : ""}
                  ${paymentMethod ? `
                  <tr>
                    <td style="color:#8a9bb5;font-size:13px;padding:3px 0;width:160px;">Betalningsmetod</td>
                    <td style="color:#c9d6e8;font-size:13px;padding:3px 0;">${paymentMethodLabel[paymentMethod] || paymentMethod}</td>
                  </tr>` : ""}
                  <tr>
                    <td style="color:#8a9bb5;font-size:13px;padding:3px 0;width:160px;">Bankgiro</td>
                    <td style="color:#c9d6e8;font-size:13px;padding:3px 0;">–</td>
                  </tr>
                  <tr>
                    <td style="color:#8a9bb5;font-size:13px;padding:3px 0;width:160px;">Referens</td>
                    <td style="color:#c9d6e8;font-size:13px;padding:3px 0;font-family:monospace;">${invoiceNumber}</td>
                  </tr>
                </table>
                ${invoiceNotes ? `<p style="margin:14px 0 0;color:#8a9bb5;font-size:12px;line-height:1.6;border-top:1px solid #1e2d4a;padding-top:12px;">${invoiceNotes}</p>` : ""}
              </div>
            </td>
          </tr>

          <!-- ── FOOTER ── -->
          <tr>
            <td style="padding:20px 48px 32px;border-top:2px solid #8B6914;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0 0 4px;color:#4a5d75;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">KAISEN TRAVEL GROUP</p>
                    <p style="margin:0;color:#4a5d75;font-size:11px;">info@kaisengroup.se &nbsp;·&nbsp; kaisengroup.se</p>
                  </td>
                  <td align="right">
                    <img src="https://itaefkyfuvwicvarnfke.supabase.co/storage/v1/object/public/email-assets/kaisen-logo.png" alt="KAISEN TRAVEL GROUP" style="height:32px;display:block;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      guestEmail, guestName, invoiceNumber,
      tripTitle, destination, startDate, endDate,
      paymentDueDate, paymentMethod,
      breakdown, total, currency, invoiceNotes,
    } = body;

    if (!guestEmail) {
      return new Response(JSON.stringify({ error: "guestEmail is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = invoiceTemplate({
      invoiceNumber: invoiceNumber || `KAI-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      guestName: guestName || guestEmail,
      guestEmail,
      tripTitle: tripTitle || "Resa",
      destination: destination || "",
      startDate, endDate,
      paymentDueDate, paymentMethod,
      breakdown: Array.isArray(breakdown) ? breakdown : [],
      total: Number(total) || 0,
      currency: currency || "SEK",
      invoiceNotes,
    });

    const subject = `Faktura ${invoiceNumber || ""} – ${tripTitle || "KAISEN TRAVEL GROUP"}`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [guestEmail],
        subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: result }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
