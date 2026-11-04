import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { formatEventDate, formatEventDateOnly, formatEventDateTime } from "./formatSek";

describe("matchkortens datumrad", () => {
  test("börjar med stor bokstav", () => {
    assert.equal(formatEventDate("2026-12-09T17:30:00Z"), "Onsdag 9 december 2026");
  });
  test("ger aldrig liten första bokstav", () => {
    for (const iso of ["2026-11-09T18:00:00Z", "2026-12-19T15:00:00Z", "2027-01-02T12:00:00Z"]) {
      const first = formatEventDate(iso).charAt(0);
      assert.equal(first, first.toUpperCase());
    }
  });
  test("datum utan veckodag och datum med tid är orörda", () => {
    assert.equal(formatEventDateOnly("2026-12-09T17:30:00Z"), "9 december 2026");
    assert.equal(formatEventDateTime("2026-12-09T17:30:00Z"), "9 december 2026 kl. 18:30");
  });
});
