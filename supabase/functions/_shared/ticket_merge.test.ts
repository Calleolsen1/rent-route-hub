// Run: deno test supabase/functions/_shared/ticket_merge.test.ts
// Cases are real category pairs seen on live fixtures (Nov 2026).
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { autoPairs, mergeOffers, pairScore, pickSupplier, type Offer } from "./ticket_merge.ts";

const o = (supplier: Offer["supplier"], name: string, description: string[] = [], extra: Partial<Offer> = {}): Offer => ({
  supplier, supplier_category_id: name, category_id: `${supplier}:${name}`, name, description,
  color: supplier === "travelconnection" ? "#fff" : null, image_url: null, tier: "match",
  available: true, max_qty: 4, final_sek: 1000, request_only: supplier === "p1", ...extra,
});
const tc = (n: string, d: string[] = [], x: Partial<Offer> = {}) => o("travelconnection", n, d, x);
const p1 = (n: string, d: string[] = [], x: Partial<Offer> = {}) => o("p1", n, d, x);
const H = { tier: "hospitality" as const };

Deno.test("same seats pair", () => {
  for (const [a, b] of [
    [tc("Shortside", ["Short side : Short side ring 1 or 2"]), p1("Shortside", ["Up to 2 together, e-tickets"])],
    [tc("Longside"), p1("Longside Lower")],
    [tc("Club Deck Plus", ["Club Deck Official Match Tickets, Long Side Seats – Blocks CD4-CD6"]), p1("Club Deck seats", ["Club Deck seats in block CD2 or CD6 at Ibrox."])],
    [tc("93:20 Lounge ticket", [], H), p1("93:20 Lounge", [], H)],
    [tc("Kategori 1", ["Longside Monte Mario"]), p1("Tribuna Monte Mario")],
    [tc("Blues Dining Match Day Hospitality", ["Blues Dining West Stand - Block WL1"], H), p1("Blues Dining Hospitality", ["West Stand Lower tier seats in block WL1 or WL2."], H)],
    [tc("Long side ticket"), p1("Longside Block 305-306")],
  ] as [Offer, Offer][]) assert(pairScore(a, b) > 0, `${a.name} <-> ${b.name}`);
});

Deno.test("different products don't pair", () => {
  for (const [a, b] of [
    [tc("Rose & Ball Matchday Hospitality - WEST LOWER seats", ["West Lower- Blocks WL1, WL2, WL7 , WL8"], H), p1("Blues Dining Hospitality", ["block WL1 or WL2"], H)],
    [tc("Green Room Premium – Shared Dining Tables", [], H), p1("Heart of the City Premium", [], H)],
    [tc("Premium", [], H), p1("Bernabeu Market Premium - Block 127", [], H)],
    [tc("Club 67 Lounge", ["Club 67 Lounge - Padded Seats - Block 141 or similar"], H), p1("Corner Seating", ["Corner seating, located in blocks 118-119."])],
    [tc("Kits Sports Bar", ["City Kits Sports Bar - Padded Seats"], H), p1("City Hall Lounge", [], H)],
  ] as [Offer, Offer][]) assertEquals(pairScore(a, b), 0, `${a.name} <-> ${b.name}`);
});

Deno.test("pairing is one-to-one, exact name wins", () => {
  const blues = tc("Blues Dining Match Day Hospitality", [], H);
  const rose = tc("Rose & Ball Matchday Hospitality", ["Blocks WL1, WL2"], H);
  const p = p1("Blues Dining Hospitality", ["block WL1 or WL2"], H);
  const pairs = autoPairs([rose, blues], [p]);
  assertEquals(pairs.length, 1);
  assertEquals(pairs[0][0], blues);
});

Deno.test("auto pair shows one row, cheaper wins, TC colour kept", () => {
  const m = mergeOffers([tc("Longside", [], { final_sek: 2000 }), p1("Longside Lower", [], { final_sek: 1500 }), p1("Corner")], [], []);
  assertEquals(m.length, 2);
  const row = m.find((g) => g.auto_paired)!;
  assertEquals(row.supplier, "p1");
  assertEquals(row.color, "#fff");
  assertEquals(row.alternatives?.length, 1);
});

Deno.test("admin links override auto pairing; hidden dropped", () => {
  const seats = [{ id: "S", name: "Långsida", description: [], tier: "match" as const, color: null, sort_order: 0 }];
  const links = [
    { supplier: "travelconnection" as const, supplier_category_id: "Longside", seat_category_id: "S", hidden: false },
    { supplier: "p1" as const, supplier_category_id: "Longside Lower", seat_category_id: null, hidden: true },
  ];
  const m = mergeOffers([tc("Longside"), p1("Longside Lower")], links, seats);
  assertEquals(m.map((g) => g.name), ["Långsida"]);
});

Deno.test("supplier choice", () => {
  assertEquals(pickSupplier([tc("a", [], { final_sek: 4000 }), p1("a", [], { final_sek: 4000 })]), "travelconnection");
  assertEquals(pickSupplier([tc("a", [], { final_sek: 3000, available: false }), p1("a", [], { final_sek: 4000 })]), "p1");
});
