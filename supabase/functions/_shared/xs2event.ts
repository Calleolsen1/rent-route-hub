// xs2event API client (Deno).
//
// Live API quirks confirmed via curl 2026-06-09:
//   - Auth: header X-Api-Key with the raw key (NOT Authorization: Bearer)
//   - List responses wrap data under the resource name, e.g.
//     `{ "tickets": [...], "pagination": {...} }`, not `{ "data": [...] }`
//   - Tickets return `currency_code: "EUR"` and `net_rate` in **cents**
//     (e.g. 60000 = 600 EUR). Callers must convert + apply EUR→SEK rate
//     for Swedish display.
//   - `&stock:gt:0` filter rejected as "Extra inputs"; use ticket_status=available
//
// Env vars:
//   XS2_BASE_URL      sandbox: https://testapi.xs2event.com
//   XS2_API_KEY       raw key string
//   XS2_AUTH_HEADER   default "X-Api-Key"
//   XS2_AUTH_SCHEME   default "" (empty — xs2 wants the bare key value)
//
// All types use index signatures for forward-compatibility — xs2event adds
// fields over time and we don't want strict typing to break on unknown keys.

const env = (key: string, fallback?: string): string => {
  const v = Deno.env.get(key);
  if (v == null || v === "") {
    if (fallback != null) return fallback;
    throw new Error(`${key} is not configured`);
  }
  return v;
};

const envOptional = (key: string): string | null => {
  const v = Deno.env.get(key);
  return v == null || v === "" ? null : v;
};

export class Xs2Error extends Error {
  constructor(message: string, public status: number, public body?: unknown) {
    super(message);
    this.name = "Xs2Error";
  }
}

export interface Xs2Sport { sport_id: string; [k: string]: unknown }

export interface Xs2Tournament {
  tournament_id: string;
  official_name: string;
  sport_type: string;
  date_start?: string;
  date_stop?: string;
  number_events?: number;
  [k: string]: unknown;
}

export interface Xs2Event {
  event_id: string;
  event_name?: string;
  slug?: string;
  tournament_id?: string;
  tournament_name?: string;
  sport_type: string;
  hometeam_id?: string;
  hometeam_name?: string;
  visiting_id?: string;
  visiting_name?: string;
  venue_id?: string;
  venue_name?: string;
  city?: string;
  iso_country?: string;
  event_status?: string;
  date_start: string;
  date_stop?: string;
  [k: string]: unknown;
}

export interface Xs2Venue {
  venue_id: string;
  name: string;
  city?: string;
  country?: string;
  address?: string;
  postal_code?: string;
  [k: string]: unknown;
}

export interface Xs2Category {
  category_id: string;
  category_name: string;
  /**
   * Localized — keyed by IETF tag e.g. `en_GB`, `de_DE`, `nl_NL`. Use
   * `pickLocalized(description)` to extract a usable string.
   */
  description?: Record<string, string> | string;
  party_size_together: number;
  category_type?: string;
  [k: string]: unknown;
}

export interface Xs2Ticket {
  ticket_id: string;
  event_id: string;
  category_id: string;
  sub_category: string;
  ticket_status: string;
  stock: number;
  net_rate: number;
  currency_code: string;
  ticket_validity?: string;
  ticket_targetgroup?: string;
  [k: string]: unknown;
}

export interface Xs2Reservation {
  reservation_id: string;
  expires_at: string;
  tickets?: Xs2Ticket[];
  [k: string]: unknown;
}

export interface Xs2Booking {
  booking_id: string;
  status: string;
  invoice_reference?: string;
  [k: string]: unknown;
}

export interface Xs2Config {
  baseUrl: string;
  apiKey: string;
  authHeader: string;
  authScheme: string;
}

/**
 * Returns config if XS2_API_KEY is set, otherwise null. A null config triggers
 * the Xs2Client's mock mode — it returns fixture data instead of calling the
 * real API. This lets the whole booking flow run end-to-end against the seeded
 * demo events before xs2event credentials arrive.
 *
 * Production guard: when DEPLOY_ENV=production (or STRIPE_ENV=live as a
 * fallback signal) AND XS2_MOCK_ALLOW is not "true", throws instead of
 * returning null. This stops the silent fallback that would otherwise let
 * real customers transact against the evt_demo_* fixtures if the live
 * XS2_API_KEY secret is missing or misnamed.
 */
