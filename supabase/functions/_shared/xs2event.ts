// xs2event API client (Deno).
//
// Auth scheme is configurable via env vars so the same code works regardless of
// whether xs2event hands Kaisen a Bearer token, an X-Api-Key header, or
// something custom. Defaults match the most common B2B pattern.
//
//   XS2_BASE_URL      e.g. https://api.xs2event.com   (no trailing slash)
//   XS2_API_KEY       the credential string
//   XS2_AUTH_HEADER   default "Authorization"
//   XS2_AUTH_SCHEME   default "Bearer " (note trailing space). Use "" if the
//                     header value is the raw key (e.g. X-Api-Key style).
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

export interface Xs2Sport { sport_type: string; [k: string]: unknown }

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
  tournament_id?: string;
  tournament_name?: string;
  sport_type: string;
  hometeam_id?: string;
  hometeam_name?: string;
  visiting_id?: string;
  visiting_name?: string;
  venue_id?: string;
  venue_name?: string;
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
  name: string;
  description?: string;
  party_size_together: number;
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
 */
export function loadConfig(): Xs2Config | null {
  const apiKey = envOptional("XS2_API_KEY");
  if (!apiKey) return null;
  return {
    baseUrl: env("XS2_BASE_URL").replace(/\/+$/, ""),
    apiKey,
    authHeader: env("XS2_AUTH_HEADER", "Authorization"),
    authScheme: env("XS2_AUTH_SCHEME", "Bearer "),
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

  // xs2event responses wrap arrays under various keys depending on endpoint
  // ("data", "items", or the resource name). Normalize.
  private async list<T>(path: string): Promise<T[]> {
    const res = await this.request<unknown>(path);
    if (Array.isArray(res)) return res as T[];
    if (res && typeof res === "object") {
      const obj = res as Record<string, unknown>;
      for (const key of ["data", "items", "results"]) {
        if (Array.isArray(obj[key])) return obj[key] as T[];
      }
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
  } = {}): Promise<Xs2Category[]> {
    if (this.mock) {
      if (!opts.event_id) return [];
      return MOCK_FIXTURES[opts.event_id]?.categories ?? [];
    }
    const q = buildQuery({
      event_id: opts.event_id,
      category_id: Array.isArray(opts.category_id)
        ? inFilter(opts.category_id)
        : opts.category_id as string | undefined,
    });
    return this.list<Xs2Category>(`/v1/categories${q}`);
  }

  /** Live ticket lookup. xs2event explicitly says do not cache these. */
  async listTickets(opts: {
    event_id: string;
    ticket_status?: string;
    stock_gt?: number;
  }): Promise<Xs2Ticket[]> {
    if (this.mock) {
      return MOCK_FIXTURES[opts.event_id]?.tickets ?? [];
    }
    const params: Record<string, QueryValue> = {
      event_id: opts.event_id,
      ticket_status: opts.ticket_status ?? "available",
    };
    if (opts.stock_gt != null) {
      params["stock:gt"] = opts.stock_gt;
    }
    return this.list<Xs2Ticket>(`/v1/tickets${buildQuery(params)}`);
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

// ---------------------------------------------------------------------------
// Mock fixtures — used when XS2_API_KEY is missing.
//
// Keep `event_id`, `category_id`, `sub_category` values in sync with
// supabase/seed/dev_demo_events.sql. The seed inserts events whose
// `external_event_id` matches these keys; xs2-get-event-tickets routes through
// the mock client and finds these tickets/categories. Lets you exercise the
// whole booking flow before real credentials arrive.
//
// Two tickets per group illustrate the multi-supplier case — different
// `ticket_id` for the same `(event_id, category_id, sub_category)` group means
// xs2event docs warn sitting-together is not guaranteed across suppliers.
// ---------------------------------------------------------------------------

type MockFixture = {
  categories: Xs2Category[];
  tickets: Xs2Ticket[];
};

const SEK = "SEK";

function tickets(
  event_id: string,
  category_id: string,
  sub_category: string,
  base: number,
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
      net_rate: base,
      currency_code: SEK,
    },
    {
      ticket_id: `tkt_${category_id}_${sub_category}_b`,
      event_id,
      category_id,
      sub_category,
      ticket_status: "available",
      stock: stockB,
      net_rate: Math.round(base * 1.08),
      currency_code: SEK,
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
      { category_id: "ctg_liv_vip", name: "VIP Hospitality", description: "Lounge, mat och dryck ingår", party_size_together: 4 },
      { category_id: "ctg_liv_premium", name: "Premium långsida", description: "Bästa läget på Anfield", party_size_together: 6 },
      { category_id: "ctg_liv_standard", name: "Kop End", description: "Hemmaläktaren — bästa atmosfären", party_size_together: 8 },
    ],
    tickets: [
      ...tickets(E1, "ctg_liv_vip", "singleday_regular", 8500, 6, 12),
      ...tickets(E1, "ctg_liv_premium", "singleday_regular", 4200, 14, 22),
      ...tickets(E1, "ctg_liv_standard", "singleday_regular", 1900, 30, 50),
    ],
  },
  [E2]: {
    categories: [
      { category_id: "ctg_rma_vip", name: "VIP Box", description: "Privat box med 4 säten", party_size_together: 4 },
      { category_id: "ctg_rma_premium", name: "Premium mittlinje", description: "Bästa vyn på Bernabéu", party_size_together: 6 },
      { category_id: "ctg_rma_standard", name: "Standard kortsida", description: "Bra sikt, prisvärt", party_size_together: 8 },
    ],
    tickets: [
      ...tickets(E2, "ctg_rma_vip", "singleday_regular", 12000, 4, 8),
      ...tickets(E2, "ctg_rma_premium", "singleday_regular", 6800, 10, 18),
      ...tickets(E2, "ctg_rma_standard", "singleday_regular", 2800, 24, 40),
    ],
  },
  [E3]: {
    categories: [
      { category_id: "ctg_mnz_paddock", name: "Paddock Club", description: "VIP-tillgång, mat & dryck hela helgen", party_size_together: 4 },
      { category_id: "ctg_mnz_grandstand", name: "Grandstand 7", description: "Klassisk läktare nära start/mål", party_size_together: 6 },
    ],
    tickets: [
      // Paddock: weekend pass only
      ...tickets(E3, "ctg_mnz_paddock", "weekend_regular", 38000, 4, 6),
      // Grandstand: weekend OR single Sunday
      ...tickets(E3, "ctg_mnz_grandstand", "weekend_regular", 11500, 12, 20),
      ...tickets(E3, "ctg_mnz_grandstand", "sun_regular", 4200, 18, 30),
    ],
  },
  [E4]: {
    categories: [
      { category_id: "ctg_acm_vip", name: "VIP Hospitality", description: "San Siro Lounge", party_size_together: 4 },
      { category_id: "ctg_acm_premium", name: "Tribuna d'Onore", description: "Premiumläktaren", party_size_together: 6 },
    ],
    tickets: [
      ...tickets(E4, "ctg_acm_vip", "singleday_regular", 9500, 4, 8),
      ...tickets(E4, "ctg_acm_premium", "singleday_regular", 4800, 14, 22),
    ],
  },
};
