import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("orderId") ??
      (req.method === "POST" ? (await req.json()).orderId : null);
    if (!orderId) throw new Error("orderId required");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims) {
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order } = await admin
      .from("orders")
      .select("id, user_id, status, total_sek, total_paid_sek, currency, customer_name, customer_email, customer_phone, invoice_number, paid_at, created_at, order_items(qty, unit_price_sek, events(home_team, away_team, race_name, tournament_name, venue_name, city, starts_at), ticket_categories(name))")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) return new Response("Not found", { status: 404, headers: corsHeaders });

    const userId = claims.claims.sub as string;
    const { data: isAdminRow } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    const isOwner = (order as any).user_id === userId;
    if (!isOwner && !isAdminRow) {
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    if ((order as any).status !== "paid" && (order as any).status !== "fulfilled") {
      return new Response("Invoice unavailable: order not paid", { status: 400, headers: corsHeaders });
    }

    const fmt = (n: number) => new Intl.NumberFormat("sv-SE").format(Number(n));
    const items = ((order as any).order_items ?? [])
      .map((it: any) => {
        const title = it.events?.home_team
          ? `${it.events.home_team} vs ${it.events.away_team}`
          : it.events?.race_name ?? "Evenemang";
        const when = new Date(it.events?.starts_at).toLocaleDateString("sv-SE", {
          day: "numeric", month: "long", year: "numeric",
        });
        return `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
              <div style="font-weight:600">${title}</div>
              <div style="font-size:12px;color:#475569">${when} · ${it.events?.venue_name ?? ""}${it.events?.city ? ", " + it.events.city : ""}</div>
              <div style="font-size:12px;color:#475569">${it.ticket_categories?.name ?? ""}</div>
            </td>
            <td style="text-align:right;padding:10px 0;border-bottom:1px solid #e5e7eb">${it.qty}</td>
            <td style="text-align:right;padding:10px 0;border-bottom:1px solid #e5e7eb">${fmt(it.unit_price_sek)} SEK</td>
            <td style="text-align:right;padding:10px 0;border-bottom:1px solid #e5e7eb">${fmt(Number(it.unit_price_sek) * it.qty)} SEK</td>
          </tr>`;
      })
      .join("");

    const total = Number((order as any).total_paid_sek ?? (order as any).total_sek);
    const VAT_RATE = 0.25;
    const ex = total / (1 + VAT_RATE);
    const vat = total - ex;
    const paidDate = (order as any).paid_at
      ? new Date((order as any).paid_at).toLocaleDateString("sv-SE")
      : new Date((order as any).created_at).toLocaleDateString("sv-SE");

    const html = `<!doctype html><html lang="sv"><head><meta charset="utf-8"/>
<title>Faktura ${(order as any).invoice_number ?? ""}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;background:#f8fafc;margin:0;padding:40px} .doc{max-width:720px;margin:0 auto;background:#fff;padding:48px;border:1px solid #e2e8f0} h1{margin:0 0 4px;font-size:28px} .muted{color:#64748b;font-size:13px} table{width:100%;border-collapse:collapse;margin:24px 0} th{text-align:left;font-size:12px;color:#475569;text-transform:uppercase;letter-spacing:0.05em;padding:8px 0;border-bottom:2px solid #0f172a} .totals td{padding:6px 0} .totals tr.total td{font-weight:700;font-size:18px;border-top:2px solid #0f172a;padding-top:12px} .actions{max-width:720px;margin:0 auto 16px;text-align:right} @media print{.actions{display:none}}</style>
</head><body>
<div class="actions"><button onclick="window.print()" style="padding:10px 18px;background:#0f172a;color:#fff;border:0;cursor:pointer;font-size:13px">Skriv ut / Spara som PDF</button></div>
<div class="doc">
  <table style="width:100%;border:0"><tr>
    <td style="border:0;padding:0;vertical-align:top">
      <div style="font-weight:700;letter-spacing:0.15em">KAISEN TRAVEL GROUP</div>
      <div class="muted">info@kaisengroup.se</div>
    </td>
    <td style="border:0;padding:0;text-align:right;vertical-align:top">
      <h1>Faktura</h1>
      <div class="muted">Nr ${(order as any).invoice_number ?? "—"}</div>
      <div class="muted">Datum: ${paidDate}</div>
    </td>
  </tr></table>
  <div style="margin-top:32px"><div class="muted">Faktureras till</div>
    <div>${(order as any).customer_name ?? ""}</div>
    <div>${(order as any).customer_email ?? ""}</div>
    <div>${(order as any).customer_phone ?? ""}</div>
  </div>
  <table>
    <thead><tr><th>Beskrivning</th><th style="text-align:right">Antal</th><th style="text-align:right">À-pris</th><th style="text-align:right">Belopp</th></tr></thead>
    <tbody>${items}</tbody>
  </table>
  <table class="totals" style="width:50%;margin-left:auto">
    <tr><td>Netto</td><td style="text-align:right">${fmt(ex)} SEK</td></tr>
    <tr><td>Moms 25%</td><td style="text-align:right">${fmt(vat)} SEK</td></tr>
    <tr class="total"><td>Totalt betalt</td><td style="text-align:right">${fmt(total)} SEK</td></tr>
  </table>
  <p class="muted" style="margin-top:32px">Order-ID: ${(order as any).id}<br/>Tack för din beställning. Vid frågor: info@kaisengroup.se</p>
</div></body></html>`;

    return new Response(html, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e: any) {
    console.error("get-invoice error", e);
    return new Response(e.message ?? "Error", { status: 400, headers: corsHeaders });
  }
});
