// Which DPA Sports Travel city serves each stadium, and where the stadium is.
//
// Football fixtures carry a stadium name but no city (football-data puts the
// venue on the team, never the town), and DPA only sells hotels in a short
// list of cities (GET /cities). So the link is written out by hand here:
// stadium → DPA city + coordinates, the coordinates giving each hotel its
// distance to the ground.
//
// Keyed by venue_name as the fixture sync stores it, with the home team as a
// second key for grounds whose name drifts (Brentford still reads "Griffin
// Park", Everton "Goodison Park"; both moved, the city didn't). Coordinates
// are for the current ground. A stadium missing here simply gets no hotel
// list; the page falls back to "hotel on request".

export interface DpaVenue {
  /** Exactly as DPA spells it in GET /cities. */
  city: string;
  lat: number;
  lng: number;
}

const V = (city: string, lat: number, lng: number): DpaVenue => ({ city, lat, lng });

const BY_VENUE: Record<string, DpaVenue> = {
  // London
  "Emirates Stadium": V("London", 51.5549, -0.1084),
  "Stamford Bridge": V("London", 51.4817, -0.191),
  "Selhurst Park": V("London", 51.3983, -0.0855),
  "Craven Cottage": V("London", 51.4749, -0.2217),
  "Tottenham Hotspur Stadium": V("London", 51.6043, -0.0664),
  "London Stadium": V("London", 51.5387, -0.0166),
  "Gtech Community Stadium": V("London", 51.4908, -0.2889),
  // Liverpool
  "Anfield": V("Liverpool", 53.4308, -2.9608),
  "Hill Dickinson Stadium": V("Liverpool", 53.4251, -3.0035),
  // Manchester
  "Etihad Stadium": V("Manchester", 53.4831, -2.2004),
  "Old Trafford": V("Manchester", 53.4631, -2.2913),
  // Birmingham
  "Villa Park": V("Birmingham", 52.5092, -1.8848),
  // Leeds
  "Elland Road": V("Leeds", 53.7778, -1.5721),
  // Barcelona
  "Camp Nou": V("Barcelona", 41.3809, 2.1228),
  "RCDE Stadium": V("Barcelona", 41.3478, 2.0757),
  // Madrid
  "Estadio Santiago Bernabéu": V("Madrid", 40.4531, -3.6883),
  "Estadio Wanda Metropolitano": V("Madrid", 40.4362, -3.5995),
  "Estadio Metropolitano": V("Madrid", 40.4362, -3.5995),
  "Estadio del Rayo Vallecano": V("Madrid", 40.3919, -3.6589),
  "Coliseum Alfonso Pérez": V("Madrid", 40.3257, -3.7148),
  // Germany
  "Allianz Arena": V("Munich", 48.2188, 11.6247),
  "Signal Iduna Park": V("Dortmund", 51.4926, 7.4519),
  "RheinEnergieSTADION": V("Cologne", 50.9336, 6.8751),
  "BayArena": V("Cologne", 51.0383, 7.0022),
  // Italy
  "Stadio Giuseppe Meazza": V("Milan", 45.4781, 9.124),
  "Stadio Olimpico": V("Rome", 41.9339, 12.4547),
};

const BY_HOME_TEAM: Record<string, DpaVenue> = {
  "Brentford": BY_VENUE["Gtech Community Stadium"],
  "Everton": BY_VENUE["Hill Dickinson Stadium"],
  "West Ham United": BY_VENUE["London Stadium"],
};

/** The DPA city and ground for a fixture, or null when DPA has no hotels there. */
export function dpaVenueFor(ev: { sport: string; venue_name: string | null; home_team: string | null }): DpaVenue | null {
  if (ev.sport !== "soccer") return null;
  return (ev.home_team && BY_HOME_TEAM[ev.home_team]) ||
    (ev.venue_name && BY_VENUE[ev.venue_name.trim()]) ||
    null;
}

/** Straight-line distance in km. */
export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
