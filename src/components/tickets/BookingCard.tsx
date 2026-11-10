import type { ReactNode } from "react";
import { ArrowDown, ArrowRight, Hotel, Loader2, Plane, Ticket, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSek } from "@/lib/formatSek";
import type { EventTickets } from "@/hooks/useEventTickets";
import type { EventHotels } from "@/hooks/useEventHotels";
import type { Extras } from "@/components/tickets/CheckoutBar";
import { goToStep, nextStep } from "@/components/trip/TripStep";

// "Din resa" — the right-hand card on the match page. A summary of the three
// steps on the left (tickets, hotel, flight), each with a link back to its
// step, and the one button that sends it.
//
// Request mode (prices hidden — the normal public flow) and any trip with a
// hotel or flight: "Skicka förfrågan". Nothing is booked or charged; KAISEN
// gets the request by email and books by hand.
// Buy mode (prices public, or an admin previewing) with tickets only: the
// ticket total and "Till kassan".

export default function BookingCard({
  t,
  hotels,
  headline,
  when,
  venue,
  extras,
  onExtras,
  flightFrom,
  onEnquire,
}: {
  t: EventTickets;
  hotels: EventHotels;
  headline: string;
  when: string;
  venue: string | null;
  extras: Extras;
  onExtras: (e: Extras) => void;
  flightFrom: string | null;
  onEnquire: () => void;
}) {
  const trip = extras.hotel || extras.flight;
  const next = nextStep(extras);
  const checkout = t.checkoutAllowed && t.hasTickets && !trip && !next;
  const add = (key: keyof Extras, step: string) => {
    onExtras({ ...extras, [key]: true });
    // Let the step open before scrolling to it.
    setTimeout(() => goToStep(step), 50);
  };

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
      {/* Match */}
      <div className="px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-sm font-medium text-muted-foreground">Din resa</p>
        </div>
        <p className="font-display text-xl leading-tight">{headline}</p>
        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
          <span>{when}</span>
          {venue && (
            <>
              <span aria-hidden>·</span>
              <span className="truncate">{venue}</span>
            </>
          )}
        </p>
      </div>

      <div className="divide-y divide-border">
        <Row icon={Ticket} label="Biljetter" action={t.lines.length ? { text: "Ändra", onClick: () => goToStep("biljetter") } : null}>
          {t.lines.length ? (
            <ul className="space-y-1">
              {t.lines.map(({ g, n }) => (
                <li key={g.category_id} className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="tabular-nums font-semibold">{n} ×</span> {g.name}
                  </span>
                  {t.canBuy && <span className="whitespace-nowrap tabular-nums">{formatSek((g.final_sek ?? 0) * n)}</span>}
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="Inga valda ännu" link="Välj biljetter" onClick={() => goToStep("biljetter")} />
          )}
        </Row>

        <Row icon={Hotel} label="Hotell" action={extras.hotel ? { text: "Ändra", onClick: () => goToStep("hotell") } : null}>
          {extras.hotel ? (
            <div className="space-y-0.5">
              {hotels.hotelNames.length > 1 ? (
                <>
                  <p className="text-xs text-muted-foreground">Pris på {hotels.hotelNames.length} alternativ:</p>
                  <ul className="font-medium space-y-0.5">
                    {hotels.hotelNames.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="font-medium">{hotels.hotelNames[0] ?? `Förslag från KAISEN · ${hotels.stars} stjärnor`}</p>
              )}
              <p className="text-xs text-muted-foreground">{hotels.datesText}</p>
              <p className="text-xs text-muted-foreground">{hotels.roomsText}</p>
              {!hotels.selected.length && hotels.covered && hotels.hotels.length > 0 && (
                <button type="button" onClick={() => goToStep("hotell")} className="text-xs text-primary hover:underline">
                  Välj hotell i listan
                </button>
              )}
            </div>
          ) : extras.hotel === null ? (
            <Empty text="Ej valt än" link="Välj" onClick={() => goToStep("hotell")} />
          ) : (
            <Empty text="Inget hotell" link="Lägg till" onClick={() => add("hotel", "hotell")} />
          )}
        </Row>

        <Row icon={Plane} label="Flyg" action={extras.flight ? { text: "Ändra", onClick: () => goToStep("flyg") } : null}>
          {extras.flight ? (
            <p className="font-medium">{flightFrom ? `Från ${flightFrom}` : "Tur och retur"}</p>
          ) : extras.flight === null ? (
            <Empty text="Ej valt än" link="Välj" onClick={() => goToStep("flyg")} />
          ) : (
            <Empty text="Inget flyg" link="Lägg till" onClick={() => add("flight", "flyg")} />
          )}
        </Row>
      </div>

      <div className="px-5 pt-4 pb-5 border-t border-border">
        {next ? (
          <>
            <Button onClick={() => goToStep(next.id)} className="w-full rounded-lg h-12 tracking-wider text-sm">
              Nästa: {next.label}
              <ArrowDown className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed text-center">
              Välj {next.id === "hotell" ? "hotell" : "flyg"}, sedan skickar ni förfrågan.
            </p>
          </>
        ) : checkout ? (
          <>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Totalt</span>
              <span className="font-display text-2xl tabular-nums">{t.count ? formatSek(t.total) : "-"}</span>
            </div>
            <Button onClick={t.checkout} disabled={!t.count || t.busy} className="w-full rounded-lg h-12 tracking-wider text-sm">
              {t.busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Till kassan
              {!t.busy && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onEnquire} className="w-full rounded-lg h-12 tracking-wider text-sm">
              Skicka förfrågan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed text-center">
              Pris inom 24 timmar. Inget bokas förrän ni bekräftat.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  action,
  children,
}: {
  icon: LucideIcon;
  label: string;
  action: { text: string; onClick: () => void } | null;
  children: ReactNode;
}) {
  return (
    <div className="px-5 py-3.5 text-sm">
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[13px] font-medium text-foreground">{label}</p>
          {action && (
            <button type="button" onClick={action.onClick} className="text-xs text-primary hover:underline">
              {action.text}
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

function Empty({ text, link, onClick }: { text: string; link: string; onClick: () => void }) {
  return (
    <p className="flex items-center justify-between gap-2 text-muted-foreground">
      <span>{text}</span>
      <button type="button" onClick={onClick} className="text-xs font-semibold text-primary hover:underline">
        {link}
      </button>
    </p>
  );
}
