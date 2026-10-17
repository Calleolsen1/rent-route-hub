// dpa-hotels — hotels near the ground for one of our fixtures, from DPA.
//
// Body: {
//   event_id: string,
//   arrival?: "YYYY-MM-DD",   // default: the day before the match
//   nights?: number,          // 2–5, default 2 (DPA's minimum is 2)
//   rooms?: { double?, twin?, single? }   // default one double
// }
//
// Public (verify_jwt = false), like travelconnection-tickets: what comes back
// depends on who asks —
//   - anyone:  the hotels with the rooms free for the stay, nearest first
//   - prices:  when public_prices_enabled is on, or the caller is admin
//   - cost:    DPA's GBP price, FX rate and markup — admin only
//
// `covered: false` when DPA sells no hotels in the match's city; the page
// then keeps the plain "hotel on request" choice. Nothing is booked here —
// the visitor's pick goes into their request and KAISEN books by hand.
//
// Searches are cached in dpa_search_cache for CACHE_MINUTES, and a cached
// answer of any age stands in when DPA is down or slow.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { callerIsAdmin } from "../_shared/auth.ts";
import { rateToSek } from "../_shared/fx.ts";
import { customerPrice, htmlToLines } from "../_shared/tc_pricing.ts";
import { DPA_ROOMS, dpaEnvironment, searchHotels, type DpaHotel, type RoomKey, type RoomRequest } from "../_shared/dpa.ts";
import { distanceKm, dpaVenueFor } from "../_shared/dpa_venues.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const CACHE_MINUTES = 20;
const MAX_NIGHTS = 5;
const MAX_ROOMS = 8;
const DAY = 86_400_000;

/** Calendar date of an instant in Sweden — close enough for every European kickoff. */
function localDate(iso: string): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date(iso));
}

