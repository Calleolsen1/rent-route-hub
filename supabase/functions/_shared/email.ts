// Transactional email through the Lovable → Resend gateway, the same route
// payments-webhook uses for order confirmations.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM = "Kaisen Travel Group <info@kaisengroup.se>";

/** Where operational alerts go. */
export const OPS_EMAIL = "info@kaisengroup.se";

/** Sends one email. Never throws: returns false and logs on any failure. */
export async function sendEmail(msg: { to: string; subject: string; html: string }): Promise<boolean> {
  const lovable = Deno.env.get("LOVABLE_API_KEY");
  const resend = Deno.env.get("RESEND_API_KEY");
  if (!lovable || !resend) {
    console.warn("[email] Resend not configured; skipping", msg.subject);
    return false;
  }
  try {
    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovable}`,
        "X-Connection-Api-Key": resend,
      },
      body: JSON.stringify({ from: FROM, to: [msg.to], subject: msg.subject, html: msg.html }),
    });
    if (!res.ok) {
      console.error("[email] send failed", res.status, await res.text().catch(() => ""));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] send threw", (e as Error).message);
    return false;
  }
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
