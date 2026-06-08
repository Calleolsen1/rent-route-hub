// xs2-get-event-tickets — live ticket lookup with markup applied.
//
// Body: { event_id: string }   // our internal UUID
//
// Flow:
//   1. Resolve event row, confirm source='xs2event', read external_event_id
//   2. Fetch live tickets + categories from xs2event in parallel
//   3. Group tickets by (event_id, category_id, sub_category) — different
//      ticket_ids within a group = different suppliers, so we pick cheapest
//   4. Lazy-upsert a ticket_categories row per (category_id, sub_category)
//      combo so admins can store a per-sub_category markup override (e.g.
//      weekend_regular vs sun_regular). Default markup comes from the column
//      DEFAULT (15%) set by 20260608220000_xs2event_foundation.sql.
//   5. Apply markup_pct + markup_fixed_sek to the cheapest net_rate
//   6. Return groups with both display fields and the canonical reserve
//      payload (caller passes this verbatim to xs2-reserve to avoid price
//      drift — net_rate + currency_code MUST match what we returned here)
//
// Public endpoint (verify_jwt = false in config.toml) — no auth required for
// browsing, just for reserving.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  Xs2Client,
  groupTickets,
  applyMarkup,
  type TicketGroup,
} from "../_shared/xs2event.ts";

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
    if (!event_id || typeof event_id !== "string") {
      throw new Error("event_id required");
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: event, error: eventErr } = await admin
      .from("events")
      .select("id, source, external_event_id")
      .eq("id", event_id)
      .maybeSingle();
    if (eventErr) throw eventErr;
    if (!event) throw new Error("Event not found");
    if (event.source !== "xs2event" || !event.external_event_id) {
      throw new Error("Event is not sourced from xs2event");
    }

    const xs2 = new Xs2Client();
    const [tickets, categories] = await Promise.all([
      xs2.listTickets({ event_id: event.external_event_id, stock_gt: 0 }),
      xs2.listCategories({ event_id: event.external_event_id }),
    ]);

    const categoryByExternal = new Map(categories.map((c) => [c.category_id, c]));
    const groups = groupTickets(tickets);

    // Lazy-upsert one ticket_categories row per (category_id, sub_category)
    // combo so we have a stable internal UUID to use for ordering, and so
    // admins can configure per-sub_category markup overrides.
    const categoryRows = await ensureCategoryRows(admin, event.id, groups, categoryByExternal);

    const result = groups.map((g) => {
      const row = findCategoryRow(categoryRows, g.category_id, g.sub_category);
      const baseSek = g.cheapest_net_rate;
      const finalSek = row
        ? applyMarkup(baseSek, row.markup_pct, row.markup_fixed_sek)
        : applyMarkup(baseSek, 15, 0); // safety fallback if upsert race-lost
      const xs2Category = categoryByExternal.get(g.category_id);

      return {
        category_id: row?.id ?? null,
        external_category_id: g.category_id,
        external_sub_category: g.sub_category,
        name: xs2Category?.name ?? "Unknown",
        description: xs2Category?.description ?? null,
        party_size_together: xs2Category?.party_size_together ?? 1,
        total_stock: g.total_stock,
        base_sek: baseSek,
        final_sek: finalSek,
        currency: g.currency_code,
        // Canonical reserve payload — caller forwards verbatim to xs2-reserve
        // to guarantee net_rate + currency_code match (xs2 price-drift guard).
        reserve_lines: g.tickets.map((t) => ({
          ticket_id: t.ticket_id,
          net_rate: t.net_rate,
          currency_code: t.currency_code,
          stock: t.stock,
        })),
      };
    });

    // Sort cheapest-first to match the existing EventDetail layout.
    result.sort((a, b) => a.final_sek - b.final_sek);

    return new Response(JSON.stringify({ groups: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("xs2-get-event-tickets:", e);
    const status = e.message?.includes("not found") ? 404 : 400;
    return new Response(JSON.stringify({ error: e.message ?? "Unknown error" }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function ensureCategoryRows(
  admin: ReturnType<typeof createClient>,
  ourEventId: string,
  groups: readonly TicketGroup[],
  xs2CategoryByExternal: Map<string, { name: string; description?: string; party_size_together: number }>,
): Promise<CategoryRow[]> {
  if (groups.length === 0) return [];

  const rows = groups.map((g) => {
    const xc = xs2CategoryByExternal.get(g.category_id);
    return {
      event_id: ourEventId,
      external_category_id: g.category_id,
      external_sub_category: g.sub_category,
      name: xc?.name ?? "Unknown",
      description: xc?.description ?? null,
      party_size_together: xc?.party_size_together ?? 1,
      unit_price_sek: 0, // not used for xs2 events, kept for schema compat
      currency: "SEK",
      qty_available: g.total_stock,
      last_synced_at: new Date().toISOString(),
    };
  });

  // ignoreDuplicates=false so we update party_size_together, qty_available,
  // last_synced_at — but markup_pct/markup_fixed_sek are NOT in the row, so
  // they're preserved on existing rows (DEFAULT applied only on new rows).
  const { error } = await admin
    .from("ticket_categories")
    .upsert(rows, {
      onConflict: "event_id,external_category_id,external_sub_category",
      ignoreDuplicates: false,
    });
  if (error) throw new Error(`category upsert: ${error.message}`);

  const { data, error: readErr } = await admin
    .from("ticket_categories")
    .select("id, external_category_id, external_sub_category, markup_pct, markup_fixed_sek")
    .eq("event_id", ourEventId);
  if (readErr) throw new Error(`category read-back: ${readErr.message}`);
  return (data ?? []) as CategoryRow[];
}

function findCategoryRow(
  rows: readonly CategoryRow[],
  externalCategoryId: string,
  externalSubCategory: string,
): CategoryRow | undefined {
  return rows.find(
    (r) =>
      r.external_category_id === externalCategoryId &&
      r.external_sub_category === externalSubCategory,
  );
}
