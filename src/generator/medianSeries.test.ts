import { describe, expect, it } from "vitest";
import { largeAutomatismes } from "../data/largeAutomatismes";
import { generateQuestion } from "./generateQuestion";

describe("median series", () => {
  it("can present values out of order and sorts them in the correction", () => {
    const automatisme = largeAutomatismes.find((item) => item.title === "Mediane impaire");
    expect(automatisme).toBeDefined();
    const question = generateQuestion(automatisme!, "median-unordered", 30, "3e");
    const values = [...question.statement.matchAll(/\d+(?:[,.]\d+)?/g)].map((match) => Number(match[0].replace(",", ".")));

    expect(values.length).toBeGreaterThanOrEqual(5);
    expect(values.every((value, index) => index === 0 || values[index - 1] <= value)).toBe(false);
    expect(question.correction.toLowerCase()).toContain("ordonne");
  });
});
