import { describe, expect, test } from "bun:test";
import { raceSeasonBounds } from "./raceSeason";

describe("advertised race season", () => {
  test("2027 race pages cannot include 2026 ticket events", () => {
    const bounds = raceSeasonBounds("4 juli 2027");
    expect(bounds).toEqual({ dateFrom: "2027-01-01T00:00:00.000Z", dateTo: "2027-12-31T23:59:59.999Z" });
    expect("2026-12-06T13:00:00.000Z" >= (bounds.dateFrom ?? "")).toBe(false);
  });
  test("missing dates do not invent a season", () => {
    expect(raceSeasonBounds(null)).toEqual({});
  });
});