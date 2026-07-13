import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { allOfficialAutomatismes } from "../data/allAutomatismes";
import { siteProgressionChapters } from "../data/siteProgression";
import { generateSeries } from "../generator/generateSeries";
import { defaultSettings } from "../services/storage";
import { BELT_STAGES, BeltTrainingPage, beltQuestionCount, isBeltStageUnlocked } from "./BeltTrainingPage";

describe("BeltTrainingPage", () => {
  it("offers four level routes and six progressive belts", () => {
    const html = renderToStaticMarkup(
      <BeltTrainingPage
        settings={defaultSettings}
        automatismes={allOfficialAutomatismes}
        achievements={[]}
        onStartPreset={vi.fn()}
        onResetProgress={vi.fn()}
      />
    );

    expect(BELT_STAGES).toHaveLength(6);
    expect(html).toContain("Le dojo des automatismes");
    expect(html).not.toContain("Parcours premium");
    expect(html).toContain("Remise à zéro");
    expect(html).toContain("Ceinture blanche");
    expect(html).toContain("Ceinture noire");
    expect(html).toContain("Lancer l’entraînement");
    expect(html).not.toContain("Sélectionné");
    expect(html).toContain("Ceinture jaune, verrouillée");
    expect(html).toContain("Valide d’abord la ceinture blanche");
    (["6e", "5e", "4e", "3e"] as const).forEach((level) => expect(html).toContain(`>${level}<`));
  });

  it("unlocks belts only after every previous belt is validated", () => {
    expect(isBeltStageUnlocked(0, new Set())).toBe(true);
    expect(isBeltStageUnlocked(1, new Set())).toBe(false);
    expect(isBeltStageUnlocked(1, new Set(["white"]))).toBe(true);
    expect(isBeltStageUnlocked(3, new Set(["white", "yellow"]))).toBe(false);
    expect(isBeltStageUnlocked(3, new Set(["white", "yellow", "orange"]))).toBe(true);
  });

  it("keeps belt difficulty and coverage progressive", () => {
    expect(BELT_STAGES.map((stage) => stage.ratio)).toEqual([...BELT_STAGES.map((stage) => stage.ratio)].sort((a, b) => a - b));
    expect(BELT_STAGES[0].questionCount).toBeLessThan(BELT_STAGES.at(-1)!.questionCount);
    expect(BELT_STAGES.at(-1)?.difficulty).toBe("mixed");
    expect(BELT_STAGES.at(-1)?.ratio).toBe(1);
  });

  it("can generate every level and belt route", () => {
    (["6e", "5e", "4e", "3e"] as const).forEach((level) => {
      BELT_STAGES.forEach((belt) => {
        const chapterLimit = Math.max(
          3,
          Math.min(siteProgressionChapters[level].length, Math.ceil(siteProgressionChapters[level].length * belt.ratio))
        );
        const selectedChapterIds = siteProgressionChapters[level]
          .slice(0, chapterLimit)
          .map((chapter) => chapter.id);

        try {
          const questionCount = beltQuestionCount(level, belt);
          const series = generateSeries(allOfficialAutomatismes, {
            ...defaultSettings,
            levels: [level],
            chapterLimitByLevel: { ...defaultSettings.chapterLimitByLevel, [level]: chapterLimit },
            selectedChapterIdsByLevel: { ...defaultSettings.selectedChapterIdsByLevel, [level]: selectedChapterIds },
            selectedDomains: [],
            selectedAutomatismeIds: [],
            excludedTags: [],
            includePreviousSteps: true,
            questionCount,
            difficultyMode: belt.difficulty,
            orderMode: "progressive"
          }, [], { coverChapterIds: selectedChapterIds });
          expect(series.questions).toHaveLength(questionCount);
          expect(new Set(series.questions.map((question) => question.chapterId))).toEqual(new Set(selectedChapterIds));
        } catch (error) {
          throw new Error(`${level}/${belt.key}: ${error instanceof Error ? error.message : String(error)}`);
        }
      });
    });
  });
});
