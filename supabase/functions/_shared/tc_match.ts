// Matching Travel Connection products onto the fixtures we already list.
//
// Pure functions, no Deno or Supabase imports, so the rules can be tested
// locally against real sandbox data with plain Node.
//
// Why matching rather than importing: fixtures come from football-data.org
// and Jolpica. A supplier that inserts its own events shows every game twice
// (that is what retired OneClicket). Travel Connection only ever attaches
// tickets to an event that already exists.
//
// Verified against the sandbox catalogue on 2026-09-23: 213 of 253 football
// products matched on team pair alone before the alias rules below; kickoff
// dates differed by at most 2 days. Every remaining miss was either Scottish
// football (not sold) or a spelling difference these rules now cover.

/** Travel Connection competition id -> the football-data code we list. */
export const TC_COMPETITION_CODES: Record<number, string> = {
  401: "PL", // English Premier League
  405: "PD", // Spanish La Liga
  407: "FL1", // French Ligue 1
  409: "CL", // UEFA Champions League
  410: "SA", // Italian Serie A
  426: "BL1", // German Bundesliga
};

/**
 * How far apart our kickoff and theirs may be and still be the same game.
 * Supplier dates are often placeholders (`date_confirmed: false`) until TV
 * picks are made, so this is wide. A team pair only meets at one ground once
 * per competition, so a wide window can't pick the wrong fixture.
 */
export const FOOTBALL_WINDOW_DAYS = 21;

/** An F1 weekend is Friday–Sunday; allow for the supplier dating it by Friday. */
export const F1_WINDOW_DAYS = 4;

/** Words that carry no identity: club-type prefixes, "Calcio", founding years. */
const NOISE = new Set([
  "fc", "afc", "cf", "ac", "as", "ss", "ssc", "us", "es", "aj", "rc", "bc",
  "sc", "sco", "cfc", "acf", "ogc", "osc", "losc", "sv", "vfl", "vfb", "tsg",
  "calcio", "club", "athletic", "de", "the", "and",
]);

/**
 * Supplier spelling -> our spelling, for names no generic rule can bridge.
 * Keys and values are both normalised with `teamKey`, so write them plainly.
 */
const ALIASES: Record<string, string> = {
  "Inter Milan": "Inter",
  "RC Lens": "Racing Club de Lens",
  "Racing Lens": "Racing Club de Lens",
  "Bayern Munich": "Bayern München",
  "Atletico de Madrid": "Atlético Madrid",
  "Athletic Bilbao": "Athletic Club",
  "Wolves": "Wolverhampton Wanderers",
  "Spurs": "Tottenham Hotspur",
};

function stripAccents(s: string): string {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "");
}

/** Lowercase, accent-free, punctuation-free identity tokens for a team name. */
export function teamTokens(name: string): string[] {
  const cleaned = stripAccents(name)
    .toLowerCase()
    .replace(/&/g, " and ")
    // "A.J.Auxerre" and "U.S. Lecce": dots between initials go, so the
    // initials collapse into one noise token instead of separate letters.
    .replace(/\b([a-z])\.(?=[a-z]\b|[a-z]\.)/g, "$1")
    .replace(/\./g, " ")
    .replace(/[^a-z0-9 ]/g, " ");
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const meaningful = tokens.filter((t) => !NOISE.has(t) && !/^(18|19|20)\d\d$/.test(t) && !/^\d{1,2}$/.test(t));
  // A name made only of noise ("AS", "FC") keeps what it had rather than
  // vanishing and matching everything.
  return meaningful.length ? meaningful : tokens;
}

/** Canonical comparison key for a team name, aliases applied. */
export function teamKey(name: string): string {
  const aliased = aliasFor(name) ?? name;
  return teamTokens(aliased).join(" ");
}

function aliasFor(name: string): string | undefined {
  const k = teamTokens(name).join(" ");
  for (const [from, to] of Object.entries(ALIASES)) {
    if (teamTokens(from).join(" ") === k) return to;
  }
  return undefined;
}

/**
 * Map one supplier team name onto one of our team names, or null.
 *
 * Exact key match first. Otherwise a token-subset match — "Le Havre Athletic
 * Club" contains every token of "Le Havre" — but only when exactly one of our
 * names qualifies. That uniqueness rule is what keeps "Paris" (Paris FC) from
 * swallowing "Paris Saint-Germain": PSG's tokens are a superset of both, so
 * the subset rule sees two candidates and refuses to guess.
 */
