import { useState } from "react";
import { ChevronDown, Eye, MapPin, Minus, Plus, Ticket } from "lucide-react";
import { formatSek } from "@/lib/formatSek";
import { normColor } from "@/lib/planColor";
import { rowKey, type EventTickets } from "@/hooks/useEventTickets";
import { StepHeader } from "@/components/trip/TripStep";
import StadiumPlan from "@/components/StadiumPlan";

// The ticket categories for a match: name, what the seat is, availability,
// a quantity stepper — and the price when selling is on. With prices hidden
// the quantities feed a request (nothing is booked); see useEventTickets. Hovering a row lights up its area on
// the seating plan in the right-hand column; only that row is highlighted.

export default function TicketList({ t }: { t: EventTickets }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <div id="biljetter" className="scroll-mt-24">
      <StepHeader
        n={1}
        eyebrow="Biljetter"
        title={t.canBuy && t.fromPrice != null ? `Biljetter från ${formatSek(t.fromPrice)}` : "Välj dina biljetter"}
      >
        {t.isGeneric ? (
          "Vi ordnar biljetter till den här matchen på förfrågan - välj nivå och antal."
        ) : t.hasPlan && t.onPlanColors && t.onPlanColors.size > 0 ? (
          <>
            <span className="hidden lg:inline">Håll muspekaren över en biljett för att se var den ligger på arenan.</span>
            <span className="lg:hidden">Tryck på "Visa på kartan" för att se var biljetten ligger.</span>
          </>
        ) : null}
      </StepHeader>

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
                {g.color ? (
                  <span
                    className="mt-1.5 h-3 w-3 rounded-full flex-shrink-0 border border-black/10"
                    style={{ backgroundColor: g.color }}
                    aria-hidden
                  />
                ) : (
                  <Ticket className="mt-1 h-3.5 w-3.5 flex-shrink-0 text-primary" aria-hidden />
                )}
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
                      {g.description.length > 1 && (
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
                      {/* Touch screens have no hover: tap to open the plan
                          right in the row, with this ticket's blocks lit. */}
                      {locatable && (
                        <button
                          type="button"
                          onClick={() => t.togglePin(g)}
                          aria-expanded={t.pinnedKey === key}
                          className={`lg:hidden inline-flex items-center gap-1 rounded-full border h-7 px-2.5 font-medium transition-colors ${
                            t.pinnedKey === key
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-primary/40 text-primary"
                          }`}
                        >
                          <MapPin className="h-3 w-3" />
                          {t.pinnedKey === key ? "Dölj karta" : "Visa på kartan"}
                        </button>
                      )}
                      {t.isGeneric ? (
                        <span className="text-muted-foreground">Ordnas på förfrågan</span>
                      ) : g.available ? (
                        <span className="text-muted-foreground inline-flex items-center gap-1">
                          {!t.canBuy && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />}
                          {t.canBuy ? `Max ${g.max_qty}` : "Tillgänglig"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Slutsålt just nu</span>
                      )}
                    </div>
                    {g.available && (
                      <QtyStepper
                        n={n}
                        max={g.max_qty}
                        name={g.name}
                        onAdd={() => t.step(g, 1)}
                        onRemove={() => t.step(g, -1)}
                      />
                    )}
                  </div>
                  {locatable && t.pinnedKey === key && t.planUrl && (
                    <div className="lg:hidden mt-3 rounded-lg border border-border bg-background p-2 animate-in fade-in slide-in-from-top-1 duration-200">
                      <StadiumPlan
                        src={t.planUrl}
                        areas={t.areas}
                        active={normColor(g.color!)}
                        activeLabels={[g.name]}
                        alt={`Var ${g.name} ligger på arenan`}
                        maxHeight="40vh"
                      />
                    </div>
                  )}
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
            {" "}E-biljetterna släpps närmare matchen och skickas till din e-post och Mitt KAISEN.
          </>
        ) : (
          "Välj antal och skicka en förfrågan - vi återkommer med pris och tillgänglighet inom 24h. Inget bokas eller debiteras förrän ni har bekräftat."
        )}
      </p>
    </div>
  );
}

/**
 * Quantity control that can't be missed: a solid blue "Lägg till" until a
 * ticket is picked, then a blue − n + stepper.
 */
function QtyStepper({
  n,
  max,
  name,
  onAdd,
  onRemove,
}: {
  n: number;
  max: number;
  name: string;
  onAdd: () => void;
  onRemove: () => void;
}) {
  if (n === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 h-9 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.97] transition"
        aria-label={`Lägg till en biljett ${name}`}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Lägg till
      </button>
    );
  }
  return (
    <div className="flex-shrink-0 inline-flex items-center rounded-full border-2 border-primary bg-background p-0.5 shadow-sm">
      <button
        type="button"
        onClick={onRemove}
        className="h-8 w-8 inline-flex items-center justify-center rounded-full text-primary hover:bg-primary/10 active:scale-95 transition"
        aria-label={`Färre biljetter ${name}`}
      >
        <Minus className="h-4 w-4" strokeWidth={2.5} />
      </button>
      <span className="w-8 text-center text-base font-bold tabular-nums text-primary" aria-live="polite">
        {n}
      </span>
      <button
        type="button"
        onClick={onAdd}
        disabled={n >= max}
        className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label={`Fler biljetter ${name}`}
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
      </button>
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
