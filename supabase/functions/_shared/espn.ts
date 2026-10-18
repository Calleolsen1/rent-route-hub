// ESPN public scoreboard client (Deno) — fixtures for the cups football-data's
// free plan doesn't cover (Europa League, FA Cup, Carabao Cup).
//
// Verified live 2026-10-18:
//   - no key, no auth: site.api.espn.com/apis/site/v2/sports/soccer/{league}/scoreboard
//   - `dates=YYYYMM` returns a whole month (36 Europa League games for Nov);
//     date RANGES (YYYYMMDD-YYYYMMDD) answer 400, so we walk month by month
//   - events carry venue name + city/country and a team logo, unlike football-data
//   - FA Cup only lists rounds once drawn; PL clubs enter in the 3rd round (Jan)
//   - unofficial API: if ESPN changes shape the sync logs an error per cup and
//     the existing fixtures stay put (retire only runs for cups that synced)

import { canonicalTeam } from "./footballdata.ts";
import { scottishTeam } from "./tc_scotland.ts";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer";

/** Codes match tc_cups.ts so Travel Connection links onto these instead of seeding duplicates. */
export const ESPN_CUPS = [
  { code: "EL", league: "uefa.europa", name: "Europa League" },
  { code: "FAC", league: "eng.fa", name: "FA Cup" },
  { code: "EFL", league: "eng.league_cup", name: "Carabao Cup" },
] as const;

/** How many months ahead to look, current month included. Covers every final. */
const MONTHS_AHEAD = 9;

export interface EspnTeam {
  id?: string;
  displayName?: string;
  logo?: string;
}

export interface EspnEvent {
  id: string;
  date: string;
  status?: { type?: { state?: string } };
  competitions?: {
    venue?: { fullName?: string; address?: { city?: string; country?: string } };
    competitors?: { homeAway?: string; team?: EspnTeam }[];
  }[];
}

/** ESPN spellings that differ from the site's nav entries. */
const ESPN_CANONICAL: Record<string, string> = {
  "AC Milan": "Milan",
  "Internazionale": "Inter",
  "Atletico Madrid": "Atlético Madrid",
  "Barcelona": "FC Barcelona",
  "Bayern Munich": "Bayern München",
  "Borussia Monchengladbach": "Borussia Mönchengladbach",
};

export function espnTeam(name: string | null | undefined): string {
  if (!name) return "";
  return scottishTeam(name) ?? ESPN_CANONICAL[name] ?? canonicalTeam(name);
}

/** Knockout ties before the draw have placeholder sides ("TBD", "Winner Match 3"). */
function isRealTeam(t: EspnTeam | undefined): t is EspnTeam & { displayName: string } {
  const n = t?.displayName?.trim();
  return !!n && !/^(tbd|tba)$|winner|loser|\//i.test(n);
}

export function monthsFrom(now: Date, count = MONTHS_AHEAD): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1));
    out.push(`${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

export interface EspnFixture {
  id: string;
  startsAt: string;
  home: EspnTeam & { displayName: string };
  away: EspnTeam & { displayName: string };
  venue: string | null;
  city: string | null;
  country: string | null;
}

/** Unplayed fixtures with both sides known. */
export function toFixture(e: EspnEvent, now: Date): EspnFixture | null {
  if (e.status?.type?.state !== "pre") return null;
  const starts = new Date(e.date);
  if (!Number.isFinite(starts.getTime()) || starts <= now) return null;
  const c = e.competitions?.[0];
  const home = c?.competitors?.find((x) => x.homeAway === "home")?.team;
  const away = c?.competitors?.find((x) => x.homeAway === "away")?.team;
  if (!isRealTeam(home) || !isRealTeam(away)) return null;
  return {
    id: e.id,
    startsAt: starts.toISOString(),
    home,
    away,
    venue: c?.venue?.fullName ?? null,
    city: c?.venue?.address?.city ?? null,
    country: c?.venue?.address?.country ?? null,
  };
}

/** All upcoming fixtures for one ESPN league. Throws if any month fails, so a partial read never retires games. */
export async function upcomingCupFixtures(league: string, now = new Date()): Promise<EspnFixture[]> {
  const byId = new Map<string, EspnFixture>();
  const months = await Promise.all(monthsFrom(now).map(async (m) => {
    const res = await fetch(`${BASE}/${league}/scoreboard?dates=${m}&limit=500`);
    if (!res.ok) throw new Error(`ESPN ${league} ${m}: HTTP ${res.status}`);
    const body = await res.json() as { events?: EspnEvent[] };
    return body.events ?? [];
  }));
  for (const e of months.flat()) {
    const f = toFixture(e, now);
    if (f) byId.set(f.id, f);
  }
  return [...byId.values()];
}
