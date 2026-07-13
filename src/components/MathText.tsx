import katex from "katex";
import type { ReactNode } from "react";
import "katex/dist/katex.min.css";

type Props = {
  text: string;
};

type TextPart =
  | { kind: "text"; value: string }
  | { kind: "math"; value: string };

const explicitMathRegex = /(\$\$[^$]+\$\$|\$[^$]+\$|\\\([^)]*\\\)|\\\[[^\]]*\\\])/g;
const fractionOnlyRegex = /^-?\d+(?:[,.]\d+)?\/-?\d+(?:[,.]\d+)?$/;
const fractionRegex =
  /\\(?:dfrac|frac)\{([^{}]+)\}\{([^{}]+)\}|(?<![\w:])(-?\d+(?:[,.]\d+)?)\/(-?\d+(?:[,.]\d+)?)(?![\w/])/g;
const simpleSlashFractionRegex =
  /((?:-?\d+(?:\{,\}\d+)?|[a-z])(?:\^\{-?\d+\})?)\/(-?\d+(?:\{,\}\d+)?(?:\^\{-?\d+\})?)/gi;
const functionRegex = /\b[a-z]\([^)]*\)\s*=\s*[^.;!?]+/i;
const equationRegex =
  /(?:\(?-?\d+(?:[,.]\d+)?[a-z]?(?:\s*(?:[+\-×÷*/=<>≤≥]|\\times|\\div)\s*\(?-?\d*(?:[,.]\d+)?[a-z]?\)?)+|\b[a-z]\s*=\s*-?\d+(?:[,.]\d+)?|\([^)]+\)(?:²|³|\^\d+)?)/i;
const geometryTokenRegex =
  /(?<![\p{L}\p{N}_°])(?:\[(?:[A-Z](?:['’])?){2}\]|\((?:[A-Z](?:['’])?){2}\)|(?:[A-Z](?:['’])?){2,4}|[A-KM-Z](?:['’])?)(?![\p{L}\p{N}_])/gu;
const nonMathematicalAcronyms = new Set(["DNB", "PGCD", "PPCM", "SOH", "CAH", "TOA"]);

function findGeometryToken(value: string): RegExpMatchArray | null {
  geometryTokenRegex.lastIndex = 0;
  let match = geometryTokenRegex.exec(value);
  while (match && nonMathematicalAcronyms.has(match[0])) {
    match = geometryTokenRegex.exec(value);
  }
  geometryTokenRegex.lastIndex = 0;
  return match;
}

function stripDelimiters(value: string): string {
  if (value.startsWith("$$") && value.endsWith("$$")) return value.slice(2, -2);
  if (value.startsWith("$") && value.endsWith("$")) return value.slice(1, -1);
  if (value.startsWith("\\(") && value.endsWith("\\)")) return value.slice(2, -2);
  if (value.startsWith("\\[") && value.endsWith("\\]")) return value.slice(2, -2);
  return value;
}

function normalizeLatex(value: string): string {
  return value
    .trim()
    .replace(/\bV(?=\s*(?:=|\\approx|≈))/g, "\\mathcal{V}")
    .replace(/(\d),(\d)/g, "$1{,}$2")
    .replace(/[−–]/g, "-")
    .replace(/×/g, "\\times")
    .replace(/÷/g, "\\div")
    .replace(/≤/g, "\\le")
    .replace(/≥/g, "\\ge")
    .replace(/π/g, "\\pi")
    .replace(/²/g, "^{2}")
    .replace(/³/g, "^{3}")
    .replace(/(\d+|[a-z]|\))\^(-?\d+)/gi, "$1^{$2}")
    .replace(fractionRegex, (_, n1: string, d1: string, n2: string, d2: string) => {
      const numerator = n1 ?? n2;
      const denominator = d1 ?? d2;
      return `\\dfrac{${numerator}}{${denominator}}`;
    })
    .replace(simpleSlashFractionRegex, "\\dfrac{$1}{$2}");
}

function renderMath(value: string, key: string): ReactNode {
  const latex = normalizeLatex(stripDelimiters(value));

  try {
    return (
      <span
        className={fractionOnlyRegex.test(value.trim()) ? "math-render math-render-fraction" : "math-render"}
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(latex, {
            displayMode: false,
            throwOnError: false,
            strict: "ignore",
            trust: false
          })
        }}
        key={key}
      />
    );
  } catch {
    return (
      <span className="math-render-fallback" key={key}>
        {value}
      </span>
    );
  }
}

function splitExplicitMath(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(explicitMathRegex)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      parts.push({ kind: "text", value: text.slice(lastIndex, index) });
    }
    parts.push({ kind: "math", value: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

function splitAutoMath(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const rest = text.slice(cursor);
    const functionMatch = functionRegex.exec(rest);
    const equationMatch = equationRegex.exec(rest);
    const geometryMatch = findGeometryToken(rest);
    const candidates = [functionMatch, equationMatch, geometryMatch]
      .filter(Boolean)
      .sort((a, b) => (a?.index ?? 0) - (b?.index ?? 0));
    const match = candidates[0];

    if (!match) {
      parts.push({ kind: "text", value: rest });
      break;
    }

    const index = match.index ?? 0;
    const raw = match[0].replace(/[.,;!?]+$/, "");
    const start = cursor + index;
    const end = start + raw.length;

    if (start > cursor) {
      parts.push({ kind: "text", value: text.slice(cursor, start) });
    }
    parts.push({ kind: "math", value: raw });
    cursor = end;
  }

  return parts;
}

export function MathText({ text }: Props) {
  const explicitParts = splitExplicitMath(text);
  const parts = explicitParts.flatMap((part) => (part.kind === "math" ? [part] : splitAutoMath(part.value)));

  return (
    <span className="math-text">
      {parts.map((part, index) =>
        part.kind === "math" ? renderMath(part.value, `${index}-${part.value}`) : part.value
      )}
    </span>
  );
}
