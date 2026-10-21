// Jolpica F1 client (Deno) — the community successor to Ergast, which shut
// down after the 2024 season.
//
// https://api.jolpi.ca/ergast/f1
//
// No API key, no account, no rate-limit header. Free and open, but also
// community-run with no SLA — if it disappears, F1 needs another source.
// That risk is contained: it feeds ~10 race landing pages, nothing else.
//
// Verified live 2026-09-19:
//   - /{season}/races/ returns the full calendar in one call (23 races for
//     2026) but defaults to limit=30, so always pass an explicit limit
//   - future seasons exist as valid 200s with total=0 until the calendar is
//     published — 2027 is empty today, so an empty season is normal, not an
//     error worth failing a sync over
//   - every race carries Circuit.Location (locality, country, lat/long) and
//     session times (practices, qualifying)
//   - names are English ("United States GP"); the site's nav entries
//     are Swedish, hence RACE_NAME_SV below

const DEFAULT_BASE = "https://api.jolpi.ca/ergast/f1";

export class JolpicaError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "JolpicaError";
  }
}

export interface JolpicaLocation {
  lat?: string;
  long?: string;
  locality?: string;
  country?: string;
}

export interface JolpicaCircuit {
  circuitId: string;
  circuitName: string;
  url?: string;
  Location?: JolpicaLocation;
}

export interface JolpicaSession {
  date?: string;
  time?: string;
}

export interface JolpicaRace {
  season: string;
  round: string;
  raceName: string;
  url?: string;
  date: string;
  time?: string;
  Circuit: JolpicaCircuit;
  FirstPractice?: JolpicaSession;
  SecondPractice?: JolpicaSession;
  ThirdPractice?: JolpicaSession;
  Qualifying?: JolpicaSession;
  Sprint?: JolpicaSession;
  [k: string]: unknown;
}

interface MRData {
  MRData: {
    total?: string;
    limit?: string;
    offset?: string;
    RaceTable?: { Races?: JolpicaRace[] };
  };
}

/**
 * English race name -> the Swedish name used by the site's nav entries.
 *
 * Race pages query `race_name.eq.<nav entry name>` — exact equality — so an
 * unmapped name means the landing page silently shows nothing. Unmapped races
 * keep their English name and still appear in general listings.
 */
const RACE_NAME_SV: Record<string, string> = {
  "monaco grand prix": "Monacos GP",
  "united states grand prix": "USA:s GP",
  "spanish grand prix": "Spaniens GP",
  "italian grand prix": "Italiens GP",
  "hungarian grand prix": "Ungerns GP",
  "qatar grand prix": "Qatars GP",
  "portuguese grand prix": "Algarves GP",
  "abu dhabi grand prix": "Abu Dhabi GP",
  "las vegas grand prix": "Las Vegas GP",
  "miami grand prix": "Miami GP",
  "british grand prix": "Storbritanniens GP",
  "belgian grand prix": "Belgiens GP",
  "dutch grand prix": "Nederländernas GP",
  "austrian grand prix": "Österrikes GP",
  "french grand prix": "Frankrikes GP",
  "german grand prix": "Tysklands GP",
  "japanese grand prix": "Japans GP",
  "australian grand prix": "Australiens GP",
  "canadian grand prix": "Kanadas GP",
  "brazilian grand prix": "Brasiliens GP",
  "mexico city grand prix": "Mexikos GP",
  "mexican grand prix": "Mexikos GP",
  "azerbaijan grand prix": "Azerbajdzjans GP",
  "singapore grand prix": "Singapores GP",
  "bahrain grand prix": "Bahrains GP",
  "saudi arabian grand prix": "Saudiarabiens GP",
  "chinese grand prix": "Kinas GP",
  "emilia romagna grand prix": "Emilia Romagnas GP",
};

/**
 * Swedish display name for a race.
 *
 * Note the 2026 calendar contains "Bahrain Grand Prix in Malaysia" — a
 * provisional entry whose name doesn't follow the usual pattern. Stripping a
 * trailing " in <place>" keeps it mapping onto the Bahrain page rather than
 * becoming its own orphan race.
 */
export function raceNameSv(raceName: string): string {
  const cleaned = (raceName ?? "").replace(/\s+in\s+[A-Za-z ]+$/i, "").trim();
  return RACE_NAME_SV[cleaned.toLowerCase()] ?? (cleaned || raceName);
}

/** Combine Ergast's split date + time into an ISO timestamp. */
export function raceStartsAt(race: JolpicaRace): string {
  const time = race.time && /^\d{2}:\d{2}/.test(race.time)
    ? (race.time.endsWith("Z") ? race.time : `${race.time}Z`)
    : "12:00:00Z";
  return `${race.date}T${time}`;
}

/**
 * When the race weekend opens — first practice if published, else the race
 * day. Useful for a travel page: the trip starts before Sunday.
 */
export function weekendStartsAt(race: JolpicaRace): string | null {
  const fp = race.FirstPractice;
  if (!fp?.date) return null;
  const time = fp.time
    ? (fp.time.endsWith("Z") ? fp.time : `${fp.time}Z`)
    : "09:00:00Z";
  return `${fp.date}T${time}`;
}

/** Stable external id — season + round is unique and never renumbered. */
export const jolpicaExternalId = (race: JolpicaRace): string =>
  `f1_${race.season}_${race.round}`;

export class JolpicaClient {
  private base: string;

  constructor(baseUrl?: string) {
    this.base = (baseUrl ?? Deno.env.get("JOLPICA_BASE_URL") ?? DEFAULT_BASE)
      .replace(/\/+$/, "");
  }

  /**
   * Every race of a season. Returns [] for a season whose calendar isn't
   * published yet — a valid 200 with total=0, not an error.
   */
  async listRaces(season: number | string): Promise<JolpicaRace[]> {
    // Default page size is 30; a season is never larger, but ask explicitly
    // so a future expanded calendar can't be silently truncated.
    const url = `${this.base}/${season}/races/?format=json&limit=100`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });

    if (!res.ok) {
      throw new JolpicaError(`jolpica ${season}: HTTP ${res.status}`, res.status);
    }

    const body = (await res.json()) as MRData;
    return body?.MRData?.RaceTable?.Races ?? [];
  }

  /**
   * Current season plus the next one, so the calendar rolls over without a
   * code change in December. The next season is usually empty until the FIA
   * publishes it.
   */
  async listUpcoming(now = new Date()): Promise<JolpicaRace[]> {
    const year = now.getUTCFullYear();
    const seasons = [year, year + 1];
    const out: JolpicaRace[] = [];
    for (const s of seasons) {
      try {
        out.push(...(await this.listRaces(s)));
      } catch (e) {
        // A missing next-season calendar must not fail the whole sync.
        console.warn(`[jolpica] season ${s} unavailable:`, (e as Error).message);
      }
    }
    const cutoff = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    return out.filter((r) => raceStartsAt(r) >= cutoff);
  }
}
