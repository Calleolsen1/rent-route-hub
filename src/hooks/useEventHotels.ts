import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Hotels near the ground for a match, from DPA Sports Travel via the
// dpa-hotels function: the stay (arrival, nights, rooms) the visitor sets,
// what's free for it, and the one they picked. Prices come back only when
// selling is on or an admin is looking — otherwise the pick simply goes into
// the request and Kaisen books it by hand.

export type RoomKey = "double" | "twin" | "single";
export type Rooms = Partial<Record<RoomKey, number>>;

export const ROOM_LABELS: Record<RoomKey, string> = {
  double: "Dubbelrum",
  twin: "Twinrum",
  single: "Enkelrum",
};

export type HotelOption = {
  hotel_id: number;
  name: string;
  stars: number | null;
  image: string | null;
  gallery: string[];
  address: string | null;
  distance_km: number | null;
  breakfast: boolean;
  wifi: boolean;
  check_in: string | null;
  check_out: string | null;
  free_cancel_days: number | null;
  info: string[];
  final_sek?: number;
  supplier_total?: number;
  supplier_currency?: string;
};

type HotelsResponse = {
  covered: boolean;
  city?: string;
  match_day?: string;
  earliest_arrival?: string;
  arrival?: string;
  nights?: number;
  rooms?: Rooms;
  prices_visible?: boolean;
  stale?: boolean;
  environment?: string;
  hotels: HotelOption[];
};

const DAY = 86_400_000;
export const addDays = (d: string, n: number) =>
  new Date(Date.parse(`${d}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

/** "fre 23 okt" */
export const shortDate = (d: string) =>
  new Intl.DateTimeFormat("sv-SE", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    .format(new Date(`${d}T00:00:00Z`))
    .replace(".", "");

export function roomsText(rooms: Rooms): string {
  return (Object.keys(ROOM_LABELS) as RoomKey[])
    .filter((k) => (rooms[k] ?? 0) > 0)
    .map((k) => `${rooms[k]} × ${ROOM_LABELS[k]}`)
    .join(", ");
}

/** Calendar date of an instant in Sweden, as the server counts match days. */
const localDate = (iso: string) =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Stockholm" }).format(new Date(iso));

/**
 * `startsAt` lets the stay (dates, rooms) work on every match, also where DPA
 * has no hotels: the visitor still says when and how they want to stay, and
 * Kaisen finds the hotel.
 */
export function useEventHotels(eventId: string | undefined, startsAt: string | null = null) {
  const [data, setData] = useState<HotelsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  // The stay. Arrival null = the day before the match.
  const [arrival, setArrival] = useState<string | null>(null);
  const [nights, setNights] = useState(2);
  const [rooms, setRooms] = useState<Rooms>({ double: 1 });
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data: res, error } = await supabase.functions.invoke("dpa-hotels", {
        body: { event_id: eventId, arrival, nights, rooms },
      });
      if (cancelled) return;
      // A failed lookup leaves the plain "hotel on request" choice.
      setFailed(!!error);
      if (!error) setData(res as HotelsResponse);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId, arrival, nights, rooms]);

  const covered = !!data?.covered && !failed;
  const hotels = useMemo(() => (covered ? data?.hotels ?? [] : []), [covered, data]);
  // A pick that isn't free for the new stay is dropped.
  const selected = hotels.find((h) => h.hotel_id === selectedId) ?? null;
  useEffect(() => {
    if (!loading && selectedId != null && !selected) setSelectedId(null);
  }, [loading, selectedId, selected]);

  // Dates from the server when it answered for this match, else worked out
  // here the same way (arrival from three days before to the match day).
  const matchDay = data?.match_day ?? (startsAt ? localDate(startsAt) : null);
  const today = localDate(new Date().toISOString());
  const earliestArrival =
    data?.earliest_arrival ?? (matchDay ? [addDays(matchDay, -3), today].sort()[1] : null);
  const stayArrival = (covered ? data?.arrival : null) ?? arrival ?? (matchDay ? addDays(matchDay, -1) : null);
  const stayNights = (covered ? data?.nights : null) ?? nights;
  const roomCount = Object.values(rooms).reduce((s, n) => s + (n ?? 0), 0);

  const setRoom = (key: RoomKey, delta: number) =>
    setRooms((r) => {
      const n = Math.max(0, Math.min(8, (r[key] ?? 0) + delta));
      const next = { ...r, [key]: n };
      const total = Object.values(next).reduce((s, v) => s + (v ?? 0), 0);
      return total === 0 || total > 8 ? r : next;
    });

  const hotelName = selected ? `${selected.name}${selected.stars ? ` (${selected.stars}★)` : ""}` : null;
  /** "fre 30 okt–sön 1 nov (2 nätter)" */
  const datesText = stayArrival
    ? `${shortDate(stayArrival)}–${shortDate(addDays(stayArrival, stayNights))} (${stayNights} nätter)`
    : `${stayNights} nätter`;
  /** One line for the request: hotel (or Kaisen's suggestion), dates, rooms. */
  const selectionLine = `Hotell: ${hotelName ?? "förslag från Kaisen"}, ${datesText}, ${roomsText(rooms)}`;

  return {
    covered,
    loading,
    city: data?.city ?? null,
    matchDay,
    earliestArrival,
    arrival: stayArrival,
    setArrival,
    nights: stayNights,
    setNights,
    rooms,
    setRoom,
    roomCount,
    hotels,
    pricesVisible: !!data?.prices_visible,
    stale: !!data?.stale,
    environment: data?.environment ?? null,
    selected,
    select: setSelectedId,
    hotelName,
    datesText,
    roomsText: roomsText(rooms),
    selectionLine,
  };
}

export type EventHotels = ReturnType<typeof useEventHotels>;
