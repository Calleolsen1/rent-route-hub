// Travel Connection API client (Deno) — ticket supplier for football and F1.
//
// Docs: https://docs.travelconnectionleisure.com (append .md to any page).
//
// Verified live against the sandbox on 2026-09-23:
//   - auth is OAuth2 password grant: POST /oauthorize/token with the account
//     email + password. Access tokens last 3600s; a refresh_token grant exists.
//   - catalogue: GET /product (not /products), paginated with page[size] up to
//     100 and page[number]. Types seen: football_match, event.
//   - live prices: POST /inventory-status {products: [ids]} — up to 100 ids per
//     call. Prices are wholesale, in the product's currency (EUR, or GBP for
//     UK football and Bayern). `max_purchase_qty` is the most tickets one
//     order may take and drops to 0 while someone else holds them.
//   - POST /reservations holds tickets for 10 MINUTES (expires_at = created_at
//     + 600). The reservation number ("O253722") becomes the order number on
//     confirm. DELETE /reservations/{num} releases the hold (204) and stock
//     comes straight back. The cancelled hold still shows in GET /orders.
//   - errors come back either as {type, message, errors} or as a bare array
//     [{type, message}] depending on the endpoint.
//   - confirm needs only the LEAD guest; remaining tickets are filled in as
//     "TBA" and the supplier emails for names later if the match needs them.
//     The order then sits at "Pending Payment" with a 14-day invoice. There
//     is no API to cancel a confirmed order — that goes through their support.
//   - rate limit is 60 requests/minute.
//
// Env:
//   TRAVELCONNECTION_USERNAME        required (account email)
//   TRAVELCONNECTION_PASSWORD        required
//   TRAVELCONNECTION_BASE_URL        optional, defaults to the SANDBOX
//   TRAVELCONNECTION_ORDERS_ENABLED  must be "true" before anything that holds
//                                    or buys tickets may run against production

const SANDBOX_BASE = "https://api-sandbox.travelconnectionleisure.com/v1";

export type TcEnvironment = "sandbox" | "production";

export class TravelConnectionError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown,
  ) {
    super(message);
    this.name = "TravelConnectionError";
  }
}

// ─── API shapes (only the fields we read) ──────────────────────────────────

export interface TcDateTime {
  tz: string;
  local: string;
  utc: string;
  epoch: number;
}

export interface TcProduct {
  id: number;
  name: string;
  type: "football_match" | "event" | string;
  slug?: string;
  match: {
    start: TcDateTime;
    date_confirmed?: boolean;
    time_confirmed: boolean;
    home: number;
    away: number;
    competition: number;
    status: string;
  } | null;
  event: {
    event?: { start?: TcDateTime; end?: TcDateTime; status?: string };
    event_dates?: { id: number; date_start: string; date_end: string }[];
  } | null;
  min_order?: number;
  max_order?: number;
  venue?: number | null;
  all_guests_details_required?: boolean;
  currency?: string;
}

export interface TcTicketOption {
  id: number;
  ticket_category: number;
  event_date: number | null;
  name: string;
  price: number;
  available: boolean;
  max_purchase_qty: number;
  delivery_methods: number[];
}

export interface TcVenue {
  id: number;
  name: string;
  city: string | null;
  /** Seating plan painted in the category colours; null for most venues. */
  images: { stadium?: string | null; seating?: string | null } | null;
}

export interface TcTicketCategory {
  id: number;
  product_type: string;
  venue: number;
  name: string | null;
  /** HTML, e.g. "<ul><li><strong>Long side LATERAL UPPER</strong></li>…" */
  description: string | null;
  consumer_info: string | null;
  color: string | null;
  guest_data_requirements: unknown;
}

export interface TcInventory {
  id: number;
  status: "Upcoming" | "Expired" | string;
  ticket_options: TcTicketOption[];
}

export interface TcReservationProduct {
  id: number;
  tour_date: number | string;
  name: string;
  ticket_option: string;
  ticket_option_id: number;
  delivery_method: string;
  qty: number;
  total: number;
  currency: string;
}

export interface TcReservation {
  reservation_num: string;
  created_at: number;
  status: string;
  agent_reference: string | null;
  price_total: number;
  expires_at: number;
  currency: string;
  products: TcReservationProduct[];
}

