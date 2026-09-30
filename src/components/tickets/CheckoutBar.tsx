import { ArrowDown, ArrowRight, Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSek } from "@/lib/formatSek";
import type { EventTickets } from "@/hooks/useEventTickets";
import { goToStep, nextStep } from "@/components/trip/TripStep";

// Fixed bar that slides up from the bottom as soon as something is picked
// (tickets, hotel or flight), so the next step is always one click away
// wherever the visitor is on the page. It sits above the site's mobile
// "Skicka en förfrågan" bar (z-40) and covers it while it shows.
//
// What's in the trip is chosen in the steps on the page; the bar only sums
// it up. Until hotel and flight are both answered (yes or no) the button
// leads to the next step; then "Till kassan" when selling is on and it's
// tickets only, otherwise "Skicka förfrågan" — nothing is booked or charged.

/** Hotel / flight on top of the tickets. null = the step isn't answered yet. */
export type Extras = { hotel: boolean | null; flight: boolean | null };

export default function CheckoutBar({
  t,
  extras,
  onEnquire,
}: {
  t: EventTickets;
  extras: Extras;
  onEnquire: () => void;
}) {
  const trip = extras.hotel || extras.flight;
  const visible = t.count > 0 || trip;
  const next = nextStep(extras);
  const checkout = t.canBuy && t.hasTickets && !trip && !next;
  const parts = [
    t.count ? `${t.count} biljett${t.count === 1 ? "" : "er"}` : null,
    extras.hotel ? "Hotell" : null,
    extras.flight ? "Flyg" : null,
  ].filter(Boolean);

  return (
    <>
      <div
        aria-hidden={!visible}
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur shadow-[0_-8px_30px_rgba(15,23,42,0.12)] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="container mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex items-center gap-3">
              <span className="hidden sm:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Ticket className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{parts.join(" · ")}</p>
                <p className="font-display text-xl sm:text-2xl leading-tight tabular-nums">
                  {checkout ? formatSek(t.total) : next ? `Steg ${next.n} av 3` : "Din resa"}
                </p>
              </div>
            </div>

            <div className="flex-shrink-0 text-right">
              {next ? (
                <>
                  <Button
                    key={`next-${next.id}`}
                    onClick={() => goToStep(next.id)}
                    tabIndex={visible ? 0 : -1}
                    className="h-12 rounded-xl px-5 sm:px-8 text-sm tracking-wider animate-in fade-in zoom-in-95 duration-200"
                  >
                    Nästa: {next.label}
                    <ArrowDown className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="mt-1 text-[11px] text-muted-foreground hidden sm:block">
                    {next.id === "hotell" ? "Med eller utan hotell?" : "Med eller utan flyg?"}
                  </p>
                </>
              ) : checkout ? (
                <Button
                  key="checkout"
                  onClick={t.checkout}
                  disabled={!visible || t.busy}
                  tabIndex={visible ? 0 : -1}
                  className="h-12 rounded-xl px-5 sm:px-8 text-sm tracking-wider animate-in fade-in zoom-in-95 duration-200"
                >
                  {t.busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Till kassan
                  {!t.busy && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              ) : (
                <>
                  <Button
                    key="enquire"
                    onClick={onEnquire}
                    tabIndex={visible ? 0 : -1}
                    className="h-12 rounded-xl px-5 sm:px-8 text-sm tracking-wider animate-in fade-in zoom-in-95 duration-200"
                  >
                    Skicka förfrågan
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <p className="mt-1 text-[11px] text-muted-foreground hidden sm:block">
                    {trip ? "Pris på hela resan inom 24h" : "Vi återkommer med pris inom 24h"}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Room at the bottom of the page so the bar never hides the footer's last line. */}
      {visible && <div className="h-24" aria-hidden />}
    </>
  );
}
