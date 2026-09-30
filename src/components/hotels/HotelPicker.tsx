import { useState } from "react";
import { BedDouble, Check, ChevronDown, Coffee, Eye, Hotel, MapPin, Minus, Plus, Star, Wifi } from "lucide-react";
import { formatSek } from "@/lib/formatSek";
import {
  ROOM_LABELS,
  addDays,
  shortDate,
  type EventHotels,
  type HotelOption,
  type RoomKey,
} from "@/hooks/useEventHotels";

// "Hotell nära arenan" on the match page: hotels from DPA Sports Travel with
// rooms free for the stay the visitor sets, nearest the ground first. Picking
// one adds it to the request (and turns the hotel part of the package on);
// nothing is booked. Prices show only when selling is on or an admin looks.

export default function HotelPicker({
  h,
  onPick,
}: {
  h: EventHotels;
  /** Called with the hotel picked, or null when the pick is cleared. */
  onPick: (hotel: HotelOption | null) => void;
}) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  if (!h.covered) return null;

  const arrivals: string[] = [];
  if (h.earliestArrival && h.matchDay) {
    for (let d = h.earliestArrival; d <= h.matchDay; d = addDays(d, 1)) arrivals.push(d);
  }
  const dayLabel = (d: string) => {
    if (d === h.matchDay) return `${shortDate(d)} (matchdagen)`;
    if (h.matchDay && d === addDays(h.matchDay, -1)) return `${shortDate(d)} (dagen före)`;
    return shortDate(d);
  };

  return (
    <div id="hotell" className="scroll-mt-24">
      <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-1 font-sans">Hotell</p>
      <h2 className="font-display text-2xl md:text-3xl leading-tight mb-1">Hotell nära arenan</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Rum hos våra hotellpartners i {h.city}. Välj ett hotell så tar vi med det i din förfrågan.
      </p>

      {h.environment === "test" && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 flex items-center gap-2">
          <Eye className="h-4 w-4 flex-shrink-0" />
          Testmiljö hos DPA - hotellen är påhittade. Lägg in live-nyckeln innan sidan publiceras (bara admin ser den här rutan).
        </div>
      )}

      {/* The stay */}
      <div className="rounded-xl border border-border bg-card p-4 mb-3 flex flex-wrap gap-x-4 gap-y-3">
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Ankomst</span>
          <select
            value={h.arrival ?? ""}
            onChange={(e) => h.setArrival(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm"
          >
            {arrivals.map((d) => (
              <option key={d} value={d}>
                {dayLabel(d)}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Nätter</span>
          <select
            value={h.nights}
            onChange={(e) => h.setNights(Number(e.target.value))}
            className="h-9 rounded-lg border border-border bg-background px-2.5 text-sm"
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} nätter{h.arrival ? ` - ut ${shortDate(addDays(h.arrival, n))}` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="basis-full">
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Rum</span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ROOM_LABELS) as RoomKey[]).map((k) => (
              <RoomStepper
                key={k}
                label={ROOM_LABELS[k]}
                n={h.rooms[k] ?? 0}
                canRemove={(h.rooms[k] ?? 0) > 0 && h.roomCount > 1}
                canAdd={h.roomCount < 8}
                onStep={(d) => h.setRoom(k, d)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hotels */}
      {h.loading && h.hotels.length === 0 ? (
        <HotelListSkeleton />
      ) : h.hotels.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground text-center">
          Inga lediga rum hos våra hotellpartners för de här datumen. Prova andra datum - eller skicka förfrågan med
          "Biljetter + hotell", så hittar vi ett hotell åt er.
        </div>
      ) : (
        <div
          className={`rounded-xl border border-border bg-card divide-y divide-border overflow-hidden transition-opacity ${
            h.loading ? "opacity-60" : ""
          }`}
          aria-busy={h.loading}
        >
          {h.hotels.map((o) => {
            const picked = h.selected?.hotel_id === o.hotel_id;
            const open = expanded[o.hotel_id];
            return (
              <div key={o.hotel_id} className={`p-3 sm:p-4 transition-colors ${picked ? "bg-primary/5" : ""}`}>
                <div className="flex gap-3 sm:gap-4">
                  {o.image ? (
                    <img
                      src={o.image}
                      alt={o.name}
                      loading="lazy"
                      className="h-20 w-24 sm:h-24 sm:w-32 flex-shrink-0 rounded-lg object-cover bg-muted"
                    />
                  ) : (
                    <div className="h-20 w-24 sm:h-24 sm:w-32 flex-shrink-0 rounded-lg bg-muted flex items-center justify-center">
                      <Hotel className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium leading-snug">{o.name}</p>
                        {o.stars ? (
                          <p className="mt-0.5 flex items-center gap-0.5 text-amber-500" aria-label={`${o.stars} stjärnor`}>
                            {Array.from({ length: o.stars }, (_, i) => (
                              <Star key={i} className="h-3 w-3 fill-current" />
                            ))}
                          </p>
                        ) : null}
                      </div>
                      {h.pricesVisible && o.final_sek != null && (
                        <div className="text-right flex-shrink-0">
                          <p className="font-display text-lg leading-snug whitespace-nowrap">{formatSek(o.final_sek)}</p>
                          <p className="text-[10px] text-muted-foreground">hela vistelsen</p>
                          {o.supplier_total != null && (
                            <p className="text-[10px] text-muted-foreground">
                              DPA {o.supplier_total} {o.supplier_currency}
                              {o.free_cancel_days ? ` · avbok. ${o.free_cancel_days} d` : ""}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {o.distance_km != null && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {o.distance_km.toLocaleString("sv-SE")} km till arenan
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        {o.breakfast ? <Coffee className="h-3 w-3" /> : <BedDouble className="h-3 w-3" />}
                        {o.breakfast ? "Frukost ingår" : "Endast rum"}
                      </span>
                      {o.wifi && (
                        <span className="inline-flex items-center gap-1">
                          <Wifi className="h-3 w-3" /> Wifi
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      {o.info.length > 0 || o.address ? (
                        <button
                          type="button"
                          onClick={() => setExpanded((p) => ({ ...p, [o.hotel_id]: !open }))}
                          className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          {open ? "Visa mindre" : "Visa mer"}
                          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          h.select(picked ? null : o.hotel_id);
                          onPick(picked ? null : o);
                        }}
                        aria-pressed={picked}
                        className={`flex-shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 h-9 text-sm font-semibold transition active:scale-[0.97] ${
                          picked
                            ? "border-2 border-primary bg-background text-primary"
                            : "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                        }`}
                      >
                        {picked ? <Check className="h-4 w-4" strokeWidth={2.5} /> : <Plus className="h-4 w-4" strokeWidth={2.5} />}
                        {picked ? "Valt" : "Välj"}
                      </button>
                    </div>
                  </div>
                </div>
                {open && (
                  <div className="mt-3 sm:pl-36 space-y-2 text-xs text-muted-foreground">
                    {o.address && <p>{o.address}</p>}
                    {o.info.map((l, i) => (
                      <p key={i}>{l}</p>
                    ))}
                    {(o.check_in || o.check_out) && (
                      <p>
                        Incheckning {o.check_in ?? "-"} · Utcheckning {o.check_out ?? "-"}
                      </p>
                    )}
                    {o.gallery.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {o.gallery.map((src) => (
                          <img key={src} src={src} alt="" loading="lazy" className="h-20 w-28 flex-shrink-0 rounded-md object-cover bg-muted" />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        Tillgängligheten gäller just nu. Vi bekräftar hotell och pris i vårt svar på din förfrågan - inget bokas förrän ni har
        bekräftat.
      </p>
    </div>
  );
}

function RoomStepper({
  label,
  n,
  canAdd,
  canRemove,
  onStep,
}: {
  label: string;
  n: number;
  canAdd: boolean;
  canRemove: boolean;
  onStep: (delta: number) => void;
}) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-full border h-9 pl-3 pr-1 text-sm ${
        n > 0 ? "border-primary bg-primary/5" : "border-border bg-background"
      }`}
    >
      <span className={n > 0 ? "font-medium" : "text-foreground/80"}>{label}</span>
      <button
        type="button"
        onClick={() => onStep(-1)}
        disabled={!canRemove}
        className="ml-1 h-7 w-7 inline-flex items-center justify-center rounded-full text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label={`Färre ${label.toLowerCase()}`}
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
      <span className="w-4 text-center tabular-nums font-semibold" aria-live="polite">
        {n}
      </span>
      <button
        type="button"
        onClick={() => onStep(1)}
        disabled={!canAdd}
        className="h-7 w-7 inline-flex items-center justify-center rounded-full text-primary hover:bg-primary/10 disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label={`Fler ${label.toLowerCase()}`}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function HotelListSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-card divide-y divide-border" aria-label="Hämtar hotell">
      {[0, 1, 2].map((i) => (
        <div key={i} className="p-4 flex gap-4">
          <div className="h-24 w-32 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-4 w-1/2 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-3 w-2/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
