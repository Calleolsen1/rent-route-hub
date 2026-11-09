// P1 Travel B2B API (v2) — football and F1 tickets/hospitality.
//
// Docs: https://docs.api.p1travel.com/b2b-api-docs/ (password protected).
// Auth: header `Api-Key`. Keys live only in the function secrets:
//   P1_ENV              "sandbox" (default) or "live"
//   P1_API_KEY_SANDBOX  sandbox key
//   P1_API_KEY_LIVE     live key (only read when P1_ENV=live)
//
// Quirks worth knowing (from the docs):
//   - event `start`/`end` and booking option times carry a "Z" but are the
//     LOCAL wall-clock time at the venue. Never shift them by a timezone.
//   - stock is capped at 10 in responses ("10" means 10+), and products may
//     carry ordering restrictions (Max/Min/QuantityStep/DontLeave/…).
//   - rate limit 600 requests/minute.

export type P1Env = "sandbox" | "live";
export type P1Currency = "EUR" | "USD" | "GBP";

export interface P1Team {
  id: string;
  name: string;
  shortName: string | null;
  abbreviation: string | null;
  countryCode: string | null;
}

export interface P1Restriction {
  type: "Max" | "Min" | "QuantityStep" | "DontLeave" | "BlacklistedTicketHolderNationalities" | "AwayFansNotAllowed";
  value: string | null;
}

export interface P1Product {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  productName: string | null;
  price: { currency: P1Currency; amount: number } | null;
  available: boolean;
  stock: number | null;
  hasUnlimitedStock: boolean;
  properties: { productPropertyId: string; productPropertyKey: string; value: string | null }[] | null;
  ticketCategoryImageUrl: string | null;
  orderingRestrictions: P1Restriction[] | null;
}

export interface P1BookingOption {
  bookingOption: {
    id: string;
    name: string | null;
    isDefault: boolean;
    startDateTime: string | null;
    endDateTime: string | null;
  };
  products: P1Product[] | null;
}

export interface P1Event {
  id: string;
  title: string;
  start: string;
  end: string | null;
  isDateConfirmed: boolean;
  organizer: { id: string; name: string } | null;
  venue: { id: string; name: string; address: { city?: string | null; country?: string | null } | null } | null;
  series: { id: string; name: string; seriesGroupName: string | null } | null;
  eventCategory: { id: string; key: string } | null;
  homeTeam: P1Team | null;
  awayTeam: P1Team | null;
  allowAwayFans: boolean;
  requiredTicketHolderFields: string[] | null;
  bookingOptionProducts: P1BookingOption[] | null;
}

interface P1Page {
  data: P1Event[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export class P1Error extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function p1Environment(): P1Env {
  return (Deno.env.get("P1_ENV") ?? "sandbox").toLowerCase() === "live" ? "live" : "sandbox";
}

export class P1Client {
  readonly environment: P1Env;
  private base: string;
  private key: string;

  constructor() {
    this.environment = p1Environment();
    const key = Deno.env.get(this.environment === "live" ? "P1_API_KEY_LIVE" : "P1_API_KEY_SANDBOX");
    if (!key) throw new P1Error(`P1 API key missing for ${this.environment} (set ${this.environment === "live" ? "P1_API_KEY_LIVE" : "P1_API_KEY_SANDBOX"})`, 500);
    this.key = key;
    this.base = this.environment === "live"
      ? "https://api.p1travel.com/b2b-api/v2"
      : "https://api.sandbox.p1travel.com/b2b-api/v2";
  }

  private async get<T>(path: string, params: URLSearchParams): Promise<T> {
    const url = `${this.base}${path}?${params.toString()}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url, {
        headers: { "Api-Key": this.key, Accept: "application/json" },
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new P1Error(`P1 ${path} ${res.status}: ${body.slice(0, 300)}`, res.status);
      }
      return (await res.json()) as T;
    }
    throw new P1Error(`P1 ${path}: no answer after retries`, 503);
  }

  /** All events in a window (paged through), optionally only specific ids. */
  async searchEvents(opts: { from?: string; till?: string; eventIds?: string[]; currency?: P1Currency }): Promise<P1Event[]> {
    const out: P1Event[] = [];
    const pageSize = 100;
    for (let page = 1; page < 200; page++) {
      const p = new URLSearchParams();
      if (opts.from) p.set("from", opts.from);
      if (opts.till) p.set("till", opts.till);
      for (const id of opts.eventIds ?? []) p.append("eventIds", id);
      p.set("currency", opts.currency ?? "EUR");
      p.set("page[number]", String(page));
      p.set("page[size]", String(pageSize));
      const res = await this.get<P1Page>("/events/search", p);
      out.push(...(res.data ?? []));
      if (!res.data?.length || out.length >= (res.totalCount ?? 0)) break;
    }
    return out;
  }
}

/** Football fixture: has both teams. */
export const isP1Football = (e: P1Event): boolean => !!(e.homeTeam?.name && e.awayTeam?.name);

/** Formula 1 race weekend (series/category/title mention F1). */
export function isP1F1(e: P1Event): boolean {
  const text = [e.series?.name, e.series?.seriesGroupName, e.eventCategory?.key, e.title].filter(Boolean).join(" ");
  return /\b(formula\s*1|formula one|f1)\b/i.test(text);
}

/** Max quantity a customer may pick for a product (stock + restrictions, never above 20). */
export function p1MaxQty(p: P1Product): number {
  const restrictionMax = (p.orderingRestrictions ?? [])
    .filter((r) => r.type === "Max" && r.value)
    .map((r) => Number(r.value))
    .find((n) => Number.isFinite(n) && n > 0);
  const stock = p.hasUnlimitedStock ? 20 : Math.max(0, Number(p.stock ?? 0));
  return Math.max(0, Math.min(20, restrictionMax ?? 20, stock));
}
