// Live XS2Event offers for one of our fixtures, in SEK, marked up and
// cleaned up for customers. Used by event-tickets (the merged list).
//
// XS2 sells per lot (ticket_id); a category usually has several lots at
// different prices. The page gets ONE offer per category and day
// (sub_category): the cheapest lot that can be bought, with the largest
// single lot as the quantity cap (different lots are not seated together).
//
// XS2 is request-only: KAISEN buys in the XS2 portal after the request.
// Same FX, markup rules and rounding as the other suppliers.

import { rateToSek } from "./fx.ts";
import { cleanLines, customerPrice, htmlToLines, loadContext, resolveMarkup, type Markup } from "./tc_pricing.ts";
import { guessTier } from "./p1_pricing.ts";
import { Xs2Client, xs2Buyable, type Xs2Category, type Xs2Ticket } from "./xs2.ts";
import { svTexts, type SvItem, type SvText } from "./sv_texts.ts";

// deno-lint-ignore no-explicit-any
type Db = any;

export type Tier = "match" | "hospitality";

export interface Xs2Offer {
  category_id: string; // "xs2:<categoryKey>:<sub_category>" — what the page selects
  xs2_category_id: string; // stable per stadium (supplier_category_id)
  xs2_ticket_id: string | null; // the cheapest buyable lot
  name: string;
  short_name: string | null;
  section: string | null;
  description: string[];
  /** XS2's English, for matching against the other suppliers. */
  name_en: string;
  description_en: string[];
  /** F1 day for pairing (same keys as P1's); null for football. */
  day: string | null;
  image_url: string | null;
  tier: Tier;
  available: boolean;
  max_qty: number;
  supplier_price: number; // in supplier_currency, not cents
  supplier_currency: string;
  base_sek: number;
  final_sek: number | null;
  markup: Markup;
}

export interface Xs2Priced {
  xs2_event_id: string;
  environment: string;
  offers: Xs2Offer[];
  /** Swedish texts are being made for this view; the page may ask again shortly. */
  translating: boolean;
}

// F1 days: sub_category -> [list section, label in the full name].
const DAYS: Record<string, [string, string]> = {
  weekend: ["Hela helgen", "hela helgen"],
  thufrisatsun: ["Hela helgen", "4 dagar (tor–sön)"],
  frisatsun: ["Hela helgen", "3 dagar (fre–sön)"],
  satsun: ["Lördag–söndag", "lör–sön"],
  sun: ["Söndag", "söndag"],
  sat: ["Lördag", "lördag"],
  fri: ["Fredag", "fredag"],
  thu: ["Torsdag", "torsdag"],
};
const subKey = (sub: string | null | undefined) => (sub ?? "").replace(/_.*$/, "").toLowerCase();
export const xs2Day = (sub: string | null | undefined): [string, string] | null => DAYS[subKey(sub)] ?? null;
/** Day key for pairing with P1: every whole-weekend variant is "weekend". */
export const xs2DayKey = (sub: string | null | undefined): string | null =>
  !xs2Day(sub) ? null : DAYS[subKey(sub)][0] === "Hela helgen" ? "weekend" : subKey(sub);

/** Lots without a category ("0") are keyed by their title instead. */
export const xs2CategoryKey = (t: Pick<Xs2Ticket, "category_id" | "ticket_title" | "category_name">): string =>
  t.category_id && t.category_id !== "0" ? t.category_id : `t:${(t.ticket_title ?? t.category_name ?? "biljett").trim().toLowerCase()}`;

/** XS2's English description lines (the source we translate from). */
export const xs2EnglishLines = (cat: Xs2Category | undefined): string[] => cleanLines(htmlToLines(cat?.description?.en_GB || null));

/** "Category 2" -> "Kategori 2" (also the label used until a translation exists). */
export const xs2Label = (name: string): string => name.replace(/^cat(?:egory)?\.?\s*(\d+[a-z]?)$/i, (_m, n: string) => `Kategori ${n.toUpperCase()}`);

/**
 * Customer text: our Swedish translation of XS2's English when made, else
 * XS2's own Swedish (machine-made, sometimes garbled), else English; plus a
 * few seat facts (already Swedish).
 */
export function xs2Description(cat: Xs2Category | undefined, lot: Xs2Ticket | undefined, svLines?: string[]): string[] {
  const d = cat?.description ?? {};
  const lines = svLines?.length ? cleanLines(svLines) : cleanLines(htmlToLines(d.sv_SE || d.en_GB || null));
  const facts: string[] = [];
  const opt = { ...(lot?.options ?? {}), ...(cat?.options ?? {}) };
  if (opt.covered_seat) facts.push("Tak över platsen");
  if (opt.numbered_seat) facts.push("Numrerade platser");
  const together = Number(cat?.party_size_together ?? 0);
  if (together > 1) facts.push(`Upp till ${together} personer sitter tillsammans`);
  if ((lot?.flags ?? []).includes("no_away_fans")) facts.push("Ej för bortasupportrar");
  return [...lines, ...facts];
}

