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
import { cleanLines, customerPrice, htmlToLines, loadContext, resolveMarkup, type Markup } from "./tc_pricing.ts";
import { translateCategory } from "./translate.ts";
import { background } from "./background.ts";
import { P1Client, isP1F1, p1MaxQty, type P1Product } from "./p1.ts";

// deno-lint-ignore no-explicit-any
type Db = any;

export type Tier = "match" | "hospitality";

export interface P1Offer {
  category_id: string; // "p1:<productId>" — what the page selects
  p1_product_id: string;
  p1_category_id: string | null;
  name: string;
  /** F1: the grandstand alone for the row; `name` (with the day) goes into requests. */
  short_name: string | null;
  /** F1: list section — "Hela helgen", "Söndag", …, "Hospitality". */
  section: string | null;
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
  /** Content/translation was started for this view; the page may ask again shortly. */
  translating: boolean;
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

// ─── F1 names ─────────────────────────────────────────────────────────────
//
// P1 sells F1 per day: the booking option is the day ("Fri/Sat/Sun",
// "Sunday", "Friday ") or a kind ("Hospitality", "F1 Experiences"), and the
// names repeat it: "Fri/Sat/Sun - Marina Grandstand - 3-Day (Fri/Sat/Sun)".
// The page wants "Marina Grandstand" under a "Hela helgen" heading; requests
// get "Marina Grandstand – 3 dagar (fre–sön)" so KAISEN knows the day.

const DAY_SV: [RegExp, string, string][] = [
  // [token, list section, label in the full name]
  [/^thu(rsday)?\/fri\/sat\/sun$/i, "Hela helgen", "4 dagar (tor–sön)"],
  [/^fri\/sat\/sun$/i, "Hela helgen", "3 dagar (fre–sön)"],
  [/^sat\/sun$/i, "Lördag–söndag", "lör–sön"],
  [/^sunday$/i, "Söndag", "söndag"],
  [/^saturday$/i, "Lördag", "lördag"],
  [/^friday$/i, "Fredag", "fredag"],
  [/^thursday$/i, "Torsdag", "torsdag"],
];
const DURATION = /^(\d)-days?$/i;
const KIND: [RegExp, string][] = [[/^hospitality$/i, "Hospitality"], [/^f1 experiences?$/i, "F1 Experiences"]];
export const F1_SECTION_ORDER = ["Hela helgen", "Lördag–söndag", "Söndag", "Lördag", "Fredag", "Torsdag", "Hospitality", "F1 Experiences"];

const isDayToken = (t: string) => DAY_SV.some(([re]) => re.test(t)) || DURATION.test(t) || KIND.some(([re]) => re.test(t));

export function f1Naming(p: P1Product, optionName: string | null): { name: string; short: string; section: string; hospitality: boolean } {
  const opt = (optionName ?? "").trim();
  const raw = [p.categoryName, p.productName].map((x) => (x ?? "").trim()).filter(Boolean).join(" - ");
  const parts = raw.split(/\s+[-–]\s+|\s*\|\s*|\s*,\s*/).map((x) => x.replace(/\s*\([^)]*\)\s*$/, "").trim()).filter(Boolean);
  const day = DAY_SV.find(([re]) => re.test(opt)) ?? DAY_SV.find(([re]) => parts.some((x) => re.test(x)));
  const kind = KIND.find(([re]) => re.test(opt)) ?? KIND.find(([re]) => parts.some((x) => re.test(x)));
  const dur = parts.map((x) => x.match(DURATION)).find(Boolean);
  const seat: string[] = [];
  // Live names also carry the race ("Miami GP 2027 2027-04-29"); the page already says which race.
  const isRaceTitle = (x: string) => /\b20\d{2}-\d{2}-\d{2}\b/.test(x) || /\b(gp|grand prix)\b.*\b20\d{2}\b/i.test(x);
  for (const x of parts) if (!isDayToken(x) && !isRaceTitle(x) && x.toLowerCase() !== opt.toLowerCase() && !seat.includes(x)) seat.push(x);
  // "Gold 2 VIP Lounge – Friday Access Only" -> "… – endast fredag"
  const DAY_WORD: Record<string, string> = { thursday: "torsdag", friday: "fredag", saturday: "lördag", sunday: "söndag" };
  const sv = (x: string) => x.replace(/\b(thursday|friday|saturday|sunday)\s+access\s+only\b/gi, (_m, d: string) => `endast ${DAY_WORD[d.toLowerCase()]}`);
  const short = seat.map(sv).join(" – ") || (kind ? kind[1] : "Biljett");
  const section = kind ? kind[1] : day ? day[1] : "Övrigt";
  const when = day ? day[2] : dur ? `${dur[1]} dagar` : "";
  const name = kind
    ? `${short} – ${kind[1]}${dur ? `, ${dur[1]} dagar` : day ? `, ${day[2]}` : ""}`
    : when ? `${short} – ${when}` : short;
  return { name, short: dur && kind ? `${short} · ${dur[1]} dagar` : short, section, hospitality: !!kind };
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
  await translate(db, { ...(prev ?? {}), ...(fresh as Partial<InfoRow>), p1_category_id: id } as InfoRow);
}

