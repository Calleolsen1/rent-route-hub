import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Eye, MapPin, Minus, Plus } from "lucide-react";
import { formatSek } from "@/lib/formatSek";
import { normColor } from "@/lib/planColor";
import { rowKey, type EventTickets } from "@/hooks/useEventTickets";

// The ticket categories for a match: name, what the seat is, price and a
// quantity stepper (when selling is on). Hovering a row lights up its area on
// the seating plan in the right-hand column; only that row is highlighted.

export default function TicketList({ t }: { t: EventTickets }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div id="biljetter" className="scroll-mt-24">
      <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-1 font-sans">
        {t.canBuy ? "Biljetter" : "Biljettkategorier"}
      </p>
      <h2 className="font-display text-2xl md:text-3xl leading-tight mb-1">
        {t.canBuy && t.fromPrice != null ? `Biljetter från ${formatSek(t.fromPrice)}` : "Välj var ni vill sitta"}
      </h2>
      {t.hasPlan && t.onPlanColors && t.onPlanColors.size > 0 && (
        <p className="text-xs text-muted-foreground mb-4 hidden lg:block">
          Håll muspekaren över en biljett för att se var den ligger på arenan.
        </p>
      )}
      {!t.hasPlan && <div className="mb-4" />}

      {t.preview && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 flex items-center gap-2">
          <Eye className="h-4 w-4 flex-shrink-0" />
          Förhandsvisning - bara synlig för admin. Kunder ser inte priser förrän de slås på under Påslag.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
        {t.groups.map((g) => {
          const key = rowKey(g);
          const n = g.category_id ? t.qty[g.category_id] ?? 0 : 0;
          const open = expanded[key];
          const lit = t.rowLit(g);
          const locatable = t.onMap(g);
          return (
            <div
              key={key}
              ref={t.registerRow(g)}
              onMouseEnter={() => t.hoverRow(g)}
              onMouseLeave={() => t.hoverRow(null)}
              className={`px-4 py-3.5 transition-colors ${g.available ? "" : "opacity-50"} ${lit ? "bg-primary/5" : ""}`}
              style={lit && g.color ? { boxShadow: `inset 3px 0 0 ${normColor(g.color)}` } : undefined}
            >
              <div className="flex items-start gap-3">
                <span
                  className="mt-1.5 h-3 w-3 rounded-full flex-shrink-0 border border-black/10"
                  style={{ backgroundColor: g.color ?? "transparent" }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium leading-snug">{g.name}</p>
                    {t.canBuy && (
                      <p className="font-display text-lg leading-snug whitespace-nowrap">
                        {g.final_sek != null ? formatSek(g.final_sek) : "-"}
                      </p>
                    )}
                  </div>
                  {g.description[0] && (
                    <p className={`mt-0.5 text-xs text-muted-foreground ${open ? "" : "line-clamp-1"}`}>
                      {g.description[0]}
                    </p>
                  )}
                  {open && g.description.length > 1 && (
                    <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground list-disc pl-4">
                      {g.description.slice(1).map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      {g.description.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setExpanded((p) => ({ ...p, [key]: !open }))}
                          className="text-primary hover:underline inline-flex items-center gap-0.5"
                        >
                          {open ? "Visa mindre" : "Visa mer"}
                          <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                      )}
                      {/* Touch screens have no hover: tap to show the area. */}
                      {locatable && (
                        <button
                          type="button"
                          onClick={() => {
                            t.togglePin(g);
                            if (window.matchMedia("(max-width: 1023px)").matches) {
                              document.getElementById("arenakarta")?.scrollIntoView({ behavior: "smooth", block: "start" });
                            }
                          }}
                          className="text-primary hover:underline inline-flex items-center gap-1 lg:hidden"
                        >
                          <MapPin className="h-3 w-3" />
                          {t.pinnedKey === key ? "Dölj på kartan" : "Visa på kartan"}
                        </button>
                      )}
                      {t.canBuy && (
                        <span className="text-muted-foreground">
                          {g.available ? `Max ${g.max_qty}` : "Slutsålt just nu"}
                        </span>
                      )}
                    </div>
                    {t.canBuy && g.available && (
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full"
                          onClick={() => t.step(g, -1)}
                          disabled={n === 0}
                          aria-label={`Färre biljetter ${g.name}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium tabular-nums">{n}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 rounded-full"
                          onClick={() => t.step(g, 1)}
                          disabled={n >= g.max_qty}
                          aria-label={`Fler biljetter ${g.name}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
        {t.canBuy ? (
          <>
            Platserna i kategorin tilldelas av arrangören - sällskap sitter normalt ihop parvis.
            {t.guestDetailsRequired && " Klubben kräver namn på alla besökare; vi hör av oss efter köpet."}
            {" "}E-biljetterna släpps närmare matchen och skickas till din e-post och Mitt Kaisen.
          </>
        ) : (
          "Skriv gärna vilken kategori ni vill ha i förfrågan, så återkommer vi med pris och tillgänglighet."
        )}
      </p>
    </div>
  );
}

/** Same shape as the loaded list, so nothing jumps when tickets arrive. */
export function TicketListSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Hämtar biljetter">
      <div className="h-3 w-24 rounded bg-muted mb-2" />
      <div className="h-7 w-64 rounded bg-muted mb-5" />
      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="px-4 py-4 flex gap-3">
            <div className="h-3 w-3 rounded-full bg-muted mt-1" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-1/2 rounded bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
              </div>
              <div className="h-3 w-3/4 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
