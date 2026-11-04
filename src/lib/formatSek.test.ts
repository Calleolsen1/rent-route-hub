import { expect, test } from "bun:test";
import { formatEventDate, formatEventDateOnly, formatEventDateTime } from "./formatSek";

// matchkortens datumrad ska börja med stor bokstav: "Lördag 9 december 2026"
test("formatEventDate inleder med stor bokstav", () => {
  expect(formatEventDate("2026-12-09T17:30:00Z")).toBe("Onsdag 9 december 2026");
});

test("formatEventDate ger aldrig liten första bokstav", () => {
  for (const iso of ["2026-11-09T18:00:00Z", "2026-12-19T15:00:00Z", "2027-01-02T12:00:00Z"]) {
    const first = formatEventDate(iso).charAt(0);
    expect(first).toBe(first.toUpperCase());
  }
});

// oförändrade grannar: datum utan veckodag och datum med tid ska se ut som förut
test("datum utan veckodag och datum med tid är orörda", () => {
  expect(formatEventDateOnly("2026-12-09T17:30:00Z")).toBe("9 december 2026");
  expect(formatEventDateTime("2026-12-09T17:30:00Z")).toBe("9 december 2026 kl. 18:30");
});
