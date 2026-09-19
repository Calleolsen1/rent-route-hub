// OneClicket (ESATOUR S.r.l.) API client — Deno.
//
// Kaisen's ticket supplier. Everything is a GET with PHP
// `http_build_query`-style nested params and the key in an `API-KEY` header.
//
// Live API quirks confirmed via curl 2026-09-19 against the production
// account (user_id 3826) — several differ from the v1.6 PDF:
//   - EVERY scalar comes back as a **string**: "id":"61635", "stock":"6",
//     "price_final":"211.00". Always coerce; never trust `typeof`.
//   - `versions` is empty for most products — only ~8% of the 62k catalogue
//     has purchasable stock. Products with `versions: []` are unbuyable and
//     must be skipped, otherwise we'd import 62k dead events.
//   - `extra_data.split_type` is a human **label** ("Avoid Leaving One
//     Ticket"), not the 1-5 integer the PDF documents. Both are normalised.
//   - Products carry EITHER `stadium_id`/`stadium_name` OR
//     `location_id`/`location_name` — never both. Venue resolution must
//     fall back.
//   - `url` and `shippings` exist in responses but are absent from the PDF.
//   - Category filtering is hierarchical: `filters[category][id]=794`
//     (Soccer) also returns children like 986 "Other Football". The flat
//     leaf ids (1006 Premier League, 960 Champions League) are legacy and
//     return 0 products — filter by the parent.
//   - Prices are EUR major units (confirmed against the embedded
//     `tixstock_data.face_value.currency`). Callers convert to SEK.
//   - HTTP is always 200; failure is signalled by `meta.status`/`meta.code`.
//
// Env vars:
//   ONECLICKET_API_KEY    raw key string (contains '+' — do not URL-encode)
//   ONECLICKET_BASE_URL   default https://www.oneclicket.com/api
//   ONECLICKET_USER_ID    numeric account id, required to place orders

const envOptional = (key: string): string | null => {
  const v = Deno.env.get(key);
  return v == null || v === "" ? null : v;
};

/** Parent category ids that actually carry inventory for Kaisen's sports. */
export const OC_CATEGORY_SOCCER = 794;
export const OC_CATEGORY_FORMULA1 = 805;

/** Shipping ids per the v1.6 docs, p.44. 1 and 2 are free of charge. */
export const OC_SHIPPING = {
  1: { label: "E-ticket", fee_eur: 0 },
  2: { label: "Pick-up at the venue city", fee_eur: 0 },
  3: { label: "Delivery to your hotel at the venue city", fee_eur: 15 },
  4: { label: "Delivery to your address", fee_eur: 15 },
  5: { label: "Delivery to your hotel at the venue city", fee_eur: 20 },
  6: { label: "Delivery to your hotel at the venue city", fee_eur: 25 },
} as const;

export class OneClicketError extends Error {
  constructor(
    message: string,
    public code: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "OneClicketError";
  }
}

/** meta.code values documented on p.52 of the v1.6 spec. */
const CODE_MEANING: Record<number, string> = {
  100: "ok",
  200: "warning in the parameters passed",
  300: "required parameters not passed",
  301: "parameters passed are incorrect or badly formatted",
  302: "element with the passed id was not found",
  400: "the api key passed is not valid",
  401: "permission denied for this call",
  402: "call to a non-existent function",
};

// --- coercion helpers -------------------------------------------------------
// The API stringifies everything, including nulls-as-empty-strings.

