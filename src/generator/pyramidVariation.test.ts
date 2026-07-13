import { describe, expect, it } from "vitest";
import { allOfficialAutomatismes } from "../data/allAutomatismes";
import { generateQuestion } from "./generateQuestion";

describe("pyramid variations", () => {
  it("uses every available pyramid family across regenerated data sets", () => {
    const template = allOfficialAutomatismes.find((item) =>
      item.figureTemplate?.kind === "solid" && item.figureTemplate.solid === "pyramide"
    );
    expect(template).toBeDefined();

    const variants = new Set(
      Array.from({ length: 60 }, (_, index) => {
        const figure = generateQuestion(template!, `pyramid-variation-${index}`).figure;
        return figure?.kind === "solid" && figure.solid === "pyramide" ? figure.variant : undefined;
      })
    );

    expect(variants.has(undefined)).toBe(false);
    expect(variants).toEqual(new Set([0, 1, 2, 3, 4, 5]));
  });
});
