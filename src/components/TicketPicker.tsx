import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown, Eye, Loader2, MapPin, Minus, Plus, Ticket } from "lucide-react";
import { formatSek } from "@/lib/formatSek";
import StadiumPlan, { type PlanArea } from "@/components/StadiumPlan";
import { normColor } from "@/lib/planColor";

// Tickets for one match, live from the supplier (Travel Connection), side by
// side with the supplier's official seating plan.
//
// Two modes, decided by the server:
//   - buy:   prices are public (or an admin is previewing) — prices, quantity
//            steppers and checkout
//   - guide: prices hidden — the categories and the plan only, so a visitor
//            can see where each ticket is and name it in their enquiry
//
// Hovering a category lights up its area on the plan; hovering the plan
// shows which tickets are sold there; clicking an area selects it. Works for
// every stadium the supplier has a plan for, because the plan is painted in
// the categories' own colours.
//
// The browser only ever sends which categories and how many; the order is
// priced on the server.

type Group = {
  category_id: string | null;
  name: string;
  description: string[];
  color: string | null;
  available: boolean;
  max_qty: number;
  final_sek?: number;
};

type TicketsResponse = {
  supplier: string | null;
  prices_visible?: boolean;
  preview?: boolean;
  guest_details_required?: boolean;
  plan_url?: string | null;
  groups: Group[];
};

async function errorMessage(error: unknown): Promise<string> {
  try {
    const ctx = (error as { context?: Response }).context;
    const parsed = ctx ? await ctx.json() : null;
    if (parsed?.error) return parsed.error as string;
  } catch {
    /* fall through */
  }
  return (error as Error)?.message ?? "Något gick fel";
}

