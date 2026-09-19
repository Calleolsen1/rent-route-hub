// oneclicket-place-order — place a supplier order via insOrders.
//
// Body: { order_id?: string, lines: [{ version_id, qty, tickets? }],
//         dry_run?: boolean }
//
// Auth: authenticated admin only.
//
// ── Read this before enabling ────────────────────────────────────────────
// OneClicket has NO sandbox. `insOrders` writes to the live marketplace and
// commits real money against Kaisen's account (user 3826). The supplier asked
// to be emailed at info@oneclicket.com BEFORE any test order is placed.
//
// So this function is double-gated:
//   1. `dry_run` defaults to TRUE. It validates the lines against live stock
//      and returns the exact payload that *would* be sent, without sending it.
//   2. A real send additionally requires ONECLICKET_ORDERS_ENABLED=true in
//      the function secrets. Without it, dry_run:false is refused.
//
// Flip the secret only once the supplier has confirmed they're expecting the
// order. Until then this endpoint is a validator, and that is deliberate.
// ─────────────────────────────────────────────────────────────────────────

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  OneClicketClient,
  OneClicketError,
  allowedQuantities,
  ocBool,
  ocInt,
  versionDisplayName,
  type OcOrderLine,
  type OcOrderTicketHolder,
  type OcVersion,
} from "../_shared/oneclicket.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function requireAdmin(req: Request): Promise<string> {
  const auth = req.headers.get("Authorization");
  if (!auth) throw new Error("Missing Authorization header");

  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: auth } } },
  );
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const { data: isAdmin, error } = await userClient.rpc("has_role", {
    _user_id: user.id,
    _role: "admin",
  });
  if (error || !isAdmin) throw new Error("Admin role required");
  return user.id;
}

interface RequestLine {
  version_id: string | number;
  qty: number;
  tickets?: OcOrderTicketHolder[];
}

interface Validation {
  version_id: string;
  qty: number;
  ok: boolean;
  problem?: string;
  name?: string;
  price_eur?: number;
  stock?: number;
  allowed?: number[];
  needs_ticket_holders?: boolean;
}

/**
 * Validate every line against LIVE supplier state before committing.
 *
 * insOrders is all-or-nothing and irreversible from our side, so a bad
 * quantity must be caught here rather than discovered as a supplier rejection
 * after a customer has already paid.
 */
