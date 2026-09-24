import { ArrowRight, Check, Hotel, Loader2, Plane, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSek } from "@/lib/formatSek";
import type { EventTickets } from "@/hooks/useEventTickets";

// Fixed checkout bar that slides up from the bottom as soon as a ticket is
// added, so the next step is always one click away wherever the visitor is
// on the page. It sits above the site's mobile "Skicka en förfrågan" bar
// (z-40) and covers it while tickets are picked.
//
// Two small toggles offer hotel and flight on top of the tickets.
//
// Request mode (prices hidden — the normal public flow): no prices; the
// button is always "Skicka förfrågan" and nothing is booked or charged.
// Buy mode (prices public / admin preview): "Till kassan" pays for the
// tickets; with hotel or flight on it flips to "Efterfråga paket".

export type Extras = { hotel: boolean; flight: boolean };

export default function CheckoutBar({
  t,
  extras,
  onToggleExtra,
  onEnquire,
}: {
  t: EventTickets;
  extras: Extras;
  onToggleExtra: (key: keyof Extras) => void;
  onEnquire: () => void;
}) {
  const visible = t.count > 0;
  const trip = extras.hotel || extras.flight;
  // Anything but paying for tickets alone is a request.
  const request = !t.canBuy || trip;
  const names = t.lines.map((l) => l.g.name);
  const summary = names.length > 1 ? `${names[0]} +${names.length - 1} till` : names[0] ?? "";

  const toggles = (
    <div className="flex items-center gap-2" role="group" aria-label="Lägg till i resan">
      <span className="hidden md:inline text-xs text-muted-foreground mr-1">Lägg till</span>
      <ExtraToggle icon={Hotel} label="Hotell" on={extras.hotel} onClick={() => onToggleExtra("hotel")} />
      <ExtraToggle icon={Plane} label="Flyg" on={extras.flight} onClick={() => onToggleExtra("flight")} />
    </div>
  );

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
            {/* What's picked */}
            <div className="min-w-0 flex items-center gap-3">
              <span className="hidden sm:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Ticket className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">
                  {t.count} biljett{t.count === 1 ? "" : "er"} · {summary}
                </p>
                <p className="font-display text-xl sm:text-2xl leading-tight tabular-nums">
                  {t.canBuy ? formatSek(t.total) : "Din förfrågan"}
                  {trip && <span className="ml-1.5 font-sans text-xs text-muted-foreground align-middle">+ {tripLabel(extras)}</span>}
                </p>
              </div>
            </div>

            {/* Hotel / flight — middle of the bar on larger screens */}
            <div className="hidden md:block">{toggles}</div>

            {/* Next step */}
            <div className="flex-shrink-0 text-right">
              {request ? (
                <Button
                  key="enquire"
                  onClick={onEnquire}
                  tabIndex={visible ? 0 : -1}
                  className="h-12 rounded-xl px-5 sm:px-8 text-sm tracking-wider animate-in fade-in zoom-in-95 duration-200"
                >
                  {t.canBuy ? "Efterfråga paket" : "Skicka förfrågan"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
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
              )}
              {request && (
                <p className="mt-1 text-[11px] text-muted-foreground hidden sm:block">
                  {trip ? "Pris på hela resan inom 24h" : "Vi återkommer med pris inom 24h"}
                </p>
              )}
            </div>
          </div>

          {/* Phones: toggles on their own quiet row */}
          <div className="md:hidden mt-2 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">Lägg till i resan</span>
            {toggles}
          </div>
        </div>
      </div>
      {/* Room at the bottom of the page so the bar never hides the footer's last line. */}
      {visible && <div className="h-28 md:h-24" aria-hidden />}
    </>
  );
}

function tripLabel(e: Extras): string {
  return [e.hotel && "hotell", e.flight && "flyg"].filter(Boolean).join(" & ");
}

function ExtraToggle({
  icon: Icon,
  label,
  on,
  onClick,
}: {
  icon: typeof Hotel;
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex items-center gap-1.5 rounded-full border h-9 px-3.5 text-sm font-medium transition-colors ${
        on
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-foreground/80 hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {on ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
