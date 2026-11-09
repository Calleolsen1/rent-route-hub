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
  for (const o of loose) out.push(toGroup(o, null, false));

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
