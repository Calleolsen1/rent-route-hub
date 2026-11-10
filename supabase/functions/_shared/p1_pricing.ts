// Live P1 Travel offers for one of our fixtures, in SEK, marked up and
// cleaned up for customers.
//
// Used by event-tickets (the merged list) and p1-tickets (P1 on its own).
// Same FX, markup rules and rounding as Travel Connection.
//
// Display text: P1 names repeat the fixture ("Chelsea vs Leeds United
// 2026-11-21 - Blues Dining") and its properties are internal codes
// ("VIP_LEVEL: 4"). The page gets the seat part of the name, a tier
// (VIP level -> hospitality), and the category's own content from P1's
// content API, translated to Swedish once in the background.

import { rateToSek } from "./fx.ts";
import { customerPrice, htmlToLines, loadContext, resolveMarkup, type Markup } from "./tc_pricing.ts";
import { translateCategory } from "./translate.ts";
import { background } from "./background.ts";
import { P1Client, p1MaxQty, type P1Product } from "./p1.ts";

// deno-lint-ignore no-explicit-any
type Db = any;

export type Tier = "match" | "hospitality";

export interface P1Offer {
  category_id: string; // "p1:<productId>" — what the page selects
  p1_product_id: string;
  p1_category_id: string | null;
  name: string;
  description: string[];
  image_url: string | null;
  tier: Tier;
  available: boolean;
  max_qty: number;
  supplier_price: number;
  supplier_currency: string;
  base_sek: number;
  final_sek: number | null;
  markup: Markup;
}

export interface P1Priced {
  p1_event_id: string;
  environment: string;
  guest_details_required: boolean;
  fx: { rateToSek: number; stale: boolean };
  offers: P1Offer[];
}

/** Strip the fixture prefix P1 puts in front of names. */
export const seatPart = (s: string | null | undefined) =>
  (s ?? "").replace(/^.*?\b20\d{2}-\d{2}-\d{2}\s*[-–]\s*/, "").trim();

/** "Category – product" unless they say the same thing; booking option appended when there are several. */
export function p1Name(p: P1Product, optionName: string | null): string {
  const cat = seatPart(p.categoryName);
  const prod = seatPart(p.productName);
  let name = cat && prod && !prod.toLowerCase().includes(cat.toLowerCase()) ? `${cat} – ${prod}` : prod || cat || "Biljett";
  if (optionName) name = `${name} (${optionName})`;
  return name;
}

const vipLevel = (p: P1Product): number | null => {
  const v = (p.properties ?? []).find((x) => /vip[_\s]*level/i.test(x.productPropertyKey))?.value;
  const n = Number(v);
  return v != null && Number.isFinite(n) ? n : null;
};

const HOSPITALITY_WORDS = /\b(hospitality|lounge|vip|box|suite|dining|club|restaurant|premium seat package|paddock|executive|champions)\b/i;

/** Hospitality vs plain match ticket, from words in the name/description. */
export function guessTier(name: string, description: string[] = []): Tier {
  return HOSPITALITY_WORDS.test([name, ...description.slice(0, 2)].join(" ")) ? "hospitality" : "match";
}

/** Properties a customer can read ("Seat Type: Covered"); internal codes dropped. */
export function p1PropertyLines(p: P1Product): string[] {
  return (p.properties ?? [])
    .filter((x) => x.value && x.value.trim() && !/vip[_\s]*level/i.test(x.productPropertyKey) && !/^[A-Z0-9_]+$/.test(x.productPropertyKey))
    .map((x) => `${x.productPropertyKey.replace(/([a-z])([A-Z])/g, "$1 $2")}: ${x.value!.trim()}`);
}

// ─── Category content (cached, translated in the background) ──────────────

const CONTENT_TTL_MS = 7 * 24 * 3_600_000;
const RETRY_MS = 6 * 3_600_000;
const tried = new Map<string, number>();

interface InfoRow {
  p1_category_id: string;
  name: string | null;
  description: string[] | null;
  image_url: string | null;
  name_sv: string | null;
  description_sv: string[] | null;
  translated_from: string[] | null;
  sv_source: "ai" | "manual" | null;
  fetched_at: string;
}

/** Pull name/description/image out of a content response whose exact shape we don't rely on. */
export function parseContent(raw: Record<string, unknown>): { name: string | null; description: string[]; image_url: string | null } {
  const data = (raw.data && typeof raw.data === "object" ? raw.data : raw) as Record<string, unknown>;
  const str = (...keys: string[]) => {
    for (const k of keys) if (typeof data[k] === "string" && (data[k] as string).trim()) return (data[k] as string).trim();
    return null;
  };
  const desc = str("description", "longDescription", "content", "text", "shortDescription");
  const imgs = Array.isArray(data.images) ? (data.images as Record<string, unknown>[]) : [];
  const image = imgs.map((i) => (typeof i?.url === "string" ? i.url : typeof i?.imageUrl === "string" ? i.imageUrl : null)).find(Boolean) ??
    str("imageUrl", "image");
  return { name: str("name", "title"), description: htmlToLines(desc), image_url: (image as string | null) ?? null };
}

