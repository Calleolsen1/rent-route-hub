import { ArrowRight, Loader2, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatSek } from "@/lib/formatSek";
import type { EventTickets } from "@/hooks/useEventTickets";

// Fixed checkout bar that slides up from the bottom as soon as a ticket is
// added, so "Till kassan" is always one click away wherever the visitor is
// on the page. It sits above the site's mobile "Skicka en förfrågan" bar
// (z-40) and covers it while tickets are picked.

export default function CheckoutBar({ t }: { t: EventTickets }) {
  const visible = t.canBuy && t.count > 0;
  const names = t.lines.map((l) => l.g.name);
  const summary = names.length > 1 ? `${names[0]} +${names.length - 1} till` : names[0] ?? "";

  return (
    <>
      <div
        aria-hidden={!visible}
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur shadow-[0_-8px_30px_rgba(15,23,42,0.12)] pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="container mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0 flex items-center gap-3">
            <span className="hidden sm:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Ticket className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">
                {t.count} biljett{t.count === 1 ? "" : "er"} · {summary}
              </p>
              <p className="font-display text-xl sm:text-2xl leading-tight tabular-nums">{formatSek(t.total)}</p>
            </div>
          </div>
          <Button
            onClick={t.checkout}
            disabled={!visible || t.busy}
            tabIndex={visible ? 0 : -1}
            className="h-12 rounded-xl px-5 sm:px-8 text-sm tracking-wider flex-shrink-0"
          >
            {t.busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Till kassan
            {!t.busy && <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>
      {/* Room at the bottom of the page so the bar never hides the footer's last line. */}
      {visible && <div className="h-24" aria-hidden />}
    </>
  );
}