export interface TcGuest {
  first_name: string;
  last_name: string;
  ticket_option_id: number;
  lead: boolean;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
}

export interface TcConfirmation {
  order_no: string;
  total: string;
  currency: string;
  status: "confirmed";
}

export interface TcOrder {
  order_num: string;
  agent_reference: string | null;
  created_at: number | string;
  status: string;
  customer: string;
  currency: string;
  invoice: {
    invoice_num: string | null;
    due_date: string | null;
    status: string;
    total_amount: number;
    amount_due: number | string;
    invoice: string | null;
    vouchers: string[];
    products: unknown[];
  };
}

interface Page<T> {
  data: T[];
  links?: { next: string | null };
  meta?: { current_page: number; last_page: number; total: number };
}

// ─── Environment ───────────────────────────────────────────────────────────

export function tcBaseUrl(): string {
  return (Deno.env.get("TRAVELCONNECTION_BASE_URL") ?? SANDBOX_BASE).replace(/\/+$/, "");
}

export function tcEnvironment(): TcEnvironment {
  return /sandbox/i.test(tcBaseUrl()) ? "sandbox" : "production";
}

/**
 * Throws unless it is safe to hold or buy tickets.
 *
 * The sandbox is always allowed. Production additionally needs
 * TRAVELCONNECTION_ORDERS_ENABLED=true, so pointing the base URL at the live
 * API can never, on its own, start creating real invoices for KAISEN to pay.
 */
export function assertOrderingAllowed(): TcEnvironment {
  const env = tcEnvironment();
  if (env === "production" && Deno.env.get("TRAVELCONNECTION_ORDERS_ENABLED") !== "true") {
    throw new TravelConnectionError(
      "Bokningar mot Travel Connections skarpa miljö är avstängda (TRAVELCONNECTION_ORDERS_ENABLED är inte satt).",
      403,
    );
  }
  return env;
}

// ─── Rate limiting + auth ──────────────────────────────────────────────────

/**
 * The supplier allows 60 requests/minute. Calls go out immediately until 55
 * have been made within the last minute (a small safety margin);
 * only then does a call wait. The old version spaced EVERY call a second
 * apart, which added a second or more to each page view for nothing.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 55;
const recentCalls: number[] = [];

async function throttle(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (recentCalls.length && recentCalls[0] <= now - WINDOW_MS) recentCalls.shift();
    if (recentCalls.length < MAX_PER_WINDOW) {
      recentCalls.push(now);
      return;
    }
    await new Promise((r) => setTimeout(r, recentCalls[0] + WINDOW_MS - now + 10));
  }
}

export interface TokenState {
  access: string;
  refresh: string | null;
  expiresAt: number;
  base: string;
}

/**
 * Where the current access token is shared between functions.
 *
 * Travel Connection INVALIDATES the previous token whenever the account logs
 * in again (verified 2026-09-24: the old token then gets 403 "invalid
 * token"). Every edge function — tickets, sync, booking, checkout, webhook —
 * runs in its own instance, so if each logged in for itself they would keep
 * knocking each other out, possibly mid-payment. They share one token
 * instead (dbTokenStore) and only log in when the shared one is dead.
 */
export interface TokenStore {
  load(): Promise<TokenState | null>;
  save(t: TokenState): Promise<void>;
}

