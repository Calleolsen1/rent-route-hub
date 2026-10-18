// Crests for clubs outside our football-data plan (football-sync only fills
// team_crests for the competitions it can read). Keys are the exact
// events.home_team / away_team and nav entry names. Source: TheSportsDB.
const BADGE = "https://r2.thesportsdb.com/images/media/team/badge";

export const EXTRA_CRESTS: Record<string, string> = {
  // Scottish Premiership (seeded from Travel Connection)
  "Celtic": `${BADGE}/3uv1641758780002.png`,
  "Glasgow Rangers": `${BADGE}/zgrbl21788969413.png`,
  "Aberdeen": `${BADGE}/f9s6vg1781155578.png`,
  "Dundee": `${BADGE}/tlei9x1750743461.png`,
  "Dundee United": `${BADGE}/orfh821655722356.png`,
  "Falkirk": `${BADGE}/w37ucy1685023169.png`,
  "Heart of Midlothian": `${BADGE}/twqvyt1447597939.png`,
  "Hibernian": `${BADGE}/qjys3z1684928969.png`,
  "Hibernian FC": `${BADGE}/qjys3z1684928969.png`,
  "Kilmarnock": `${BADGE}/ihxzq71785820059.png`,
  "Motherwell": `${BADGE}/3e1dtj1785820999.png`,
  "St. Johnstone": `${BADGE}/j7o7cc1781888845.png`,
  "St. Mirren": `${BADGE}/xvtuvv1447604452.png`,
};
