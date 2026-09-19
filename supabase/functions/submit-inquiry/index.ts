// Submit-Inquiry Edge Function
// Validates an inquiry form submission, stores it in `public.inquiries`,
// emails info@kaisengroup.se (notification) and the customer (auto-reply)
// via the Resend API. Publicly accessible (verify_jwt = false).
//
// Anti-abuse:
//   - Cloudflare Turnstile verification when TURNSTILE_SECRET_KEY env is set
//     (defensively skipped if not configured, so we don't break before user
//     signs up for Turnstile).
//   - Rate limit: 5 submissions per IP per 10 minutes.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.23.8";
import { checkRateLimit } from "../_shared/rate_limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INQUIRY_TYPES = [
  "group",
  "conference",
  "training_camp",
  "vip",
  "contact",
] as const;

const Schema = z.object({
  type: z.enum(INQUIRY_TYPES),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(4).max(40),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  group_size: z.number().int().positive().max(10000).optional(),
  preferred_dates_start: z.string().optional().or(z.literal("")),
  preferred_dates_end: z.string().optional().or(z.literal("")),
  destination: z.string().trim().max(160).optional().or(z.literal("")),
  budget_sek: z.number().int().nonnegative().max(100_000_000).optional(),
  sport_or_topic: z.string().trim().max(160).optional().or(z.literal("")),
  message: z.string().trim().min(5).max(4000),
  source_page: z.string().trim().max(300).optional().or(z.literal("")),
  turnstile_token: z.string().optional(),
});

/**
 * Verify a Cloudflare Turnstile token. Returns true if either:
 *  - TURNSTILE_SECRET_KEY env is unset (no captcha required yet, defensive)
 *  - Cloudflare verifies the token successfully.
 */
async function verifyTurnstile(token: string | undefined, remoteIp: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return true;
  if (!token) return false;
  try {
    const params = new URLSearchParams();
    params.append("secret", secret);
    params.append("response", token);
    if (remoteIp) params.append("remoteip", remoteIp);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: params,
    });
    const data = await res.json();
    return data?.success === true;
  } catch (e) {
    console.error("turnstile verify error", e);
    return false;
  }
}

const TYPE_LABELS: Record<(typeof INQUIRY_TYPES)[number], string> = {
  group: "Gruppresa",
  conference: "Konferens",
  training_camp: "Träningsläger",
  vip: "VIP-service",
  contact: "Kontaktformulär",
};

const SENDER = "Kaisen Travel Group <info@kaisengroup.se>";
const ADMIN_INBOX = "info@kaisengroup.se";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
      c
    ]!)
  );

const row = (label: string, value?: string | number | null) =>
  value === undefined || value === null || value === ""
    ? ""
    : `<tr><td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;vertical-align:top;">${escapeHtml(
        label
      )}</td><td style="padding:6px 0;color:#0f172a;font-size:14px;">${escapeHtml(
        String(value)
      )}</td></tr>`;

