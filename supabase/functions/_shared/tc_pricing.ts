// Live Travel Connection prices for one of our fixtures, in SEK, marked up.
//
// Shared by travelconnection-tickets (what the page shows) and
// travelconnection-checkout (what the order is created at), so the price a
// customer sees and the price they're charged come from the same code.
//
// Markup, most specific wins:
//   1. category  — ticket_categories.markup_override = true
//   2. match     — markup_rules scope 'event'
//   3. league    — markup_rules scope 'league' (events.tournament_name)
//   4. standard  — platform settings default_markup_pct / _fixed_sek
// then the customer price is rounded UP to price_rounding_sek (1 = off).

import { rateToSek, type FxRate } from "./fx.ts";
import { translateCategory } from "./translate.ts";
import { planSignedUrl } from "./tc_venues.ts";
import { background } from "./background.ts";
import {
  TravelConnectionClient,
  type TcInventory,
  type TcTicketOption,
} from "./travelconnection.ts";

// Called with clients from both esm.sh and npm: supabase-js builds, whose
// types don't line up; the queries here are simple enough to go untyped.
// deno-lint-ignore no-explicit-any
type Db = any;

export type MarkupSource = "category" | "match" | "league" | "standard";

export interface Markup {
  pct: number;
  fixed: number;
  source: MarkupSource;
}

export interface PricedOption {
  category_id: string | null;
  ticket_option_id: number;
  tc_category_id: number;
  name: string;
  description: string[];
  color: string | null;
  available: boolean;
  max_qty: number;
  supplier_price: number;
  supplier_currency: string;
  base_sek: number;
  final_sek: number;
  markup: Markup;
}

export interface PricedEvent {
  tc_product_id: number;
  currency: string;
  fx: FxRate;
  league: string | null;
  guest_details_required: boolean;
  /** Official seating plan (signed URL to our copy), painted in the category colours. */
  plan_url: string | null;
  options: PricedOption[];
}

export const tcCategoryKey = (optionId: number) => `tc_${optionId}`;

// ─── Text helpers ─────────────────────────────────────────────────────────

const ENTITIES: Record<string, string> = {
  nbsp: " ", amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", ndash: "–",
  mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", hellip: "…",
  euro: "€", pound: "£",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : m;
    }
    return ENTITIES[code.toLowerCase()] ?? m;
  });
}

/**
 * Supplier HTML -> plain bullet points. Tags are stripped entirely, so
 * nothing from the supplier is ever rendered as markup on our site.
 */
export function htmlToLines(html: string | null | undefined): string[] {
  if (!html) return [];
  const text = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<\s*(li|p|br|div|h\d)[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "");
  return decodeEntities(text)
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter((l) => l.length > 1);
}

/** "CAT 2" -> "Kategori 2"; anything else (session names etc.) as-is. */
export function displayName(name: string | null | undefined, fallbackId: number): string {
  const n = (name ?? "").trim();
  const cat = n.match(/^cat(?:egory)?\.?\s*(\d+[a-z]?)$/i);
  if (cat) return `Kategori ${cat[1].toUpperCase()}`;
  return n || `Kategori ${fallbackId}`;
}

// ─── Markup ───────────────────────────────────────────────────────────────

interface Rule {
  scope: "league" | "event";
  league: string | null;
  event_id: string | null;
  markup_pct: number;
  markup_fixed_sek: number;
}

interface PricingContext {
  standard: { pct: number; fixed: number };
  league: Rule | null;
  match: Rule | null;
  rounding: number;
}

async function loadContext(db: Db, eventId: string, league: string | null): Promise<PricingContext> {
  const [{ data: pct }, { data: fixed }, { data: rounding }, { data: rules }] = await Promise.all([
    db.rpc("get_platform_decimal", { p_key: "default_markup_pct", p_default: 15 }),
    db.rpc("get_platform_decimal", { p_key: "default_markup_fixed_sek", p_default: 0 }),
    db.rpc("get_platform_decimal", { p_key: "price_rounding_sek", p_default: 1 }),
    db
      .from("markup_rules")
      .select("scope, league, event_id, markup_pct, markup_fixed_sek")
      .or(`event_id.eq.${eventId}${league ? `,league.eq."${league.replace(/"/g, '\\"')}"` : ""}`),
  ]);
  const list = (rules ?? []) as Rule[];
  return {
    standard: { pct: Number(pct ?? 15), fixed: Number(fixed ?? 0) },
    match: list.find((r) => r.scope === "event") ?? null,
    league: list.find((r) => r.scope === "league") ?? null,
    rounding: Math.max(1, Number(rounding ?? 1)),
  };
}

