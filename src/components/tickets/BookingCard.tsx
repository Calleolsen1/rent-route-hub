import { ArrowRight, Hotel, Loader2, MapPin, Plane, Plus, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSek } from "@/lib/formatSek";
import type { EventTickets } from "@/hooks/useEventTickets";

// The right-hand booking card on the match page.
//
// Selling on (or admin preview): "the whole trip?" with the hotel/flight
// packages first — those are what Kaisen wants customers to choose, always
// quoted on request — then the tickets picked in the list, total and checkout.
// Selling off: the enquiry card as before — pick a package, send a request.

export type PackageId = "biljetter" | "hotell" | "komplett";

const PACKAGES: { id: PackageId; icons: typeof Ticket[]; label: string; parts: string[] }[] = [
  { id: "biljetter", icons: [Ticket], label: "Endast biljetter", parts: ["biljett"] },
  { id: "hotell", icons: [Ticket, Hotel], label: "Biljetter + hotell", parts: ["biljett", "hotell"] },
  { id: "komplett", icons: [Ticket, Plane, Hotel], label: "Biljetter + flyg + hotell", parts: ["biljett", "hotell", "flyg"] },
];

export default function BookingCard({
  t,
  headline,
  when,
  venue,
  selectedPackage,
  onSelectPackage,
  onEnquire,
}: {
  t: EventTickets;
  headline: string;
  when: string;
  venue: string | null;
  selectedPackage: PackageId;
  onSelectPackage: (id: PackageId, parts: string[]) => void;
  onEnquire: () => void;
}) {
  const selling = t.canBuy && t.hasTickets;
  // Buying tickets alone happens in the list, so the enquiry only offers trips.
  const packages = selling ? PACKAGES.filter((p) => p.id !== "biljetter") : PACKAGES;

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Match */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/70 font-sans">
            {selling ? "Din bokning" : "Din förfrågan"}
          </p>
          {!selling && (
            <span className="shrink-0 bg-muted text-muted-foreground text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded">
              Offertbaserad
            </span>
          )}
        </div>
        <p className="font-display text-xl leading-tight">{headline}</p>
        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
          <span>{when}</span>
          {venue && (
            <>
              <span aria-hidden>·</span>
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{venue}</span>
            </>
          )}
        </p>
      </div>

      {/* Packages: always on request */}
      <div className="px-5 pb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2.5 font-sans">
          {selling ? "Hela resan?" : "Välj ditt paket"}
        </p>
        <div className="space-y-2">
          {packages.map(({ id, icons, label, parts }) => {
            const selected = selectedPackage === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectPackage(id, parts)}
                className={`w-full flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left transition-all ${
                  selected
                    ? "border-2 border-primary bg-primary/5"
                    : "border border-border bg-background hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                <span className={`text-sm font-semibold ${selected ? "text-foreground" : "text-foreground/80"}`}>
                  {label}
                </span>
                <span className={`flex items-center gap-1 ${selected ? "text-primary" : "text-muted-foreground"}`}>
                  {icons.map((Icon, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <Plus className="h-2.5 w-2.5 opacity-60" />}
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
        <Button
          onClick={onEnquire}
          className="mt-3 w-full rounded-xl h-11 tracking-wider text-sm"
        >
          Efterfråga paket
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed text-center">
          {selling ? "Hotell och flyg offereras efter era önskemål." : "Pris på förfrågan - vi återkommer med biljetter, hotell och flyg efter era önskemål."}{" "}
          <span className="font-semibold text-foreground">Vi återkommer inom 24h.</span>
        </p>
      </div>
      {/* Tickets picked in the list */}
      {selling && (
        <div className="px-5 pt-4 pb-5 border-t border-border">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-2.5 font-sans">
            Bara biljetter
          </p>
          <div className="rounded-xl bg-muted/50 p-3.5">
            {t.lines.length ? (
              <ul className="space-y-1.5 text-sm">
                {t.lines.map(({ g, n }) => (
                  <li key={g.category_id} className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="tabular-nums">{n} ×</span> {g.name}
                    </span>
                    <span className="whitespace-nowrap tabular-nums">{formatSek((g.final_sek ?? 0) * n)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Ticket className="h-4 w-4 shrink-0" /> Välj biljetter i listan.
              </p>
            )}
            <div className="mt-3 pt-3 border-t border-border flex items-baseline justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Totalt</span>
              <span className="font-display text-2xl tabular-nums">{t.count ? formatSek(t.total) : "-"}</span>
            </div>
          </div>
          <Button
            onClick={t.checkout}
            disabled={!t.count || t.busy}
            className="mt-3 w-full rounded-xl h-12 tracking-wider text-sm"
          >
            {t.busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Till kassan
            {!t.busy && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      )}

    </div>
  );
}
