/**
 * Swap hyphens inside names (Saint-Germain, Spa-Francorchamps) for a
 * non-breaking hyphen so display headings never split a name across lines.
 * Looks identical; only affects where the line may break.
 */
export const noBreakHyphen = (s: string | null | undefined): string =>
  (s ?? "").replace(/([\p{L}.])-(\p{L})/gu, "$1‑$2");