const addDays = (d: string, n: number) => new Date(Date.parse(`${d}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

function parseRooms(raw: unknown): RoomRequest {
  const out: RoomRequest = {};
  if (raw && typeof raw === "object") {
    for (const key of Object.keys(DPA_ROOMS) as RoomKey[]) {
      const n = Math.floor(Number((raw as Record<string, unknown>)[key] ?? 0));
      if (n > 0) out[key] = Math.min(n, MAX_ROOMS);
    }
  }
  const total = Object.values(out).reduce((s, n) => s + (n ?? 0), 0);
  if (total === 0) return { double: 1 };
  if (total > MAX_ROOMS) throw new Error(`Högst ${MAX_ROOMS} rum per förfrågan`);
  return out;
}

const cleanName = (s: string) => s.replace(/\s+ROOM ONLY\s*$/i, "").replace(/\s*\(CT\)\s*$/, "").trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const eventId = body?.event_id;
    if (!eventId || typeof eventId !== "string") throw new Error("event_id required");

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: ev } = await db
      .from("events")
      .select("id, sport, venue_name, home_team, starts_at")
      .eq("id", eventId)
      .maybeSingle();
    if (!ev) throw new Error("Evenemanget hittades inte");

    const venue = dpaVenueFor(ev);
    if (!venue || !Deno.env.get("DPA_API_KEY")) return json({ covered: false, hotels: [] });

    // The stay: arrival between three days before and the match day itself,
    // never in the past; at least one night after the match.
    const matchDay = localDate(ev.starts_at);
    const today = localDate(new Date().toISOString());
    if (matchDay < today) return json({ covered: false, hotels: [] });
    const earliest = [addDays(matchDay, -3), today].sort()[1];
    let arrival = typeof body.arrival === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.arrival)
      ? body.arrival
      : addDays(matchDay, -1);
    if (arrival < earliest) arrival = earliest;
    if (arrival > matchDay) arrival = matchDay;
    const nights = Math.min(MAX_NIGHTS, Math.max(2, Math.floor(Number(body.nights ?? 2)) || 2));
    const rooms = parseRooms(body.rooms);

    const [isAdmin, { data: pricesPublic }] = await Promise.all([
      callerIsAdmin(req),
      db.rpc("get_platform_bool", { p_key: "public_prices_enabled", p_default: false }),
    ]);
    const showPrices = isAdmin || pricesPublic === true;

    // ── Search, cached ────────────────────────────────────────────────────
    const env = dpaEnvironment();
    const roomKey = (Object.keys(DPA_ROOMS) as RoomKey[]).map((k) => `${k}${rooms[k] ?? 0}`).join("-");
    const cacheKey = `${env}|${venue.city}|${arrival}|${nights}|${roomKey}`;
    const { data: cached } = await db
      .from("dpa_search_cache")
      .select("hotels, fetched_at")
      .eq("key", cacheKey)
      .maybeSingle();

    let hotels: DpaHotel[];
    let stale = false;
    const fresh = cached && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_MINUTES * 60_000;
    if (fresh && !isAdmin) {
      hotels = cached.hotels as DpaHotel[];
    } else {
      try {
        hotels = await searchHotels({ city: venue.city, arrival, nights, rooms });
        await db.from("dpa_search_cache").upsert(
          { key: cacheKey, hotels, fetched_at: new Date().toISOString() },
          { onConflict: "key" },
        );
      } catch (e) {
        if (!cached) throw e;
        console.warn("[dpa-hotels] search failed, serving cache:", (e as Error).message);
        hotels = cached.hotels as DpaHotel[];
        stale = true;
      }
    }

    // ── Price and shape ───────────────────────────────────────────────────
    let pricing: { rate: Awaited<ReturnType<typeof rateToSek>>; pct: number; fixed: number; step: number } | null = null;
    if (showPrices && hotels.length) {
      const currency = hotels[0].currency || "GBP";
      const [rate, { data: pct }, { data: fixed }, { data: step }] = await Promise.all([
        rateToSek(db, currency),
        db.rpc("get_platform_decimal", { p_key: "default_markup_pct", p_default: 15 }),
        db.rpc("get_platform_decimal", { p_key: "default_markup_fixed_sek", p_default: 0 }),
        db.rpc("get_platform_decimal", { p_key: "price_rounding_sek", p_default: 1 }),
      ]);
      pricing = { rate, pct: Number(pct ?? 15), fixed: Number(fixed ?? 0), step: Math.max(1, Number(step ?? 1)) };
    }

    const out = hotels.map((h) => {
      const a = h.address;
      const base = pricing ? Number(h.price_total) * pricing.rate.rateToSek : 0;
      return {
        hotel_id: Number(h.hotel_id),
        name: cleanName(h.name),
        stars: Number(h.star_raiting) || null,
        image: h.image_large || h.image_small || null,
        gallery: (h.image_gallery ?? []).map((g) => g.large).filter(Boolean).slice(0, 6),
        address: a ? [a.street_name, a.post_code].filter(Boolean).join(", ") : null,
        distance_km: a?.lat && a?.lng ? Math.round(distanceKm(venue, a) * 10) / 10 : null,
        breakfast: Number(h.breakfast) === 1,
        wifi: Number(h.wifi) === 1,
        check_in: h.check_in?.slice(0, 5) ?? null,
        check_out: h.check_out?.slice(0, 5) ?? null,
        free_cancel_days: Number(h.cancellations) || null,
        info: htmlToLines(h.hotel_info).slice(0, 4),
        ...(pricing && { final_sek: customerPrice(base, pricing, pricing.step) }),
        ...(isAdmin && {
          supplier_total: Number(h.price_total),
          supplier_currency: h.currency,
          rooms_breakdown: h.price_breakdown,
        }),
      };
    }).sort((x, y) => (x.distance_km ?? 999) - (y.distance_km ?? 999));

    return json({
      covered: true,
      city: venue.city,
      match_day: matchDay,
      earliest_arrival: earliest,
      arrival,
      nights,
      rooms,
      prices_visible: showPrices,
      stale,
      hotels: out,
      ...(isAdmin && {
        environment: env,
        fx: pricing && {
          currency: pricing.rate.currency,
          rate_to_sek: pricing.rate.rateToSek,
          rate_date: pricing.rate.rateDate,
        },
        markup_pct: pricing?.pct,
      }),
    });
  } catch (e) {
    const message = (e as Error).message ?? "Unknown error";
    console.error("[dpa-hotels]", message);
    return json({ error: message }, 400);
  }
});