export function loadConfig(): Xs2Config | null {
  const apiKey = envOptional("XS2_API_KEY");
  if (!apiKey) {
    const isProd =
      envOptional("DEPLOY_ENV") === "production" ||
      envOptional("STRIPE_ENV") === "live";
    const mockAllowed = envOptional("XS2_MOCK_ALLOW") === "true";
    if (isProd && !mockAllowed) {
      throw new Xs2Error(
        "xs2event mock mode is disabled in production — set XS2_API_KEY or XS2_MOCK_ALLOW=true",
        500,
      );
    }
    return null;
  }
  return {
    baseUrl: env("XS2_BASE_URL").replace(/\/+$/, ""),
    apiKey,
    authHeader: env("XS2_AUTH_HEADER", "X-Api-Key"),
    authScheme: env("XS2_AUTH_SCHEME", ""),
  };
}

/** Today's date in ISO YYYY-MM-DD — for date_stop=ge:<today> filters. */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Build xs2event `in:[a,b,c]` filter syntax. */
export function inFilter(values: readonly string[]): string {
  return `in:[${values.join(",")}]`;
}

type QueryValue = string | number | boolean | undefined;

function buildQuery(params: Record<string, QueryValue>): string {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  }
  return parts.length ? `?${parts.join("&")}` : "";
}

export class Xs2Client {
  private cfg: Xs2Config | null;
  readonly mock: boolean;

