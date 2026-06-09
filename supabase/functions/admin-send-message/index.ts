import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "Kaisen Travel Group <info@kaisengroup.se>";

/**
 * Verify the caller has the admin role. Throws on missing/invalid token or
 * non-admin user. Without this any logged-in user could trigger transactional
 * email from the company address — a real impersonation vector.
 */
async function requireAdmin(req: Request): Promise<string> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("Missing Authorization header");
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error("Unauthorized");
  const { data: role } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!role) throw new Error("Forbidden — admin role required");
  return user.id;
}
const LOGO_URL = "https://itaefkyfuvwicvarnfke.supabase.co/storage/v1/object/public/email-assets/kaisen-logo.png";

function messageTemplate(toName: string, subject: string, body: string): string {
  const bodyHtml = body.replace(/\n/g, "<br/>");
  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0f1929;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1929;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#162035;border:1px solid #1e2d4a;max-width:560px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="padding:28px 48px;border-bottom:1px solid #1e2d4a;">
              <img src="${LOGO_URL}" alt="Kaisen Travel Group" style="height:48px;display:block;" />
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 48px;">
              <p style="margin:0 0 6px;color:#8a9bb5;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;">Meddelande från Kaisen</p>
              <h1 style="margin:0 0 20px;color:#d4a84b;font-size:22px;font-weight:400;font-family:'Georgia',serif;line-height:1.3;">
                ${subject}
              </h1>
              ${toName ? `<p style="margin:0 0 16px;color:#8a9bb5;font-size:14px;">Hej ${toName},</p>` : ""}
              <div style="color:#c9d6e8;font-size:15px;line-height:1.8;">
                ${bodyHtml}
              </div>
              <div style="margin-top:32px;padding-top:20px;border-top:1px solid #1e2d4a;">
                <p style="margin:0;color:#4a5d75;font-size:12px;line-height:1.6;">
                  Du kan svara på detta meddelande direkt i din Kaisen-portal under <strong style="color:#8a9bb5;">Meddelanden</strong>.
                </p>
              </div>
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
    await requireAdmin(req);
    const { toEmail, toName, subject, body } = await req.json();

    if (!toEmail || !subject || !body) {
      return new Response(JSON.stringify({ error: "toEmail, subject and body are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const html = messageTemplate(toName || "", subject, body);

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
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /unauthorized|forbidden|missing authorization/i.test(msg) ? 403 : 500;
    if (status === 500) console.error("admin-send-message error:", err);
    return new Response(JSON.stringify({ error: msg }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
