// football-data.org v4 client (Deno).
//
// Fixtures for display only — KAISEN sells trips on request, so there is no
// ticket inventory or pricing here, just which games exist and where.
//
// Verified live 2026-09-19 on the FREE tier:
//   - the free token unlocks 13 competitions including all six KAISEN sells:
//     PL, PD (La Liga), SA, BL1, FL1 and CL. Unlike API-Sports' free tier,
//     the CURRENT season is included — that was the blocker that ruled the
//     other provider out.
//   - /competitions/{code}/matches?status=SCHEDULED returns the remaining
//     season in one response (334 Premier League fixtures), no paging
//   - matches carry NO venue. Venue lives on the team, so each competition
//     needs a second call to /teams, which also supplies the crest.
//   - /teams gives 100% venue and crest coverage (20/20 for the PL)
//   - rate limit is 10 requests/minute, hence the throttle below
//
// Env:
//   FOOTBALL_DATA_API_KEY   required
//   FOOTBALL_DATA_BASE_URL  optional, defaults to the public v4 host

const DEFAULT_BASE = "https://api.football-data.org/v4";

/** Competitions KAISEN sells, in sync order. */
export const COMPETITIONS = ["PL", "PD", "SA", "BL1", "FL1", "CL"] as const;
export type CompetitionCode = (typeof COMPETITIONS)[number];

export const COMPETITION_NAMES: Record<string, string> = {
  PL: "Premier League",
  PD: "La Liga",
  SA: "Serie A",
  BL1: "Bundesliga",
  FL1: "Ligue 1",
  CL: "Champions League",
};

export class FootballDataError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "FootballDataError";
  }
}

export interface FdTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
  venue?: string;
  area?: { name?: string };
}

export interface FdMatchTeam {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

export interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number;
  stage?: string;
  homeTeam: FdMatchTeam;
  awayTeam: FdMatchTeam;
  competition?: { code?: string; name?: string };
  season?: { id?: number };
  [k: string]: unknown;
}

/**
 * football-data's team name -> the site's canonical name.
 *
 * Keys are the EXACT `name` strings the API returns, confirmed against live
 * data for all six competitions. Team pages query `home_team.eq.<nav entry
 * name>` — exact equality — so an unmapped spelling means a blank page for a
 * club that actually has fixtures.
 *
 * `shortName` is deliberately not used as the canonical value: it gives
 * "Atleti", "Barça" and "Man United", none of which match the nav entries.
 */
const TEAM_CANONICAL: Record<string, string> = {
  "Athletic Club": "Athletic Bilbao",
  "Bayer 04 Leverkusen": "Bayer Leverkusen",
  "Real Sociedad de Fútbol": "Real Sociedad",
  "Arsenal FC": "Arsenal",
  "Chelsea FC": "Chelsea",
  "Liverpool FC": "Liverpool",
  "Manchester City FC": "Manchester City",
  "Manchester United FC": "Manchester United",
  "Tottenham Hotspur FC": "Tottenham Hotspur",
  "Club Atlético de Madrid": "Atlético Madrid",
  "FC Barcelona": "FC Barcelona",
  "Real Madrid CF": "Real Madrid",
  "FC Bayern München": "Bayern München",
  "Borussia Dortmund": "Borussia Dortmund",
  "FC Internazionale Milano": "Inter",
  "AC Milan": "Milan",
  "AS Roma": "Roma",
  "Juventus FC": "Juventus",
};

/**
 * Canonical display name for a team.
 *
 * Falls back to trimming the club-type noise football-data appends ("Arsenal
 * FC" -> "Arsenal") so unmapped clubs still read naturally on a card, while
 * mapped ones match their landing page exactly.
 */
export function canonicalTeam(name: string | null | undefined): string {
  if (!name) return "";
  const mapped = TEAM_CANONICAL[name];
  if (mapped) return mapped;
  return name
    .replace(/^(FC|AC|AS|SS|SC|CF|RC|CD|SV|VfL|VfB|TSG|1\.\s?FC)\s+/i, "")
    .replace(/\s+(FC|CF|AFC|BC|SK|AC|SC)$/i, "")
    .trim() || name;
}

/** Statuses that represent a game that hasn't been played yet. */
const UPCOMING = new Set(["SCHEDULED", "TIMED"]);
export const isUpcoming = (m: FdMatch): boolean => UPCOMING.has(m.status);

interface Envelope<T> {
  message?: string;
  errorCode?: number;
  [k: string]: unknown;
}

/**
 * Free tier allows 10 requests/minute and answers 429 past that. A full sync
 * is 12 calls (six competitions x teams + matches), so pace them rather than
 * burst and retry.
 */
const MIN_INTERVAL_MS = 6500;
let lastCallAt = 0;

async function throttle(): Promise<void> {
  const wait = lastCallAt + MIN_INTERVAL_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCallAt = Date.now();
}

export class FootballDataClient {
  private token: string;
  private base: string;

  constructor(token?: string) {
    const t = token ?? Deno.env.get("FOOTBALL_DATA_API_KEY");
    if (!t) throw new FootballDataError("FOOTBALL_DATA_API_KEY is not configured", 401);
    this.token = t;
    this.base = (Deno.env.get("FOOTBALL_DATA_BASE_URL") ?? DEFAULT_BASE).replace(/\/+$/, "");
  }

  private async get<T>(path: string): Promise<T> {
    await throttle();
    const res = await fetch(`${this.base}${path}`, {
      headers: { "X-Auth-Token": this.token, Accept: "application/json" },
    });

    const text = await res.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      throw new FootballDataError(
        `football-data ${path}: non-JSON response (HTTP ${res.status})`,
        res.status,
      );
    }

    if (!res.ok) {
      const msg = (body as Envelope<unknown>)?.message ?? `HTTP ${res.status}`;
      throw new FootballDataError(`football-data ${path}: ${msg}`, res.status);
    }
    return body as T;
  }

  /** Teams in a competition, indexed by id — the only source of venue. */
  async teamsByIdFor(code: string): Promise<Map<number, FdTeam>> {
    const body = await this.get<{ teams?: FdTeam[] }>(`/competitions/${code}/teams`);
    const map = new Map<number, FdTeam>();
    for (const t of body.teams ?? []) map.set(t.id, t);
    return map;
  }

  /** Remaining fixtures for a competition's current season. */
  async upcomingMatches(code: string): Promise<FdMatch[]> {
    const body = await this.get<{ matches?: FdMatch[] }>(
      `/competitions/${code}/matches?status=SCHEDULED`,
    );
    return (body.matches ?? []).filter(isUpcoming);
  }
}
