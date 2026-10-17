// travelconnection-poll — keep supplier bookings up to date.
//
// Auth: authenticated admin, or the hourly pg_cron job (see _shared/auth.ts).
//
// Travel Connection has no webhook for dispatch, so this asks each confirmed
// booking's order for its invoice and vouchers. When a website order's
// voucher first appears it is copied onto orders.voucher_urls (which the
// customer can read in Mitt KAISEN) and the customer is emailed once.
//
// Also marks lapsed holds as expired, so admin never shows a "reserved"
// booking the supplier has already released.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { TravelConnectionClient, dbTokenStore } from "../_shared/travelconnection.ts";
import { requireAdminOrCron } from "../_shared/auth.ts";
import { escapeHtml, sendEmail } from "../_shared/email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Supplier calls per run, well inside 60/minute and the function timeout. */
const MAX_ORDERS_PER_RUN = 40;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function voucherEmail(name: string | null, match: string, urls: string[]): string {
  const siteUrl = Deno.env.get("SITE_URL") ?? "https://rent-route-hub.lovable.app";
  return `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#0f172a;">
    <div style="background:#0f172a;color:#fff;padding:28px;text-align:center;font-size:20px;font-weight:700;letter-spacing:0.04em;">
      KAISEN TRAVEL GROUP
    </div>
    <div style="padding:28px;">
      <h1 style="font-size:22px;margin:0 0 12px;">Din resevoucher är klar</h1>
      <p style="color:#475569;line-height:1.6;">
        Hej ${escapeHtml(name ?? "")},<br/>
        voucher för <strong>${escapeHtml(match)}</strong> finns nu att hämta. Den visar hur
        biljetterna levereras. Själva e-biljetterna släpps av klubben närmare matchen
        och skickas till dig så snart de kommer.
      </p>
      ${urls.map((u, i) => `
        <p style="margin:16px 0;">
          <a href="${escapeHtml(u)}" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-size:14px;">
            Hämta voucher${urls.length > 1 ? ` ${i + 1}` : ""}
          </a>
        </p>`).join("")}
      <p style="color:#475569;font-size:13px;">Du hittar den också under Mina biljetter på <a href="${siteUrl}/mitt-kaisen/biljetter">Mitt KAISEN</a>.</p>
    </div>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    await requireAdminOrCron(req, db);

    // Lapsed holds. No supplier call needed: the expiry time is authoritative.
    const { data: lapsed } = await db
      .from("tc_bookings")
      .update({ status: "expired" })
      .eq("status", "reserved")
      .lt("reservation_expires_at", new Date().toISOString())
      .select("id");

    // Confirmed bookings for matches not yet played (plus a day, for late
    // documents), oldest refresh first.
    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { data: bookings, error } = await db
      .from("tc_bookings")
      .select("id, order_id, order_num, voucher_urls, events!inner(starts_at, home_team, away_team, race_name)")
      .eq("status", "confirmed")
      .not("order_num", "is", null)
      .gte("events.starts_at", since)
      .order("updated_at", { ascending: true })
      .limit(MAX_ORDERS_PER_RUN);
    if (error) throw new Error(`tc_bookings read: ${error.message}`);

    const tc = new TravelConnectionClient({ store: dbTokenStore(db) });
    let refreshed = 0;
    let emailed = 0;
    const failures: string[] = [];

    for (const b of bookings ?? []) {
      try {
        const order = await tc.getOrder(b.order_num);
        const vouchers: string[] = order.invoice?.vouchers ?? [];
        await db.from("tc_bookings").update({
          supplier_status: order.status,
          invoice_url: order.invoice?.invoice ?? null,
          voucher_urls: vouchers,
          response_payload: order,
        }).eq("id", b.id);
        refreshed++;

        if (!b.order_id || !vouchers.length) continue;

        // First time vouchers appear for this website order: copy them to the
        // order and tell the customer. The empty-array guard in the update
        // makes this happen once even if two runs overlap.
        const { data: updated } = await db
          .from("orders")
          .update({ voucher_urls: vouchers })
          .eq("id", b.order_id)
          .eq("voucher_urls", "[]")
          .select("customer_email, customer_name");
        const o = updated?.[0];
        if (o?.customer_email) {
          const ev = b.events as unknown as { home_team: string | null; away_team: string | null; race_name: string | null };
          const match = ev.home_team ? `${ev.home_team} – ${ev.away_team}` : ev.race_name ?? "din match";
          if (await sendEmail({ to: o.customer_email, subject: `Din resevoucher - ${match}`, html: voucherEmail(o.customer_name, match, vouchers) })) {
            emailed++;
          }
        }
      } catch (e) {
        failures.push(`${b.order_num}: ${(e as Error).message}`);
      }
    }

    return json({ expired: lapsed?.length ?? 0, refreshed, emailed, failures });
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[travelconnection-poll]", message);
    return json({ error: message }, 400);
  }
});
