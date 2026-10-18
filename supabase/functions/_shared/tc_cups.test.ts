import { describe, expect, test } from "bun:test";
import { canSeedCupFixture, cupCompetition } from "./tc_cups.ts";
import { FootballMatcher, type OurEvent } from "./tc_match.ts";

describe("Cup coverage", () => {
  for (const [name, code] of [["UEFA Champions League", "CL"], ["UEFA Europa League", "EL"], ["Emirates FA Cup", "FAC"], ["Carabao Cup", "EFL"], ["EFL Cup", "EFL"]]) {
    test(`${name} is supported`, () => expect(cupCompetition(name)?.code).toBe(code));
  }
  test("unadvertised cups are excluded", () => {
    expect(cupCompetition("UEFA Conference League")).toBeUndefined();
    expect(cupCompetition("Scottish League Cup")).toBeUndefined();
  });
  test("only future, named, non-cancelled games can be imported", () => {
    const now = new Date("2026-10-18T22:22:00Z");
    const future = new Date("2026-11-01T15:00:00Z");
    expect(canSeedCupFixture("FA Cup", "Arsenal", "Chelsea", future, "scheduled", now)).toBe(true);
    expect(canSeedCupFixture("FA Cup", null, "Chelsea", future, "scheduled", now)).toBe(false);
    expect(canSeedCupFixture("FA Cup", "Arsenal", "Chelsea", future, "cancelled", now)).toBe(false);
    expect(canSeedCupFixture("FA Cup", "Arsenal", "Chelsea", now, "scheduled", now)).toBe(false);
  });
  test("a cup product cannot attach to a league game between the same teams", () => {
    const base: OurEvent = { id: "league", sport: "soccer", home_team: "Arsenal", away_team: "Chelsea", race_name: null, starts_at: "2026-11-01T15:00:00Z", external_tournament_id: "PL" };
    const matcher = new FootballMatcher([base, { ...base, id: "cup", external_tournament_id: "FAC", starts_at: "2026-11-03T15:00:00Z" }]);
    expect(matcher.match("Arsenal", "Chelsea", new Date(base.starts_at), new Set(), "FAC").eventId).toBe("cup");
    expect(matcher.match("Arsenal", "Chelsea", new Date(base.starts_at), new Set(), "EL").eventId).toBeNull();
  });
});