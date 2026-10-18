import { expect, test } from "bun:test";
import { isOfferedScottishFixture, scottishTeam } from "./tc_scotland.ts";
test("Scottish Premiership offers Celtic home fixtures", () => expect(isOfferedScottishFixture(431, "Celtic FC")).toBe(true));
test("Scottish Premiership offers Rangers home fixtures", () => {
  expect(isOfferedScottishFixture(431, "Rangers FC")).toBe(true);
  expect(scottishTeam("Rangers FC")).toBe("Glasgow Rangers");
});
test("other Scottish home teams and other competitions are excluded", () => {
  expect(isOfferedScottishFixture(431, "Aberdeen")).toBe(false);
  expect(isOfferedScottishFixture(401, "Celtic FC")).toBe(false);
  expect(isOfferedScottishFixture(431, "Celtic Women")).toBe(false);
});