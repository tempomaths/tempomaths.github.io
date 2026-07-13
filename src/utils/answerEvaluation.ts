function normalizeLatexFraction(value: string): string {
  return value.replace(/\\(?:d?frac)\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "$1/$2");
}

export function normalizeAnswer(value: string): string {
  return normalizeLatexFraction(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\$/g, "")
    .replace(/\\text\s*\{([^{}]*)\}/g, "$1")
    .replace(/\\(?:left|right|,|;|!)/g, "")
    .replace(/\\times|×/g, "x")
    .replace(/\\div|÷/g, "/")
    .replace(/\{([^{}]*)\}/g, "$1")
    .replace(/,/g, ".")
    .replace(/[−–—]/g, "-")
    .replace(/²/g, "2")
    .replace(/³/g, "3")
    .replace(/\s+/g, "")
    .replace(/[.;:]$/g, "");
}

function numericValue(value: string): number | null {
  const withoutEquation = value.replace(/^[a-z]+=/, "");
  const withoutUnits = withoutEquation.replace(/(?:[a-z]+|€|°)(?:\^?[23])?$/g, "");
  const fraction = withoutUnits.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (fraction) {
    const denominator = Number(fraction[2]);
    return denominator === 0 ? null : Number(fraction[1]) / denominator;
  }
  return /^-?\d+(?:\.\d+)?$/.test(withoutUnits) ? Number(withoutUnits) : null;
}

export function isAnswerCorrect(userAnswer: string, expectedAnswer: string): boolean {
  const user = normalizeAnswer(userAnswer);
  const expected = normalizeAnswer(expectedAnswer);
  if (!user) return false;
  if (user === expected) return true;

  const userNumber = numericValue(user);
  const expectedNumber = numericValue(expected);
  return userNumber !== null && expectedNumber !== null && Math.abs(userNumber - expectedNumber) < 1e-9;
}
