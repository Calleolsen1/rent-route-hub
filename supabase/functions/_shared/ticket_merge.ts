// One ticket list from Travel Connection + P1 Travel.
//
// Each supplier category can be linked (in admin) to one of KAISEN's own
// seat categories for the stadium. The page then shows ONE row per seat
// category, sold through the supplier with the better offer:
//   1. a supplier with something available beats one that is sold out
//   2. then the lower customer price
//   3. on a tie, Travel Connection (it can go straight to checkout)
// Every offer of the winning supplier in that category is kept (an F1 seat
// can have one option per day); the losing supplier's offers are dropped.
//
// Unlinked supplier categories are shown as their own rows; hidden ones are
// dropped. Pure — no I/O — so it is unit-tested.

export type Supplier = "travelconnection" | "p1";
export type Tier = "match" | "hospitality";

export interface Offer {
  supplier: Supplier;
  /** Stable per stadium: TC ticket category id, P1 category id. */
  supplier_category_id: string;
  /** What the page selects and the checkout/request reads. */
  category_id: string | null;
  name: string;
  /** Shorter row label (F1: grandstand without the day); `name` stays full. */
  short_name?: string | null;
  /** List section (F1: the day); null = split by tier. */
  section?: string | null;
  description: string[];
  color: string | null;
  image_url: string | null;
  tier: Tier;
  available: boolean;
  max_qty: number;
  final_sek: number | null;
  request_only: boolean;
  /** Admin-only extras, passed through. */
  admin?: Record<string, unknown>;
}

export interface SeatCategory {
  id: string;
  name: string;
  description: string[];
  tier: Tier;
  color: string | null;
  sort_order: number;
}

export interface Link {
  supplier: Supplier;
  supplier_category_id: string;
  seat_category_id: string | null;
  hidden: boolean;
}

export interface MergedGroup {
  category_id: string | null;
  name: string;
  short_name: string | null;
  section: string | null;
  description: string[];
  color: string | null;
  image_url: string | null;
  tier: Tier;
  available: boolean;
  max_qty: number;
  final_sek: number | null;
  request_only: boolean;
  supplier: Supplier;
  seat_category_id: string | null;
  /** Other supplier's offers for the same seat category (admin only). */
  alternatives?: { supplier: Supplier; name: string; final_sek: number | null; available: boolean }[];
  /** Merged by the automatic pairing, not by an admin link. */
  auto_paired?: boolean;
  admin?: Record<string, unknown>;
}

const linkKey = (s: Supplier, id: string) => `${s}:${id}`;
const price = (o: { final_sek: number | null }) => o.final_sek ?? Number.MAX_SAFE_INTEGER;

/** Best offer from a list: available first, then cheapest. */
function best(offers: Offer[]): Offer | undefined {
  return [...offers].sort((a, b) => Number(b.available) - Number(a.available) || price(a) - price(b))[0];
}

/** Which supplier sells a seat category: available > cheaper > Travel Connection. */
export function pickSupplier(offers: Offer[]): Supplier {
  const tc = best(offers.filter((o) => o.supplier === "travelconnection"));
  const p1 = best(offers.filter((o) => o.supplier === "p1"));
  if (!tc) return "p1";
  if (!p1) return "travelconnection";
  if (tc.available !== p1.available) return tc.available ? "travelconnection" : "p1";
  return price(p1) < price(tc) ? "p1" : "travelconnection";
}

const toGroup = (o: Offer, seat: SeatCategory | null, useSeatText: boolean): MergedGroup => ({
  category_id: o.category_id,
  name: seat && useSeatText ? seat.name : o.name,
  short_name: seat && useSeatText ? null : o.short_name ?? null,
  section: o.section ?? null,
  description: seat && useSeatText && seat.description.length ? seat.description : o.description,
  // TC colours drive the stadium plan; a seat category may set its own.
  color: seat?.color ?? o.color,
  image_url: o.image_url,
  tier: seat?.tier ?? o.tier,
  available: o.available,
  max_qty: o.max_qty,
  final_sek: o.final_sek,
  request_only: o.request_only,
  supplier: o.supplier,
  seat_category_id: seat?.id ?? null,
  ...(o.admin && { admin: o.admin }),
});