function resolveMarkup(
  ctx: PricingContext,
  row: { markup_override: boolean; markup_pct: number; markup_fixed_sek: number } | undefined,
): Markup {
  if (row?.markup_override) {
    return { pct: Number(row.markup_pct), fixed: Number(row.markup_fixed_sek), source: "category" };
  }
  if (ctx.match) return { pct: Number(ctx.match.markup_pct), fixed: Number(ctx.match.markup_fixed_sek), source: "match" };
  if (ctx.league) return { pct: Number(ctx.league.markup_pct), fixed: Number(ctx.league.markup_fixed_sek), source: "league" };
  return { ...ctx.standard, source: "standard" };
}

/** Percentage, then fixed kronor, then rounded UP to the step. */
export function customerPrice(baseSek: number, m: { pct: number; fixed: number }, step: number): number {
  const raw = baseSek * (1 + m.pct / 100) + m.fixed;
  return Math.ceil(Math.round(raw) / step) * step;
}

// ─── Category info (cached a day) ─────────────────────────────────────────

const INFO_TTL_MS = 24 * 3_600_000;

interface CategoryInfo {
  name: string | null;
  description: string[];
  color: string | null;
  /** Swedish, once translated (or written by an admin). */
  name_sv: string | null;
  description_sv: string[] | null;
}

interface InfoRow {
  tc_category_id: number;
  name: string | null;
  description: string[] | null;
  color: string | null;
  fetched_at: string;
  name_sv: string | null;
  description_sv: string[] | null;
  translated_from: string[] | null;
  sv_source: "ai" | "manual" | null;
}

const sameLines = (a: string[] | null, b: string[] | null) => JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

/** Last translation attempt per category on this instance, to back off after a failure. */
const translationTried = new Map<number, number>();
const TRANSLATION_RETRY_MS = 6 * 3_600_000;

async function fetchCategory(db: Db, tc: TravelConnectionClient, id: number, prev: InfoRow | undefined): Promise<InfoRow | null> {
  try {
    const c = await tc.getTicketCategory(id);
    const fresh = {
      tc_category_id: id,
      name: c.name,
      description: htmlToLines(c.description),
      color: c.color,
      guest_data_requirements: c.guest_data_requirements ?? null,
      fetched_at: new Date().toISOString(),
    };
    await db.from("tc_ticket_category_info").upsert(fresh, { onConflict: "tc_category_id" });
    return { name_sv: null, description_sv: null, translated_from: null, sv_source: null, ...prev, ...fresh };
  } catch (e) {
    // A description is nice to have. Never let it take prices down.
    console.warn(`[tc_pricing] category ${id}:`, (e as Error).message);
    return null;
  }
}

async function translateRow(db: Db, r: InfoRow): Promise<void> {
  translationTried.set(r.tc_category_id, Date.now());
  const sv = await translateCategory(r.name ?? "", r.description ?? []);
  if (!sv) return;
  await db.from("tc_ticket_category_info").update({
    name_sv: sv.name,
    description_sv: sv.lines,
    translated_from: r.description ?? [],
    sv_source: "ai",
    translated_at: new Date().toISOString(),
  }).eq("tc_category_id", r.tc_category_id);
}

/**
 * What each category is, from our cache. Only a category never seen before
 * is fetched while the visitor waits (its colour is needed for the map).
 * The daily English refresh and the Swedish translation run after the
 * response — they used to run first, costing seconds per view, and a failed
 * translation was retried on every single view.
 */