export function resolveTeam(supplierName: string, ourNames: readonly string[]): string | null {
  const key = teamKey(supplierName);
  if (!key) return null;

  const exact = ourNames.filter((n) => teamKey(n) === key);
  if (exact.length === 1) return exact[0];
  if (exact.length > 1) return null;

  const theirs = new Set(key.split(" "));
  const theirSquad = squadMarker(key);
  const subset = ourNames.filter((n) => {
    const ours = teamKey(n).split(" ");
    if (!ours.length) return false;
    // "Manchester United Women" contains every token of "Manchester United",
    // but it is a different team. Only compare like with like.
    if (squadMarker(ours.join(" ")) !== theirSquad) return false;
    const oursSet = new Set(ours);
    const oursInTheirs = ours.every((t) => theirs.has(t));
    const theirsInOurs = [...theirs].every((t) => oursSet.has(t));
    return oursInTheirs || theirsInOurs;
  });
  return subset.length === 1 ? subset[0] : null;
}

/** Women's, youth and reserve sides, which share a name with the senior team. */
function squadMarker(key: string): string {
  const m = key.match(/\b(women|ladies|femenino|feminine|u\d{2}|youth|ii|b)\b/);
  return m ? m[1] : "";
}

export interface OurEvent {
  id: string;
  sport: "soccer" | "formula1";
  home_team: string | null;
  away_team: string | null;
  race_name: string | null;
  starts_at: string;
  external_tournament_id: string | null;
}

export interface MatchResult {
  eventId: string | null;
  /** Swedish, shown in the admin review list when nothing matched. */
  note: string | null;
  daysApart?: number;
}

const DAY_MS = 86_400_000;

function nearest(events: OurEvent[], startsAt: Date): { ev: OurEvent; days: number } | null {
  let best: { ev: OurEvent; days: number } | null = null;
  for (const ev of events) {
    const days = Math.abs(new Date(ev.starts_at).getTime() - startsAt.getTime()) / DAY_MS;
    if (!best || days < best.days) best = { ev, days };
  }
  return best;
}

/**
 * Index our football fixtures once per sync, then match each supplier game.
 * `taken` holds event ids already claimed so two supplier products can never
 * land on the same fixture (the DB also enforces this with a UNIQUE).
 */
export class FootballMatcher {
  private names: string[];
  private byPair = new Map<string, OurEvent[]>();
  private resolved = new Map<string, string | null>();

  constructor(events: readonly OurEvent[]) {
    const soccer = events.filter((e) => e.sport === "soccer" && e.home_team && e.away_team);
    this.names = [...new Set(soccer.flatMap((e) => [e.home_team!, e.away_team!]))];
    for (const e of soccer) {
      const k = `${e.home_team}|${e.away_team}`;
      const list = this.byPair.get(k) ?? [];
      list.push(e);
      this.byPair.set(k, list);
    }
  }

  team(supplierName: string): string | null {
    if (!this.resolved.has(supplierName)) {
      this.resolved.set(supplierName, resolveTeam(supplierName, this.names));
    }
    return this.resolved.get(supplierName)!;
  }

  match(home: string, away: string, startsAt: Date, taken: ReadonlySet<string>): MatchResult {
    const h = this.team(home);
    const a = this.team(away);
    if (!h || !a) {
      const missing = [!h && home, !a && away].filter(Boolean).join(" och ");
      return { eventId: null, note: `Känner inte igen laget: ${missing}` };
    }
    const candidates = (this.byPair.get(`${h}|${a}`) ?? []).filter((e) => !taken.has(e.id));
    if (!candidates.length) {
      return { eventId: null, note: `Ingen match ${h} – ${a} i vår spelschema` };
    }
    const best = nearest(candidates, startsAt)!;
    if (best.days > FOOTBALL_WINDOW_DAYS) {
      return {
        eventId: null,
        note: `${h} – ${a} finns, men ${Math.round(best.days)} dagar ifrån leverantörens datum`,
      };
    }
    return { eventId: best.ev.id, note: null, daysApart: best.days };
  }
}

/** Does a supplier "event" product look like a Formula 1 race weekend? */
export function isF1Product(name: string): boolean {
  return /\b(formula\s*1|formula one|f1)\b|grand prix/i.test(name);
}

/** Match an F1 product to the Jolpica race whose weekend it falls in. */
export function matchF1(events: readonly OurEvent[], startsAt: Date, taken: ReadonlySet<string>): MatchResult {
  const races = events.filter((e) => e.sport === "formula1" && !taken.has(e.id));
  const best = nearest(races, startsAt);
  if (!best || best.days > F1_WINDOW_DAYS) {
    return { eventId: null, note: "Inget F1-race i vår kalender den helgen" };
  }
  return { eventId: best.ev.id, note: null, daysApart: best.days };
}
