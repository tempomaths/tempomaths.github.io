import { describe, expect, it } from "vitest";
import { allOfficialAutomatismes } from "./allAutomatismes";
import { getWeakChapters } from "./curriculumCoverage";
import { DNB_OFFICIAL_TAG } from "./dnbOfficialAutomatismes";
import { PURE_MENTAL_TAG } from "./mentalCalculAutomatismes";
import { siteProgressionChapters } from "./siteProgression";
import { generateSeries } from "../generator/generateSeries";
import { generateQuestion } from "../generator/generateQuestion";
import { defaultSettings } from "../services/storage";
import { LEVELS } from "../utils/labels";

function normalized(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function itemSignal(item: (typeof allOfficialAutomatismes)[number]): string {
  return normalized([item.title, ...item.tags].join(" "));
}

function fullItemSignal(item: (typeof allOfficialAutomatismes)[number]): string {
  return normalized(
    [
      item.title,
      item.subdomain,
      item.statementTemplate,
      item.answerTemplate,
      item.correctionTemplate,
      ...item.tags
    ].join(" ")
  );
}

function signalHas(signal: string, ...needles: string[]): boolean {
  const tokens = signal.split(/[^a-z0-9]+/).filter(Boolean);
  return needles.some((needle) => {
    const normalizedNeedle = normalized(needle);
    if (/^[a-z0-9]+$/.test(normalizedNeedle) && normalizedNeedle.length <= 4) {
      return tokens.includes(normalizedNeedle);
    }
    return signal.includes(normalizedNeedle);
  });
}

function chapterItems(level: keyof typeof siteProgressionChapters, rank: number) {
  const chapter = siteProgressionChapters[level].find((item) => item.rank === rank);
  expect(chapter).toBeTruthy();
  return allOfficialAutomatismes.filter((item) => item.chapterId === chapter?.id);
}

describe("large aligned automatisme base", () => {
  it("contains a much larger chapter-aligned base", () => {
    expect(allOfficialAutomatismes.length).toBeGreaterThanOrEqual(1000);
    expect(allOfficialAutomatismes.every((item) => item.chapterRank && item.chapterTitle)).toBe(true);
  });

  it("contains Scratch and generated geometry figures", () => {
    expect(allOfficialAutomatismes.some((item) => item.figureTemplate?.kind === "scratch")).toBe(true);
    expect(
      allOfficialAutomatismes.some(
        (item) => item.figureTemplate && item.figureTemplate.kind !== "scratch"
      )
    ).toBe(true);
  });

  it("provides colorful bar, pie and line readings in 4e and 3e statistics", () => {
    (["4e-chap-12", "3e-chap-01"] as const).forEach((chapterId) => {
      const charts = allOfficialAutomatismes.filter(
        (item) => item.chapterId === chapterId && item.figureTemplate?.kind === "chart"
      );
      const chartTypes = charts.map((item) => item.figureTemplate?.kind === "chart" ? item.figureTemplate.chartType : "");

      expect(charts.length, chapterId).toBeGreaterThanOrEqual(6);
      expect(chartTypes.filter((type) => type === "bar").length).toBeGreaterThanOrEqual(2);
      expect(chartTypes.filter((type) => type === "pie").length).toBeGreaterThanOrEqual(2);
      expect(chartTypes.filter((type) => type === "line").length).toBeGreaterThanOrEqual(2);
      expect(charts.every((item) => /effectif|fréquence|graphique|courbe/i.test(`${item.title} ${item.tags.join(" ")}`))).toBe(true);
    });
  });

  it("strengthens signed-fraction practice in 4e and 3e", () => {
    const signedFractions = (chapterIds: string[]) => allOfficialAutomatismes.filter(
      (item) => chapterIds.includes(item.chapterId ?? "") && item.tags.includes("fractions") && item.tags.includes("relatifs")
    );

    expect(signedFractions(["4e-chap-10", "4e-chap-13"]).length).toBeGreaterThanOrEqual(8);
    expect(signedFractions(["3e-chap-03"]).length).toBeGreaterThanOrEqual(5);
  });

  it("never asks pupils to square a Pythagorean length greater than 15", () => {
    const violations: string[] = [];
    const pythagoreanItems = allOfficialAutomatismes.filter((item) => item.domain === "pythagore");

    pythagoreanItems.forEach((item) => {
      for (let sample = 0; sample < 20; sample += 1) {
        const question = generateQuestion(item, `pythagore-cap:${item.id}:${sample}`, item.defaultDurationSeconds);
        const rendered = [question.statement, question.correction, question.shortAnswer].join(" ");
        const squaredOperands = [...rendered.matchAll(/\(?(-?\d+(?:[.,]\d+)?)\)?\s*(?:\^2|²)/g)]
          .map((match) => Math.abs(Number(match[1].replace(",", "."))));
        squaredOperands.filter((value) => value > 15).forEach((value) => violations.push(`${item.id}: ${value}`));
      }
    });

    expect(violations).toEqual([]);
  });

  it("provides visible Scratch slides for every algorithmics chapter", () => {
    (["6e", "5e", "4e", "3e"] as const).forEach((level) => {
      const chapter = siteProgressionChapters[level].find((item) => item.domain === "algorithmique");
      const slides = allOfficialAutomatismes.filter(
        (item) => item.chapterId === chapter?.id && item.figureTemplate?.kind === "scratch"
      );
      expect(slides.length).toBeGreaterThanOrEqual(6);
    });
  });

  it("keeps 6e free from relative-number automatisms", () => {
    const sixthGradeRelativeItems = allOfficialAutomatismes.filter(
      (item) =>
        item.levels.includes("6e") &&
        (item.tags.includes("relatifs") || /relatif/i.test(`${item.title} ${item.subdomain} ${item.statementTemplate}`))
    );

    expect(sixthGradeRelativeItems).toEqual([]);
  });

  it("keeps literal x variables inside the new sixth-grade algebra chapter", () => {
    const standaloneX = /(^|[^A-Za-zÀ-ÿ])x([^A-Za-zÀ-ÿ]|$)/;
    const sixthGradeLiteralItems = allOfficialAutomatismes
      .filter((item) => item.levels.includes("6e") && item.chapterId !== "6e-chap-18")
      .map((item) => {
        const question = generateQuestion(item, `no-x:${item.id}`, item.defaultDurationSeconds);
        // Scratch legitimately uses x as the horizontal coordinate. The test
        // targets premature algebraic x in sixth-grade mathematical content.
        const figureText = question.figure?.kind === "scratch" ? "" : question.figure ? JSON.stringify(question.figure) : "";
        const rendered = [question.statement, question.shortAnswer, question.correction, figureText].join(" ");
        return standaloneX.test(rendered) ? `${item.id}: ${rendered}` : "";
      })
      .filter(Boolean);

    expect(sixthGradeLiteralItems).toEqual([]);
  });

  it("keeps 6e free from corresponding and alternate-interior angle automatismes", () => {
    const forbiddenAngleItems = allOfficialAutomatismes
      .filter((item) => item.levels.includes("6e"))
      .filter((item) =>
        signalHas(
          fullItemSignal(item),
          "angle correspondant",
          "angles correspondants",
          "alterne-interne",
          "alternes-internes",
          "alternate-interior"
        )
      )
      .map((item) => `${item.chapterTitle} / ${item.title}`);

    expect(forbiddenAngleItems).toEqual([]);
  });

  it("contains a launchable pure mental-calculation bank for every level", () => {
    LEVELS.forEach((level) => {
      const mentalItems = allOfficialAutomatismes.filter(
        (item) => item.levels.includes(level) && item.tags.includes(PURE_MENTAL_TAG)
      );
      const mentalIds = new Set(mentalItems.map((item) => item.id));
      const series = generateSeries(
        allOfficialAutomatismes,
        {
          ...defaultSettings,
          levels: [level],
          progressionByLevel: { "6e": "end", "5e": "end", "4e": "end", "3e": "end" },
          chapterLimitByLevel: { "6e": 999, "5e": 999, "4e": 999, "3e": 999 },
          includePreviousSteps: true,
          selectedDomains: [],
          questionCount: Math.min(8, mentalItems.length),
          durationSeconds: 20,
          durationByDifficulty: false,
          selectedAutomatismeIds: [...mentalIds],
          excludedTags: [],
          difficultyMode: "mixed",
          orderMode: "random",
          seed: `mental-${level}`
        },
        []
      );

      expect(mentalItems.length, level).toBeGreaterThanOrEqual(5);
      expect(mentalItems.every((item) => !item.figureTemplate), level).toBe(true);
      expect(series.questions, level).toHaveLength(Math.min(8, mentalItems.length));
      expect(
        series.questions.every((question) => mentalIds.has(question.automatismeId)),
        level
      ).toBe(true);
    });
  });

  it("keeps sensitive chapters aligned with their own progression point", () => {
    const sixthGeometryVocabulary = chapterItems("6e", 2).map(itemSignal);
    const sixthDecimals = chapterItems("6e", 7).map(itemSignal);
    const sixthFractions = chapterItems("6e", 5).map(itemSignal);
    const fifthFractionComparison = chapterItems("5e", 8).map(itemSignal);
    const fourthFractionComparison = chapterItems("4e", 10).map(itemSignal);
    const fourthFractionProducts = chapterItems("4e", 13).map(itemSignal);

    expect(sixthGeometryVocabulary.some((signal) => signalHas(signal, "aire", "perimetre", "volume", "solide", "translation", "homothetie", "reperage"))).toBe(false);
    expect(sixthDecimals.some((signal) => signalHas(signal, "multiplier par 0,1", "multiplier un decimal", "produit decimal"))).toBe(false);
    expect(sixthFractions.some((signal) => signalHas(signal, "produit de fractions", "quotient de fractions", "pgcd", "irreductible"))).toBe(false);
    expect(fifthFractionComparison.some((signal) => signalHas(signal, "produit de fractions", "quotient de fractions"))).toBe(false);
    expect(fourthFractionComparison.some((signal) => signalHas(signal, "produit de fractions", "quotient de fractions"))).toBe(false);
    expect(fourthFractionProducts.some((signal) => signalHas(signal, "produit de fractions", "quotient de fractions"))).toBe(true);
  });

  it("reinforces relative numbers from 4e onward", () => {
    const fourthRelativeItems = allOfficialAutomatismes.filter(
      (item) => item.levels.includes("4e") && item.tags.includes("relatifs")
    );
    const thirdRelativeItems = allOfficialAutomatismes.filter(
      (item) => item.levels.includes("3e") && item.tags.includes("relatifs")
    );

    expect(fourthRelativeItems.length).toBeGreaterThanOrEqual(20);
    expect(thirdRelativeItems.length).toBeGreaterThanOrEqual(20);
  });

  it("uses non-trivial fraction denominators after 6e", () => {
    const laterFractionCalculs = allOfficialAutomatismes.filter(
      (item) =>
        !item.levels.includes("6e") &&
        item.domain === "fractions" &&
        (item.tags.includes("denominateurs-multiples") || item.tags.includes("denominateurs-differents"))
    );

    expect(laterFractionCalculs.length).toBeGreaterThanOrEqual(6);
  });

  it("keeps literal calculation at a real 4e-3e level", () => {
    const literalMonomialItems = allOfficialAutomatismes.filter(
      (item) =>
        (item.levels.includes("4e") || item.levels.includes("3e")) &&
        (item.domain === "calcul-litteral" || item.domain === "equations") &&
        item.tags.includes("monomes-4-6") &&
        item.tags.includes("relatifs")
    );

    expect(literalMonomialItems.length).toBeGreaterThanOrEqual(8);
  });

  it("uses short phrased instructions instead of bare infinitives", () => {
    const bareInfinitiveStarts = /^(calculer|resoudre|résoudre|reduire|réduire|developper|développer|factoriser|simplifier|comparer|ecrire|écrire|completer|compléter|determiner|déterminer|donner|convertir|effectuer|trouver|identifier|encadrer)\b/i;
    const terseItems = allOfficialAutomatismes
      .filter((item) => bareInfinitiveStarts.test(item.statementTemplate))
      .map((item) => `${item.id}: ${item.statementTemplate}`);

    expect(terseItems).toEqual([]);
  });

  it("keeps Pythagore and Thales chapters free from generic geometry flashes", () => {
    const theoremItems = allOfficialAutomatismes.filter(
      (item) => item.domain === "pythagore" || item.domain === "thales"
    );

    const offTopicTheoremItems = theoremItems
      .filter((item) => !item.tags.includes(item.domain))
      .map((item) => `${item.chapterTitle} / ${item.title}`);

    expect(offTopicTheoremItems).toEqual([]);
    expect(theoremItems.some((item) => /perimetre mental|somme des angles/i.test(item.title))).toBe(false);
  });

  it("shows a figure for every Pythagore and Thalès model", () => {
    const theoremWithoutFigure = allOfficialAutomatismes
      .filter((item) => item.tags.includes("pythagore") || item.tags.includes("thales"))
      .filter((item) => !item.figureTemplate)
      .map((item) => item.id);

    expect(theoremWithoutFigure).toEqual([]);
  });

  it("keeps every announced solid consistent with its generated 3D figure", () => {
    const expectedSolid = (text: string) => {
      const signal = normalized(text);
      if (signalHas(signal, "cone")) return "cone";
      if (signalHas(signal, "sphere", "boule")) return "sphere";
      if (signalHas(signal, "pyramide")) return "pyramide";
      if (signalHas(signal, "prisme")) return "prisme";
      if (signalHas(signal, "cylindre")) return "cylindre";
      if (signalHas(signal, "pave")) return "pave";
      return null;
    };

    const mismatches = allOfficialAutomatismes
      .filter((item) => item.figureTemplate?.kind === "solid")
      .filter((item) => {
        const expected = expectedSolid(`${item.title} ${item.statementTemplate}`);
        return expected !== null && item.figureTemplate?.kind === "solid" && item.figureTemplate.solid !== expected;
      })
      .map((item) => item.id);

    expect(mismatches).toEqual([]);
  });

  it("shows faithful figures for official DNB trigonometry questions", () => {
    const officialTrig = allOfficialAutomatismes.filter(
      (item) => item.domain === "trigonometrie" && item.tags.includes(DNB_OFFICIAL_TAG)
    );

    expect(officialTrig.length).toBeGreaterThan(0);
    officialTrig.forEach((item, index) => {
      const generated = generateQuestion(item, `dnb-trig-${index}`);
      expect(generated.figure?.kind).toBe("right-triangle");
      if (generated.figure?.kind === "right-triangle") {
        expect(generated.figure.angleLabel).toMatch(/35°|60°/);
      }
    });
  });

  it("keeps Pythagore and Thales focused on the requested slide formats", () => {
    const theoremItems = allOfficialAutomatismes.filter(
      (item) =>
        (item.levels.includes("4e") || item.levels.includes("3e")) &&
        ["pythagore", "thales", "trigonometrie"].includes(item.domain)
    );
    const pythagoreItems = theoremItems.filter((item) => item.domain === "pythagore");
    const thalesItems = theoremItems.filter((item) => item.domain === "thales");
    const pythagoreOffFormat = pythagoreItems
      .filter((item) => !item.tags.some((tag) => ["egalite", "triplet", "reciproque", "contraposee", "redaction", "calcul-longueur", "classification-pythagore"].includes(tag)))
      .map((item) => `${item.chapterTitle} / ${item.title}`);
    const pythagoreForbidden = pythagoreItems
      .filter((item) => signalHas(normalized(item.title), "reperage", "methode"))
      .map((item) => `${item.chapterTitle} / ${item.title}`);
    const thalesOffFormat = thalesItems
      .filter((item) => !item.tags.includes("rapports") && !item.tags.includes("thales-reciprocal"))
      .map((item) => `${item.chapterTitle} / ${item.title}`);
    const thalesForbidden = thalesItems
      .filter((item) => signalHas(normalized(item.title), "produit-en-croix", "produit-croix", "fractions"))
      .map((item) => `${item.chapterTitle} / ${item.title}`);

    expect(theoremItems.length).toBeGreaterThanOrEqual(90);
    expect(pythagoreItems.some((item) => item.tags.includes("calcul-longueur"))).toBe(true);
    expect(pythagoreItems.some((item) => item.tags.includes("egalite"))).toBe(true);
    expect(thalesItems.some((item) => item.tags.includes("papillon"))).toBe(true);
    expect(pythagoreOffFormat).toEqual([]);
    expect(pythagoreForbidden).toEqual([]);
    expect(thalesOffFormat).toEqual([]);
    expect(thalesForbidden).toEqual([]);
  });

  it("keeps trigonometry slides focused on writing ratios from the figure", () => {
    const trigItems = allOfficialAutomatismes
      .filter((item) => item.tags.includes("trigonometrie") && !item.tags.includes(DNB_OFFICIAL_TAG));
    const forbiddenTrigCalculations = trigItems
      .filter((item) =>
        /calculer|calcule|donne la valeur|longueur avec|cote adjacent|cote oppose|hypotenuse par|cos\^{-1}|sin\^{-1}|tan\^{-1}/i.test(
          `${item.title} ${item.statementTemplate} ${item.answerTemplate} ${item.correctionTemplate}`
        )
      )
      .map((item) => `${item.id}: ${item.title}`);

    expect(trigItems.length).toBeGreaterThan(0);
    expect(trigItems.every((item) => item.tags.includes("rapport") || item.tags.includes("vocabulaire"))).toBe(true);
    expect(trigItems.every((item) => item.figureTemplate)).toBe(true);
    expect(forbiddenTrigCalculations).toEqual([]);

    trigItems.forEach((item, index) => {
      const generated = generateQuestion(item, `trig-ratios-${index}`);
      expect(generated.figure?.kind).toBe("right-triangle");
      if (generated.figure?.kind === "right-triangle") {
        const sideLabels = `${generated.figure.legALabel} ${generated.figure.legBLabel} ${generated.figure.hypotenuseLabel}`;
        expect(sideLabels)
          .not.toMatch(/opposé|adjacent|hypoténuse/i);
        const asksToWriteRatio = /écris le rapport|rapport du|rapport de la|\\dfrac\{\\ldots\}/i.test(generated.statement);
        expect(sideLabels.match(/\d+ cm/g)?.length).toBe(asksToWriteRatio ? 3 : 2);
        expect(generated.figure.angleLabel).toBe("α");
      }
      expect(`${generated.shortAnswer} ${generated.correction}`).not.toMatch(/\\text\{(?:côté\s+)?(?:opposé|adjacent)|\\text\{hypoténuse/i);
    });
  });

  it("contains an isolated official DNB automatisms bank", () => {
    const dnbItems = allOfficialAutomatismes.filter((item) => item.tags.includes(DNB_OFFICIAL_TAG));
    const series = generateSeries(
      allOfficialAutomatismes,
      {
        ...defaultSettings,
        levels: ["3e"],
        progressionByLevel: { "6e": "end", "5e": "end", "4e": "end", "3e": "end" },
        chapterLimitByLevel: { "6e": 999, "5e": 999, "4e": 999, "3e": 999 },
        includePreviousSteps: true,
        selectedDomains: [],
        questionCount: 5,
        durationSeconds: 45,
        durationByDifficulty: false,
        readingSeconds: 0,
        showTimer: true,
        timerSize: "large",
        autoPauseBetweenQuestions: false,
        correctionMode: "final",
        detailedCorrections: true,
        orderMode: "random",
        difficultyMode: "mixed",
        selectedAutomatismeIds: dnbItems.map((item) => item.id),
        excludedTags: [],
        avoidSeenQuestions: false,
        slideshowMode: "ritual",
        seed: "dnb-test"
      },
      []
    );

    expect(dnbItems.length).toBeGreaterThanOrEqual(25);
    expect(dnbItems.every((item) => item.chapterId === "3e-chap-20" && item.chapterRank === 20)).toBe(true);
    expect(series.questions).toHaveLength(5);
    expect(series.questions.every((question) => question.automatismeId.startsWith("dnb-officiel:"))).toBe(true);
  });

  it("covers every chapter from the site progression", () => {
    const underCovered = getWeakChapters(allOfficialAutomatismes, 10)
      .map(
      ({ chapter, count }) => `${chapter.level} chap ${chapter.rank}: ${count}`
      );

    expect(underCovered).toEqual([]);
  });

  it("keeps the local chapter progression as the spine of the official base", () => {
    Object.values(siteProgressionChapters)
      .flat()
      .forEach((chapter) => {
        const items = allOfficialAutomatismes.filter((item) => item.chapterId === chapter.id);
        expect(items.length, chapter.id).toBeGreaterThanOrEqual(10);
        expect(items.every((item) => item.chapterTitle === chapter.title), chapter.id).toBe(true);
      });
  });

  it("renders every generated model without broken expressions", () => {
    allOfficialAutomatismes.forEach((automatisme) => {
      const question = generateQuestion(automatisme, `render:${automatisme.id}`, automatisme.defaultDurationSeconds);
      const rendered = `${question.statement} ${question.shortAnswer} ${question.correction}`;
      expect(rendered, automatisme.id).not.toMatch(/\[(?:[a-z_]\w*|[^'\]]*[+\-*/][^'\]]*)\]|NaN|Infinity/);
    });
  });

  it("renders every generated model without broken visible characters", () => {
    const brokenCharacterPattern = /Ã|Â|Ï|�|cm\?|m\?|[A-Za-zÀ-ÿ]\?[A-Za-zÀ-ÿ]|\?[A-Za-zÀ-ÿ]|[A-Za-zÀ-ÿ]\?(?=\s*(?:\d|:))/;
    const brokenItems = allOfficialAutomatismes
      .map((automatisme) => {
        const question = generateQuestion(automatisme, `chars:${automatisme.id}`, automatisme.defaultDurationSeconds);
        const figureText = question.figure ? JSON.stringify(question.figure) : "";
        const renderedFields = [question.statement, question.shortAnswer, question.correction, figureText];
        return renderedFields.some((field) => brokenCharacterPattern.test(field))
          ? `${automatisme.id}: ${renderedFields.join(" ")}`
          : "";
      })
      .filter(Boolean);

    expect(brokenItems).toEqual([]);
  });
});
