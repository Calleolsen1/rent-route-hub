// Central source of truth for sports data (teams, leagues, F1 races).
// These constants drive the landing pages; names must match synced event data.

export type TeamFixture = {
  opponent: string;
  date: string;
  competition: string;
};

export type TeamInfo = {
  slug: string;
  name: string;
  league: string;
  city: string;
  stadium: string;
  tagline: string;
  description: string;
  fixtures: TeamFixture[];
};

export type LeagueInfo = {
  league: string;
  teams: string[]; // display names
};

export type RaceInfo = {
  slug: string;
  name: string;
  circuit: string;
  city: string;
  date: string;
  shortDate: string;
  tagline: string;
  description: string;
};

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/å|ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const TEAMS: Record<string, TeamInfo> = {
  "bayern-munchen": { slug: "bayern-munchen", name: "Bayern München", league: "Bundesliga", city: "München, Tyskland", stadium: "Allianz Arena", tagline: "Tysk fotbollskungadynasti", description: "Upplev Bayern München LIVE på Allianz Arena – en av Europas mest ikoniska fotbollsarenor. Se de tyska mästarna bjuda på fotboll i världsklass och känn den mäktiga stämningen bland tiotusentals passionerade supportrar i München.", fixtures: [{ opponent: "Borussia Dortmund", date: "12 oktober 2026", competition: "Bundesliga" }, { opponent: "Real Madrid", date: "5 november 2026", competition: "Champions League" }, { opponent: "RB Leipzig", date: "23 november 2026", competition: "Bundesliga" }] },
  "borussia-dortmund": { slug: "borussia-dortmund", name: "Borussia Dortmund", league: "Bundesliga", city: "Dortmund, Tyskland", stadium: "Signal Iduna Park", tagline: "Den gula väggen", description: "Upplev Borussia Dortmund LIVE på Signal Iduna Park, där den ikoniska Gula väggen skapar en av Europas mäktigaste fotbollsatmosfärer. Tusentals passionerade supportrar och gulsvarta färger gör matchdagen i Dortmund till en oförglömlig fotbollsupplevelse.", fixtures: [{ opponent: "Bayern München", date: "12 oktober 2026", competition: "Bundesliga" }, { opponent: "Schalke 04", date: "26 oktober 2026", competition: "Bundesliga" }, { opponent: "Manchester City", date: "12 november 2026", competition: "Champions League" }] },
  "atletico-madrid": { slug: "atletico-madrid", name: "Atlético Madrid", league: "La Liga", city: "Madrid, Spanien", stadium: "Metropolitano", tagline: "Cholismo & passion", description: "Känn passionen på Riyadh Air Metropolitano när Atlético Madrids hängivna supportrar lyfter stämningen till nya nivåer. Här väntar intensiv fotboll, rödvita färger och en matchupplevelse där varje minut räknas – mitt i pulserande Madrid.", fixtures: [{ opponent: "Real Madrid", date: "28 september 2026", competition: "La Liga" }, { opponent: "FC Barcelona", date: "18 oktober 2026", competition: "La Liga" }, { opponent: "Sevilla", date: "8 november 2026", competition: "La Liga" }] },
  "fc-barcelona": { slug: "fc-barcelona", name: "FC Barcelona", league: "La Liga", city: "Barcelona, Spanien", stadium: "Spotify Camp Nou", tagline: "Més que un club", description: "Se FC Barcelona LIVE och upplev fotboll i världsklass på ikoniska Spotify Camp Nou. Kombinera matchen med en weekend i Barcelona – en stad fylld av fantastisk arkitektur, härliga restauranger, shopping och strandliv. Den perfekta mixen av fotboll och storstadspuls!", fixtures: [{ opponent: "Real Madrid", date: "26 oktober 2026", competition: "La Liga" }, { opponent: "Atlético Madrid", date: "18 oktober 2026", competition: "La Liga" }, { opponent: "Bayern München", date: "3 december 2026", competition: "Champions League" }] },
  "real-madrid": { slug: "real-madrid", name: "Real Madrid", league: "La Liga", city: "Madrid, Spanien", stadium: "Santiago Bernabéu", tagline: "Hala Madrid", description: "Se Real Madrid LIVE på ikoniska Santiago Bernabéu och kombinera världsfotboll i toppklass med en weekend i Madrid. Upptäck stadens livliga tapasbarer, shopping, kultur och pulserande nattliv – ett perfekt resmål för en fotbollsresa utöver det vanliga.", fixtures: [{ opponent: "FC Barcelona", date: "26 oktober 2026", competition: "La Liga" }, { opponent: "Atlético Madrid", date: "28 september 2026", competition: "La Liga" }, { opponent: "Liverpool", date: "26 november 2026", competition: "Champions League" }] },
  "arsenal": { slug: "arsenal", name: "Arsenal", league: "Premier League", city: "London, England", stadium: "Emirates Stadium", tagline: "North London is red", description: "Arsenal på Emirates - en av Londons mest moderna arenor med klassisk fotbollskultur från Highbury i ryggen.", fixtures: [{ opponent: "Tottenham", date: "4 oktober 2026", competition: "Premier League" }, { opponent: "Chelsea", date: "1 november 2026", competition: "Premier League" }, { opponent: "Manchester City", date: "22 november 2026", competition: "Premier League" }] },
  "chelsea": { slug: "chelsea", name: "Chelsea", league: "Premier League", city: "London, England", stadium: "Stamford Bridge", tagline: "Pride of London", description: "Stamford Bridge i hjärtat av London - Chelsea bjuder på Premier League och Champions League i världsklass.", fixtures: [{ opponent: "Arsenal", date: "1 november 2026", competition: "Premier League" }, { opponent: "Liverpool", date: "15 november 2026", competition: "Premier League" }, { opponent: "Manchester United", date: "6 december 2026", competition: "Premier League" }] },
  "liverpool": { slug: "liverpool", name: "Liverpool", league: "Premier League", city: "Liverpool, England", stadium: "Anfield", tagline: "You'll Never Walk Alone", description: "Anfield - där You'll Never Walk Alone ekar från läktarna. En av världens mest känslosamma fotbollsupplevelser.", fixtures: [{ opponent: "Manchester United", date: "18 oktober 2026", competition: "Premier League" }, { opponent: "Chelsea", date: "15 november 2026", competition: "Premier League" }, { opponent: "Real Madrid", date: "26 november 2026", competition: "Champions League" }] },
  "manchester-city": { slug: "manchester-city", name: "Manchester City", league: "Premier League", city: "Manchester, England", stadium: "Etihad Stadium", tagline: "Modern fotbolls toppskikt", description: "Manchester City på Etihad - modern fotboll i absolut världsklass under Pep Guardiola och stjärnlaget.", fixtures: [{ opponent: "Manchester United", date: "25 oktober 2026", competition: "Premier League" }, { opponent: "Arsenal", date: "22 november 2026", competition: "Premier League" }, { opponent: "Borussia Dortmund", date: "12 november 2026", competition: "Champions League" }] },
  "manchester-united": { slug: "manchester-united", name: "Manchester United", league: "Premier League", city: "Manchester, England", stadium: "Old Trafford", tagline: "Theatre of Dreams", description: "Old Trafford - Theatre of Dreams. En av världens mest legendariska fotbollsarenor och Manchester Uniteds hem.", fixtures: [{ opponent: "Liverpool", date: "18 oktober 2026", competition: "Premier League" }, { opponent: "Manchester City", date: "25 oktober 2026", competition: "Premier League" }, { opponent: "Chelsea", date: "6 december 2026", competition: "Premier League" }] },
  "tottenham-hotspur": { slug: "tottenham-hotspur", name: "Tottenham Hotspur", league: "Premier League", city: "London, England", stadium: "Tottenham Hotspur Stadium", tagline: "To dare is to do", description: "Tottenhams nya arena i norra London är en av världens mest moderna fotbollsanläggningar. Premier League på toppnivå.", fixtures: [{ opponent: "Arsenal", date: "4 oktober 2026", competition: "Premier League" }, { opponent: "Chelsea", date: "9 november 2026", competition: "Premier League" }, { opponent: "Manchester City", date: "29 november 2026", competition: "Premier League" }] },
  "milan": { slug: "milan", name: "Milan", league: "Serie A", city: "Milano, Italien", stadium: "San Siro", tagline: "Sempre Milan", description: "AC Milan på San Siro - sju gånger Champions League-mästare och en av italiensk fotbolls största stoltheter.", fixtures: [{ opponent: "Inter", date: "22 november 2026", competition: "Serie A" }, { opponent: "Juventus", date: "4 oktober 2026", competition: "Serie A" }, { opponent: "Roma", date: "15 november 2026", competition: "Serie A" }] },
  "inter": { slug: "inter", name: "Inter", league: "Serie A", city: "Milano, Italien", stadium: "San Siro", tagline: "Pazza Inter Amala", description: "Känn passionen på San Siro och kombinera Inter-matchen med en weekend i Milano – en stad med fantastisk mat, shopping och italiensk stil. Missa inte derbyt mot Milan – Derby della Madonnina - ett av fotbollsvärldens hetaste derbyn!", fixtures: [{ opponent: "Milan", date: "22 november 2026", competition: "Serie A" }, { opponent: "Juventus", date: "1 november 2026", competition: "Serie A" }, { opponent: "Napoli", date: "8 november 2026", competition: "Serie A" }] },
  "juventus": { slug: "juventus", name: "Juventus", league: "Serie A", city: "Turin, Italien", stadium: "Allianz Stadium", tagline: "Fino alla fine", description: "Juventus på Allianz Stadium i Turin - den gamla damen och Italiens mest framgångsrika klubb.", fixtures: [{ opponent: "Milan", date: "4 oktober 2026", competition: "Serie A" }, { opponent: "Inter", date: "1 november 2026", competition: "Serie A" }, { opponent: "Roma", date: "29 november 2026", competition: "Serie A" }] },
  "roma": { slug: "roma", name: "Roma", league: "Serie A", city: "Rom, Italien", stadium: "Stadio Olimpico", tagline: "Forza Roma", description: "AS Roma på Stadio Olimpico - passionerad fotboll i Italiens eviga stad. Romkultur och fotboll i världsklass.", fixtures: [{ opponent: "Milan", date: "15 november 2026", competition: "Serie A" }, { opponent: "Juventus", date: "29 november 2026", competition: "Serie A" }, { opponent: "Lazio", date: "13 december 2026", competition: "Serie A" }] },
};

