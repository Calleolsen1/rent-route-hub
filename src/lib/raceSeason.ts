/** Keep ticket results in the season advertised on the race page. */
export function raceSeasonBounds(dateText?: string | null): { dateFrom?: string; dateTo?: string } {
  const match = dateText?.match(/\b(\d{4})\b/);
  if (!match) return {};
  const year = Number(match[1]);
  return {
    dateFrom: new Date(Date.UTC(year, 0, 1)).toISOString(),
    dateTo: new Date(Date.UTC(year + 1, 0, 1) - 1).toISOString(),
  };
}