// XS2Event API — third ticket supplier, READ-ONLY (football + F1).
//
// KAISEN has a read-only key on purpose: events, tickets and prices only.
// Reservations/bookings return 403 for it; KAISEN buys XS2 tickets by hand
// in the XS2 portal after a customer request. Nothing here books.
//
// Secrets:
//   XS2_API_KEY    the key (header X-Api-Key, raw — not Bearer)
//   XS2_BASE_URL   optional, default https://api.xs2event.com (live)
//
// Quirks (verified on the live API 2026-11-13):
//   - money is in CENTS of the ticket's own currency_code (EUR, USD, GBP
//     mixed within one F1 event).
//   - a ticket is one supplier lot. One category has many lots at different
//     prices; ticket_status "available" with stock 0 is NOT buyable.
//   - category_id "0" = lot without a category (seen only on disabled lots).
//   - boolean filters take 1/0, not true/false ("tickets_available=1").
//   - F1 events span the weekend (date_start Fri 00:00 … date_stop Sun);
//     date_start_main_event is the race itself.
//   - category descriptions are HTML per locale, sv_SE included.

export interface Xs2Event {
  event_id: string;
  event_name: string;
  date_start: string;
  date_stop: string | null;
  date_start_main_event: string | null;
  event_status: string;
  tournament_name: string | null;
  venue_name: string | null;
  city: string | null;
  iso_country: string | null;
  sport_type: string;
  date_confirmed: boolean | null;
  hometeam_name: string | null;
  visiting_name: string | null;
  min_ticket_price_eur: number | null;
  number_of_tickets: number | null;
}

export interface Xs2Ticket {
  ticket_id: string;
  event_id: string;
  category_id: string;
  category_name: string | null;
  ticket_title: string | null;
  category_type: string | null;
  sub_category: string | null;
  ticket_status: string;
  stock: number;
  net_rate: number;
  currency_code: string;
  flags: string[] | null;
  options: { covered_seat?: boolean | null; numbered_seat?: boolean | null; pairs_only?: boolean | null } | null;
}

export interface Xs2Category {
  category_id: string;
  category_name: string | null;
  category_type: string | null;
  description: Record<string, string | null> | null;
  party_size_together: number | null;
  options: { covered_seat?: boolean | null; numbered_seat?: boolean | null } | null;
  files: { url?: string; file_url?: string; type?: string }[] | null;
}

export class Xs2Error extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export class Xs2Client {
  private base: string;
  private key: string;

  constructor() {
    const key = Deno.env.get("XS2_API_KEY");
    if (!key) throw new Xs2Error("XS2 API key missing (set XS2_API_KEY)", 500);
    this.key = key;
    this.base = (Deno.env.get("XS2_BASE_URL") ?? "https://api.xs2event.com").replace(/\/+$/, "");
  }

  get environment(): string {
    return /testapi/i.test(this.base) ? "test" : "live";
  }

  private async get<T>(path: string, params: URLSearchParams): Promise<T> {
    const url = `${this.base}${path}?${params.toString()}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      const res = await fetch(url, {
        headers: { "X-Api-Key": this.key, Accept: "application/json" },
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        continue;
      }
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Xs2Error(`XS2 ${path} ${res.status}: ${body.slice(0, 300)}`, res.status);
      }
      return (await res.json()) as T;
    }
    throw new Xs2Error(`XS2 ${path}: no answer after retries`, 503);
  }

  /** Every page of a list endpoint (`key` = the array's name in the response). */
  private async all<T>(path: string, key: string, base: Record<string, string>, maxPages = 60): Promise<T[]> {
    const out: T[] = [];
    for (let page = 1; page <= maxPages; page++) {
      const p = new URLSearchParams({ ...base, page_size: "100", page: String(page) });
      const res = await this.get<Record<string, unknown>>(path, p);
      const items = (res[key] ?? []) as T[];
      out.push(...items);
      const next = (res.pagination as { next_page?: string } | undefined)?.next_page;
      if (!items.length || !next) break;
    }
    return out;
  }

  /** Upcoming, not-started events of one sport from `from` on. */
  events(sport: "soccer" | "formula1", from: Date): Promise<Xs2Event[]> {
    return this.all<Xs2Event>("/v1/events", "events", {
      sport_type: sport,
      event_status: "notstarted",
      date_start: `ge:${from.toISOString().slice(0, 10)}`,
    });
  }

  tickets(eventId: string): Promise<Xs2Ticket[]> {
    return this.all<Xs2Ticket>("/v1/tickets", "tickets", { event_id: eventId }, 10);
  }

  categories(eventId: string): Promise<Xs2Category[]> {
    return this.all<Xs2Category>("/v1/categories", "categories", { event_id: eventId }, 5);
  }
}

/** A lot a customer could actually get. */
export const xs2Buyable = (t: Xs2Ticket): boolean => t.ticket_status === "available" && Number(t.stock) > 0 && Number(t.net_rate) > 0;