  constructor(cfg?: Xs2Config | null) {
    this.cfg = cfg === undefined ? loadConfig() : cfg;
    this.mock = !this.cfg;
    if (this.mock) {
      console.log("[xs2event] mock mode — XS2_API_KEY not set, using fixtures");
    }
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.cfg) {
      throw new Xs2Error("xs2event client in mock mode — request() not callable", 500);
    }
    const url = `${this.cfg.baseUrl}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        [this.cfg.authHeader]: `${this.cfg.authScheme}${this.cfg.apiKey}`,
        ...init.headers,
      },
    });

    const text = await res.text();
    let body: unknown = undefined;
    if (text) {
      try { body = JSON.parse(text); } catch { body = text; }
    }

    if (!res.ok) {
      const msg = typeof body === "object" && body && "message" in body
        ? String((body as { message: unknown }).message)
        : `xs2event ${res.status} ${res.statusText}`;
      throw new Xs2Error(msg, res.status, body);
    }

    return body as T;
  }

  // xs2event wraps list responses under the resource name
  // (sports / tournaments / events / venues / tickets / categories).
  // Fallback to `data`/`items`/`results` for older endpoints if shape changes.
  private async list<T>(path: string): Promise<T[]> {
    const res = await this.request<unknown>(path);
    if (Array.isArray(res)) return res as T[];
    if (res && typeof res === "object") {
      const obj = res as Record<string, unknown>;
      // Prefer the canonical resource-name key first
      for (const key of [
        "tickets", "events", "tournaments", "categories",
        "venues", "sports", "teams", "data", "items", "results",
      ]) {
        if (Array.isArray(obj[key])) return obj[key] as T[];
      }
      // Last-resort heuristic: take the only array value if just one exists
      const arrays = Object.entries(obj).filter(([, v]) => Array.isArray(v));
      if (arrays.length === 1) return arrays[0][1] as T[];
    }
    throw new Xs2Error(
      `xs2event ${path}: unexpected response shape`,
      200,
      res,
    );
  }

  // --- Reads ---

  async listSports(): Promise<Xs2Sport[]> {
    if (this.mock) return [];
    return this.list<Xs2Sport>("/v1/sports");
  }

  async listTournaments(opts: {
    sport_type?: string;
    date_stop_ge?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<Xs2Tournament[]> {
    if (this.mock) return [];
    const q = buildQuery({
      sport_type: opts.sport_type,
      date_stop: opts.date_stop_ge ? `ge:${opts.date_stop_ge}` : undefined,
      page: opts.page,
      page_size: opts.page_size,
    });
    return this.list<Xs2Tournament>(`/v1/tournaments${q}`);
  }

  async listEvents(opts: {
    sport_type?: string | readonly string[];
    tournament_id?: string | readonly string[];
    date_stop_ge?: string;
    page?: number;
    page_size?: number;
  } = {}): Promise<Xs2Event[]> {
    if (this.mock) return [];
    const q = buildQuery({
      sport_type: Array.isArray(opts.sport_type)
        ? inFilter(opts.sport_type)
        : opts.sport_type as string | undefined,
      tournament_id: Array.isArray(opts.tournament_id)
        ? inFilter(opts.tournament_id)
        : opts.tournament_id as string | undefined,
      date_stop: opts.date_stop_ge ? `ge:${opts.date_stop_ge}` : undefined,
      page: opts.page,
      page_size: opts.page_size,
    });
    return this.list<Xs2Event>(`/v1/events${q}`);
  }

  async listVenues(opts: { page?: number; page_size?: number } = {}): Promise<Xs2Venue[]> {
    if (this.mock) return [];
    const q = buildQuery(opts);
    return this.list<Xs2Venue>(`/v1/venues${q}`);
  }

  async listCategories(opts: {
    event_id?: string;
    category_id?: string | readonly string[];
    page_size?: number;
  } = {}): Promise<Xs2Category[]> {
    if (this.mock) {
      if (!opts.event_id) return [];
      return MOCK_FIXTURES[opts.event_id]?.categories ?? [];
    }
    // Default page_size 500 — xs2's natural default of 50 is too small for
    // F1 events with extensive grandstand/hospitality categories, leading
    // to "Unknown" category-name fallbacks when ticket category_ids reference
    // categories on later pages.
    const q = buildQuery({
      event_id: opts.event_id,
      category_id: Array.isArray(opts.category_id)
        ? inFilter(opts.category_id)
        : opts.category_id as string | undefined,
      page_size: opts.page_size ?? 500,
    });
    return this.list<Xs2Category>(`/v1/categories${q}`);
  }

  /**
   * Live ticket lookup. xs2event explicitly says do not cache these.
   *
   * The `stock_gt` opt is honoured client-side now — the live API rejects
   * `&stock:gt:0` as an unknown query parameter, despite the docs.
   * `ticket_status=available` already excludes sold-out tickets in practice.
   */
  async listTickets(opts: {
    event_id: string;
    ticket_status?: string;
    stock_gt?: number;
    page_size?: number;
  }): Promise<Xs2Ticket[]> {
    if (this.mock) {
      const arr = MOCK_FIXTURES[opts.event_id]?.tickets ?? [];
      return opts.stock_gt != null ? arr.filter((t) => t.stock > opts.stock_gt!) : arr;
    }
    // Default page_size 500 to cover multi-supplier events that exceed xs2's
    // natural 50-row default page.
    const params: Record<string, QueryValue> = {
      event_id: opts.event_id,
      ticket_status: opts.ticket_status ?? "available",
      page_size: opts.page_size ?? 500,
    };
    const tickets = await this.list<Xs2Ticket>(`/v1/tickets${buildQuery(params)}`);
    if (opts.stock_gt != null) {
      return tickets.filter((t) => Number(t.stock) > opts.stock_gt!);
    }
    return tickets;
  }

  // --- Writes ---

  /**
   * Hold tickets for 10 minutes. xs2event guards against price drift —
   * net_rate + currency_code on each ticket MUST match what /v1/tickets
   * returned at lookup time.
   */
  async createReservation(body: {
    tickets: Array<{
      ticket_id: string;
      quantity: number;
      net_rate: number;
      currency_code: string;
    }>;
    [k: string]: unknown;
  }): Promise<Xs2Reservation> {
    if (this.mock) {
      return {
        reservation_id: `mock_rsv_${crypto.randomUUID()}`,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        tickets: [],
      };
    }
    return this.request<Xs2Reservation>("/v1/reservations", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async confirmBooking(body: {
    reservation_id: string;
    invoice_reference: string;
    booking_email: string;
    payment_method: string;
    [k: string]: unknown;
  }): Promise<Xs2Booking> {
    if (this.mock) {
      return {
        booking_id: `mock_bkg_${crypto.randomUUID()}`,
        status: "confirmed",
        invoice_reference: body.invoice_reference,
      };
    }
    return this.request<Xs2Booking>("/v1/bookings", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getETicketPdfUrl(opts: { ticket_id: string }): Promise<{ url: string }> {
    if (this.mock) return { url: "https://placehold.co/mock-eticket.pdf" };
    return this.request<{ url: string }>(
      `/v1/etickets/download-pdf-by-url${buildQuery(opts)}`,
    );
  }

  async getETicketZipUrl(opts: { booking_id: string }): Promise<{ url: string }> {
    if (this.mock) return { url: "https://placehold.co/mock-tickets.zip" };
    return this.request<{ url: string }>(
      `/v1/etickets/download-zip-url${buildQuery(opts)}`,
    );
  }
}

// --- Domain helpers (used by edge functions and sync logic) ---

/**
 * Group tickets by event_id + category_id + sub_category. Per xs2event docs:
 * different ticket_ids within the same group are different SUPPLIERS for the
 * same logical seat type. Caller picks cheapest, summed stock, etc.
 */
export interface TicketGroup {
  event_id: string;
  category_id: string;
  sub_category: string;
  cheapest_net_rate: number;
  currency_code: string;
  total_stock: number;
  supplier_ticket_ids: string[];
  /** Tickets sorted by net_rate ascending. */
  tickets: Xs2Ticket[];
}

export function groupTickets(tickets: readonly Xs2Ticket[]): TicketGroup[] {
  const groups = new Map<string, TicketGroup>();
  for (const t of tickets) {
    const key = `${t.event_id}|${t.category_id}|${t.sub_category}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        event_id: t.event_id,
        category_id: t.category_id,
        sub_category: t.sub_category,
        cheapest_net_rate: t.net_rate,
        currency_code: t.currency_code,
        total_stock: 0,
        supplier_ticket_ids: [],
        tickets: [],
      };
      groups.set(key, g);
    }
    g.tickets.push(t);
    g.supplier_ticket_ids.push(t.ticket_id);
    g.total_stock += t.stock;
    if (t.net_rate < g.cheapest_net_rate) g.cheapest_net_rate = t.net_rate;
  }
  for (const g of groups.values()) {
    g.tickets.sort((a, b) => a.net_rate - b.net_rate);
  }
  return Array.from(groups.values());
}

