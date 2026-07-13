import { describe, expect, it } from "vitest";
import { generateQuestion } from "../generator/generateQuestion";
import type { Automatisme } from "../types";
import { makeScratchProgram } from "../utils/scratchSyntax";
import { allOfficialAutomatismes } from "./allAutomatismes";
import { siteProgressionChapters } from "./siteProgression";

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\\times|×/g, " multiplication ")
    .replace(/\\div|÷/g, " division ")
    .replace(/\+/g, " addition ")
    .replace(/-/g, " soustraction ")
    .replace(/\{\{[^}]+\}\}/g, "#")
    .replace(/[^a-z0-9#]+/g, " ")
    .trim();
}

function typeFingerprint(item: Automatisme): string {
  return normalized(item.statementTemplate);
}

function groupAt(source: string, start: number): { value: string; end: number } | null {
  if (source[start] !== "{") return null;
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return { value: source.slice(start + 1, index), end: index + 1 };
    }
  }
  return null;
}

function expandLatexCommands(source: string): string {
  let result = source;

  for (const command of ["\\dfrac", "\\frac"]) {
    let commandIndex = result.indexOf(command);
    while (commandIndex >= 0) {
      const numerator = groupAt(result, commandIndex + command.length);
      const denominator = numerator ? groupAt(result, numerator.end) : null;
      if (!numerator || !denominator) break;
      result = `${result.slice(0, commandIndex)}((${expandLatexCommands(numerator.value)})/(${expandLatexCommands(denominator.value)}))${result.slice(denominator.end)}`;
      commandIndex = result.indexOf(command);
    }
  }

  let squareRootIndex = result.indexOf("\\sqrt");
  while (squareRootIndex >= 0) {
    const radicand = groupAt(result, squareRootIndex + "\\sqrt".length);
    if (!radicand) break;
    result = `${result.slice(0, squareRootIndex)}Math.sqrt(${expandLatexCommands(radicand.value)})${result.slice(radicand.end)}`;
    squareRootIndex = result.indexOf("\\sqrt");
  }

  return result;
}

