import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FROM_EMAIL = "Kaisen Travel Group <info@kaisengroup.se>";

function inviteEmailHtml(actionUrl: string, firstName: string) {
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
          <tr>
            <td style="padding:36px 48px 28px;border-bottom:1px solid #1e2d4a;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#8B6914;width:36px;height:36px;text-align:center;vertical-align:middle;border-radius:50%;">
                    <span style="color:#fff;font-size:16px;font-weight:700;">K</span>
                  </td>
                  <td style="padding-left:12px;">
                    <span style="color:#d4a84b;font-size:18px;letter-spacing:0.25em;font-family:'Georgia',serif;">MITT KAISEN</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 48px;">
              <p style="margin:0 0 8px;color:#8a9bb5;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;">Välkommen</p>
              <h1 style="margin:0 0 20px;color:#d4a84b;font-size:28px;font-weight:400;font-family:'Georgia',serif;line-height:1.3;">
                Hej ${firstName},
              </h1>
              <p style="margin:0 0 28px;color:#8a9bb5;font-size:15px;line-height:1.7;">
                Ditt konto på <strong style="color:#c9d6e8;">Mitt Kaisen</strong> är nu skapat. Klicka på knappen nedan för att sätta ditt lösenord och komma igång med din personliga reseportal.
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

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Verify caller is admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await callerClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: corsHeaders,
      });
    }

    const callerId = claimsData.claims.sub;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: corsHeaders,
      });
    }

    const { email, first_name, last_name } = await req.json();

    if (!email || !first_name || !last_name) {
      return new Response(
        JSON.stringify({ error: "email, first_name och last_name krävs" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.find(
      (u) => u.email === email.toLowerCase().trim()
    );
    if (alreadyExists) {
      return new Response(
        JSON.stringify({ error: "En användare med denna e-post finns redan." }),
        { status: 409, headers: corsHeaders }
      );
    }

    const siteUrl = req.headers.get("origin") || "https://rent-route-hub.lovable.app";
    const redirectTo = `${siteUrl}/mitt-kaisen/aterstall-losenord`;

    // Create user and generate invite link (without sending Supabase's default email)
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email: email.toLowerCase().trim(),
      options: {
        data: {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
        },
        redirectTo,
      },
    });

    if (linkError || !linkData) {
      console.error("generateLink error:", linkError);
      return new Response(
        JSON.stringify({ error: linkError?.message || "Kunde inte generera inbjudningslänk" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const newUserId = linkData.user.id;
    const actionLink = linkData.properties?.action_link;

    // Create profile
    await adminClient.from("profiles").upsert({
      id: newUserId,
      email: email.toLowerCase().trim(),
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      status: "active",
    });

    // Assign guest role
    await adminClient.from("user_roles").upsert({
      user_id: newUserId,
      role: "guest",
    });

    // Send email via Resend
    if (resendApiKey && actionLink) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email.toLowerCase().trim()],
          subject: "Välkommen till Mitt Kaisen – sätt ditt lösenord",
          html: inviteEmailHtml(actionLink, first_name.trim()),
        }),
      });

      if (!emailRes.ok) {
        const emailErr = await emailRes.json();
        console.error("Resend error:", emailErr);
        // Still return success since user was created — just note email issue
        return new Response(
          JSON.stringify({
            success: true,
            user_id: newUserId,
            warning: "Konto skapat men mejlet kunde inte skickas via Resend.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Konto skapat och välkomstmejl skickat till ${email}`,
        user_id: newUserId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: corsHeaders,
    });
  }
});