// ─── Automatic pairing (until an admin links a stadium) ──────────────────
//
// Unlinked categories from the two suppliers are compared per match; when
// they clearly are the same seats, only the better offer is shown. Checked
// against real fixtures: same name (Shortside / Shortside), a shared block
// code (Club Deck CD4-CD6 / CD2 or CD6), one name inside the other
// (Longside / Longside Lower, 93:20 Lounge ticket / 93:20 Lounge), or two
// shared meaningful words (Longside Monte Mario / Tribuna Monte Mario).
// Different products (Green Room / Heart of the City; block 141 / 118-119)
// don't pair. One-to-one, strongest pairs first. Admin links override.

const NOISE = new Set([
  "ticket", "tickets", "package", "packages", "seat", "seats", "seating", "official", "match", "matchday",
  "the", "and", "with", "of", "at", "in", "on", "or", "a", "sb", "together", "request", "plus", "block", "blocks",
  "category", "kategori", "standard", "location", "e", "up", "to", "day",
]);

// Words many different products share ("Rose & Ball Hospitality" and "Blues
// Dining Hospitality" are different lounges). They never prove a pair on
// their own. Stand/side words (longside, tribuna, east…) do count.
const GENERIC = new Set([
  "hospitality", "lounge", "premium", "vip", "club", "lower", "upper", "tier", "level", "central",
  "dining", "experience", "executive", "box", "sports", "bar", "food", "included", "restaurant", "pre", "prime",
]);

/** TC names some categories "Kategori 2"; their first description line says where it is. */
const meaningfulName = (o: Offer) => (/^kategori\s*\d+[a-z]?$/i.test(o.name.trim()) && o.description[0] ? o.description[0] : o.name);

export function nameTokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/(long|short)\s+side/g, "$1side")
    .replace(/match\s+day/g, "matchday")
    .replace(/half\s*way/g, "halfway")
    .replace(/\bblocks?\s+[a-z]{0,3}\d{1,4}(\s*[-–&/]\s*[a-z]{0,3}\d{1,4})*/g, " ") // block codes are compared separately
    .split(/[^a-z0-9:åäöéüñ]+/)
    .filter((w) => w && !NOISE.has(w) && !/^\d{1,2}$/.test(w));
}

/** Block codes: "CD4-CD6", "AM3", "F41", "block 141", "002-003", "WL1". */
export function blockCodes(s: string): Set<string> {
  const out = new Set<string>();
  const t = s.toLowerCase();
  for (const m of t.matchAll(/\b([a-z]{1,3})(\d{1,3})\b/g)) {
    if (["cat", "row", "rows", "u", "no"].includes(m[1])) continue;
    out.add(m[1] + m[2]);
  }
  for (const m of t.matchAll(/\b\d{3}\b/g)) out.add(m[0]);
  for (const m of t.matchAll(/\bblocks?\s+(\d{1,3})\b/g)) out.add(`b${Number(m[1])}`);
  return out;
}

/** 0 = different seats; higher = more certainly the same. */
export function pairScore(a: Offer, b: Offer): number {
  const na = nameTokens(meaningfulName(a)), nb = nameTokens(meaningfulName(b));
  const sa = new Set(na), sb = new Set(nb);
  if (sa.size && sa.size === sb.size && [...sa].every((w) => sb.has(w))) return 4; // same name
  const ba = blockCodes(`${a.name} ${a.description.slice(0, 2).join(" ")}`);
  const bb = blockCodes(`${b.name} ${b.description.slice(0, 2).join(" ")}`);
  const sharedBlock = [...ba].some((x) => bb.has(x));
  const sharedWords = [...sa].filter((w) => sb.has(w));
  const distinct = sharedWords.filter((w) => !GENERIC.has(w)).length;
  const [small] = sa.size <= sb.size ? [sa, sb] : [sb, sa];
  const subset = small.size > 0 && sharedWords.length === small.size && [...small].some((w) => !GENERIC.has(w));
  const jaccard = sharedWords.length / Math.max(1, new Set([...sa, ...sb]).size);
  const hospitality = a.tier === "hospitality" || b.tier === "hospitality";
  if (sharedBlock && distinct >= 1) return 3.5;
  if (subset) return 2 + jaccard;
  // Lounges can share a block, so a block alone only pairs plain tickets.
  if (sharedBlock && !hospitality) return 2;
  if (distinct >= 2 && jaccard >= 0.5) return 1 + jaccard;
  return 0;
}

