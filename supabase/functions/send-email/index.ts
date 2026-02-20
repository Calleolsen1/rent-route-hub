const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "Kaisen Travel Group <info@kaisengroup.se>";

function inviteTemplate(actionUrl: string, firstName?: string) {
  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Välkommen till Mitt Kaisen</title>
</head>
<body style="margin:0;padding:0;background:#0f1929;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1929;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#162035;border:1px solid #1e2d4a;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:36px 48px 28px;border-bottom:1px solid #1e2d4a;">
              <img src="https://itaefkyfuvwicvarnfke.supabase.co/storage/v1/object/public/email-assets/kaisen-logo.png" alt="Kaisen Travel Group" style="height:48px;display:block;" />
             </td>
           </tr>
           <!-- Body -->
           <tr>
             <td style="padding:40px 48px;">
               <p style="margin:0 0 8px;color:#8a9bb5;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;">Välkommen</p>
              <h1 style="margin:0 0 20px;color:#d4a84b;font-size:28px;font-weight:400;font-family:'Georgia',serif;line-height:1.3;">
                ${firstName ? `Hej ${firstName},` : "Välkommen till Mitt Kaisen"}
              </h1>
              <p style="margin:0 0 28px;color:#8a9bb5;font-size:15px;line-height:1.7;">
                Ditt konto på <strong style="color:#c9d6e8;">Mitt Kaisen</strong> är nu skapat. Klicka på knappen nedan för att sätta ditt lösenord och komma igång.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${actionUrl}" style="display:inline-block;background:#8B6914;color:#fff;text-decoration:none;padding:14px 36px;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;font-family:Arial,sans-serif;">
                      Sätt ditt lösenord
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;color:#4a5d75;font-size:12px;line-height:1.6;">
                Om knappen inte fungerar, kopiera och klistra in denna länk i din webbläsare:<br/>
                <a href="${actionUrl}" style="color:#8B6914;word-break:break-all;">${actionUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 48px 32px;border-top:1px solid #1e2d4a;">
              <p style="margin:0;color:#4a5d75;font-size:11px;letter-spacing:0.1em;">
                KAISEN TRAVEL GROUP &nbsp;·&nbsp; info@kaisengroup.se
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function recoveryTemplate(actionUrl: string) {
  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Återställ lösenord – Mitt Kaisen</title>
</head>
<body style="margin:0;padding:0;background:#0f1929;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1929;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#162035;border:1px solid #1e2d4a;max-width:560px;width:100%;">
          <tr>
            <td style="padding:36px 48px 28px;border-bottom:1px solid #1e2d4a;">
              <img src="https://itaefkyfuvwicvarnfke.supabase.co/storage/v1/object/public/email-assets/kaisen-logo.png" alt="Kaisen Travel Group" style="height:48px;display:block;" />
             </td>
           </tr>
           <tr>
             <td style="padding:40px 48px;">
               <p style="margin:0 0 8px;color:#8a9bb5;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;">Lösenordsåterställning</p>
              <h1 style="margin:0 0 20px;color:#d4a84b;font-size:28px;font-weight:400;font-family:'Georgia',serif;">
                Återställ ditt lösenord
              </h1>
              <p style="margin:0 0 28px;color:#8a9bb5;font-size:15px;line-height:1.7;">
                Vi mottog en förfrågan om att återställa lösenordet för ditt Mitt Kaisen-konto. Klicka på knappen nedan för att fortsätta.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <a href="${actionUrl}" style="display:inline-block;background:#8B6914;color:#fff;text-decoration:none;padding:14px 36px;font-size:13px;letter-spacing:0.15em;text-transform:uppercase;font-family:Arial,sans-serif;">
                      Återställ lösenord
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:28px 0 0;color:#4a5d75;font-size:12px;line-height:1.6;">
                Om du inte begärde detta kan du ignorera detta mejl.<br/>
                <a href="${actionUrl}" style="color:#8B6914;word-break:break-all;">${actionUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 48px 32px;border-top:1px solid #1e2d4a;">
              <p style="margin:0;color:#4a5d75;font-size:11px;letter-spacing:0.1em;">
                KAISEN TRAVEL GROUP &nbsp;·&nbsp; info@kaisengroup.se
              </p>
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
      status: 500, headers: corsHeaders,
    });
  }

  try {
    const body = await req.json();
    const { user, email_data } = body;

    const emailType = email_data?.email_action_type;
    const actionUrl = email_data?.action_link || "";
    const firstName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "";
    const toEmail = user?.email;

    if (!toEmail) {
      return new Response(JSON.stringify({ error: "No recipient email" }), {
        status: 400, headers: corsHeaders,
      });
    }

    let subject = "Välkommen till Mitt Kaisen";
    let html = inviteTemplate(actionUrl, firstName);

    if (emailType === "recovery") {
      subject = "Återställ ditt lösenord – Mitt Kaisen";
      html = recoveryTemplate(actionUrl);
    } else if (emailType === "invite") {
      subject = "Välkommen till Mitt Kaisen – sätt ditt lösenord";
      html = inviteTemplate(actionUrl, firstName);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: result }), {
        status: 500, headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: corsHeaders,
    });
  }
});