async function fetchContent(db: Db, p1: P1Client, id: string, prev?: InfoRow): Promise<void> {
  tried.set(id, Date.now());
  let row: Partial<InfoRow> & { raw?: unknown };
  try {
    const raw = await p1.categoryContent(id);
    row = { ...parseContent(raw), raw };
  } catch (e) {
    // Not stored: a stored row would hide the category for a week. The
    // in-memory `tried` mark backs off retries for a few hours instead.
    console.warn(`[p1_pricing] content ${id}:`, (e as Error).message);
    return;
  }
  const fresh = { p1_category_id: id, ...row, fetched_at: new Date().toISOString() };
  await db.from("p1_category_info").upsert(fresh, { onConflict: "p1_category_id" });
  const desc = (row.description ?? []) as string[];
  const needsSv = prev?.sv_source !== "manual" && desc.length && JSON.stringify(prev?.translated_from ?? []) !== JSON.stringify(desc);
  if (needsSv) {
    const sv = await translateCategory(row.name ?? "", desc);
    if (sv) {
      await db.from("p1_category_info").update({
        name_sv: sv.name, description_sv: sv.lines, translated_from: desc, sv_source: "ai", translated_at: new Date().toISOString(),
      }).eq("p1_category_id", id);
    }
  }
}

async function contentFor(db: Db, p1: P1Client, ids: string[]): Promise<Map<string, InfoRow>> {
  const out = new Map<string, InfoRow>();
  if (!ids.length) return out;
  const { data } = await db
    .from("p1_category_info")
    .select("p1_category_id, name, description, image_url, name_sv, description_sv, translated_from, sv_source, fetched_at")
    .in("p1_category_id", ids);
  for (const r of (data ?? []) as InfoRow[]) out.set(r.p1_category_id, r);
  // Nothing here waits for P1's content API: fetched after the response.
  const todo = ids.filter((id) => {
    const r = out.get(id);
    const old = !r || Date.now() - new Date(r.fetched_at).getTime() > CONTENT_TTL_MS;
    return old && Date.now() - (tried.get(id) ?? 0) > RETRY_MS;
  });
  if (todo.length) background("p1 content", Promise.all(todo.map((id) => fetchContent(db, p1, id, out.get(id)))));
  return out;
}

// ─── The whole lookup ─────────────────────────────────────────────────────

/** Live P1 offers for a fixture, or null when no P1 event is linked to it. */
export async function priceP1Event(db: Db, eventId: string, league: string | null): Promise<P1Priced | null> {
  const { data: link } = await db
    .from("p1_event_links")
    .select("p1_event_id")
    .eq("event_id", eventId)
    .neq("match_method", "ignored")
    .maybeSingle();
  if (!link?.p1_event_id) return null;

  const p1 = new P1Client();
  const [ev] = await p1.searchEvents({ eventIds: [link.p1_event_id], currency: "EUR" });
  if (!ev) return null;

  const options = ev.bookingOptionProducts ?? [];
  const several = options.length > 1;
  const products = options.flatMap((o) => (o.products ?? []).map((p) => ({ p, option: several ? o.bookingOption.name : null })));
  const catIds = [...new Set(products.map(({ p }) => p.categoryId).filter((x): x is string => !!x))];

  const [fx, ctx, content] = await Promise.all([
    rateToSek(db, "EUR"),
    loadContext(db, eventId, league),
    contentFor(db, p1, catIds),
  ]);
  const markup = resolveMarkup(ctx, undefined);

  const offers: P1Offer[] = products.map(({ p, option }) => {
    const supplierPrice = Number(p.price?.amount ?? 0);
    const baseSek = Math.round(supplierPrice * fx.rateToSek);
    const maxQty = p1MaxQty(p);
    const info = p.categoryId ? content.get(p.categoryId) : undefined;
    const name = p1Name(p, option);
    const description = info?.description_sv?.length ? info.description_sv : info?.description?.length ? info.description : p1PropertyLines(p);
    const vip = vipLevel(p);
    return {
      category_id: `p1:${p.id}`,
      p1_product_id: p.id,
      p1_category_id: p.categoryId,
      name,
      description,
      image_url: info?.image_url ?? p.ticketCategoryImageUrl ?? null,
      tier: vip != null && vip >= 2 ? "hospitality" : guessTier(name, description),
      available: p.available && maxQty > 0,
      max_qty: Math.max(maxQty, 1),
      supplier_price: supplierPrice,
      supplier_currency: p.price?.currency ?? "EUR",
      base_sek: baseSek,
      final_sek: supplierPrice > 0 ? customerPrice(baseSek, markup, ctx.rounding) : null,
      markup,
    };
  });

  return {
    p1_event_id: ev.id,
    environment: p1.environment,
    guest_details_required: (ev.requiredTicketHolderFields ?? []).length > 0,
    fx: { rateToSek: fx.rateToSek, stale: fx.stale },
    offers,
  };
}
