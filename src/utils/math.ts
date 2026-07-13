export function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a));
  let y = Math.abs(Math.trunc(b));

  while (y !== 0) {
    const next = x % y;
    x = y;
    y = next;
  }

  return x || 1;
}

export function simplifyFraction(num: number, den: number): { num: number; den: number } {
  if (den === 0) {
    throw new Error("A fraction denominator cannot be zero.");
  }

  const sign = den < 0 ? -1 : 1;
  const divisor = gcd(num, den);

  return {
    num: sign * (num / divisor),
    den: Math.abs(den / divisor)
  };
}

export function formatFraction(num: number, den: number): string {
  const simplified = simplifyFraction(num, den);
  if (simplified.den === 1) {
    return String(simplified.num);
  }
  return `${simplified.num}/${simplified.den}`;
}

export function formatDecimalFrench(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 1000) / 1000;
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(/0+$/, "");
  return text.replace(".", ",");
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function roundingRelation(value: number, decimals: number): "=" | "≈" {
  return Math.abs(roundTo(value, decimals) - value) < 1e-10 ? "=" : "≈";
}