export const FOOTBALL_LEAGUES: LeagueInfo[] = [
  { league: "Bundesliga", teams: ["Bayern München", "Borussia Dortmund"] },
  { league: "La Liga", teams: ["Atlético Madrid", "FC Barcelona", "Real Madrid"] },
  { league: "Premier League", teams: ["Arsenal", "Chelsea", "Liverpool", "Manchester City", "Manchester United", "Tottenham Hotspur"] },
  { league: "Serie A", teams: ["Milan", "Inter", "Juventus", "Roma"] },
];

export const RACES: Record<string, RaceInfo> = {
  "ungern": { slug: "ungern", name: "Ungerns Grand Prix", circuit: "Hungaroring", city: "Budapest, Ungern", date: "26 juli 2026", shortDate: "26 juli", tagline: "Monaco utan barriärerna", description: "Hungaroring är en av kalenderns mest tekniska banor - en kurvig utmaning där föraren räknas mer än bilen." },
  "italien-monza": { slug: "italien-monza", name: "Italiens Grand Prix", circuit: "Autodromo Nazionale Monza", city: "Monza, Italien", date: "6 september 2026", shortDate: "6 september", tagline: "Hastighetens tempel", description: "Monza - F1:s historiska hem och hastighetens tempel. Tifosin målar tribunerna röda när Ferrari kör hemma." },
  "spanien-madrid": { slug: "spanien-madrid", name: "Spaniens Grand Prix", circuit: "Madring", city: "Madrid, Spanien", date: "13 september 2026", shortDate: "13 september", tagline: "Spaniens nya F1-bana", description: "Madring är F1:s nya stadsbana i Madrid - en spektakulär kombination av gata och permanent bana." },
  "usa-austin": { slug: "usa-austin", name: "USA:s Grand Prix", circuit: "Circuit of the Americas", city: "Austin, Texas", date: "25 oktober 2026", shortDate: "25 oktober", tagline: "Allt är större i Texas", description: "Austin bjuder på fest, livemusik och en av kalenderns mest älskade banor - Circuit of the Americas." },
  "las-vegas": { slug: "las-vegas", name: "Las Vegas Grand Prix", circuit: "Las Vegas Strip Circuit", city: "Las Vegas, USA", date: "21 november 2026", shortDate: "21 november", tagline: "F1 under neonen", description: "F1-bilar i 350 km/h ner för Las Vegas Strip i mörkret - kalenderns mest spektakulära nattevent." },
  "qatar": { slug: "qatar", name: "Qatars Grand Prix", circuit: "Lusail International Circuit", city: "Doha, Qatar", date: "29 november 2026", shortDate: "29 november", tagline: "Race under stjärnorna", description: "Lusail bjuder på ett av säsongens snabbaste flytande race under Qatars stjärnhimmel." },
  "abu-dhabi": { slug: "abu-dhabi", name: "Abu Dhabi Grand Prix", circuit: "Yas Marina Circuit", city: "Abu Dhabi, UAE", date: "6 december 2026", shortDate: "6 december", tagline: "Säsongsfinalen", description: "F1-säsongens finale på Yas Marina - race från sol till mörker med yacht-show och världsklass-fest." },
  "miami": { slug: "miami", name: "Miami Grand Prix", circuit: "Miami International Autodrome", city: "Miami, USA", date: "9 maj 2027", shortDate: "9 maj 2027", tagline: "F1 möter South Beach", description: "Miami GP runt Hard Rock Stadium - F1, palmer och South Beach-fest i Florida-värmen." },
  "monaco": { slug: "monaco", name: "Monacos Grand Prix", circuit: "Circuit de Monaco", city: "Monte Carlo, Monaco", date: "6 juni 2027", shortDate: "6 juni 2027", tagline: "Kronan i F1-kalendern", description: "Monaco - F1:s mest prestigefulla race. Gatorna i Monte Carlo, yachterna i hamnen, glamouren utan motstycke." },
  "algarve": { slug: "algarve", name: "Algarves Grand Prix", circuit: "Autódromo do Algarve", city: "Portimão, Portugal", date: "13 juni 2027", shortDate: "13 juni 2027", tagline: "Bergen och Atlanten", description: "Portimão - en av F1:s mest dramatiska banor med branta backar och Atlanten som fond." },
};

export const F1_RACES_NAV = Object.values(RACES).map((r) => ({
  slug: r.slug,
  label: r.name.replace(/s Grand Prix$/i, "").replace(/ Grand Prix$/i, ""),
  date: r.shortDate,
}));

export const getTeam = (slug?: string) => (slug ? TEAMS[slug] : undefined);
export const getRace = (slug?: string) => (slug ? RACES[slug] : undefined);
