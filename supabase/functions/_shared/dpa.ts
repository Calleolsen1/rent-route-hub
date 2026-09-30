// DPA Sports Travel — hotel rooms in the cities we sell football in.
//
// Docs: https://dpasportstravel.com/api-docs/ (Swagger: aubergine-262-DPA-1.0.0).
// Secrets: DPA_API_KEY, DPA_BASE_URL (unset = the test API, whose only hotels
// are dummies called "Hotel stock for 2026 Liverpool" and the like). The live
// key's searches are read-only; nothing here books.
//
// Quirks, verified against both environments on 2026-09-30:
//   - every path needs a trailing slash; without it the server 301s
//   - failures come back as HTTP 200 with {"error":1,"message":"…"} — no
//     stock is "No available hotels for your search.", a bad key
//     "Authentication failed", one night "Minimum number of nights is 2"
//   - prices are whole GBP per room per night; price_total covers the stay
//   - `cancellations` is the free-cancellation cut-off in days before arrival
//   - some cities carry a trailing space ("Dortmund ", "Munich "); search
//     matches them either way
//   - a search can hang for minutes (Madrid did), hence the timeout

const TEST_BASE = "https://dev.dpasportstravel.com/api";
const TIMEOUT_MS = 12_000;

/** Room types we offer, keyed by DPA room_id (the same ids in test and live). */
export const DPA_ROOMS = {
  double: { id: 318, sv: "Dubbelrum" },
  twin: { id: 319, sv: "Twinrum" },
  single: { id: 316, sv: "Enkelrum" },
} as const;

export type RoomKey = keyof typeof DPA_ROOMS;
export type RoomRequest = Partial<Record<RoomKey, number>>;

export interface DpaHotel {
  hotel_id: number | string;
  name: string;
  image_small: string | null;
  image_large: string | null;
  star_raiting: string | null;
  city: string;
  price_total: number;
  price_breakdown: {
    room_id: number;
    room_name: string;
    quantity: number;
    per_room_per_night: number;
    line_total: number;
  }[];
  currency: string;
  cancellations: number | string;
  first_night: string;
  last_night: string;
  image_gallery?: { small: string; large: string }[];
  address?: {
    lat: number;
    lng: number;
    street_name?: string;
    city?: string;
    post_code?: string;
    country?: string;
  };
  hotel_info?: string;
  location_info?: string;
  breakfast: number;
  wifi: number;
  check_in?: string;
  check_out?: string;
}

export class DpaError extends Error {}

export function dpaEnvironment(): "test" | "live" {
  const base = Deno.env.get("DPA_BASE_URL") ?? TEST_BASE;
  return /\/\/dev\./.test(base) ? "test" : "live";
}

async function get<T>(path: string, query: URLSearchParams): Promise<T> {
  const key = Deno.env.get("DPA_API_KEY");
  if (!key) throw new DpaError("DPA_API_KEY saknas");
  const base = (Deno.env.get("DPA_BASE_URL") ?? TEST_BASE).replace(/\/+$/, "");
  const res = await fetch(`${base}/${path}/?${query}`, {
    headers: { "X-API-Key": key, Accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new DpaError(`DPA ${path}: HTTP ${res.status}`);
  const body = await res.json();
  if (body && !Array.isArray(body) && body.error) {
    throw new DpaError(String(body.message ?? "DPA error"));
  }
  return body as T;
}

const NO_STOCK = /no available hotels/i;

/**
 * Hotels in `city` with every requested room free for the whole stay.
 * No stock is an empty list, not an error.
 */
export async function searchHotels(p: {
  city: string;
  arrival: string;
  nights: number;
  rooms: RoomRequest;
}): Promise<DpaHotel[]> {
  const q = new URLSearchParams({ date: p.arrival, nights: String(p.nights), city: p.city });
  for (const [key, n] of Object.entries(p.rooms)) {
    if (n && n > 0) q.set(`rooms[${DPA_ROOMS[key as RoomKey].id}]`, String(n));
  }
  try {
    return await get<DpaHotel[]>("hotels", q);
  } catch (e) {
    if (e instanceof DpaError && NO_STOCK.test(e.message)) return [];
    throw e;
  }
}
