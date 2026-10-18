export function scottishTeam(name: string | null | undefined): string | null {
  const key = name?.trim().toLowerCase();
  if (key === "celtic" || key === "celtic fc") return "Celtic";
  if (["rangers", "rangers fc", "glasgow rangers", "glasgowrangers"].includes(key ?? "")) return "Glasgow Rangers";
  return null;
}

export function isOfferedScottishFixture(competitionId: number | null, home: string | null): boolean {
  return competitionId === 431 && scottishTeam(home) !== null;
}