export const ocNum = (v: unknown, fallback = 0): number => {
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const ocInt = (v: unknown, fallback = 0): number =>
  Math.trunc(ocNum(v, fallback));

export const ocBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1";

export const ocStr = (v: unknown): string | null => {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

// --- types ------------------------------------------------------------------

export interface OcMeta {
  status: "success" | "warning" | "error";
  code: number | string;
  messages?: string[];
}

export interface OcPagination {
  total_items: number | string;
  total_pages: number | string;
  current_page: number | string;
  limit: number | string;
}

export interface OcEnvelope<T> {
  meta: OcMeta;
  data?: T;
  pagination?: OcPagination;
}

export interface OcTeam {
  team_id: string;
  team_name: string;
  [k: string]: unknown;
}

export interface OcVersion {
  id: string;
  published: string;
  buy_multipler: string;
  price: string;
  price_vat: string;
  price_final: string;
  price_discount: string;
  stock: string;
  stock_always_available: string;
  version_name: string;
  version_color?: string;
  version_image_src?: string;
  shippings?: string[];
  /** JSON *string* of the upstream Tixstock listing — seat details, face value. */
  tixstock_data?: string;
  extra_data?: {
    split_type?: string | number;
    split_quantity?: string | number;
    display_quantity?: string | number;
  };
  [k: string]: unknown;
}

export interface OcProduct {
  id: string;
  code: string;
  date: string;
  name: string;
  description?: string | null;
  published: string;
  need_ticketing: string;
  price_from?: number | string | null;
  category_id: string;
  category_name: string;
  city_id?: string;
  city_name?: string;
  stadium_id?: string;
  stadium_name?: string;
  location_id?: string;
  location_name?: string;
  has_image?: string;
  image_src?: string;
  url?: string;
  teams?: OcTeam[];
  versions?: OcVersion[];
  [k: string]: unknown;
}

export interface OcCategory {
  id: string;
  name: string;
  published: string;
  [k: string]: unknown;
}

/** Normalised split rules — how many tickets a buyer may take from a version. */
export type SplitType =
  | "any"
  | "all_together"
  | "avoid_leaving_one"
  | "multiples"
  | "singles";

const SPLIT_BY_LABEL: Record<string, SplitType> = {
  "no preferences": "any",
  "no preference": "any",
  "all together": "all_together",
  "avoid leaving one ticket": "avoid_leaving_one",
  "avoid leaving one": "avoid_leaving_one",
  "sell in multiples": "multiples",
  "single tickets": "singles",
};

const SPLIT_BY_NUMBER: Record<number, SplitType> = {
  1: "any",
  2: "all_together",
  3: "avoid_leaving_one",
  4: "multiples",
  5: "singles",
};

export function normaliseSplitType(raw: unknown): SplitType {
  if (raw == null || raw === "") return "any";
  const n = Number(raw);
  if (Number.isFinite(n) && SPLIT_BY_NUMBER[n]) return SPLIT_BY_NUMBER[n];
  return SPLIT_BY_LABEL[String(raw).trim().toLowerCase()] ?? "any";
}

/**
 * Quantities a buyer is actually allowed to purchase from a version.
 *
 * Combines `buy_multipler`, `extra_data.split_type`/`split_quantity` and
 * `display_quantity`. Returning the explicit list (rather than a min/max) is
 * what lets the UI render a quantity picker that can't produce a rejected
 * order — `avoid_leaving_one` in particular has a hole in the middle.
 */
export function allowedQuantities(v: OcVersion): number[] {
  const stock = ocInt(v.stock);
  if (stock <= 0) return [];

  const multiplier = Math.max(1, ocInt(v.buy_multipler, 1));
  const split = normaliseSplitType(v.extra_data?.split_type);
  const splitQty = Math.max(0, ocInt(v.extra_data?.split_quantity));
  const displayQty = Math.max(0, ocInt(v.extra_data?.display_quantity));

  // display_quantity, when set, is a hard ceiling we must respect (p.9).
  const ceiling = displayQty > 0 ? Math.min(stock, displayQty) : stock;

  if (split === "all_together") return ceiling >= stock ? [stock] : [];

  const step = split === "multiples" && splitQty > 0
    ? Math.max(multiplier, splitQty)
    : multiplier;

  const out: number[] = [];
  for (let q = step; q <= ceiling; q += step) {
    // "any quantity except n-1, where n is the available quantity"
    if (split === "avoid_leaving_one" && q === stock - 1) continue;
    out.push(q);
  }
  return out;
}

/** Seat/delivery detail the supplier embeds as a JSON string. */
export interface TixstockData {
  seat_details?: {
    category?: string;
    section?: string;
    row?: string;
    first_seat?: string;
  };
  face_value?: { currency?: string; amount?: string };
  ticket?: { type?: string; general_admission?: string };
  delivery?: { type?: string; in_hand?: boolean };
  [k: string]: unknown;
}

export function parseTixstock(v: OcVersion): TixstockData | null {
  if (!v.tixstock_data) return null;
  try {
    return JSON.parse(v.tixstock_data) as TixstockData;
  } catch {
    return null;
  }
}

/**
 * Human-readable seating name for a version.
 *
 * Raw `version_name` is `"'<product name>' - tweede-ring-lange-zijde"` — the
 * product title is repeated inside quotes and the useful part is a slug.
 * Strip the prefix and de-slugify.
 */
export function versionDisplayName(v: OcVersion): string {
  const raw = (v.version_name ?? "").trim();
  const stripped = raw.replace(/^'[^']*'\s*-\s*/, "").trim() || raw;
  if (!stripped) return "Ticket";
  return stripped
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// --- query building ---------------------------------------------------------

/**
 * PHP `http_build_query` equivalent — the API expects `filters[product][id]=1`
 * and `filters[product][id][0]=1&filters[product][id][1]=2` for lists.
 */
export type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | QueryValue[]
  | { [k: string]: QueryValue };

export function buildPhpQuery(params: Record<string, QueryValue>): string {
  const parts: string[] = [];

  const walk = (prefix: string, value: QueryValue): void => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(`${prefix}[${i}]`, v));
      return;
    }
    if (typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(`${prefix}[${k}]`, v);
      return;
    }
    parts.push(`${encodeURIComponent(prefix)}=${encodeURIComponent(String(value))}`);
  };

  for (const [k, v] of Object.entries(params)) walk(k, v);
  return parts.length ? `?${parts.join("&")}` : "";
}

