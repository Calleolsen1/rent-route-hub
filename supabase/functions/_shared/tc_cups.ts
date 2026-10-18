// Only the four cups advertised by KAISEN may seed supplier-only fixtures.
export const CUP_COMPETITIONS = [
  { code: "CL", name: "Champions League", aliases: ["Champions League", "UEFA Champions League"] },
  { code: "EL", name: "Europa League", aliases: ["Europa League", "UEFA Europa League"] },
  { code: "FAC", name: "FA Cup", aliases: ["FA Cup", "English FA Cup", "Emirates FA Cup", "The Emirates FA Cup"] },
  { code: "EFL", name: "Carabao Cup", aliases: ["Carabao Cup", "EFL Cup", "Football League Cup", "English League Cup", "League Cup", "English Carabao Cup"] },
] as const;

export function cupCompetition(name: string | null | undefined) {
  const key = name?.trim().toLowerCase();
  return CUP_COMPETITIONS.find((cup) => cup.aliases.some((alias) => alias.toLowerCase() === key));
}

export function canSeedCupFixture(competition: string | null | undefined, home: string | null, away: string | null, starts: Date | null, status: string | undefined, now: Date): boolean {
  return !!cupCompetition(competition) && canSeedFootballFixture(home, away, starts, status, now);
}

export function canSeedFootballFixture(home: string | null, away: string | null, starts: Date | null, status: string | undefined, now: Date): boolean {
  return !!home?.trim() && !!away?.trim()
    && !!starts && Number.isFinite(starts.getTime()) && starts > now
    && !/cancel|postpon|finish|complete|played|abandon/i.test(status ?? "");
}