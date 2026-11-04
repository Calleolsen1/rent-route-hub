type ExtraTeam = {
  slug: string;
  name: string;
  league: string;
  city: string;
  stadium: string;
  tagline?: string;
};

const EXTRA_TEAMS: ExtraTeam[] = [
  { slug: "crystal-palace", name: "Crystal Palace", league: "Premier League", city: "London, England", stadium: "Selhurst Park", tagline: "South London and Proud" },
  { slug: "everton", name: "Everton", league: "Premier League", city: "Liverpool, England", stadium: "Hill Dickinson Stadium", tagline: "Nil Satis Nisi Optimum" },
  { slug: "fulham", name: "Fulham", league: "Premier League", city: "London, England", stadium: "Craven Cottage", tagline: "Come on you Whites" },
  { slug: "leeds-united", name: "Leeds United", league: "Premier League", city: "Leeds, England", stadium: "Elland Road", tagline: "Marching On Together" },
  { slug: "aston-villa", name: "Aston Villa", league: "Premier League", city: "Birmingham, England", stadium: "Villa Park", tagline: "Prepared" },
  { slug: "brentford", name: "Brentford", league: "Premier League", city: "London, England", stadium: "Gtech Community Stadium", tagline: "Up The Bees" },
  { slug: "athletic-bilbao", name: "Athletic Bilbao", league: "La Liga", city: "Bilbao, Spanien", stadium: "San Mamés", tagline: "Aupa Athletic" },
  { slug: "sevilla", name: "Sevilla", league: "La Liga", city: "Sevilla, Spanien", stadium: "Ramón Sánchez-Pizjuán", tagline: "Nunca te rindas" },
  { slug: "valencia", name: "Valencia", league: "La Liga", city: "Valencia, Spanien", stadium: "Mestalla", tagline: "Amunt Valencia" },
  { slug: "real-sociedad", name: "Real Sociedad", league: "La Liga", city: "San Sebastián, Spanien", stadium: "Reale Arena", tagline: "Aupa Real" },
  { slug: "bayer-leverkusen", name: "Bayer Leverkusen", league: "Bundesliga", city: "Leverkusen, Tyskland", stadium: "BayArena", tagline: "Nur der SVB" },
  { slug: "borussia-monchengladbach", name: "Borussia Mönchengladbach", league: "Bundesliga", city: "Mönchengladbach, Tyskland", stadium: "Borussia-Park", tagline: "Die Fohlen" },
  { slug: "celtic", name: "Celtic", league: "Scottish Premiership", city: "Glasgow, Skottland", stadium: "Celtic Park", tagline: "You'll Never Walk Alone" },
  { slug: "glasgow-rangers", name: "Glasgow Rangers", league: "Scottish Premiership", city: "Glasgow, Skottland", stadium: "Ibrox Stadium", tagline: "Follow Follow" },
];

export const ADDITIONAL_TEAMS = EXTRA_TEAMS.map((team) => ({
  ...team,
  tagline: team.tagline ?? "",
  description: `Upplev ${team.name} på ${team.stadium}. Berätta vad din fotbollsresa ska innehålla så tar vi fram ett reseförslag med matchbiljetter, hotell, flyg och transfer.`,
  fixtures: [],
}));
