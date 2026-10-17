// Transactional email, sent straight to the Resend API with RESEND_API_KEY —
// the same way submit-inquiry, send-booking-confirmation and the other
// working senders do.
//
// Do NOT route this through connector-gateway.lovable.dev with the key as
// X-Connection-Api-Key: that expects a Lovable connection key, not a Resend
// key, and every order confirmation sent that way failed silently (found
// 2026-09-24 when a test purchase never got its email).

const FROM = "KAISEN Travel Group <info@kaisengroup.se>";

/** Where operational alerts go. */
export const OPS_EMAIL = "info@kaisengroup.se";

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  reply_to?: string;
}

/** Sends one email. Returns null on success, or why it failed. Never throws. */
export async function sendEmailOrError(msg: EmailMessage): Promise<string | null> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) return "RESEND_API_KEY saknas";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        ...(msg.reply_to ? { reply_to: msg.reply_to } : {}),
      }),
    });
    if (!res.ok) return `Resend ${res.status}: ${await res.text().catch(() => "")}`.slice(0, 500);
    return null;
  } catch (e) {
    return `Resend request failed: ${(e as Error).message}`;
  }
}

/** Sends one email. Returns true on success; failures are logged, never thrown. */
export async function sendEmail(msg: EmailMessage): Promise<boolean> {
  const error = await sendEmailOrError(msg);
  if (error) console.error("[email]", msg.subject, error);
  return error === null;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