/** Strongest one-to-one TC↔P1 pairs among unlinked offers. */
export function autoPairs(tc: Offer[], p1: Offer[]): [Offer, Offer][] {
  const cands: { a: Offer; b: Offer; s: number }[] = [];
  for (const a of tc) for (const b of p1) {
    const s = pairScore(a, b);
    if (s > 0) cands.push({ a, b, s });
  }
  cands.sort((x, y) => y.s - x.s);
  const usedA = new Set<Offer>(), usedB = new Set<Offer>();
  const out: [Offer, Offer][] = [];
  for (const c of cands) {
    if (usedA.has(c.a) || usedB.has(c.b)) continue;
    usedA.add(c.a);
    usedB.add(c.b);
    out.push([c.a, c.b]);
  }
  return out;
}

export function mergeOffers(offers: Offer[], links: Link[], seats: SeatCategory[]): MergedGroup[] {
  const linkBy = new Map(links.map((l) => [linkKey(l.supplier, l.supplier_category_id), l]));
  const seatBy = new Map(seats.map((s) => [s.id, s]));

  const bySeat = new Map<string, Offer[]>();
  const loose: Offer[] = [];
  for (const o of offers) {
    const l = linkBy.get(linkKey(o.supplier, o.supplier_category_id));
    if (l?.hidden) continue;
    const seatId = l?.seat_category_id && seatBy.has(l.seat_category_id) ? l.seat_category_id : null;
    if (seatId) bySeat.set(seatId, [...(bySeat.get(seatId) ?? []), o]);
    else loose.push(o);
  }

  const out: MergedGroup[] = [];
  for (const [seatId, list] of bySeat) {
    const seat = seatBy.get(seatId)!;
    const winner = pickSupplier(list);
    const mine = list.filter((o) => o.supplier === winner);
    const others = list.filter((o) => o.supplier !== winner);
    const single = mine.length === 1;
    for (const o of mine) {
      const g = toGroup(o, seat, single);
      if (others.length) g.alternatives = others.map((x) => ({ supplier: x.supplier, name: x.name, final_sek: x.final_sek, available: x.available }));
      out.push(g);
    }
  }
  // Unlinked: pair the obvious duplicates automatically, show the rest as is.
  const pairs = autoPairs(loose.filter((o) => o.supplier === "travelconnection"), loose.filter((o) => o.supplier === "p1"));
  const paired = new Set<Offer>();
  for (const [tc, p1] of pairs) {
    paired.add(tc);
    paired.add(p1);
    const winner = pickSupplier([tc, p1]) === "p1" ? p1 : tc;
    const loser = winner === tc ? p1 : tc;
    // The winner's own name/description (it's what gets booked); TC's colour
    // so the row still lights its area on the stadium plan.
    const g = toGroup(winner, null, false);
    g.color = tc.color;
    g.alternatives = [{ supplier: loser.supplier, name: loser.name, final_sek: loser.final_sek, available: loser.available }];
    g.auto_paired = true;
    out.push(g);
  }
  for (const o of loose) if (!paired.has(o)) out.push(toGroup(o, null, false));

  // Match tickets before hospitality; within each, available first, then
  // the admin's order for seat categories, then price.
  const order = (g: MergedGroup) => (g.seat_category_id ? seatBy.get(g.seat_category_id)!.sort_order : 0);
  return out.sort((a, b) =>
    Number(a.tier === "hospitality") - Number(b.tier === "hospitality") ||
    Number(b.available) - Number(a.available) ||
    order(a) - order(b) ||
    price(a) - price(b)
  );
}

/** Our stadium key for an event: venue name, else race name, else home team. */
export function venueKey(e: { venue_name?: string | null; race_name?: string | null; home_team?: string | null }): string | null {
  const k = (e.venue_name || e.race_name || e.home_team || "").trim();
  return k || null;
}
