/** Default "Kompletta paket" lines, used when an entry has no features_json. */
export const DEFAULT_FEATURES_BY_KIND: Record<string, string[]> = {
  team: [
    "Matchbiljetter - välj mellan olika biljettkategorier",
    "Hotell - centralt i olika kategorier inklusive frukost",
    "Flyg - avresa från valfri flygplats",
    "Transfer - möjlighet att förboka transport till hotell",
  ],
  race: [
    "Biljetter - weekend alt söndag i olika kategorier",
    "Hotell - centralt inklusive frukost i olika kategorier",
    "Flyg - avresa från valfri flygplats",
    "Transfers - möjlighet att förboka transport till hotell",
  ],
};

/** "Kompletta paket till Emirates Stadium" / "Formel 1-resa till Monza". */
export function packageTitle(kind: string, sportLabel: string, venue?: string | null) {
  if (kind === "race") return venue ? `${sportLabel}-resa till ${venue}` : `${sportLabel}-resa`;
  return venue ? `Kompletta paket till ${venue}` : "Kompletta paket";
}
