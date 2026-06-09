import { formatSek } from "@/lib/formatSek";

/**
 * Resolves the displayed compare-at value with this priority:
 *   1. Explicit compareAtSek (per-event override or xs2 face_value)
 *   2. Synthetic from defaultPct (currentSek * (1 + pct/100))
 *   3. None (no strikethrough)
 *
 * Returns null when no compare-at applies or when it would be <= current.
 */
export function resolveCompareAt(
  currentSek: number | null | undefined,
  compareAtSek: number | null | undefined,
  defaultPct: number | null | undefined,
): number | null {
  const cur = Number(currentSek);
  if (!Number.isFinite(cur) || cur <= 0) return null;
  const explicit = Number(compareAtSek);
  if (Number.isFinite(explicit) && explicit > cur) return Math.round(explicit);
  const pct = Number(defaultPct);
  if (Number.isFinite(pct) && pct > 0) {
    return Math.round(cur * (1 + pct / 100));
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
  compareAtSek?: number | null;
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
  const compareAt = resolveCompareAt(cur, compareAtSek, defaultPct);
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
