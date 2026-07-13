import { describe, expect, it } from "vitest";
import { randomInt, seededRandom } from "./random";

describe("seeded random", () => {
  it("is reproducible", () => {
    const first = seededRandom("classe-5e");
    const second = seededRandom("classe-5e");

    expect([first(), first(), first()]).toEqual([second(), second(), second()]);
  });

  it("generates integers inside bounds", () => {
    const rng = seededRandom("bounds");
    const values = Array.from({ length: 30 }, () => randomInt(2, 7, rng));
    expect(values.every((value) => value >= 2 && value <= 7)).toBe(true);
  });
});
