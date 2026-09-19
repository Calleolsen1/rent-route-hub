// oneclicket-get-event-tickets — live availability + markup for a OneClicket event.
//
// Body: { event_id: string }   // our internal UUID
//
// Returns a `{ groups: [...] }` payload that EventDetail renders directly,
// including `allowed_quantities` so the picker can only offer quantities the
// supplier will actually accept.
//
// Public endpoint (verify_jwt = false) — browsing needs no auth.
//
// Why live rather than reading the synced rows: OneClicket stock is a
// marketplace of individual resellers and moves between syncs. The synced
// ticket_categories rows exist to carry admin markup overrides and a stable
// internal UUID; price and stock always come from this call.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  OneClicketClient,
  allowedQuantities,
  normaliseSplitType,
  ocBool,
  ocExternalVersionId,
  ocInt,
  ocNum,
  ocStr,
  parseTixstock,
  versionDisplayName,
  type OcVersion,
} from "../_shared/oneclicket.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CategoryRow = {
  id: string;
  external_category_id: string | null;
  external_sub_category: string | null;
  markup_pct: number;
  markup_fixed_sek: number;
};

/** Percentage markup then a fixed addition, rounded to whole krona. */
function applyMarkup(baseSek: number, pct: number, fixed: number): number {
  const withPct = baseSek * (1 + (Number(pct) || 0) / 100);
  return Math.round(withPct + (Number(fixed) || 0));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { event_id } = await req.json();
    if (!event_id || typeof event_id !== "string") throw new Error("event_id required");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: event, error: eventErr } = await admin
      .from("events")
      .select("id, source, external_event_id")
      .eq("id", event_id)
      .maybeSingle();
    if (eventErr) throw new Error(eventErr.message);
    if (!event) throw new Error("event not found");
    if (event.source !== "oneclicket") {
      throw new Error(`event ${event_id} is not a oneclicket event`);
    }

    // Stored as 'oc_<id>'; the API wants the bare numeric id.
    const productId = String(event.external_event_id ?? "").replace(/^oc_/, "");
    if (!productId) throw new Error("event has no external_event_id");

    const oc = new OneClicketClient();
    const product = await oc.getProductById(productId);

    // Product pulled, delisted, or past the supplier's 36h cutoff — an empty
    // list is the correct answer, not an error.
    if (!product || !ocBool(product.published)) {
      return new Response(JSON.stringify({ groups: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const versions = (product.versions ?? []).filter(
      (v: OcVersion) => ocBool(v.published) && ocInt(v.stock) > 0,
    );
    if (!versions.length) {
      return new Response(JSON.stringify({ groups: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: rateRaw } = await admin.rpc("get_platform_decimal", {
      p_key: "eur_to_sek_rate",
      p_default: 11.5,
    });
    const { data: mkRaw } = await admin.rpc("get_platform_decimal", {
      p_key: "default_markup_pct",
      p_default: 15,
    });
    const eurToSek = Number(rateRaw ?? 11.5);
    const defaultMarkupPct = Number(mkRaw ?? 15);

    // Lazy-upsert a row per version so admins get a stable UUID to hang a
    // markup override on.
    const rows = versions.map((v: OcVersion) => {
      const tix = parseTixstock(v);
      const seat = tix?.seat_details;
      const seatParts = [
        seat?.section && `Section ${seat.section}`,
        seat?.row && `Row ${seat.row}`,
      ].filter(Boolean).join(" · ");
      const quantities = allowedQuantities(v);
      return {
        event_id: event.id,
        external_category_id: ocExternalVersionId(v.id),
        external_sub_category: ocStr(seat?.category) ?? "",
        name: versionDisplayName(v),
        description: seatParts || null,
        party_size_together: quantities.length ? quantities[0] : 1,
        // Keep this a real price, not 0. oneclicket-sync writes the marked-up
        // list price here and the admin Tickets table reads it; writing 0 on
        // every page view would make the column flap between a real number
        // and nothing. New versions that appeared since the last sync get the
        // default markup — the row's own markup_pct override, once set, is
        // applied to the live figure returned below.
        unit_price_sek: Math.round(
          ocNum(v.price_final) * eurToSek * (1 + defaultMarkupPct / 100),
        ),
        currency: "SEK",
        qty_available: ocInt(v.stock),
        supplier_version_id: String(v.id),
        supplier_buy_multiplier: Math.max(1, ocInt(v.buy_multipler, 1)),
        supplier_split_type: normaliseSplitType(v.extra_data?.split_type),
        supplier_split_quantity: Math.max(0, ocInt(v.extra_data?.split_quantity)),
        supplier_display_quantity: Math.max(0, ocInt(v.extra_data?.display_quantity)),
        last_synced_at: new Date().toISOString(),
      };
    });

    const { error: upErr } = await admin
      .from("ticket_categories")
      .upsert(rows, {
        onConflict: "event_id,external_category_id,external_sub_category",
        ignoreDuplicates: false,
      });
    if (upErr) throw new Error(`category upsert: ${upErr.message}`);

    const { data: catRows, error: readErr } = await admin
      .from("ticket_categories")
      .select("id, external_category_id, external_sub_category, markup_pct, markup_fixed_sek")
      .eq("event_id", event.id);
    if (readErr) throw new Error(`category read-back: ${readErr.message}`);

    const byExternal = new Map<string, CategoryRow>(
      ((catRows ?? []) as CategoryRow[]).map((r) => [r.external_category_id ?? "", r]),
    );

    const groups = versions.map((v: OcVersion) => {
      const row = byExternal.get(ocExternalVersionId(v.id));
      // Prices are EUR major units — no cents conversion.
      const baseSek = ocNum(v.price_final) * eurToSek;
      const finalSek = row
        ? applyMarkup(baseSek, row.markup_pct, row.markup_fixed_sek)
        : applyMarkup(baseSek, 15, 0);
      const tix = parseTixstock(v);
      const seat = tix?.seat_details;
      const seatParts = [
        seat?.section && `Section ${seat.section}`,
        seat?.row && `Row ${seat.row}`,
      ].filter(Boolean).join(" · ");
      const quantities = allowedQuantities(v);

      return {
        category_id: row?.id ?? null,
        external_category_id: ocExternalVersionId(v.id),
        external_sub_category: ocStr(seat?.category) ?? "",
        name: versionDisplayName(v),
        description: seatParts || null,
        party_size_together: quantities.length ? quantities[0] : 1,
        total_stock: ocInt(v.stock),
        base_sek: Math.round(baseSek),
        final_sek: finalSek,
        currency: "SEK",
        // OneClicket has no reservation step — stock is only committed by
        // insOrders — so there is never anything to hold here.
        reserve_lines: [] as never[],
        supplier: "oneclicket" as const,
        // The exact quantities the supplier will accept, so the picker can
        // never offer a number that insOrders would reject.
        allowed_quantities: quantities,
        supplier_version_id: String(v.id),
      };
    });

    groups.sort((a, b) => a.final_sek - b.final_sek);

    return new Response(JSON.stringify({ groups }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[oneclicket-get-event-tickets]", message);
    return new Response(JSON.stringify({ error: message }), {
      status: message.includes("not found") ? 404 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
