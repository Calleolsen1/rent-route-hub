/** Canonical form of a supplier category colour, e.g. "#ffd663" -> "#FFD663". */
export const normColor = (c: string) => c.trim().toUpperCase().replace(/^#?/, "#");
