import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatSek } from "@/lib/formatSek";
import { normColor } from "@/lib/planColor";
import type { PlanArea } from "@/components/StadiumPlan";

// State shared by the match page's ticket list, seating plan and booking
// card, which sit in different columns: the tickets live from the supplier
// (Travel Connection), the quantities picked, what's highlighted on the plan,
// and the checkout.
//
// Two modes, decided by the server:
//   - buy:   prices are public (or an admin is previewing) — prices, quantity
//            steppers and checkout
//   - guide: prices hidden — the categories and the plan only, so a visitor
//            can see where each ticket is and name it in their enquiry
//
// The browser only ever sends which categories and how many; the order is
// priced on the server.

export type TicketGroup = {
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
  groups: TicketGroup[];
};

export const rowKey = (g: TicketGroup) => g.category_id ?? g.name;

/**
 * Shown when the supplier has no tickets for a fixture — most matches, and
 * every F1 race today. Same list, steppers and request flow, so the page looks
 * the same either way; KAISEN sources the tickets by hand. Never buyable.
 */
const GENERIC_TIERS: Record<string, TicketGroup[]> = {
  soccer: [
    { category_id: "generic:standard", name: "Standardbiljett", description: ["Bra platser på läktarna - sällskap placeras ihop i mån av plats."], color: null, available: true, max_qty: 20 },
    { category_id: "generic:premium", name: "Premium", description: ["De bästa platserna på långsidan, nära mittlinjen."], color: null, available: true, max_qty: 20 },
    { category_id: "generic:vip", name: "VIP & Hospitality", description: ["Lounge med mat och dryck och premiumstolar."], color: null, available: true, max_qty: 20 },
  ],
  formula1: [
    { category_id: "generic:grandstand", name: "Tribunplats", description: ["Sittplats på en av tribunerna längs banan."], color: null, available: true, max_qty: 20 },
    { category_id: "generic:ga", name: "General admission", description: ["Fri rörlighet i publikområdena runt banan."], color: null, available: true, max_qty: 20 },
    { category_id: "generic:vip", name: "VIP & Paddock", description: ["Hospitality med lounge, mat och dryck - Paddock Club i mån av tillgång."], color: null, available: true, max_qty: 20 },
  ],
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

export function useEventTickets(eventId: string | undefined, sport: string | null = "soccer") {
  const navigate = useNavigate();
  const [data, setData] = useState<TicketsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  // Highlighting. A row is lit only when it is the one under the pointer or
  // the one picked — never its siblings, even when they share an area.
  const [hoverRowKey, setHoverRowKey] = useState<string | null>(null);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [pinned, setPinned] = useState<{ key: string; color: string } | null>(null);
  const [onPlanColors, setOnPlanColors] = useState<Set<string> | null>(null);
  const rowEls = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const load = () =>
        supabase.functions.invoke("travelconnection-tickets", { body: { event_id: eventId } });
      // One retry: a supplier hiccup (slow answer, token just rotated)
      // shouldn't swap the real tickets and plan for the generic tiers.
      let { data: res, error } = await load();
      if (error && !cancelled) ({ data: res, error } = await load());
      if (cancelled) return;
      // A failed lookup just means no tickets here; the enquiry path stays.
      setData(error ? null : (res as TicketsResponse));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const supplierGroups = useMemo(() => data?.groups ?? [], [data]);
  // No supplier tickets: offer the generic tiers so the visitor can still say
  // what they want. Not while loading, so the skeleton isn't replaced by
  // generic rows that then swap for real ones.
  const isGeneric = !loading && supplierGroups.length === 0;
  const groups = useMemo(
    () => (isGeneric ? GENERIC_TIERS[sport ?? "soccer"] ?? GENERIC_TIERS.soccer : supplierGroups),
    [isGeneric, sport, supplierGroups],
  );
  const canBuy = !!data?.prices_visible && !isGeneric;
  const hasTickets = groups.length > 0;
  // The home ground's official plan can come without tickets (borrowed from
  // another fixture at the same stadium).
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

  const lines = groups
    .filter((g) => g.category_id && (qty[g.category_id] ?? 0) > 0)
    .map((g) => ({ g, n: qty[g.category_id!] }));
  const count = lines.reduce((s, l) => s + l.n, 0);
  const total = lines.reduce((s, l) => s + (l.g.final_sek ?? 0) * l.n, 0);
  const fromPrice = (() => {
    const p = groups.filter((g) => g.available && g.final_sek != null).map((g) => g.final_sek!);
    return p.length ? Math.min(...p) : null;
  })();

  const onMap = (g: TicketGroup) => !!g.color && !!onPlanColors?.has(normColor(g.color));

  /** Colour lit on the plan: pointer over a row or an area wins over the pick. */
  const hoverRowColor = hoverRowKey ? groups.find((g) => rowKey(g) === hoverRowKey)?.color ?? null : null;
  const activeColor = hoverRowColor ? normColor(hoverRowColor) : hoverColor ?? pinned?.color ?? null;

  /** Info-box text on the plan for the row hovered (or picked) in the list. */
  const litRow = hoverRowKey
    ? groups.find((g) => rowKey(g) === hoverRowKey)
    : pinned
      ? groups.find((g) => rowKey(g) === pinned.key)
      : undefined;
  const activeLabels = litRow
    ? [canBuy && litRow.final_sek != null ? `${litRow.name} · ${formatSek(litRow.final_sek)}` : litRow.name]
    : null;

  const rowLit = (g: TicketGroup) => hoverRowKey === rowKey(g) || (!hoverRowKey && pinned?.key === rowKey(g));

  const step = (g: TicketGroup, delta: number) => {
    if (!g.category_id) return;
    setQty((p) => ({
      ...p,
      [g.category_id!]: Math.max(0, Math.min(g.max_qty, (p[g.category_id!] ?? 0) + delta)),
    }));
  };

  const hoverRow = (g: TicketGroup | null) => setHoverRowKey(g && onMap(g) ? rowKey(g) : null);

  /** Pin a row's area on the plan (touch screens have no hover). */
  const togglePin = (g: TicketGroup) => {
    if (!g.color) return;
    const key = rowKey(g);
    setPinned((p) => (p?.key === key ? null : { key, color: normColor(g.color!) }));
  };

  /** Clicked an area on the plan: pin its first ticket and bring it into view. */
  const pickFromPlan = useCallback((color: string) => {
    const first = groups.find((g) => g.color && normColor(g.color) === color);
    if (!first) return;
    const key = rowKey(first);
    setPinned((p) => (p?.key === key ? null : { key, color }));
    rowEls.current[key]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [groups]);

  const registerRow = (g: TicketGroup) => (el: HTMLElement | null) => {
    rowEls.current[rowKey(g)] = el;
  };

  const checkout = async () => {
    if (!count || !eventId) return;
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

  return {
    loading,
    groups,
    hasTickets,
    isGeneric,
    canBuy,
    hasPlan,
    planUrl: data?.plan_url ?? null,
    preview: !!data?.preview,
    guestDetailsRequired: !!data?.guest_details_required,
    areas,
    // selection + checkout
    qty,
    step,
    lines,
    count,
    total,
    fromPrice,
    checkout,
    busy,
    // plan interplay
    onMap,
    onPlanColors,
    setOnPlanColors,
    activeColor,
    activeLabels,
    rowLit,
    hoverRow,
    setHoverColor,
    togglePin,
    pinnedKey: pinned?.key ?? null,
    pickFromPlan,
    registerRow,
  };
}

export type EventTickets = ReturnType<typeof useEventTickets>;