async function categoryInfo(db: Db, tc: TravelConnectionClient, ids: number[]): Promise<Map<number, CategoryInfo>> {
  const out = new Map<number, CategoryInfo>();
  if (!ids.length) return out;
  const { data } = await db
    .from("tc_ticket_category_info")
    .select("tc_category_id, name, description, color, fetched_at, name_sv, description_sv, translated_from, sv_source")
    .in("tc_category_id", ids);
  const rows = new Map<number, InfoRow>(((data ?? []) as InfoRow[]).map((r) => [r.tc_category_id, r]));

  const missing = ids.filter((id) => !rows.has(id));
  const fetched = await Promise.all(missing.map((id) => fetchCategory(db, tc, id, undefined)));
  for (const r of fetched) if (r) rows.set(r.tc_category_id, r);

  const stale = ids.filter((id) => {
    const r = rows.get(id);
    return r && !missing.includes(id) && Date.now() - new Date(r.fetched_at).getTime() >= INFO_TTL_MS;
  });
  const untranslated = [...rows.values()].filter((r) =>
    r.sv_source !== "manual" &&
    (!r.description_sv || !sameLines(r.translated_from, r.description)) &&
    Date.now() - (translationTried.get(r.tc_category_id) ?? 0) > TRANSLATION_RETRY_MS
  );
  if (stale.length || untranslated.length) {
    background("category refresh", (async () => {
      const refreshed = await Promise.all(stale.map((id) => fetchCategory(db, tc, id, rows.get(id))));
      const toTranslate = new Map(untranslated.map((r) => [r.tc_category_id, r]));
      for (const r of refreshed) {
        if (r && r.sv_source !== "manual" && !sameLines(r.translated_from, r.description)) toTranslate.set(r.tc_category_id, r);
      }
      await Promise.all([...toTranslate.values()].map((r) => translateRow(db, r)));
    })());
  }

  for (const r of rows.values()) {
    out.set(r.tc_category_id, {
      name: r.name,
      description: r.description ?? [],
      color: r.color,
      name_sv: r.name_sv,
      description_sv: r.description_sv,
    });
  }
  return out;
}

/**
 * Swedish display name for a ticket option. "CAT 2" is rule-based; other
 * names use the category's translation, keeping any per-date suffix the
 * option adds to the category name ("… (Fri 25/09)").
 */
function optionDisplayName(optionName: string, ci: CategoryInfo | undefined, fallbackId: number): string {
  const n = (optionName || ci?.name || "").trim();
  if (/^cat(?:egory)?\.?\s*\d+[a-z]?$/i.test(n)) return displayName(n, fallbackId);
  if (ci?.name_sv && ci.name && n.startsWith(ci.name)) return ci.name_sv + n.slice(ci.name.length);
  return displayName(n, fallbackId);
}

// ─── Inventory (short public cache) ───────────────────────────────────────

// Public page views share the supplier's 60 requests/minute with the sync
// and with bookings. A popular fixture must not starve those, so a public
// view reuses a lookup for up to a minute per warm instance. Checkout and
// admin always pass fresh: true.
const PUBLIC_CACHE_MS = 60_000;
const inventoryCache = new Map<number, { at: number; inv: TcInventory | undefined }>();

async function inventoryFor(tc: TravelConnectionClient, productId: number, fresh: boolean) {
  const hit = inventoryCache.get(productId);
  if (!fresh && hit && Date.now() - hit.at < PUBLIC_CACHE_MS) return hit.inv;
  const inv = (await tc.inventory([productId])).get(productId);
  inventoryCache.set(productId, { at: Date.now(), inv });
  return inv;
}

// ─── The whole lookup ─────────────────────────────────────────────────────

/**
 * Live options for a fixture, priced. Returns null when no supplier product
 * is linked to the event. Also keeps ticket_categories in step (stable ids
 * for order_items, latest price for admin) and the event's från-price.
 */