export default function TicketPicker({
  eventId,
  venueName,
  onAvailability,
  onPlan,
}: {
  eventId: string;
  venueName?: string | null;
  /** Whether tickets can be bought here, e.g. to adjust the sidebar. */
  onAvailability?: (canBuy: boolean) => void;
  /** Whether the supplier's seating plan is shown, so the page can drop its own. */
  onPlan?: (hasPlan: boolean) => void;
}) {
  const navigate = useNavigate();
  const [data, setData] = useState<TicketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  // Plan highlight: what the pointer is over, and what was clicked.
  const [hovered, setHovered] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [onPlanColors, setOnPlanColors] = useState<Set<string> | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const planRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: res, error } = await supabase.functions.invoke("travelconnection-tickets", {
        body: { event_id: eventId },
      });
      if (cancelled) return;
      // A failed lookup just means no tickets here; the enquiry path stays.
      const payload = error ? null : (res as TicketsResponse);
      setData(payload);
      setLoading(false);
      onAvailability?.(
        !!payload?.prices_visible && (payload.groups ?? []).some((g) => g.available && g.final_sek != null),
      );
      onPlan?.(!!payload?.plan_url && (payload.groups ?? []).length > 0);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const groups = useMemo(() => data?.groups ?? [], [data]);
  const canBuy = !!data?.prices_visible;
  const hasPlan = !!data?.plan_url;

  const areas: PlanArea[] = useMemo(() => {
    const byColor = new Map<string, string[]>();
    for (const g of groups) {
      if (!g.color) continue;
      const c = normColor(g.color);
      const label = canBuy && g.final_sek != null ? `${g.name} · ${formatSek(g.final_sek)}` : g.name;
      byColor.set(c, [...(byColor.get(c) ?? []), label]);
    }
    return [...byColor.entries()].map(([color, labels]) => ({ color, labels }));
  }, [groups, canBuy]);

  const onMap = (g: Group) => !!g.color && !!onPlanColors?.has(normColor(g.color));
  const active = hovered ?? pinned;

  const lines = groups
    .filter((g) => g.category_id && (qty[g.category_id] ?? 0) > 0)
    .map((g) => ({ g, n: qty[g.category_id!] }));
  const count = lines.reduce((s, l) => s + l.n, 0);
  const total = lines.reduce((s, l) => s + (l.g.final_sek ?? 0) * l.n, 0);
  const cheapest = groups.filter((g) => g.available && g.final_sek != null).map((g) => g.final_sek!);

  const step = (g: Group, delta: number) => {
    if (!g.category_id) return;
    setQty((p) => ({
      ...p,
      [g.category_id!]: Math.max(0, Math.min(g.max_qty, (p[g.category_id!] ?? 0) + delta)),
    }));
  };

  /** Clicked an area on the plan: select it and bring its first ticket into view. */
  const pickFromPlan = (color: string) => {
    setPinned((p) => (p === color ? null : color));
    const first = groups.find((g) => g.color && normColor(g.color) === color);
    const el = first ? rowRefs.current[first.category_id ?? first.name] : null;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  /** Tapped "Visa på kartan" (touch has no hover): pin it and show the plan. */
  const showOnPlan = (color: string) => {
    setPinned((p) => (p === color ? null : color));
    // On narrow screens the plan sits above the list, possibly out of view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      planRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const checkout = async () => {
    if (!count) return;
    setBusy(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("travelconnection-checkout", {
        body: {
          event_id: eventId,
          lines: lines.map((l) => ({ category_id: l.g.category_id, qty: l.n })),
        },
      });
      if (error) throw new Error(await errorMessage(error));
      navigate(`/checkout/${(res as { order_id: string }).order_id}`);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  };

  if (loading) return <PickerSkeleton />;
  if (!groups.length) return null;

  const checkoutBar = canBuy && (
    <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Ticket className="h-3.5 w-3.5" />
          {count ? `${count} biljett${count === 1 ? "" : "er"}` : "Välj antal i listan"}
        </p>
        <p className="font-display text-2xl leading-tight">{count ? formatSek(total) : "-"}</p>
      </div>
      <Button onClick={checkout} disabled={!count || busy} className="rounded-xl h-11 px-5 flex-shrink-0">
        {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Till kassan
        {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </div>
  );

  return (
    <div id="biljetter" className="scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-2 mb-4">
        <div>
          <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-1 font-sans">
            {canBuy ? "Biljetter" : "Biljettkategorier"}
          </p>
          <h2 className="font-display text-2xl md:text-3xl leading-tight">
            {canBuy && cheapest.length ? `Biljetter från ${formatSek(Math.min(...cheapest))}` : "Välj var ni vill sitta"}
          </h2>
        </div>
        {hasPlan && onPlanColors && onPlanColors.size > 0 && (
          <p className="text-xs text-muted-foreground hidden md:block">
            Håll muspekaren över en biljett för att se var den ligger på arenan.
          </p>
        )}
      </div>

      {data?.preview && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 flex items-center gap-2">
          <Eye className="h-4 w-4 flex-shrink-0" />
          Förhandsvisning - bara synlig för admin. Kunder ser inte priser förrän de slås på under Påslag.
        </div>
      )}

      <div className={`grid gap-6 ${hasPlan ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]" : ""}`}>
        {/* Tickets */}
        <div className="space-y-4 min-w-0">
          <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
            {groups.map((g) => {
              const key = g.category_id ?? g.name;
              const n = g.category_id ? qty[g.category_id] ?? 0 : 0;
              const open = expanded[key];
              const color = g.color ? normColor(g.color) : null;
              const lit = !!color && active === color;
              const locatable = onMap(g);
              return (
                <div
                  key={key}
                  ref={(el) => (rowRefs.current[key] = el)}
                  onMouseEnter={() => locatable && setHovered(color)}
                  onMouseLeave={() => setHovered(null)}
                  className={`px-4 py-3.5 transition-colors ${g.available ? "" : "opacity-50"} ${lit ? "bg-primary/5" : ""}`}
                  style={lit && color ? { boxShadow: `inset 4px 0 0 ${color}` } : undefined}
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
                        {canBuy && (
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
                          {locatable && (
                            <button
                              type="button"
                              onClick={() => showOnPlan(color!)}
                              className="text-primary hover:underline inline-flex items-center gap-1 lg:hidden"
                            >
                              <MapPin className="h-3 w-3" />
                              {pinned === color ? "Dölj på kartan" : "Visa på kartan"}
                            </button>
                          )}
                          {canBuy && (
                            <span className="text-muted-foreground">
                              {g.available ? `Max ${g.max_qty}` : "Slutsålt just nu"}
                            </span>
                          )}
                        </div>
                        {canBuy && g.available && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button
                              type="button"
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 rounded-full"
                              onClick={() => step(g, -1)}
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
                              onClick={() => step(g, 1)}
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

          {/* Checkout under the list; on large screens it also sits under the plan. */}
          <div className={hasPlan ? "lg:hidden" : ""}>{checkoutBar}</div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {canBuy ? (
              <>
                Platserna i kategorin tilldelas av arrangören - sällskap sitter normalt ihop parvis.
                {data?.guest_details_required && " Klubben kräver namn på alla besökare; vi hör av oss efter köpet."}
                {" "}E-biljetterna släpps närmare matchen och skickas till din e-post och Mitt Kaisen.
              </>
            ) : (
              "Skriv gärna vilken kategori ni vill ha i förfrågan, så återkommer vi med pris och tillgänglighet."
            )}
          </p>
        </div>

        {/* Seating plan: first on phones, a sticky right-hand column on desktop. */}
        {hasPlan && (
          <div ref={planRef} className="order-first lg:order-none min-w-0 scroll-mt-24">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="rounded-xl border border-border bg-card p-3">
                <StadiumPlan
                  src={data!.plan_url!}
                  areas={areas}
                  active={active}
                  onHover={setHovered}
                  onPick={pickFromPlan}
                  onAreasFound={setOnPlanColors}
                  alt={`Läktarkarta ${venueName ?? ""}`}
                />
                <p className="mt-1 text-[11px] text-muted-foreground text-center">
                  Officiell läktarkarta{venueName ? ` · ${venueName}` : ""}
                  {onPlanColors && onPlanColors.size > 0 && " · klicka på ett färgat område"}
                </p>
              </div>
              <div className="hidden lg:block">{checkoutBar}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Same shape as the loaded section, so nothing jumps when tickets arrive. */
function PickerSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Hämtar biljetter">
      <div className="h-3 w-24 rounded bg-muted mb-2" />
      <div className="h-7 w-64 rounded bg-muted mb-4" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
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
        <div className="order-first lg:order-none rounded-xl border border-border bg-card p-3">
          <div className="aspect-[7/5] w-full rounded-lg bg-muted" />
        </div>
      </div>
    </div>
  );
}
