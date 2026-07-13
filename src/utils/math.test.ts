import { describe, expect, it } from "vitest";
import { formatDecimalFrench, formatFraction, gcd, roundingRelation, simplifyFraction } from "./math";

describe("math helpers", () => {
  it("computes gcd", () => {
    expect(gcd(42, 56)).toBe(14);
  });

  it("simplifies fractions", () => {
    expect(simplifyFraction(18, 24)).toEqual({ num: 3, den: 4 });
    expect(formatFraction(12, 4)).toBe("3");
  });

  it("formats French decimals", () => {
    expect(formatDecimalFrench(6.2)).toBe("6,2");
    expect(formatDecimalFrench(12)).toBe("12");
  });

  it("distinguishes exact values from rounded values", () => {
    expect(roundingRelation(12, 2)).toBe("=");
    expect(roundingRelation(34 / 3, 2)).toBe("≈");
  });
});
