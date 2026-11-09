import { useState } from "react";
import { BedDouble, Check, ChevronDown, Coffee, Eye, Hotel, MapPin, Minus, Plus, Star, Ticket, Wifi } from "lucide-react";
import { formatSek } from "@/lib/formatSek";
import {
  ROOM_LABELS,
  addDays,
  shortDate,
  type EventHotels,
  type HotelOption,
  type RoomKey,
} from "@/hooks/useEventHotels";
import { OnOffChoice, StepHeader } from "@/components/trip/TripStep";

// Step 2 on the match page: hotel or not, and if so the stay (arrival,
// nights, rooms) and — where DPA Sports Travel has hotels — the hotels with
// rooms free for it, nearest the ground first. Picking one puts it in the
// request; nothing is booked. Where DPA has no hotels the stay still goes in
// the request and KAISEN suggests one. Prices only when selling is on or an
// admin looks.

const INITIAL_HOTELS = 4;

export default function HotelStep({
  h,
  on,
  onToggle,
  onPick,
}: {
  h: EventHotels;
  /** Hotel is part of the trip; null = not answered yet. */
  on: boolean | null;
  onToggle: (on: boolean) => void;
  /** Called with the hotel picked, or null when the pick is cleared. */
  onPick: (hotel: HotelOption | null) => void;
}) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  // The nearest few, so step 3 isn't pushed far down; the pick always shows.
  const [showAll, setShowAll] = useState(false);
  const shown = showAll
    ? h.hotels
    : h.hotels.filter((o, i) => i < INITIAL_HOTELS || h.isSelected(o.hotel_id));

  const arrivals: string[] = [];
  if (h.earliestArrival && h.matchDay) {
    for (let d = h.earliestArrival; d <= h.matchDay; d = addDays(d, 1)) arrivals.push(d);
  }
  // Short enough for two selects side by side on a phone; the match day and
  // check-out are spelled out on the line below.
  const dayLabel = (d: string) => (d === h.matchDay ? `${shortDate(d)} (match)` : shortDate(d));

  return (
    <div id="hotell" className="scroll-mt-40">
      <StepHeader n={2} eyebrow="Hotell" title="Hotell">
        {h.covered && h.city
          ? "Centrala hotell med frukost, 3–5 stjärnor. Välj ett så får ni pris på det och liknande alternativ."
          : "Vi ordnar hotell efter era önskemål."}
      </StepHeader>

      <OnOffChoice
        name="Hotell"
        on={on}
        onChange={onToggle}
        off={{ icon: Ticket, label: "Utan hotell", hint: "Vi ordnar boendet själva" }}
        with={{
          icon: Hotel,
          label: "Med hotell",
          hint: h.covered && h.hotels.length ? `${h.hotels.length} hotell med lediga rum` : "Nära arenan",
        }}
      />

      {on && (
        <div className="mt-4">
          {h.environment === "test" && (
            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 flex items-center gap-2">
              <Eye className="h-4 w-4 flex-shrink-0" />
              Testmiljö hos DPA - hotellen är påhittade. Lägg in live-nyckeln innan sidan publiceras (bara admin ser den här rutan).
            </div>
          )}

          {/* The stay */}
          <div className="rounded-lg border border-border bg-card p-4 mb-3 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-x-4">
            <label className="block min-w-0">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Ankomst</span>
              <select
                value={h.arrival ?? ""}
                onChange={(e) => h.setArrival(e.target.value)}
                className="h-10 sm:h-9 w-full sm:w-auto rounded-lg border border-border bg-background px-2.5 text-sm"
              >
                {arrivals.map((d) => (
                  <option key={d} value={d}>
                    {dayLabel(d)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block min-w-0">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Nätter</span>
              <select
                value={h.nights}
                onChange={(e) => h.setNights(Number(e.target.value))}
                className="h-10 sm:h-9 w-full sm:w-auto rounded-lg border border-border bg-background px-2.5 text-sm"
              >
                {[2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} nätter
                  </option>
                ))}
              </select>
            </label>
            {h.arrival && h.matchDay && (
              <p className="col-span-2 sm:basis-full -mt-1 text-xs text-muted-foreground">
                Match {shortDate(h.matchDay)} · utcheckning {shortDate(addDays(h.arrival, h.nights))}
              </p>
            )}
            <div className="col-span-2 sm:basis-full">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Rum</span>
              <div className="grid gap-2 sm:flex sm:flex-wrap">
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
          {!h.covered ? (
            <p className="text-sm text-muted-foreground">
              Vi föreslår hotell nära arenan efter era önskemål och skickar alternativ med pris i vårt svar.
            </p>
          ) : h.loading && h.hotels.length === 0 ? (
            <HotelListSkeleton />
          ) : h.hotels.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card px-4 py-6 text-sm text-muted-foreground text-center">
              Inga lediga rum hos våra hotellpartners de här datumen. Prova andra datum - eller skicka förfrågan ändå, så
              hittar vi ett hotell åt er.
            </div>
          ) : (
            <div
              className={`rounded-lg border border-border bg-card divide-y divide-border overflow-hidden transition-opacity ${
                h.loading ? "opacity-60" : ""
              }`}
              aria-busy={h.loading}
            >
              {shown.map((o) => {
                const picked = h.isSelected(o.hotel_id);
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
                              h.toggle(o.hotel_id);
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


          {h.hotels.length > shown.length || showAll ? (
            h.hotels.length > INITIAL_HOTELS && (
              <button
                type="button"
                onClick={() => setShowAll((v) => !v)}
                className="mt-3 w-full rounded-lg border border-border bg-card h-11 text-sm font-medium text-primary hover:bg-muted/50 inline-flex items-center justify-center gap-1"
              >
                {showAll ? "Visa färre hotell" : `Visa alla ${h.hotels.length} hotell`}
                <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
              </button>
            )
          ) : null}
          {h.covered && h.hotels.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
              Tillgängligheten gäller just nu. Vi bekräftar hotell och pris i vårt svar - inget bokas förrän ni har bekräftat.
            </p>
          )}
        </div>
      )}
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
      className={`flex sm:inline-flex items-center justify-between gap-1 rounded-full border h-10 sm:h-9 pl-4 sm:pl-3 pr-1 text-sm ${
        n > 0 ? "border-primary bg-primary/5" : "border-border bg-background"
      }`}
    >
      <span className={`mr-auto ${n > 0 ? "font-medium" : "text-foreground/80"}`}>{label}</span>
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
    <div className="animate-pulse rounded-lg border border-border bg-card divide-y divide-border" aria-label="Hämtar hotell">
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