/** Apply markup. Mirrors the formula in get-ticket-prices/index.ts. */
export function applyMarkup(
  baseSek: number,
  markupPct: number,
  markupFixedSek: number,
): number {
  const withPct = baseSek * (1 + (Number(markupPct) || 0) / 100);
  return Math.round(withPct + (Number(markupFixedSek) || 0));
}

/**
 * Convert an xs2 ticket's raw `net_rate` (EUR cents) to SEK major units.
 * Reads `eur_to_sek_rate` from platform_settings via get_platform_decimal RPC;
 * falls back to the supplied default if the setting or RPC is unavailable.
 */
export function eurCentsToSek(centsEur: number, eurToSekRate: number): number {
  const eur = Number(centsEur) / 100;
  return eur * (Number(eurToSekRate) || 0);
}

/**
 * xs2 returns category `description` as a localized object
 * (`{en_GB, de_DE, nl_NL, ...}`) or sometimes a plain string. Pick a usable
 * value with a sensible preference order.
 */
export function pickLocalized(
  value: Record<string, string> | string | null | undefined,
  preferOrder: readonly string[] = ["sv_SE", "en_GB", "en_US", "de_DE", "nl_NL"],
): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  for (const lang of preferOrder) {
    if (typeof value[lang] === "string" && value[lang].length > 0) return value[lang];
  }
  // Fallback: first non-empty value in the object
  for (const v of Object.values(value)) {
    if (typeof v === "string" && v.length > 0) return v;
  }
  return "";
}

// ---------------------------------------------------------------------------
// Mock fixtures — used when XS2_API_KEY is missing.
//
// Shapes mirror the live xs2 API: `category_name` (not `name`) on categories,
// `net_rate` in EUR cents, `currency_code: "EUR"`. Callers convert via
// `eurCentsToSek()` before applying markup.
// ---------------------------------------------------------------------------

type MockFixture = {
  categories: Xs2Category[];
  tickets: Xs2Ticket[];
};

const EUR = "EUR";