const needsSwedish = (r: InfoRow) =>
  r.sv_source !== "manual" && !!r.description?.length &&
  JSON.stringify(r.translated_from ?? []) !== JSON.stringify(r.description);

/** Swedish description, once per text change. Failures retry after RETRY_MS (see translate.ts for why it can fail). */
async function translate(db: Db, r: InfoRow): Promise<void> {
  if (!needsSwedish(r)) return;
  translateTried.set(r.p1_category_id, Date.now());
  const sv = await translateCategory(r.name ?? "", r.description ?? []);
  if (!sv) return;
  await db.from("p1_category_info").update({
    name_sv: sv.name, description_sv: sv.lines, translated_from: r.description, sv_source: "ai", translated_at: new Date().toISOString(),
  }).eq("p1_category_id", r.p1_category_id);
}
const translateTried = new Map<string, number>();

async function contentFor(db: Db, p1: P1Client, ids: string[]): Promise<Map<string, InfoRow> & { translating?: boolean }> {
  const out: Map<string, InfoRow> & { translating?: boolean } = new Map<string, InfoRow>();
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
  // Content already cached but still in English (translation failed or was
  // never tried): retry the translation alone, backing off per category.
  const untranslated = [...out.values()].filter((r) =>
    !todo.includes(r.p1_category_id) && needsSwedish(r) && Date.now() - (translateTried.get(r.p1_category_id) ?? 0) > RETRY_MS
  );
  if (untranslated.length) background("p1 translate", Promise.all(untranslated.map((r) => translate(db, r))));
  out.translating = todo.length > 0 || untranslated.length > 0;
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
  const f1 = isP1F1(ev);
  const products = options.flatMap((o) => (o.products ?? []).map((p) => ({ p, option: several || f1 ? o.bookingOption.name : null })));
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
    const f1n = f1 ? f1Naming(p, option) : null;
    const name = f1n ? f1n.name : p1Name(p, option);
    const description = cleanLines(info?.description_sv?.length ? info.description_sv : info?.description?.length ? info.description : p1PropertyLines(p));
    const vip = vipLevel(p);
    return {
      category_id: `p1:${p.id}`,
      p1_product_id: p.id,
      p1_category_id: p.categoryId,
      name,
      short_name: f1n?.short ?? null,
      section: f1n?.section ?? null,
      description,
      image_url: info?.image_url ?? p.ticketCategoryImageUrl ?? null,
      tier: f1n ? (f1n.hospitality ? "hospitality" : "match") : vip != null && vip >= 2 ? "hospitality" : guessTier(name, description),
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
    translating: !!content.translating,
  };
}
