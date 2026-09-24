import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowRight, Eye, Loader2, MapPin, Minus, Plus, Ticket } from "lucide-react";
import { formatSek } from "@/lib/formatSek";
import StadiumPlan, { type PlanArea } from "@/components/StadiumPlan";
import { normColor } from "@/lib/planColor";

// Tickets for one match, live from the supplier (Travel Connection), next to
// the supplier's official seating plan.
//
// Two modes, decided by the server:
//   - buy:   prices are public (or an admin is previewing) — prices, quantity
//            steppers and checkout
//   - guide: prices hidden — the categories and the plan only, so a visitor
//            can see where each ticket is and name it in their enquiry
//
// Hovering a category lights up its area on the plan; hovering the plan
// shows which tickets are sold there; clicking an area selects it. This
// works for every stadium the supplier has a plan for, because the plan is
// painted in the categories' own colours.
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

/** Shown per category before "Visa mer". */
const DESCRIPTION_PREVIEW_LINES = 3;

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
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
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

  if (loading) {
    return (
      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Hämtar biljetter...
      </p>
    );
  }
  if (!groups.length) return null;

  return (
    <div id="biljetter" className="scroll-mt-24">
      <p className="text-[11px] sm:text-xs eyebrow text-primary uppercase mb-3 font-sans">
        {canBuy ? "Biljetter" : "Biljettkategorier & läktarkarta"}
      </p>

      {data?.preview && (
        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 flex items-center gap-2">
          <Eye className="h-4 w-4 flex-shrink-0" />
          Förhandsvisning - bara synlig för admin. Kunder ser inte priser förrän de slås på under Påslag.
        </div>
      )}

      {/* The plan stays in view while the list scrolls under it. */}
      {data?.plan_url && (
        <div className="sticky top-20 z-10 -mx-1 mb-4 rounded-xl border border-border bg-card p-3 shadow-sm">
          <StadiumPlan
            src={data.plan_url}
            areas={areas}
            active={active}
            onHover={setHovered}
            onPick={pickFromPlan}
            onAreasFound={setOnPlanColors}
            alt={`Läktarkarta ${venueName ?? ""}`}
          />
          <p className="mt-2 text-[11px] text-muted-foreground text-center">
            {onPlanColors && onPlanColors.size > 0
              ? "Håll muspekaren över en biljett för att se var den ligger - eller klicka på ett färgat område."
              : "Officiell läktarkarta från arrangören."}
          </p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card divide-y divide-border">
        {groups.map((g) => {
          const key = g.category_id ?? g.name;
          const n = g.category_id ? qty[g.category_id] ?? 0 : 0;
          const open = expanded[key];
          const shown = open ? g.description : g.description.slice(0, DESCRIPTION_PREVIEW_LINES);
          const color = g.color ? normColor(g.color) : null;
          const lit = !!color && active === color;
          const locatable = onMap(g);
          return (
            <div
              key={key}
              ref={(el) => (rowRefs.current[key] = el)}
              onMouseEnter={() => locatable && setHovered(color)}
              onMouseLeave={() => setHovered(null)}
              className={`p-4 sm:p-5 transition-colors ${g.available ? "" : "opacity-50"} ${lit ? "bg-primary/5" : ""}`}
              style={lit && color ? { boxShadow: `inset 4px 0 0 ${color}` } : undefined}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium flex items-center gap-2">
                    {g.color && (
                      <span
                        className="h-3 w-3 rounded-full flex-shrink-0 border border-black/10"
                        style={{ backgroundColor: g.color }}
                        aria-hidden
                      />
                    )}
                    {g.name}
                  </p>
                  {shown.length > 0 && (
                    <ul className="mt-2 space-y-1 text-xs text-muted-foreground list-disc pl-4">
                      {shown.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-1 flex flex-wrap gap-x-3">
                    {g.description.length > DESCRIPTION_PREVIEW_LINES && (
                      <button
                        type="button"
                        onClick={() => setExpanded((p) => ({ ...p, [key]: !open }))}
                        className="text-xs text-primary hover:underline"
                      >
                        {open ? "Visa mindre" : "Visa mer"}
                      </button>
                    )}
                    {/* Touch screens have no hover: tap to show the area. */}
                    {locatable && (
                      <button
                        type="button"
                        onClick={() => setPinned((p) => (p === color ? null : color))}
                        className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <MapPin className="h-3 w-3" />
                        {pinned === color ? "Dölj på kartan" : "Visa på kartan"}
                      </button>
                    )}
                  </div>
                </div>
                {canBuy && (
                  <div className="text-right flex-shrink-0">
                    <p className="font-display text-xl whitespace-nowrap">
                      {g.final_sek != null ? formatSek(g.final_sek) : "-"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">per biljett</p>
                  </div>
                )}
              </div>

              {canBuy && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    {g.available ? `Max ${g.max_qty} per köp` : "Slutsålt just nu"}
                  </p>
                  {g.available && (
                    <div className="flex items-center gap-2">
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
              )}
            </div>
          );
        })}
      </div>

      {canBuy ? (
        <>
          <div className="mt-4 rounded-xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                {count ? `${count} biljett${count === 1 ? "" : "er"}` : "Välj biljetter ovan"}
              </p>
              {count > 0 && <p className="font-display text-2xl">{formatSek(total)}</p>}
            </div>
            <Button onClick={checkout} disabled={!count || busy} className="rounded-xl h-11 px-6">
              {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Till kassan
              {!busy && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            Platserna i kategorin tilldelas av arrangören - sällskap sitter normalt ihop parvis.
            {data?.guest_details_required && " Klubben kräver namn på alla besökare; vi hör av oss efter köpet."}
            {" "}E-biljetterna släpps närmare matchen och skickas till din e-post och Mitt Kaisen.
          </p>
        </>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
          Skriv gärna vilken kategori ni vill ha i förfrågan, så återkommer vi med pris och tillgänglighet.
        </p>
      )}
    </div>
  );
}