// --- client -----------------------------------------------------------------

export interface OneClicketConfig {
  baseUrl: string;
  apiKey: string;
  userId: string | null;
}

export function loadOneClicketConfig(): OneClicketConfig | null {
  const apiKey = envOptional("ONECLICKET_API_KEY");
  if (!apiKey) return null;
  return {
    baseUrl: (envOptional("ONECLICKET_BASE_URL") ?? "https://www.oneclicket.com/api")
      .replace(/\/+$/, ""),
    apiKey,
    userId: envOptional("ONECLICKET_USER_ID"),
  };
}

/**
 * The supplier enforces 10 calls/second (v1.6 p.4) and returns no
 * Retry-After — exceeding it just fails. A process-wide spacer is simpler and
 * safer than a token bucket here: sync is the only high-volume caller and it
 * is not latency-sensitive.
 */
const MIN_INTERVAL_MS = 120; // ~8 rps, a deliberate margin under the cap
let lastCallAt = 0;

async function throttle(): Promise<void> {
  const wait = lastCallAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

export class OneClicketClient {
  private cfg: OneClicketConfig;

  constructor(cfg?: OneClicketConfig | null) {
    const resolved = cfg === undefined ? loadOneClicketConfig() : cfg;
    if (!resolved) {
      throw new OneClicketError("ONECLICKET_API_KEY is not configured", 400);
    }
    this.cfg = resolved;
  }

  get userId(): string | null {
    return this.cfg.userId;
  }

  /**
   * All endpoints are GET + query params and always answer HTTP 200 — success
   * is decided by `meta.status`. `warning` is surfaced to the caller rather
   * than thrown: reads still carry usable data alongside it.
   */
  async call<T>(
    request: string,
    params: Record<string, QueryValue> = {},
  ): Promise<OcEnvelope<T>> {
    await throttle();

    const url = `${this.cfg.baseUrl}/${request}${buildPhpQuery(params)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "API-KEY": this.cfg.apiKey,
      },
    });

    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      throw new OneClicketError(
        `oneclicket ${request}: non-JSON response (HTTP ${res.status})`,
        res.status,
        text.slice(0, 500),
      );
    }

    if (!res.ok) {
      throw new OneClicketError(
        `oneclicket ${request}: HTTP ${res.status}`,
        res.status,
        body,
      );
    }

    const env = body as OcEnvelope<T>;
    const code = ocInt(env?.meta?.code, 0);
    const status = env?.meta?.status;

    if (status === "error" || (code !== 0 && code !== 100)) {
      const detail = env?.meta?.messages?.join("; ") ||
        CODE_MEANING[code] || "unknown error";
      throw new OneClicketError(
        `oneclicket ${request} failed (${code}): ${detail}`,
        code,
        body,
      );
    }

    if (status === "warning") {
      console.warn(
        `[oneclicket] ${request} warning:`,
        env?.meta?.messages?.join("; ") ?? CODE_MEANING[code],
      );
    }

    return env;
  }

  /** Single page of products. `limit` is capped at 100 by the supplier. */
  async getProducts(params: {
    categoryId?: number | number[];
    productIds?: (string | number)[];
    dateFrom?: string;
    dateTo?: string;
    publishedOnly?: boolean;
    limit?: number;
    page?: number;
  } = {}): Promise<{ products: OcProduct[]; totalPages: number; totalItems: number }> {
    const filters: Record<string, QueryValue> = {};

    const product: Record<string, QueryValue> = {};
    if (params.publishedOnly !== false) product.published = 1;
    if (params.productIds?.length) {
      product.id = params.productIds.length === 1
        ? String(params.productIds[0])
        : params.productIds.map(String);
    }
    if (params.dateFrom) product.date_from = params.dateFrom;
    if (params.dateTo) product.date_to = params.dateTo;
    if (Object.keys(product).length) filters.product = product;

    if (params.categoryId != null) {
      filters.category = {
        id: Array.isArray(params.categoryId)
          ? params.categoryId.map(String)
          : String(params.categoryId),
      };
    }

    const env = await this.call<OcProduct[]>("getProducts", {
      iso: "en",
      filters: Object.keys(filters).length ? filters : undefined,
      sort: { field: "date", type: "asc" },
      limit: params.limit ?? 100,
      page: params.page ?? 1,
    });

    return {
      products: env.data ?? [],
      totalPages: ocInt(env.pagination?.total_pages, 1),
      totalItems: ocInt(env.pagination?.total_items, 0),
    };
  }

  /**
   * Walks every page for a category, keeping only products that have at least
   * one published, in-stock version. `maxPages` bounds the crawl so a sync can
   * never run away against the 62k-row catalogue — but it must exceed the
   * real page count of the category being crawled (soccer is ~50 pages), or
   * later fixtures are silently dropped.
   */
  async getBuyableProducts(params: {
    categoryId: number;
    dateFrom?: string;
    maxPages?: number;
  }): Promise<{ products: OcProduct[]; pagesRead: number; totalItems: number }> {
    const out: OcProduct[] = [];
    const maxPages = params.maxPages ?? 80;
    let page = 1;
    let totalPages = 1;
    let totalItems = 0;

    do {
      const res = await this.getProducts({
        categoryId: params.categoryId,
        dateFrom: params.dateFrom,
        limit: 100,
        page,
      });
      totalPages = res.totalPages;
      totalItems = res.totalItems;

      for (const p of res.products) {
        const live = (p.versions ?? []).filter(
          (v) => ocBool(v.published) && ocInt(v.stock) > 0,
        );
        if (live.length) out.push({ ...p, versions: live });
      }
      page += 1;
    } while (page <= Math.min(totalPages, maxPages));

    return { products: out, pagesRead: page - 1, totalItems };
  }

  async getProductById(id: string | number): Promise<OcProduct | null> {
    const { products } = await this.getProducts({
      productIds: [id],
      publishedOnly: false,
      limit: 1,
    });
    return products[0] ?? null;
  }

  async getCategories(): Promise<OcCategory[]> {
    const env = await this.call<OcCategory[]>("getCategories", {
      iso: "en",
      limit: 300,
      page: 1,
    });
    return env.data ?? [];
  }

  async getOrders(params: { id?: number | string; limit?: number; page?: number } = {}) {
    const env = await this.call<unknown[]>("getOrders", {
      filters: params.id != null ? { order: { id: String(params.id) } } : undefined,
      sort: { field: "id", type: "desc" },
      limit: params.limit ?? 20,
      page: params.page ?? 1,
    });
    return env.data ?? [];
  }

  /**
   * Place an order. `insOrders` writes to the supplier's **live** system —
   * there is no sandbox. Callers must gate this behind an explicit opt-in.
   */
  async insertOrder(products: OcOrderLine[]): Promise<OcEnvelope<unknown>> {
    if (!products.length) throw new OneClicketError("no order lines", 300);
    return await this.call<unknown>("insOrders", {
      insert: { order: { products } },
    });
  }

  /** Decrease a version's stock — must be a multiple of `buy_multipler`. */
  async decreaseStock(versionId: string | number, stock: number) {
    return await this.call<unknown>("decreaseProductsStock", {
      product: { version_id: String(versionId) },
      update: { stock },
    });
  }
}

export interface OcOrderTicketHolder {
  first_name: string;
  last_name: string;
  birth_date: string; // d/m/Y
  nationality_iso?: string;
  nationality?: number;
  address?: string;
  fan_card_first?: string;
  fan_card_second?: string;
}

export interface OcOrderLine {
  version_id: string | number;
  qty: number;
  tickets?: OcOrderTicketHolder[];
}

// --- event mapping ----------------------------------------------------------

/**
 * Strip the boilerplate the supplier appends to national/club sides so a name
 * can be located inside the product title.
 * "Germany National Soccer Team" -> "Germany"
 */
function bareTeamName(name: string): string {
  return name
    .replace(/\s+National\s+(Soccer|Football)\s+Team$/i, "")
    .replace(/\s+(FC|CF|AFC)$/i, "")
    .trim();
}

/** Lowercase + strip diacritics so "Fenerbahçe" matches "Fenerbahce". */
function foldName(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

/** Words that carry no identifying signal when matching a club to a title. */
const CLUB_NOISE = new Set([
  "fc", "cf", "afc", "sk", "sc", "ac", "as", "ss", "us", "club", "de", "the",
]);

/**
 * Locate a team inside a product title, tolerating the supplier's inconsistent
 * naming ("Inter" in the title vs "Inter Milan" in the teams array).
 * Returns the character index, or -1.
 */
function locateTeam(foldedTitle: string, team: string): number {
  const folded = foldName(team);
  if (!folded) return -1;

  const direct = foldedTitle.indexOf(folded);
  if (direct !== -1) return direct;

  // Try progressively shorter prefixes: "inter milan" -> "inter".
  const words = folded.split(/\s+/).filter(Boolean);
  for (let n = words.length - 1; n >= 1; n--) {
    const prefix = words.slice(0, n).join(" ");
    if (prefix.length < 3) break;
    const i = foldedTitle.indexOf(prefix);
    if (i !== -1) return i;
  }

  // Last resort: the longest distinctive single word ("bratislava").
  const distinctive = words
    .filter((w) => w.length >= 4 && !CLUB_NOISE.has(w))
    .sort((a, b) => b.length - a.length);
  for (const w of distinctive) {
    const i = foldedTitle.indexOf(w);
    if (i !== -1) return i;
  }
  return -1;
}

/** Split a title on the separators the supplier uses between the two sides. */
function titleSides(name: string): { home: string; away: string } | null {
  const parts = (name ?? "")
    .split(/\s+[-\u2013\u2014.]\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  // The away side may trail a competition: "Belgium, Nations League".
  const away = parts[1].split(",")[0].trim();
  if (!parts[0] || !away) return null;
  return { home: parts[0], away };
}

/**
 * Resolve home/away for a soccer product.
 *
 * The `teams` array is NOT in fixture order — confirmed live: "Netherlands -
 * Germany" returns `[Germany, Netherlands]`, and "Italy - Belgium" returns
 * `[Belgium, Italy]`. Ordering by first appearance in the product title is
 * what recovers the real fixture. This matters beyond cosmetics: the site's
 * static TEAMS slug map has to exact-match `home_team`, so a flipped pair
 * silently drops the event out of its team page.
 *
 * Supplier data is not clean, and each of these is a real row seen live:
 *   - duplicated entries ([Norway, Portugal, Portugal, Norway]) — deduped,
 *     otherwise both sides resolve to the same club
 *   - a team that isn't in the fixture at all ("Italy - Turkey" carrying
 *     [Germany, Italy]) — only teams actually found in the title are trusted
 *   - title/array name drift ("Inter" vs "Inter Milan") — matched on prefixes
 * When the array can't produce two distinct, locatable sides we fall back to
 * splitting the title, and only then to raw array order.
 */
export function splitTeams(p: OcProduct): { home: string | null; away: string | null } {
  const foldedTitle = foldName(p.name ?? "");

  // Dedupe — the supplier repeats entries on some rows.
  const seen = new Set<string>();
  const teams: string[] = [];
  for (const t of p.teams ?? []) {
    const bare = bareTeamName(t.team_name ?? "");
    const key = foldName(bare);
    if (!bare || seen.has(key)) continue;
    seen.add(key);
    teams.push(bare);
  }

  const located = teams
    .map((t) => ({ t, i: locateTeam(foldedTitle, t) }))
    .filter((x) => x.i !== -1)
    .sort((a, b) => a.i - b.i);

  // Two distinct sides found in the title — the only fully trustworthy case.
  if (located.length >= 2 && located[0].i !== located[1].i) {
    return { home: located[0].t, away: located[1].t };
  }

  const sides = titleSides(p.name ?? "");

  // Exactly one side matched: trust it, and take the other from the title so
  // a bogus array entry can't become the opponent.
  if (located.length === 1 && sides) {
    const anchor = located[0];
    const homeIsAnchor = locateTeam(foldName(sides.home), anchor.t) !== -1 ||
      anchor.i <= foldName(sides.home).length;
    return homeIsAnchor
      ? { home: anchor.t, away: sides.away }
      : { home: sides.home, away: anchor.t };
  }

  if (sides) return { home: sides.home, away: sides.away };

  // Neither the title nor the array is trustworthy here — e.g. "Bristol City
  // Sheffield United 17-10-2026" arrives with [Blackburn Rovers, Sheffield
  // United]. Returning raw array order would publish a confidently wrong
  // fixture, so surface what was actually verified and let the caller skip.
  if (located.length === 1) return { home: located[0].t, away: null };
  return { home: null, away: null };
}

/** Best-effort competition name; falls back to the supplier's category. */
export function tournamentName(p: OcProduct): string {
  const parts = (p.name ?? "").split(/\s+-\s+/).map((s) => s.trim());
  if (parts.length >= 3) {
    const tail = parts.slice(2).join(" - ");
    if (tail) return tail;
  }
  // "Italy - Belgium, Nations League" — competition after the comma.
  const comma = (p.name ?? "").split(",");
  if (comma.length >= 2 && comma[1].trim()) return comma[1].trim();
  return p.category_name || "Other";
}

/** Venue name, handling the stadium/location either-or. */
export function venueName(p: OcProduct): string | null {
  return ocStr(p.stadium_name) ?? ocStr(p.location_name);
}

/**
 * Namespaced external id.
 *
 * `events.external_event_id` carries a GLOBAL unique constraint (not scoped by
 * source), so a bare numeric OneClicket product id could collide with a
 * manually-created event's id. Prefixing keeps them apart.
 */
export const ocExternalEventId = (productId: string | number): string =>
  `oc_${productId}`;

export const ocExternalVersionId = (versionId: string | number): string =>
  `ocv_${versionId}`;

/** Cheapest published, in-stock version price in EUR (major units). */
export function minVersionPriceEur(p: OcProduct): number | null {
  const prices = (p.versions ?? [])
    .filter((v) => ocBool(v.published) && ocInt(v.stock) > 0)
    .map((v) => ocNum(v.price_final))
    .filter((n) => n > 0);
  return prices.length ? Math.min(...prices) : null;
}

// --- canonical naming ------------------------------------------------------
//
// The supplier labels the same club several different ways across products —
// confirmed live on 2026-09-19: "Inter" and "Inter Milan", "Roma" and "AS
// Roma", "Milan" and "AC Milan", "Atlético de Madrid", "Bayern Munich" and
// "FC Bayern Munich". The site's team pages query
// `home_team.eq.<nav entry name>` — exact equality — so every unmapped
// variant silently hides fixtures from the page that should sell them. That
// was 24 sellable fixtures at the time of writing, with Atlético Madrid and
// Bayern München showing an empty page despite having stock.
//
// Canonicalising at sync time (rather than aliasing at query time) means the
// event headline, search and listings all agree too.
//
// KEY = the canonical name, which MUST equal the `name` of the matching row in
// `nav_menu_entries`. VALUES = supplier spellings, matched case- and
// accent-insensitively. Add a line here when a new variant shows up; the sync
// logs unmapped names that look close to a nav entry.

const TEAM_ALIASES: Record<string, readonly string[]> = {
  "Inter": ["Inter Milan", "FC Internazionale", "Internazionale"],
  "Milan": ["AC Milan", "A.C. Milan"],
  "Roma": ["AS Roma", "A.S. Roma"],
  "Atlético Madrid": ["Atlético de Madrid", "Atletico de Madrid", "Atletico Madrid", "Club Atlético de Madrid"],
  "Bayern München": ["Bayern Munich", "FC Bayern Munich", "FC Bayern München", "Bayern Muenchen"],
  "Manchester United": ["Man United", "Man Utd", "Manchester Utd"],
  "Manchester City": ["Man City"],
  "Tottenham Hotspur": ["Tottenham", "Spurs", "Tottenham Hotspurs"],
  "FC Barcelona": ["Barcelona", "Barça", "Barca"],
  "Real Madrid": ["Real Madrid CF"],
  "Juventus": ["Juventus FC", "Juventus Turin"],
  "Borussia Dortmund": ["BVB", "Borussia Dortmund BVB"],
  "Liverpool": ["Liverpool FC"],
  "Arsenal": ["Arsenal FC"],
  "Chelsea": ["Chelsea FC"],
};

// Reverse index, folded — built once.
const TEAM_CANONICAL_BY_VARIANT: Map<string, string> = (() => {
  const m = new Map<string, string>();
  for (const [canonical, variants] of Object.entries(TEAM_ALIASES)) {
    m.set(foldName(canonical), canonical);
    for (const v of variants) m.set(foldName(v), canonical);
  }
  return m;
})();

/** Map a supplier team label onto the site's canonical name, if known. */
export function canonicalTeamName(raw: string | null): string | null {
  if (!raw) return null;
  return TEAM_CANONICAL_BY_VARIANT.get(foldName(raw)) ?? raw;
}

/**
 * F1 race names, supplier English -> the site's Swedish nav entry name.
 *
 * Race pages query `race_name.eq.<nav entry name>` and the nav entries are
 * Swedish ("Monacos Grand Prix"), while the supplier ships
 * "Formula 1 Monaco Grand Prix 2026 Round 8 - 3 Day Pass". Without both the
 * parse and this map, every F1 landing page matches zero events.
 */
const RACE_ALIASES: Record<string, string> = {
  "monaco grand prix": "Monacos Grand Prix",
  "united states grand prix": "USA:s Grand Prix",
  "us grand prix": "USA:s Grand Prix",
  "spanish grand prix": "Spaniens Grand Prix",
  "spain grand prix": "Spaniens Grand Prix",
  "italian grand prix": "Italiens Grand Prix",
  "italy grand prix": "Italiens Grand Prix",
  "hungarian grand prix": "Ungerns Grand Prix",
  "hungary grand prix": "Ungerns Grand Prix",
  "qatar grand prix": "Qatars Grand Prix",
  "portuguese grand prix": "Algarves Grand Prix",
  "portugal grand prix": "Algarves Grand Prix",
  "algarve grand prix": "Algarves Grand Prix",
  "abu dhabi grand prix": "Abu Dhabi Grand Prix",
  "las vegas grand prix": "Las Vegas Grand Prix",
  "miami grand prix": "Miami Grand Prix",
};

/**
 * Strip the supplier's decoration off an F1 product name.
 * "Formula 1 Qatar Grand Prix 2026 Round 22 - 3 Day Pass" -> "Qatars Grand Prix"
 * Unmapped races keep their parsed English name so they still list correctly.
 */
export function canonicalRaceName(productName: string): string {
  const parsed = (productName ?? "")
    .replace(/^\s*formula\s*1\s*/i, "")
    .replace(/\s*\d{4}\b.*$/, "")        // drop "2026 Round 22 - 3 Day Pass"
    .replace(/\s*-\s*\d+[\s-]?day\s+pass\s*$/i, "")
    .replace(/\s*-\s*(friday|saturday|sunday|thursday)\s*$/i, "")
    .trim();
  if (!parsed) return productName;
  return RACE_ALIASES[parsed.toLowerCase()] ?? parsed;
}

/** Number of days a multi-day pass covers, or null for a single-day product. */
export function passDayCount(productName: string): number | null {
  const m = /(\d+)[\s-]?day\s+pass/i.exec(productName ?? "");
  return m ? Number(m[1]) : null;
}

/**
 * Reduce a set of F1 products to ONE per Grand Prix — the weekend pass.
 *
 * The supplier lists each GP up to seven times: 2-, 3- and 4-day passes plus
 * individual Friday/Saturday/Sunday tickets, and occasionally the same pass
 * twice with and without the "Round N" suffix. Kaisen sells the weekend, so
 * single days are dropped and the 3-day pass wins; where a GP has no 3-day
 * pass the longest available one is used rather than dropping the race.
 */
export function pickWeekendPasses(products: readonly OcProduct[]): OcProduct[] {
  const byRace = new Map<string, { product: OcProduct; days: number }>();
  for (const p of products) {
    const days = passDayCount(p.name ?? "");
    if (days == null) continue; // single-day ticket
    const race = canonicalRaceName(p.name ?? "");
    const current = byRace.get(race);
    if (!current) { byRace.set(race, { product: p, days }); continue; }
    // Prefer exactly 3 days; otherwise keep the longest pass.
    const better = days === 3 && current.days !== 3
      ? true
      : current.days === 3
        ? false
        : days > current.days;
    if (better) byRace.set(race, { product: p, days });
  }
  return [...byRace.values()].map((v) => v.product);
}
