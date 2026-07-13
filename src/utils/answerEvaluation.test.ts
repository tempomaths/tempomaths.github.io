import { describe, expect, it } from "vitest";
import { isAnswerCorrect, normalizeAnswer } from "./answerEvaluation";

describe("answer evaluation", () => {
  it("normalizes decimal commas and mathematical spacing", () => {
    expect(normalizeAnswer(" 12,5 cm ")).toBe("12.5cm");
    expect(isAnswerCorrect("12,5", "$12{,}5\\,cm$")).toBe(true);
  });

  it("recognizes equivalent fractions", () => {
    expect(isAnswerCorrect("1/2", "$\\dfrac{2}{4}$")).toBe(true);
  });

  it("accepts a numerical answer without its displayed unit", () => {
    expect(isAnswerCorrect("24", "$24\\text{ cm}^2$")).toBe(true);
    expect(isAnswerCorrect("7", "$x=7$")).toBe(true);
  });

  it("does not validate an empty or different answer", () => {
    expect(isAnswerCorrect("", "4")).toBe(false);
    expect(isAnswerCorrect("5", "4")).toBe(false);
  });
});