export async function priceEvent(
  db: Db,
  tc: TravelConnectionClient,
  eventId: string,
  opts: { fresh: boolean },
): Promise<PricedEvent | null> {
  const [{ data: link, error: linkErr }, { data: event }] = await Promise.all([
    db
      .from("tc_product_links")
      .select("tc_product_id, tc_currency, guest_details_required, tc_venue_id")
      .eq("event_id", eventId)
      .in("match_method", ["auto", "manual"])
      .maybeSingle(),
    db.from("events").select("tournament_name").eq("id", eventId).maybeSingle(),
  ]);
  if (linkErr) throw new Error(linkErr.message);
  if (!link) return null;

  // The catalogue list has no currency; fetch it once and keep it.
  let currency: string = link.tc_currency;
  if (!currency) {
    const product = await tc.getProduct(link.tc_product_id);
    currency = (product.currency ?? "EUR").toUpperCase();
    await db.from("tc_product_links").update({ tc_currency: currency }).eq("tc_product_id", link.tc_product_id);
  }

  const league: string | null = event?.tournament_name ?? null;
  const [inv, fx, ctx, { data: venue }] = await Promise.all([
    inventoryFor(tc, link.tc_product_id, opts.fresh),
    rateToSek(db, currency),
    loadContext(db, eventId, league),
    link.tc_venue_id != null
      ? db.from("tc_venues").select("plan_path").eq("tc_venue_id", link.tc_venue_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const options: TcTicketOption[] = inv && inv.status !== "Expired" ? inv.ticket_options : [];
  const base = {
    tc_product_id: link.tc_product_id,
    currency,
    fx,
    league,
    guest_details_required: !!link.guest_details_required,
    plan_url: venue?.plan_path ? await planSignedUrl(db, venue.plan_path) : null, // cached per instance
  };
  if (!options.length) return { ...base, options: [] };

  const [info, { data: rows, error: readErr }] = await Promise.all([
    categoryInfo(db, tc, [...new Set(options.map((o) => o.ticket_category))]),
    db
      .from("ticket_categories")
      .select("id, external_category_id, markup_override, markup_pct, markup_fixed_sek")
      .eq("event_id", eventId)
      .like("external_category_id", "tc_%"),
  ]);
  if (readErr) throw new Error(`ticket_categories read: ${readErr.message}`);
  const byKey = new Map<string, { id: string; markup_override: boolean; markup_pct: number; markup_fixed_sek: number }>(
    (rows ?? []).map((r: { external_category_id: string }) => [r.external_category_id, r]),
  );

  const now = new Date().toISOString();
  const priced = options.map((o) => {
    const key = tcCategoryKey(o.id);
    const row = byKey.get(key);
    const markup = resolveMarkup(ctx, row);
    const baseSek = o.price * fx.rateToSek;
    const ci = info.get(o.ticket_category);
    const available = o.available && o.max_purchase_qty > 0;
    return {
      key,
      row,
      out: {
        category_id: row?.id ?? null,
        ticket_option_id: o.id,
        tc_category_id: o.ticket_category,
        name: optionDisplayName(o.name, ci, o.ticket_category),
        // Swedish when translated; English until then, never nothing.
        description: ci?.description_sv ?? ci?.description ?? [],
        color: ci?.color ?? null,
        available,
        max_qty: available ? o.max_purchase_qty : 0,
        supplier_price: o.price,
        supplier_currency: currency,
        base_sek: Math.round(baseSek),
        final_sek: customerPrice(baseSek, markup, ctx.rounding),
        markup,
      } as PricedOption,
    };
  });

  // Keep ticket_categories in step. New options are inserted; existing ones
  // get price/stock only, never their markup columns.
  const rowFields = (p: PricedOption) => ({
    name: p.name,
    // First line is the headline ("Long side LATERAL UPPER"); it travels
    // with the order into emails and Mitt Kaisen.
    description: p.description[0] ?? null,
    unit_price_sek: p.final_sek,
    currency: "SEK",
    qty_available: p.max_qty,
    max_purchase_qty: p.max_qty,
    supplier_price: p.supplier_price,
    supplier_currency: p.supplier_currency,
    last_synced_at: now,
  });

  const inserts = priced.filter((p) => !p.row).map((p) => ({
    event_id: eventId,
    external_category_id: p.key,
    external_sub_category: "",
    party_size_together: 1,
    ...rowFields(p.out),
  }));
  if (inserts.length) {
    const { data: created, error } = await db
      .from("ticket_categories")
      .upsert(inserts, { onConflict: "event_id,external_category_id,external_sub_category", ignoreDuplicates: true })
      .select("id, external_category_id");
    if (error) throw new Error(`ticket_categories insert: ${error.message}`);
    const ids = new Map((created ?? []).map((r: { external_category_id: string; id: string }) => [r.external_category_id, r.id]));
    for (const p of priced) if (!p.out.category_id) p.out.category_id = (ids.get(p.key) as string) ?? null;
  }
  // Bookkeeping the visitor doesn't need to wait for: latest price/stock on
  // existing rows (for admin), and the event's från-price for listings.
  // Nothing reads these back in this request — the checkout prices from the
  // live lookup, never from these columns.
  const live = priced.filter((p) => p.out.available).map((p) => p.out.final_sek);
  background("price bookkeeping", Promise.all([
    ...priced.filter((p) => p.row).map((p) => db.from("ticket_categories").update(rowFields(p.out)).eq("id", p.row!.id)),
    db.from("events").update({
      min_price_sek: live.length ? Math.min(...live) : null,
      max_price_sek: live.length ? Math.max(...live) : null,
    }).eq("id", eventId),
  ]));

  const out = priced.map((p) => p.out);
  // Available first, then cheapest.
  out.sort((a, b) => Number(b.available) - Number(a.available) || a.final_sek - b.final_sek);
  return { ...base, options: out };
}
