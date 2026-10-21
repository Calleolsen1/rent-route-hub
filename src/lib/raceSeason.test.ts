import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { raceSeasonBounds } from "./raceSeason";

describe("advertised race season", () => {
  test("2027 race pages cannot include 2026 ticket events", () => {
    const bounds = raceSeasonBounds("4 juli 2027");
    assert.deepEqual(bounds, { dateFrom: "2027-01-01T00:00:00.000Z", dateTo: "2027-12-31T23:59:59.999Z" });
    assert.equal("2026-12-06T13:00:00.000Z" >= (bounds.dateFrom ?? ""), false);
  });
  test("missing dates do not invent a season", () => {
    assert.deepEqual(raceSeasonBounds(null), {});
  });
});