/**
 * "Gör det till en citybreak" sections, keyed by lowercased city name as it
 * appears first in a team/race entry's city field ("London, England" -> "london").
 * A city without an entry simply shows no section.
 */
export type CityBreak = {
  title: string;
  /** Paragraphs separated by blank lines. */
  text: string;
  image: string;
};

export const CITY_BREAKS: Record<string, CityBreak> = {};

export function cityBreakFor(city?: string | null): CityBreak | undefined {
  if (!city) return undefined;
  return CITY_BREAKS[city.split(",")[0].trim().toLowerCase()];
}
