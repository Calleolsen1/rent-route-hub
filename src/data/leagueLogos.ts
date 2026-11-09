import bundesligaLogo from "@/assets/league-bundesliga.png.asset.json";
import laLigaLogo from "@/assets/league-la-liga.png.asset.json";
import premierLeagueLogo from "@/assets/league-premier-league.png.asset.json";
import serieALogo from "@/assets/league-serie-a.png.asset.json";
import scottishPremiershipLogo from "@/assets/league-scottish-premiership.png.asset.json";
import championsLeagueLogo from "@/assets/cup-champions-league.png.asset.json";
import europaLeagueLogo from "@/assets/cup-europa-league.png.asset.json";
import faCupLogo from "@/assets/cup-fa-cup.png.asset.json";
import carabaoCupLogo from "@/assets/cup-carabao-cup.png.asset.json";

/** League logos keyed by league slug (slugify(group_label)). */
export const leagueLogos: Record<string, string> = {
  bundesliga: bundesligaLogo.url,
  "la-liga": laLigaLogo.url,
  "premier-league": premierLeagueLogo.url,
  "serie-a": serieALogo.url,
  "scottish-premiership": scottishPremiershipLogo.url,
};

/** Cup logos keyed by cup slug (src/data/cups.ts). */
export const cupLogos: Record<string, string> = {
  "champions-league": championsLeagueLogo.url,
  "europa-league": europaLeagueLogo.url,
  "fa-cup": faCupLogo.url,
  "carabao-cup": carabaoCupLogo.url,
};