const imageOf = (cat: Xs2Category | undefined): string | null => {
  for (const f of cat?.files ?? []) {
    const url = f?.url ?? f?.file_url;
    if (typeof url === "string" && /^https:\/\//.test(url) && /\.(png|jpe?g|webp)(\?|$)/i.test(url)) return url;
  }
  return null;
};

/** Group lots into one offer per category + day. Pure apart from the passed-in rates. */
export function buildXs2Offers(
  tickets: Xs2Ticket[],
  categories: Xs2Category[],
  opts: { f1: boolean; rate: (currency: string) => number; markup: Markup; rounding: number; sv?: Map<string, SvText> },
): Xs2Offer[] {
  const catBy = new Map(categories.map((c) => [c.category_id, c]));
  const groups = new Map<string, Xs2Ticket[]>();
  for (const t of tickets) {
    if (t.ticket_status === "disabled" && !xs2Buyable(t)) {
      // Disabled lots still say the category exists (shown as sold out),
      // but only when the category is known; anonymous "0" lots are noise.
      if (!t.category_id || t.category_id === "0") continue;
    }
    const k = `${xs2CategoryKey(t)}|${t.sub_category ?? ""}`;
    groups.set(k, [...(groups.get(k) ?? []), t]);
  }

  const offers: Xs2Offer[] = [];
  for (const [k, lots] of groups) {
    const [catKey, sub] = k.split("|");
    const cat = catBy.get(lots[0].category_id);
    const sek = (t: Xs2Ticket) => (Number(t.net_rate) / 100) * opts.rate(t.currency_code);
    const buyable = lots.filter(xs2Buyable).sort((a, b) => sek(a) - sek(b));
    const best = buyable[0];
    const shown = best ?? lots[0];
    const labelEn = (cat?.category_name ?? shown.category_name ?? shown.ticket_title ?? "Biljett").trim();
    const sv = opts.sv?.get(catKey);
    const label = sv?.name || xs2Label(labelEn);
    const day = opts.f1 ? xs2Day(sub) : null;
    const description = xs2Description(cat, shown, sv?.lines);
    const descriptionEn = xs2EnglishLines(cat);
    const type = cat?.category_type ?? shown.category_type;
    const tier: Tier = type === "hospitality" ? "hospitality" : type ? "match" : guessTier(labelEn, descriptionEn);
    const supplierPrice = best ? Number(best.net_rate) / 100 : 0;
    const baseSek = best ? Math.round(sek(best)) : 0;
    const lotMax = Math.max(0, ...buyable.map((t) => Number(t.stock)));
    const capped = buyable.some((t) => (t.flags ?? []).includes("max_10_sale")) ? Math.min(lotMax, 10) : lotMax;
    offers.push({
      category_id: `xs2:${catKey}:${sub}`,
      xs2_category_id: catKey,
      xs2_ticket_id: best?.ticket_id ?? null,
      name: day ? `${label} – ${day[1]}` : label,
      short_name: day ? label : null,
      section: day ? (tier === "hospitality" ? "Hospitality" : day[0]) : null,
      description,
      name_en: labelEn,
      description_en: descriptionEn,
      day: opts.f1 ? xs2DayKey(sub) : null,
      image_url: imageOf(cat),
      tier,
      available: !!best,
      max_qty: Math.max(1, Math.min(20, capped)),
      supplier_price: supplierPrice,
      supplier_currency: shown.currency_code,
      base_sek: baseSek,
      final_sek: best ? customerPrice(baseSek, opts.markup, opts.rounding) : null,
      markup: opts.markup,
    });
  }
  return offers;
}

// Category texts change rarely; one call per stadium every few hours is plenty.
const CAT_TTL_MS = 6 * 3_600_000;
const catCache = new Map<string, { at: number; cats: Xs2Category[] }>();

/** Live XS2 offers for a fixture, or null when no XS2 event is linked to it. */
export async function priceXs2Event(db: Db, eventId: string, league: string | null): Promise<Xs2Priced | null> {
  const { data: link } = await db
    .from("xs2_event_links")
    .select("xs2_event_id, xs2_kind")
    .eq("event_id", eventId)
    .neq("match_method", "ignored")
    .maybeSingle();
  if (!link?.xs2_event_id) return null;

  const xs2 = new Xs2Client();
  const cached = catCache.get(link.xs2_event_id);
  const [tickets, categories, ctx] = await Promise.all([
    xs2.tickets(link.xs2_event_id),
    cached && Date.now() - cached.at < CAT_TTL_MS
      ? cached.cats
      : xs2.categories(link.xs2_event_id).then((cats) => {
        catCache.set(link.xs2_event_id, { at: Date.now(), cats });
        return cats;
      }).catch(() => [] as Xs2Category[]), // texts are nice-to-have; tickets aren't
    loadContext(db, eventId, league),
  ]);
  if (!tickets.length) return null;

  // F1 lots mix currencies (EUR, USD, GBP, AED, QAR in one race). A rate
  // that can't be fetched drops only the lots in that currency, never the
  // whole event.
  const cur = (t: Xs2Ticket) => (t.currency_code || "EUR").toUpperCase();
  const rates = new Map<string, number>();
  await Promise.all([...new Set(tickets.map(cur))].map(async (c) => {
    try {
      rates.set(c, (await rateToSek(db, c)).rateToSek);
    } catch (e) {
      console.warn(`[xs2_pricing] no FX rate for ${c}:`, (e as Error).message);
    }
  }));
  const priceable = tickets.filter((t) => rates.has(cur(t)));
  if (!priceable.length) return null;

  // Swedish names/texts, one translation per XS2 category (cached).
  const catBy = new Map(categories.map((c) => [c.category_id, c]));
  const items = new Map<string, SvItem>();
  for (const t of priceable) {
    const key = xs2CategoryKey(t);
    if (items.has(key)) continue;
    const cat = catBy.get(t.category_id);
    items.set(key, { key, name: (cat?.category_name ?? t.category_name ?? t.ticket_title ?? "").trim(), lines: xs2EnglishLines(cat) });
  }
  const { sv, translating } = await svTexts(db, "xs2", [...items.values()]);

  const offers = buildXs2Offers(priceable, categories, {
    f1: link.xs2_kind === "f1",
    rate: (c) => rates.get((c || "EUR").toUpperCase())!,
    markup: resolveMarkup(ctx, undefined),
    rounding: ctx.rounding,
    sv,
  });
  return { xs2_event_id: link.xs2_event_id, environment: xs2.environment, offers, translating };
}