async function validateLines(
  oc: OneClicketClient,
  admin: SupabaseClient<any, "public", any>,
  lines: RequestLine[],
): Promise<{ validations: Validation[]; allOk: boolean }> {
  const validations: Validation[] = [];

  for (const line of lines) {
    const versionId = String(line.version_id ?? "").trim();
    const qty = ocInt(line.qty);
    const base: Validation = { version_id: versionId, qty, ok: false };

    if (!versionId) {
      validations.push({ ...base, problem: "version_id missing" });
      continue;
    }
    if (qty <= 0) {
      validations.push({ ...base, problem: "qty must be positive" });
      continue;
    }

    // Versions are only reachable through their parent product, and we don't
    // store the product id on the request — find it via the synced row.
    const { data: catRow } = await admin
      .from("ticket_categories")
      .select("event_id, events(external_event_id)")
      .eq("supplier_version_id", versionId)
      .maybeSingle();

    const externalEventId = (catRow as { events?: { external_event_id?: string } } | null)
      ?.events?.external_event_id;
    if (!externalEventId) {
      validations.push({ ...base, problem: "version not found in synced catalogue — run oneclicket-sync" });
      continue;
    }

    const product = await oc.getProductById(String(externalEventId).replace(/^oc_/, ""));
    const version = (product?.versions ?? []).find(
      (v: OcVersion) => String(v.id) === versionId,
    );
    if (!version) {
      validations.push({ ...base, problem: "version no longer offered by supplier" });
      continue;
    }
    if (!ocBool(version.published)) {
      validations.push({ ...base, problem: "version is unpublished" });
      continue;
    }

    const allowed = allowedQuantities(version);
    const stock = ocInt(version.stock);
    const needsHolders = ocBool(product?.need_ticketing);
    const detail: Validation = {
      ...base,
      name: versionDisplayName(version),
      price_eur: Number(version.price_final),
      stock,
      allowed,
      needs_ticket_holders: needsHolders,
    };

    if (!allowed.includes(qty)) {
      validations.push({
        ...detail,
        problem: `qty ${qty} not permitted (allowed: ${allowed.join(", ") || "none"})`,
      });
      continue;
    }
    // need_ticketing=1 means the supplier requires named holders per seat;
    // omitting them makes insOrders fail after the stock is already committed.
    if (needsHolders && (line.tickets?.length ?? 0) !== qty) {
      validations.push({
        ...detail,
        problem: `product requires ${qty} named ticket holder(s), got ${line.tickets?.length ?? 0}`,
      });
      continue;
    }

    validations.push({ ...detail, ok: true });
  }

  return { validations, allOk: validations.every((v) => v.ok) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    await requireAdmin(req);

    const body = await req.json().catch(() => ({}));
    const lines: RequestLine[] = Array.isArray(body.lines) ? body.lines : [];
    if (!lines.length) throw new Error("lines[] required");

    // Opt IN to sending. Anything other than an explicit false stays a dry run.
    const dryRun = body.dry_run !== false;
    const ordersEnabled = Deno.env.get("ONECLICKET_ORDERS_ENABLED") === "true";

    if (!dryRun && !ordersEnabled) {
      return new Response(
        JSON.stringify({
          error:
            "Live OneClicket ordering is disabled. Set ONECLICKET_ORDERS_ENABLED=true " +
            "in the function secrets — and email info@oneclicket.com first, as the " +
            "supplier has no test environment.",
          dry_run_available: true,
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const oc = new OneClicketClient();
    const { validations, allOk } = await validateLines(oc, admin, lines);

    const payload: OcOrderLine[] = lines.map((l) => ({
      version_id: String(l.version_id),
      qty: ocInt(l.qty),
      ...(l.tickets?.length ? { tickets: l.tickets } : {}),
    }));

    if (!allOk) {
      return new Response(
        JSON.stringify({
          placed: false,
          dry_run: dryRun,
          error: "validation failed",
          validations,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (dryRun) {
      return new Response(
        JSON.stringify({
          placed: false,
          dry_run: true,
          would_send: { insert: { order: { products: payload } } },
          validations,
          note:
            "Nothing was sent. Pass dry_run:false (and set ONECLICKET_ORDERS_ENABLED=true) to place for real.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Record the attempt BEFORE calling out, so a timeout mid-flight still
    // leaves a row to reconcile against getOrders rather than a silent gap.
    const { data: attempt } = await admin
      .from("oneclicket_orders")
      .insert({
        order_id: typeof body.order_id === "string" ? body.order_id : null,
        status: "pending",
        request_payload: { products: payload },
      })
      .select("id")
      .single();

    try {
      const res = await oc.insertOrder(payload);
      const placed = (res.data ?? null) as
        | { id?: string; code?: string }[]
        | { id?: string; code?: string }
        | null;
      const first = Array.isArray(placed) ? placed[0] : placed;

      if (attempt?.id) {
        await admin.from("oneclicket_orders").update({
          status: "placed",
          supplier_order_id: first?.id ? String(first.id) : null,
          supplier_order_code: first?.code ? String(first.code) : null,
          response_payload: res as unknown as Record<string, unknown>,
          placed_at: new Date().toISOString(),
        }).eq("id", attempt.id);
      }

      return new Response(
        JSON.stringify({
          placed: true,
          dry_run: false,
          supplier_order_id: first?.id ?? null,
          supplier_order_code: first?.code ?? null,
          meta: res.meta,
          attempt_id: attempt?.id ?? null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (sendErr) {
      const message = (sendErr as Error).message ?? "insOrders failed";
      if (attempt?.id) {
        await admin.from("oneclicket_orders").update({
          status: "failed",
          error_message: message,
          response_payload: sendErr instanceof OneClicketError
            ? (sendErr.body as Record<string, unknown> ?? null)
            : null,
        }).eq("id", attempt.id);
      }
      throw sendErr;
    }
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[oneclicket-place-order]", message);
    return new Response(JSON.stringify({ placed: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