async function sendEmail(payload: {
  to: string;
  subject: string;
  html: string;
  reply_to?: string;
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY missing");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SENDER,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      ...(payload.reply_to ? { reply_to: payload.reply_to } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Resend error:", res.status, text);
    throw new Error(`Resend ${res.status}: ${text}`);
  }
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limit: 5 submissions per IP per 10 minutes
  const rl = await checkRateLimit(req, "submit-inquiry", { max: 5, windowSec: 600 });
  if (!rl.allowed) return rl.response;

  try {
    const body = await req.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: parsed.error.flatten().fieldErrors }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    const data = parsed.data;

    // Captcha verification (no-op when Turnstile isn't configured yet)
    const remoteIp = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    const captchaOk = await verifyTurnstile(data.turnstile_token, remoteIp);
    if (!captchaOk) {
      return new Response(
        JSON.stringify({ error: "Captcha-kontroll misslyckades" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const insertPayload = {
      type: data.type,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company || null,
      group_size: data.group_size ?? null,
      preferred_dates_start: data.preferred_dates_start || null,
      preferred_dates_end: data.preferred_dates_end || null,
      destination: data.destination || null,
      budget_sek: data.budget_sek ?? null,
      sport_or_topic: data.sport_or_topic || null,
      message: data.message,
      source_page: data.source_page || null,
    };

    const { data: inserted, error } = await supabase
      .from("inquiries")
      .insert(insertPayload)
      .select("id, created_at")
      .single();

    if (error) {
      console.error("DB insert failed:", error);
      return new Response(JSON.stringify({ error: "Database error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const typeLabel = TYPE_LABELS[data.type];

    // 1. Internal notification to info@kaisengroup.se
    const adminHtml = `
<div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
  <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <div style="background:#0f172a;color:#ffffff;padding:20px 28px;">
      <div style="font-size:11px;letter-spacing:.25em;text-transform:uppercase;opacity:.7;margin-bottom:4px;">Ny förfrågan</div>
      <div style="font-size:20px;font-weight:600;">${escapeHtml(typeLabel)}</div>
    </div>
    <div style="padding:24px 28px;">
      <table style="width:100%;border-collapse:collapse;">
        ${row("Namn", data.name)}
        ${row("E-post", data.email)}
        ${row("Telefon", data.phone)}
        ${row("Företag", data.company)}
        ${row("Gruppstorlek", data.group_size)}
        ${row("Önskat datum (från)", data.preferred_dates_start)}
        ${row("Önskat datum (till)", data.preferred_dates_end)}
        ${row("Destination", data.destination)}
        ${row("Budget (SEK)", data.budget_sek ? data.budget_sek.toLocaleString("sv-SE") : "")}
        ${row("Sport / ämne", data.sport_or_topic)}
        ${row("Källa", data.source_page)}
        ${row("Inkommen", new Date(inserted.created_at).toLocaleString("sv-SE", { timeZone: "Europe/Stockholm" }))}
      </table>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e2e8f0;">
        <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:.15em;margin-bottom:8px;">Meddelande</div>
        <div style="font-size:14px;color:#0f172a;white-space:pre-wrap;line-height:1.5;">${escapeHtml(data.message)}</div>
      </div>
    </div>
    <div style="background:#f1f5f9;padding:14px 28px;font-size:12px;color:#64748b;">
      Förfrågans-ID: ${inserted.id}
    </div>
  </div>
</div>`.trim();

    // 2. Auto-reply to customer
    const customerHtml = `
<div style="font-family:Inter,Arial,sans-serif;background:#f8fafc;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
    <div style="background:#0f172a;color:#ffffff;padding:28px;text-align:center;">
      <div style="font-family:Georgia,serif;font-size:24px;letter-spacing:.05em;">KAISEN</div>
      <div style="font-size:10px;letter-spacing:.3em;text-transform:uppercase;opacity:.7;margin-top:4px;">Travel Group</div>
    </div>
    <div style="padding:32px 28px;color:#0f172a;">
      <p style="margin:0 0 16px;font-size:16px;">Hej ${escapeHtml(data.name.split(" ")[0])},</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
        Tack för din förfrågan gällande <strong>${escapeHtml(typeLabel.toLowerCase())}</strong>. Vi har tagit emot ditt meddelande och återkommer normalt inom 24 timmar på vardagar.
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;">
        Behöver du oss tidigare? Ring eller mejla oss direkt — vänligen ange ditt förfrågans-ID nedan.
      </p>
      <div style="margin:24px 0;padding:16px;background:#f8fafc;border-left:3px solid #0f172a;font-size:13px;">
        <div style="color:#64748b;text-transform:uppercase;letter-spacing:.15em;font-size:11px;margin-bottom:4px;">Förfrågans-ID</div>
        <div style="font-family:monospace;color:#0f172a;">${inserted.id}</div>
      </div>
      <p style="margin:24px 0 0;font-size:14px;line-height:1.6;">
        Vänliga hälsningar,<br />
        <strong>Kaisen Travel Group</strong>
      </p>
    </div>
    <div style="background:#f1f5f9;padding:16px 28px;font-size:12px;color:#64748b;text-align:center;">
      info@kaisengroup.se · kaisengroup.se
    </div>
  </div>
</div>`.trim();

    // Fire emails (non-blocking on customer auto-reply failure)
    try {
      await sendEmail({
        to: ADMIN_INBOX,
        subject: `Ny ${typeLabel.toLowerCase()}-förfrågan: ${data.name}`,
        html: adminHtml,
        reply_to: data.email,
      });
    } catch (e) {
      console.error("Admin email failed:", e);
    }

    try {
      await sendEmail({
        to: data.email,
        subject: "Vi har tagit emot din förfrågan — Kaisen Travel Group",
        html: customerHtml,
      });
    } catch (e) {
      console.error("Customer auto-reply failed:", e);
    }

    return new Response(
      JSON.stringify({ ok: true, inquiry_id: inserted.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("submit-inquiry error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