// deno-lint-ignore no-explicit-any
export function dbTokenStore(db: any): TokenStore {
  return {
    async load() {
      const { data } = await db
        .from("tc_tokens")
        .select("access_token, refresh_token, expires_at, base")
        .eq("id", "current")
        .maybeSingle();
      return data
        ? {
          access: data.access_token,
          refresh: data.refresh_token,
          expiresAt: new Date(data.expires_at).getTime(),
          base: data.base,
        }
        : null;
    },
    async save(t) {
      await db.from("tc_tokens").upsert({
        id: "current",
        access_token: t.access,
        refresh_token: t.refresh,
        expires_at: new Date(t.expiresAt).toISOString(),
        base: t.base,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
    },
  };
}

// Module scope survives between requests on a warm edge instance, which
// saves a token lookup on most requests.
let token: TokenState | null = null;
let loginInFlight: Promise<TokenState> | null = null;

function errorMessage(body: unknown, fallback: string): string {
  if (Array.isArray(body)) {
    const msgs = body.map((e) => (e as { message?: string })?.message).filter(Boolean);
    if (msgs.length) return msgs.join("; ");
  }
  const msg = (body as { message?: string } | null)?.message;
  return msg ?? fallback;
}

export class TravelConnectionClient {
  private base = tcBaseUrl();
  private username: string;
  private password: string;
  private store: TokenStore | null;

  constructor(opts: { store?: TokenStore } = {}) {
    const u = Deno.env.get("TRAVELCONNECTION_USERNAME");
    const p = Deno.env.get("TRAVELCONNECTION_PASSWORD");
    if (!u || !p) {
      throw new TravelConnectionError(
        "TRAVELCONNECTION_USERNAME / TRAVELCONNECTION_PASSWORD är inte satta",
        401,
      );
    }
    this.username = u;
    this.password = p;
    this.store = opts.store ?? null;
  }

  get environment(): TcEnvironment {
    return tcEnvironment();
  }

  /**
   * A token that works: this instance's, else the shared one, else a fresh
   * login (which then becomes the shared one). `stale` is a token the
   * supplier just rejected, so it's never handed out again.
   */
  private async authenticate(stale?: string): Promise<string> {
    const usable = (t: TokenState | null): t is TokenState =>
      !!t && t.base === this.base && t.access !== stale && t.expiresAt - 60_000 > Date.now();
    if (usable(token)) return token.access;
    if (this.store) {
      const shared = await this.store.load().catch(() => null);
      if (usable(shared)) {
        token = shared;
        return shared.access;
      }
    }
    // One login per instance at a time, however many requests are waiting.
    loginInFlight ??= this.login().finally(() => {
      loginInFlight = null;
    });
    return (await loginInFlight).access;
  }

  private async login(): Promise<TokenState> {
    await throttle();
    const res = await fetch(`${this.base}/oauthorize/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ grant_type: "password", username: this.username, password: this.password }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.access_token) {
      throw new TravelConnectionError(
        `Inloggning mot Travel Connection misslyckades: ${errorMessage(body, `HTTP ${res.status}`)}`,
        res.status,
      );
    }
    const fresh: TokenState = {
      access: body.access_token,
      refresh: body.refresh_token ?? null,
      expiresAt: Date.now() + Number(body.expires_in ?? 3600) * 1000,
      base: this.base,
    };
    token = fresh;
    await this.store?.save(fresh).catch((e) => console.warn("[travelconnection] token save failed:", e?.message));
    return fresh;
  }

  private async request<T>(
    method: "GET" | "POST" | "DELETE",
    path: string,
    body?: unknown,
    retried = false,
  ): Promise<T> {
    const access = await this.authenticate();
    await throttle();
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (res.status === 204) return undefined as T;

    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      throw new TravelConnectionError(
        `Travel Connection ${method} ${path}: svar var inte JSON (HTTP ${res.status})`,
        res.status,
      );
    }

    // A dead token comes back as 401, or as 403 {"message":"invalid token"}
    // when another function has logged in since. Get a working one and retry.
    const tokenRejected = res.status === 401 ||
      (res.status === 403 && /token/i.test(errorMessage(parsed, "")));
    if (!retried && tokenRejected) {
      await this.authenticate(access);
      return this.request<T>(method, path, body, true);
    }
    if (!retried && res.status === 429) {
      await new Promise((r) => setTimeout(r, 5000));
      return this.request<T>(method, path, body, true);
    }
    if (!res.ok) {
      throw new TravelConnectionError(
        `Travel Connection ${method} ${path}: ${errorMessage(parsed, `HTTP ${res.status}`)}`,
        res.status,
        parsed,
      );
    }
    return parsed as T;
  }

  /** Every page of a paginated GET endpoint, 100 at a time. */
  private async all<T>(path: string, params: Record<string, string> = {}): Promise<T[]> {
    const out: T[] = [];
    for (let page = 1; page < 1000; page++) {
      const qs = new URLSearchParams({ ...params, "page[size]": "100", "page[number]": String(page) });
      const body = await this.request<Page<T>>("GET", `${path}?${qs}`);
      out.push(...(body.data ?? []));
      const last = body.meta?.last_page ?? page;
      if (!body.data?.length || page >= last) break;
    }
    return out;
  }

  // ─── Catalogue ─────────────────────────────────────────────────────────

  listProducts(params: { type?: string; competition?: number } = {}): Promise<TcProduct[]> {
    const p: Record<string, string> = {};
    if (params.type) p.type = params.type;
    if (params.competition) p.competition = String(params.competition);
    return this.all<TcProduct>("/product", p);
  }

  async getProduct(id: number): Promise<TcProduct> {
    const body = await this.request<{ data: TcProduct }>("GET", `/product/${id}`);
    return body.data;
  }

  async teamsById(): Promise<Map<number, string>> {
    const teams = await this.all<{ id: number; name: string }>("/teams");
    return new Map(teams.map((t) => [t.id, t.name]));
  }

  async competitionsById(): Promise<Map<number, string>> {
    const comps = await this.all<{ id: number; name: string }>("/competitions");
    return new Map(comps.map((c) => [c.id, c.name]));
  }

  /** Every venue, with its seating-plan image where the supplier has one. */
  listVenues(): Promise<TcVenue[]> {
    return this.all<TcVenue>("/venues");
  }

  /** What a ticket category is: stand, rules, colour on the seating plan. */
  async getTicketCategory(id: number): Promise<TcTicketCategory> {
    const body = await this.request<{ data: TcTicketCategory }>("GET", `/ticket-categories/${id}`);
    return body.data;
  }

  /** Live prices and availability. Batches of 100 ids per call. */
  async inventory(productIds: number[]): Promise<Map<number, TcInventory>> {
    const out = new Map<number, TcInventory>();
    for (let i = 0; i < productIds.length; i += 100) {
      const ids = productIds.slice(i, i + 100);
      const body = await this.request<Page<TcInventory>>("POST", "/inventory-status", {
        products: ids,
        page: { size: 100 },
      });
      for (const inv of body.data ?? []) out.set(inv.id, inv);
    }
    return out;
  }

  // ─── Reservations & orders ─────────────────────────────────────────────
  // Each of these holds or buys tickets, so each checks the ordering gate
  // itself rather than trusting the caller to have done it.

  async createReservation(
    lines: { ticket_option: number; quantity: number }[],
    agentReference?: string,
  ): Promise<TcReservation> {
    assertOrderingAllowed();
    const body = await this.request<{ data: TcReservation }>("POST", "/reservations", {
      agent_reference: agentReference ?? null,
      products: lines,
    });
    return body.data;
  }

  async getReservation(num: string): Promise<TcReservation | null> {
    try {
      // Returns a one-item list envelope, not a bare object.
      const body = await this.request<{ data: TcReservation | TcReservation[] }>(
        "GET",
        `/reservations/${encodeURIComponent(num)}`,
      );
      return Array.isArray(body.data) ? body.data[0] ?? null : body.data;
    } catch (e) {
      if (e instanceof TravelConnectionError && e.status === 404) return null;
      throw e;
    }
  }

  async cancelReservation(num: string): Promise<void> {
    assertOrderingAllowed();
    await this.request<void>("DELETE", `/reservations/${encodeURIComponent(num)}`);
  }

  async confirmReservation(
    num: string,
    guests: TcGuest[],
    agentReference?: string,
  ): Promise<TcConfirmation> {
    assertOrderingAllowed();
    // Unlike every other endpoint this wraps its answer in `order`, not
    // `data`: {"order":{"order_no":"O253723","total":"200.00",...}}.
    const body = await this.request<{ order?: TcConfirmation; data?: TcConfirmation }>(
      "POST",
      `/reservations/${encodeURIComponent(num)}/confirm`,
      { agent_reference: agentReference ?? null, guests },
    );
    const confirmation = body.order ?? body.data;
    if (!confirmation?.order_no) {
      throw new TravelConnectionError("Travel Connection bekräftade utan ordernummer", 502, body);
    }
    return confirmation;
  }

  async getOrder(num: string): Promise<TcOrder> {
    const body = await this.request<{ data: TcOrder }>("GET", `/orders/${encodeURIComponent(num)}`);
    return body.data;
  }
}

/** When a supplier product kicks off (football) or starts (events). */
export function productStart(p: TcProduct): Date | null {
  const utc = p.match?.start?.utc ?? p.event?.event?.start?.utc;
  return utc ? new Date(utc) : null;
}