function tickets(
  event_id: string,
  category_id: string,
  sub_category: string,
  eurCents: number,
  stockA: number,
  stockB: number,
): Xs2Ticket[] {
  // Supplier B is slightly more expensive but has more stock — exercises the
  // cheapest-first allocation in xs2-reserve.
  return [
    {
      ticket_id: `tkt_${category_id}_${sub_category}_a`,
      event_id,
      category_id,
      sub_category,
      ticket_status: "available",
      stock: stockA,
      net_rate: eurCents,
      currency_code: EUR,
    },
    {
      ticket_id: `tkt_${category_id}_${sub_category}_b`,
      event_id,
      category_id,
      sub_category,
      ticket_status: "available",
      stock: stockB,
      net_rate: Math.round(eurCents * 1.08),
      currency_code: EUR,
    },
  ];
}

const E1 = "evt_demo_liverpool_arsenal";
const E2 = "evt_demo_realmadrid_barcelona";
const E3 = "evt_demo_f1_monza";
const E4 = "evt_demo_milan_inter";

export const MOCK_FIXTURES: Record<string, MockFixture> = {
  [E1]: {
    categories: [
      { category_id: "ctg_liv_vip",      category_name: "VIP Hospitality",   description: "Lounge, mat och dryck ingår",      party_size_together: 4 },
      { category_id: "ctg_liv_premium",  category_name: "Premium långsida",  description: "Bästa läget på Anfield",            party_size_together: 6 },
      { category_id: "ctg_liv_standard", category_name: "Kop End",           description: "Hemmaläktaren — bästa atmosfären", party_size_together: 8 },
    ],
    tickets: [
      // EUR cents → ~600/300/150 EUR → ~6900/3450/1725 SEK base @ 11.5 rate
      ...tickets(E1, "ctg_liv_vip",      "singleday_regular", 60000, 6, 12),
      ...tickets(E1, "ctg_liv_premium",  "singleday_regular", 30000, 14, 22),
      ...tickets(E1, "ctg_liv_standard", "singleday_regular", 15000, 30, 50),
    ],
  },
  [E2]: {
    categories: [
      { category_id: "ctg_rma_vip",      category_name: "VIP Box",            description: "Privat box med 4 säten", party_size_together: 4 },
      { category_id: "ctg_rma_premium",  category_name: "Premium mittlinje",  description: "Bästa vyn på Bernabéu",  party_size_together: 6 },
      { category_id: "ctg_rma_standard", category_name: "Standard kortsida",  description: "Bra sikt, prisvärt",     party_size_together: 8 },
    ],
    tickets: [
      ...tickets(E2, "ctg_rma_vip",      "singleday_regular", 80000, 4, 8),
      ...tickets(E2, "ctg_rma_premium",  "singleday_regular", 50000, 10, 18),
      ...tickets(E2, "ctg_rma_standard", "singleday_regular", 20000, 24, 40),
    ],
  },
  [E3]: {
    categories: [
      { category_id: "ctg_mnz_paddock",    category_name: "Paddock Club",  description: "VIP-tillgång, mat & dryck hela helgen", party_size_together: 4 },
      { category_id: "ctg_mnz_grandstand", category_name: "Grandstand 7", description: "Klassisk läktare nära start/mål",       party_size_together: 6 },
    ],
    tickets: [
      ...tickets(E3, "ctg_mnz_paddock",    "weekend_regular", 250000, 4, 6),
      ...tickets(E3, "ctg_mnz_grandstand", "weekend_regular",  80000, 12, 20),
      ...tickets(E3, "ctg_mnz_grandstand", "sun_regular",      30000, 18, 30),
    ],
  },
  [E4]: {
    categories: [
      { category_id: "ctg_acm_vip",     category_name: "VIP Hospitality",  description: "San Siro Lounge", party_size_together: 4 },
      { category_id: "ctg_acm_premium", category_name: "Tribuna d'Onore",  description: "Premiumläktaren", party_size_together: 6 },
    ],
    tickets: [
      ...tickets(E4, "ctg_acm_vip",     "singleday_regular", 70000, 4, 8),
      ...tickets(E4, "ctg_acm_premium", "singleday_regular", 35000, 14, 22),
    ],
  },
};
