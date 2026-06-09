import { formatSek } from "@/lib/formatSek";

/**
 * Inputs covering the full compare-at priority chain. All optional —
 * callers pass whichever levels apply to their render context.
 *
 * Priority (most specific wins; SEK beats % at the same level):
 *   1. categorySek      → use as-is
 *   2. categoryPct      → current × (1 + pct/100)
 *   3. eventSek         → use as-is
 *   4. eventPct         → current × (1 + pct/100)
 *   5. defaultPct       → current × (1 + pct/100)
 *
 * Returns null when nothing produces a value strictly greater than current.
 */
export type ResolveInput = {
  categorySek?: number | null;
  categoryPct?: number | null;
  eventSek?: number | null;
  eventPct?: number | null;
  defaultPct?: number | null;
};

function fromPct(currentSek: number, pct: number | null | undefined): number | null {
  const p = Number(pct);
  if (!Number.isFinite(p) || p <= 0) return null;
  return Math.round(currentSek * (1 + p / 100));
}

function asExplicitSek(sek: number | null | undefined): number | null {
  const v = Number(sek);
  return Number.isFinite(v) && v > 0 ? Math.round(v) : null;
}

export function resolveCompareAt(
  currentSek: number | null | undefined,
  /**
   * Legacy positional API: a single explicit SEK override.
   * Pass an object to use the full priority chain.
   */
  compareAtSekOrInput?: number | null | ResolveInput,
  defaultPctLegacy?: number | null,
): number | null {
  const cur = Number(currentSek);
  if (!Number.isFinite(cur) || cur <= 0) return null;

  // Legacy two-arg call site → preserve behavior
  if (typeof compareAtSekOrInput !== "object" || compareAtSekOrInput === null) {
    const explicit = asExplicitSek(compareAtSekOrInput as number | null | undefined);
    if (explicit && explicit > cur) return explicit;
    const synth = fromPct(cur, defaultPctLegacy);
    return synth && synth > cur ? synth : null;
  }

  const input = compareAtSekOrInput;
  const candidates: Array<number | null> = [
    asExplicitSek(input.categorySek),
    fromPct(cur, input.categoryPct),
    asExplicitSek(input.eventSek),
    fromPct(cur, input.eventPct),
    fromPct(cur, input.defaultPct),
  ];
  for (const c of candidates) {
    if (c && c > cur) return c;
  }
  return null;
}

/**
 * Reusable price display. Pass currentSek (the actual price), optional
 * compareAtSek (explicit higher number to strike through), and optional
 * defaultPct (platform-wide synthetic compare-at, used only when no
 * explicit compareAt is set).
 *
 * Three render modes:
 *   - Just current price                 →  "Från 2 500 kr"
 *   - With strikethrough comparison      →  "Från ̶3̶ ̶2̶0̶0̶ ̶k̶r̶  2 500 kr  -22%"
 *   - No current price (loading/missing) →  "Se biljetter →"
 */
type Props = {
  currentSek?: number | null;
  /** Legacy single-explicit-SEK override. Prefer `compareAt` for multi-level resolution. */
  compareAtSek?: number | null;
  /** Multi-level override input — overrides `compareAtSek` and `defaultPct` if provided. */
  compareAt?: ResolveInput;
  defaultPct?: number | null;
  /** Show the "Från" prefix. Default true — turn off for single-ticket views where price is exact. */
  showFrom?: boolean;
  /** Variant — "card" for compact list display, "large" for hero / EventDetail. */
  variant?: "card" | "large";
  /** Fallback CTA when no price is available. */
  fallbackLabel?: string;
  className?: string;
};

export function PriceTag({
  currentSek,
  compareAtSek,
  compareAt: compareAtInput,
  defaultPct,
  showFrom = true,
  variant = "card",
  fallbackLabel = "Se biljetter →",
  className,
}: Props) {
  const cur = Number(currentSek);
  if (!Number.isFinite(cur) || cur <= 0) {
    return (
      <span className={`font-semibold text-primary ${className ?? ""}`}>
        {fallbackLabel}
      </span>
    );
  }
  const compareAt = compareAtInput
    ? resolveCompareAt(cur, compareAtInput)
    : resolveCompareAt(cur, compareAtSek, defaultPct);
  const pctOff = compareAt
    ? Math.round(((compareAt - cur) / compareAt) * 100)
    : null;

  if (variant === "large") {
    return (
      <div className={`flex items-baseline gap-3 flex-wrap ${className ?? ""}`}>
        {compareAt && (
          <span className="text-base text-foreground/40 line-through font-medium">
            {formatSek(compareAt)}
          </span>
        )}
        <span className="font-display text-3xl">
          {showFrom && <span className="text-base text-foreground/60 mr-1">Från</span>}
          {formatSek(cur)}
        </span>
        {pctOff != null && pctOff > 0 && (
          <span className="text-xs font-semibold bg-primary/10 text-primary rounded-full px-2 py-0.5">
            −{pctOff}%
          </span>
        )}
      </div>
    );
  }

  // card variant (compact)
  return (
    <div className={`text-right text-sm ${className ?? ""}`}>
      {compareAt && (
        <span className="text-foreground/40 line-through mr-1.5">
          {formatSek(compareAt)}
        </span>
      )}
      {showFrom && <span className="text-foreground/50">Från </span>}
      <span className="font-bold text-foreground">{formatSek(cur)}</span>
      {pctOff != null && pctOff > 0 && (
        <span className="ml-2 text-[10px] font-semibold bg-primary/10 text-primary rounded-full px-1.5 py-0.5 align-middle">
          −{pctOff}%
        </span>
      )}
    </div>
  );
}