function numericLatexValue(source: string): number | null {
  const expression = expandLatexCommands(source)
    .replace(/_[{][^{}]+[}]/g, "")
    .replace(/\\left|\\right/g, "")
    .replace(/\\times|\\cdot/g, "*")
    .replace(/\\div/g, "/")
    .replace(/\\pi/g, "Math.PI")
    .replace(/\{,\}/g, ".")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/\^\{([^{}]+)\}/g, "**($1)")
    .replace(/\^(-?\d+)/g, "**($1)")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, "")
    .replace(/°/g, "");

  const withoutMathNames = expression.replaceAll("Math.sqrt", "").replaceAll("Math.PI", "");
  if (/\\|\?|%|[A-Za-z]/.test(withoutMathNames)) return null;
  if (!/^[0-9+*/().\-]+$/.test(expression)) return null;

  try {
    const value = Function(`"use strict"; return (${expression});`)() as unknown;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function falseNumericEqualities(text: string): string[] {
  const failures: string[] = [];
  for (const match of text.matchAll(/\$([^$]+)\$/g)) {
    const chunk = match[1];
    if (!chunk.includes("=")) continue;
    const values = chunk.split("=").map(numericLatexValue);
    if (values.length < 2 || values.some((value) => value === null)) continue;
    const first = values[0] as number;
    if (values.some((value) => Math.abs((value as number) - first) > 0.002)) {
      failures.push(`${chunk} -> ${values.join(" ; ")}`);
    }
  }
  return failures;
}

function numericalAnswerValue(source: string): number | null {
  const mathChunk = source.match(/\$([^$]+)\$/)?.[1];
  if (mathChunk) {
    const value = numericLatexValue(mathChunk);
    if (value !== null) return value;
  }

  const plainExpression = source
    .trim()
    .replace(/^\$|\$$/g, "")
    .replace(/\s*(?:mm|cm|dm|m|km|g|kg|L|€)(?:²|³)?\s*$/i, "")
    .trim();
  const plainValue = numericLatexValue(plainExpression);
  if (plainValue !== null) return plainValue;

  const decimal = source.trim().match(/^(-?\d+(?:[,.]\d+)?)/)?.[1];
  return decimal ? Number(decimal.replace(",", ".")) : null;
}

describe("complete mathematical content audit", () => {
  it("provides at least ten genuinely distinct slide types in every chapter", () => {
    const weakChapters = Object.values(siteProgressionChapters)
      .flat()
      .map((chapter) => {
        const items = allOfficialAutomatismes.filter((item) => item.chapterId === chapter.id);
        return {
          chapter: chapter.id,
          count: new Set(items.map(typeFingerprint)).size
        };
      })
      .filter(({ count }) => count < 10);

    expect(weakChapters).toEqual([]);
    expect(allOfficialAutomatismes.some((item) => item.tags.includes("variation-thematique"))).toBe(false);
  });

  it("keeps solid figures inside the mathematical scope of their chapter", () => {
    const allowedSolids: Record<string, string[]> = {
      "6e-chap-16": ["pave", "prisme"],
      "5e-chap-02": ["pave", "prisme", "cylindre"],
      "5e-chap-19": ["pave", "prisme", "cylindre"],
      "4e-chap-14": ["pyramide", "cone"],
      "3e-chap-12": ["sphere"]
    };
    const mismatches = allOfficialAutomatismes
      .filter((item) => item.chapterId && allowedSolids[item.chapterId])
      .filter((item) => item.figureTemplate?.kind === "solid")
      .filter((item) =>
        item.figureTemplate?.kind === "solid" &&
        !allowedSolids[item.chapterId as string].includes(item.figureTemplate.solid)
      )
      .map((item) => `${item.id}: ${item.figureTemplate?.kind === "solid" ? item.figureTemplate.solid : ""}`);

    expect(mismatches).toEqual([]);

    const sphereChapter = allOfficialAutomatismes.filter((item) => item.chapterId === "3e-chap-12");
    expect(sphereChapter.length).toBeGreaterThanOrEqual(10);
    expect(
      sphereChapter.every(
        (item) => item.figureTemplate?.kind === "solid" && item.figureTemplate.solid === "sphere"
      )
    ).toBe(true);
  });

  it("keeps sensitive chapters at the intended school level", () => {
    const forbiddenByChapter: Record<string, RegExp> = {
      "6e-chap-15": /augmentation|réduction|reversible|réversible|retrouver le total/i,
      "6e-chap-16": /pyramide|cône|cone|cylindre|sphère|sphere|volume/i,
      "5e-chap-14": /double distributivité|identité remarquable/i,
      "5e-chap-17": /produit nul|réduction préalable|parenthèses et relatifs/i,
      "4e-chap-02": /expression littérale|fraction et relatif|puissance d'un relatif/i,
      "4e-chap-07": /double distributivité|identité remarquable/i,
      "4e-chap-14": /pavé|prisme|cylindre|sphère|boule/i,
      "3e-chap-12": /pavé|prisme|pyramide|cône|cone|cylindre/i
    };
    const offLevel = allOfficialAutomatismes
      .filter((item) => item.chapterId && forbiddenByChapter[item.chapterId])
      .filter((item) => forbiddenByChapter[item.chapterId as string].test(`${item.title} ${item.statementTemplate}`))
      .map((item) => `${item.id}: ${item.title}`);

    expect(offLevel).toEqual([]);
  });

  it("keeps sixth-grade content free of negative numbers and advanced Scratch control flow", () => {
    const failures: string[] = [];
    allOfficialAutomatismes
      .filter((item) => item.levels.includes("6e"))
      .forEach((item) => {
        ["sixth-a", "sixth-b", "sixth-c"].forEach((seed) => {
          const question = generateQuestion(item, seed, item.defaultDurationSeconds, "6e");
          const rendered = `${question.statement} ${question.shortAnswer} ${question.correction} ${question.figure ? JSON.stringify(question.figure) : ""}`;
          if (/(?:^|[\s$;(])-\d/.test(rendered)) failures.push(`${item.id} (${seed}): nombre négatif`);
        });
      });

    const sixthScratch = allOfficialAutomatismes.filter((item) => item.chapterId === "6e-chap-20");
    expect(sixthScratch.length).toBeGreaterThanOrEqual(10);
    expect(
      sixthScratch.some((item) => /coordonn/i.test(`${item.title} ${(item.tags ?? []).join(" ")}`))
    ).toBe(true);
    expect(
      sixthScratch.filter((item) => /condition|inégalité|boucle imbriquée|répéter jusqu|expression de programme/i.test(
        `${item.title} ${item.statementTemplate} ${(item.tags ?? []).join(" ")}`
      ))
    ).toEqual([]);
    expect(failures).toEqual([]);
  });

  it("renders every algorithmic slide as valid authentic Scratch blocks", () => {
    const failures: string[] = [];
    allOfficialAutomatismes
      .filter((item) => item.domain === "algorithmique")
      .forEach((item) => {
        const question = generateQuestion(item, "scratch-audit", item.defaultDurationSeconds);
        if (question.figure?.kind !== "scratch") {
          failures.push(`${item.id}: figure Scratch absente`);
          return;
        }
        const program = makeScratchProgram(question.figure.blocks);
        if (/:: grey|r\?p|repeter|degres|resultat|reponse|\bge\b|NaN|undefined/i.test(program)) {
          failures.push(`${item.id}: ${program}`);
        }
      });

    expect(failures).toEqual([]);
  });

  it("reserves the third-grade chapter 20 for official DNB slides", () => {
    const dnbChapter = allOfficialAutomatismes.filter((item) => item.chapterId === "3e-chap-20");
    expect(dnbChapter.length).toBeGreaterThanOrEqual(10);
    expect(dnbChapter.every((item) => item.id.startsWith("dnb-officiel:") && item.tags.includes("dnb-officiel"))).toBe(true);
  });

  it("separates direct and reciprocal uses of Pythagoras and Thales", () => {
    const directPythagoras = allOfficialAutomatismes.filter((item) => item.chapterId === "4e-chap-06");
    const classificationPythagoras = allOfficialAutomatismes.filter((item) => item.chapterId === "4e-chap-09");
    expect(directPythagoras.some((item) => item.tags.includes("calcul-longueur"))).toBe(true);
    expect(directPythagoras.some((item) => item.tags.includes("reciproque") || item.tags.includes("contraposee"))).toBe(false);
    expect(classificationPythagoras.every((item) => item.tags.includes("classification-pythagore"))).toBe(true);
    expect(classificationPythagoras.every((item) => item.figureTemplate?.kind === "triangle")).toBe(true);
    expect(directPythagoras.every((item) => item.figureTemplate?.kind === "right-triangle")).toBe(true);

    for (const chapterId of ["4e-chap-16", "3e-chap-05"]) {
      const reciprocalItems = allOfficialAutomatismes.filter((item) => item.chapterId === chapterId);
      expect(reciprocalItems.length).toBeGreaterThanOrEqual(10);
      expect(reciprocalItems.every((item) => item.tags.includes("thales-reciprocal"))).toBe(true);
    }

    const directThales = allOfficialAutomatismes.filter((item) => item.chapterId === "4e-chap-11" || item.chapterId === "3e-chap-02");
    expect(directThales.some((item) => item.tags.includes("calcul-longueur"))).toBe(true);
    expect(directThales.some((item) => item.tags.includes("reciproque") || item.tags.includes("contraposee"))).toBe(false);

    const papillons = allOfficialAutomatismes.filter((item) => item.tags.includes("papillon"));
    expect(papillons.length).toBeGreaterThan(0);
    expect(papillons.every((item) => item.figureTemplate?.kind === "thales" && item.figureTemplate.configuration === "papillon")).toBe(true);
  });

  it("keeps randomized segment names synchronized between titles and statements", () => {
    const failures: string[] = [];
    allOfficialAutomatismes.forEach((item) => {
      const question = generateQuestion(item, "segment-title-audit", item.defaultDurationSeconds);
      const titledSegment = question.title.match(/\bCalculer\s+([A-Z]{2})\b/)?.[1];
      if (titledSegment && !new RegExp(`\\b${titledSegment}\\b`).test(`${question.statement} ${question.shortAnswer} ${question.correction}`)) {
        failures.push(`${item.id}: ${question.title} / ${question.statement}`);
      }
    });

    expect(failures).toEqual([]);
  });

  it("handles equality when comparing fractions with a common denominator", () => {
    const comparisonItems = allOfficialAutomatismes.filter((item) => item.title === "Comparer deux fractions");
    expect(comparisonItems.length).toBeGreaterThan(0);
    for (const item of comparisonItems) {
      for (let index = 0; index < 30; index += 1) {
        const question = generateQuestion(item, `fraction-comparison-${index}`, item.defaultDurationSeconds);
        const a = Number(question.variables.a);
        const b = Number(question.variables.b);
        const expected = a === b ? "=" : a > b ? ">" : "<";
        expect(question.shortAnswer).toBe(expected);
      }
    }
  });

  it("uses the correct angle-pair geometry for corresponding and alternate-interior questions", () => {
    const angleItems = allOfficialAutomatismes.filter((item) => item.chapterId === "5e-chap-10" && item.figureTemplate?.kind === "parallel-lines");
    expect(angleItems.some((item) => item.figureTemplate?.kind === "parallel-lines" && item.figureTemplate.anglePair === "alternate-interior")).toBe(true);
    expect(
      angleItems
        .filter((item) => /correspondant/i.test(`${item.title} ${item.statementTemplate}`))
        .every((item) => item.figureTemplate?.kind === "parallel-lines" && item.figureTemplate.anglePair !== "alternate-interior")
    ).toBe(true);
  });

  it("keeps trigonometric ratios consistent with alpha, vertex names and displayed lengths", () => {
    const failures: string[] = [];
    const canonicalSegment = (segment: string) => [...segment].sort().join("");

    allOfficialAutomatismes
      .filter((item) => item.domain === "trigonometrie" && !item.tags.includes("dnb-officiel"))
      .forEach((item) => {
        const question = generateQuestion(item, "trigonometry-audit", item.defaultDurationSeconds);
        if (question.figure?.kind !== "right-triangle" || !question.figure.vertexLabels) {
          failures.push(`${item.id}: figure trigonométrique absente ou sans sommets`);
          return;
        }

        const visible = `${question.title} ${question.statement} ${question.shortAnswer} ${question.correction}`;
        if (/opposé|adjacent|hypoténuse|côté\\\s*[A-Z]{2}/i.test(visible)) {
          failures.push(`${item.id}: vocabulaire de côté non remplacé par les lettres`);
        }
        if (question.figure.angleLabel !== "α") {
          failures.push(`${item.id}: angle α absent`);
        }

        const sideLabels = [question.figure.legALabel, question.figure.legBLabel, question.figure.hypotenuseLabel ?? ""];
        if (sideLabels.filter(Boolean).some((label) => label !== "?" && !/^\d+(?:[,.]\d+)?\s*cm$/.test(label))) {
          failures.push(`${item.id}: une longueur de figure n'est pas numérique`);
        }
        if (/écris le rapport|\\dfrac\{\\ldots\}/i.test(question.statement) && sideLabels.filter(Boolean).length !== 3) {
          failures.push(`${item.id}: les trois longueurs ne sont pas affichées pour compléter le rapport`);
        }

        const [right, vertical, horizontal] = question.figure.vertexLabels;
        const expectedSegments = {
          cosinus: [right + horizontal, vertical + horizontal],
          sinus: [right + vertical, vertical + horizontal],
          tangente: [right + vertical, right + horizontal]
        } as const;
        const ratio = question.shortAnswer.match(/\\dfrac\{([A-Z]{2})\}\{([A-Z]{2})\}/);
        const signal = `${question.title} ${question.statement}`;
        const ratioName = /\bcosinus\b/i.test(signal)
          ? "cosinus"
          : /\bsinus\b/i.test(signal)
            ? "sinus"
            : /\btangente\b/i.test(signal)
              ? "tangente"
              : null;
        if (ratio && ratioName) {
          const [expectedNumerator, expectedDenominator] = expectedSegments[ratioName];
          if (
            canonicalSegment(ratio[1]) !== canonicalSegment(expectedNumerator) ||
            canonicalSegment(ratio[2]) !== canonicalSegment(expectedDenominator)
          ) {
            failures.push(`${item.id}: rapport ${question.shortAnswer} incohérent avec les sommets ${question.figure.vertexLabels.join(",")}`);
          }
        }
      });

    expect(failures).toEqual([]);
  });

  it("uses coherent square and cubic units in area and volume answers", () => {
    const failures: string[] = [];
    allOfficialAutomatismes.forEach((item) => {
      const question = generateQuestion(item, "unit-audit", item.defaultDurationSeconds);
      const asksForVolume = /(?:calcule|calculer|quel est|donne).*\bvolume\b|\bvolume (?:du|d['’]un|d['’]une)|\bvolume express\b/i
        .test(`${question.title} ${question.statement}`);
      const asksForArea = /(?:calcule|calculer|quel est|donne).*\baire\b|\baire (?:du|d['’]un|d['’]une)/i
        .test(`${question.title} ${question.statement}`);
      if (asksForVolume && /\b(?:mm|cm|dm|m|km)²\b/.test(question.shortAnswer)) {
        failures.push(`${item.id}: volume exprimé avec une unité carrée (${question.shortAnswer})`);
      }
      if (asksForArea && /\b(?:mm|cm|dm|m|km)³\b/.test(question.shortAnswer)) {
        failures.push(`${item.id}: aire exprimée avec une unité cubique (${question.shortAnswer})`);
      }
      if (/^(?:Mm|Cm|Dm|Km)(?:²|³|\b)/.test(question.shortAnswer)) {
        failures.push(`${item.id}: symbole d'unité incorrectement capitalisé (${question.shortAnswer})`);
      }
    });

    expect(failures).toEqual([]);
  });

  it("keeps spaces after numbers and separates lists of decimal values with semicolons", () => {
    const failures: string[] = [];
    const gluedUnit = /\d(?=(?:mm|cm|dm|dam|hm|km|mL|cL|dL|L|h|min|s|€)\b)/;
    const ambiguousDecimalList = /\d,\d+\s*,\s*-?\d/;

    allOfficialAutomatismes.forEach((item) => {
      ["spacing-a", "spacing-b", "spacing-c"].forEach((seed) => {
        const question = generateQuestion(item, seed, item.defaultDurationSeconds);
        const fields = [question.statement, question.shortAnswer, question.correction];
        const proseFields = fields.map((field) => field.replace(/\$[^$]*\$/g, ""));
        if (proseFields.some((field) => gluedUnit.test(field))) {
          failures.push(`${item.id} (${seed}): unité collée dans ${fields.join(" | ")}`);
        }
        if (ambiguousDecimalList.test(question.statement)) {
          failures.push(`${item.id} (${seed}): liste décimale ambiguë dans ${question.statement}`);
        }
      });
    });

    expect(failures).toEqual([]);
  });

  it("offers multiple and arbitrary denominators at the appropriate levels", () => {
    const chapterCoverage = [
      { id: "5e-chap-05", multiple: 4, arbitrary: 4 },
      { id: "4e-chap-10", multiple: 4, arbitrary: 4 },
      { id: "3e-chap-03", multiple: 1, arbitrary: 3 }
    ];

    chapterCoverage.forEach(({ id, multiple, arbitrary }) => {
      const chapterItems = allOfficialAutomatismes.filter((item) => item.chapterId === id);
      expect(chapterItems.filter((item) => item.tags.includes("denominateurs-multiples")).length, id)
        .toBeGreaterThanOrEqual(multiple);
      expect(chapterItems.filter((item) => item.tags.includes("denominateurs-quelconques")).length, id)
        .toBeGreaterThanOrEqual(arbitrary);
    });
  });

  it("validates generated numerical equalities over several data sets", () => {
    const failures: string[] = [];
    allOfficialAutomatismes.forEach((item) => {
      ["math-a", "math-b", "math-c", "math-d"].forEach((seed) => {
        const question = generateQuestion(item, seed, item.defaultDurationSeconds);
        [...falseNumericEqualities(question.shortAnswer), ...falseNumericEqualities(question.correction)]
          .forEach((failure) => failures.push(`${item.id} (${seed}): ${failure}`));
      });
    });

    expect(failures).toEqual([]);
  });

  it("matches direct numerical calculations with their generated answers", () => {
    const failures: string[] = [];
    allOfficialAutomatismes.forEach((item) => {
      ["direct-a", "direct-b", "direct-c", "direct-d"].forEach((seed) => {
        const question = generateQuestion(item, seed, item.defaultDurationSeconds);
        const expression = question.statement.match(/^\s*Calcule\s*:?\s*\$([^$]+)\$\s*[.!?]?\s*$/i)?.[1];
        if (!expression || /=|\\approx|%|\b(?:de|sur)\b/i.test(expression)) return;
        const expected = numericLatexValue(expression);
        const received = numericalAnswerValue(question.shortAnswer);
        if (expected === null || received === null) return;

        const tolerance = /au dixième/i.test(question.statement)
          ? 0.051
          : /au centième/i.test(question.statement)
            ? 0.0051
            : 0.002;
        if (Math.abs(expected - received) > tolerance) {
          failures.push(`${item.id} (${seed}): ${expression} donne ${expected}, réponse ${question.shortAnswer}`);
        }
      });
    });

    expect(failures).toEqual([]);
  });

  it("does not reveal a radius that pupils must calculate from a diameter", () => {
    const radiusItems = allOfficialAutomatismes.filter((item) => item.title === "Rayon à partir du diamètre");
    expect(radiusItems.length).toBeGreaterThan(0);

    radiusItems.forEach((item) => {
      ["radius-a", "radius-b", "radius-c"].forEach((seed) => {
        const question = generateQuestion(item, seed, item.defaultDurationSeconds);
        expect(question.figure?.kind).toBe("circle");
        expect(question.figure?.kind === "circle" ? question.figure.radiusLabel : "").toBe("?");
        const answerNumber = question.shortAnswer.match(/\d+(?:[,.]\d+)?/)?.[0];
        expect(answerNumber).toBeTruthy();
        expect(question.correction).toContain(answerNumber as string);
      });
    });
  });

  it("states the precision used for rounded statistics and percentages", () => {
    const roundedStatistics = allOfficialAutomatismes.filter(
      (item) => item.domain === "statistiques" && /roundTo\(/.test(item.answerTemplate)
    );
    expect(roundedStatistics.length).toBeGreaterThan(0);
    expect(
      roundedStatistics
        .filter((item) => !/(?:centième|dixième) près/i.test(item.statementTemplate))
        .map((item) => `${item.id}: ${item.statementTemplate}`)
    ).toEqual([]);

    const moneyPercentages = allOfficialAutomatismes.filter(
      (item) => item.title === "Pourcentage d'une quantité décimale"
    );
    expect(moneyPercentages.length).toBeGreaterThan(0);
    moneyPercentages.forEach((item) => {
      expect(item.statementTemplate).toMatch(/centime près/i);
      for (const seed of ["money-a", "money-b", "money-c", "money-d"]) {
        const answer = generateQuestion(item, seed, item.defaultDurationSeconds).shortAnswer;
        const decimals = answer.match(/,(\d+)/)?.[1] ?? "";
        expect(decimals.length).toBeLessThanOrEqual(2);
      }
    });
  });

  it("finishes arbitrary-denominator fraction corrections with the simplified answer", () => {
    const auditedTitles = new Set([
      "Addition à dénominateurs quelconques",
      "Soustraction à dénominateurs quelconques",
      "Addition de fractions quelconques",
      "Somme relative à dénominateurs quelconques",
      "Trois fractions et dénominateur commun",
      "Fractions relatives quelconques",
      "Trois fractions quelconques"
    ]);
    const fractionItems = allOfficialAutomatismes.filter((item) => auditedTitles.has(item.title));
    expect(fractionItems.length).toBeGreaterThanOrEqual(auditedTitles.size);

    fractionItems.forEach((item) => {
      for (const seed of ["fraction-detail-a", "fraction-detail-b", "fraction-detail-c"]) {
        const question = generateQuestion(item, seed, item.defaultDurationSeconds);
        expect(question.correction, item.id).toContain(question.shortAnswer);
      }
    });
  });

  it("generates clean, finite and typographically coherent content repeatedly", () => {
    const failures: string[] = [];
    const brokenExpression = /\[(?:[a-z_]\w*|[^'\]]*[+\-*/][^'\]]*)\]|NaN|Infinity|undefined/u;
    const brokenTypography = /probabilitéde|\bde equilibre\b|\bsymetrique\b|\bhomothetie\b|\blongueuré|\b(?:centi|kilo|milli)?mètrès\b|\bd m[²³]\b|\b(?:D|E|F|G|H|J|K|M|P|Q|R|S|T|U|V|W|X)['’]est\b|\d\.\d/iu;

    allOfficialAutomatismes.forEach((item) => {
      ["quality-a", "quality-b", "quality-c"].forEach((seed) => {
        const question = generateQuestion(item, seed, item.defaultDurationSeconds);
        const figure = question.figure ? JSON.stringify(question.figure) : "";
        const visibleText = [question.title, question.statement, question.shortAnswer, question.correction].join(" ");
        const rendered = `${visibleText} ${figure}`;
        // Scratch figures legitimately contain JSON arrays and signed values such
        // as "ajouter -5 à x". Unresolved expression checks only concern the text
        // displayed to pupils; encoding/typography checks still cover the figure.
        if (brokenExpression.test(visibleText) || brokenTypography.test(rendered)) {
          failures.push(`${item.id} (${seed}): ${rendered}`);
        }
      });
    });

    expect(failures).toEqual([]);
  });
});
