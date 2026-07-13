import { describe, expect, it } from "vitest";
import type { AppSettings } from "../types";
import { allOfficialAutomatismes } from "../data/allAutomatismes";
import { getLevelCoverage } from "../data/curriculumCoverage";
import { getChapterLimitFromProgression, siteProgressionChapters } from "../data/siteProgression";
import { defaultSettings } from "../services/storage";
import { filterAutomatismes } from "./filters";
import { resolveAutomatismePool } from "./pool";

describe("automatisme filters", () => {
  it("filters by level", () => {
    const result = filterAutomatismes(allOfficialAutomatismes, {
      ...defaultSettings,
      levels: ["4e"],
      progressionByLevel: { ...defaultSettings.progressionByLevel, "4e": "end" }
    });

    expect(result.length).toBeGreaterThanOrEqual(20);
    expect(result.every((item) => item.levels.includes("4e"))).toBe(true);
  });

  it("applies cumulative progression", () => {
    const result = filterAutomatismes(allOfficialAutomatismes, {
      ...defaultSettings,
      levels: ["6e"],
      progressionByLevel: { ...defaultSettings.progressionByLevel, "6e": "trimester2" },
      chapterLimitByLevel: {
        ...defaultSettings.chapterLimitByLevel,
        "6e": getChapterLimitFromProgression("6e", "trimester2")
      },
      includePreviousSteps: true
    });

    expect(result.some((item) => item.progressionStep === "start")).toBe(true);
    expect(result.some((item) => item.progressionStep === "trimester1")).toBe(true);
    expect(result.some((item) => item.progressionStep === "trimester2")).toBe(true);
    expect(result.some((item) => item.progressionStep === "end")).toBe(false);
  });

  it("completes lower selected levels when several school years are active", () => {
    const settings: AppSettings = {
      ...defaultSettings,
      levels: ["6e", "5e"],
      progressionByLevel: { ...defaultSettings.progressionByLevel, "5e": "start" },
      chapterLimitByLevel: {
        ...defaultSettings.chapterLimitByLevel,
        "5e": 1
      },
      includePreviousSteps: false
    };
    const result = filterAutomatismes(allOfficialAutomatismes, settings);
    const sixthLastChapterId = siteProgressionChapters["6e"][siteProgressionChapters["6e"].length - 1].id;
    const fifthFirstChapterId = siteProgressionChapters["5e"][0].id;

    expect(result.some((item) => item.chapterId === sixthLastChapterId)).toBe(true);
    expect(
      result
        .filter((item) => item.levels.includes("5e"))
        .every((item) => item.chapterId === fifthFirstChapterId)
    ).toBe(true);

    const sixthCoverage = getLevelCoverage(allOfficialAutomatismes, settings, "6e");
    expect(sixthCoverage.chapters.every((chapter) => chapter.selected)).toBe(true);
  });

  it("does not broaden the current progression when filters are impossible", () => {
    const result = resolveAutomatismePool(
      allOfficialAutomatismes,
      {
        ...defaultSettings,
        levels: ["6e"],
        selectedAutomatismeIds: ["missing-id"],
        selectedDomains: ["trigonometrie"],
        excludedTags: ["calcul", "geometrie", "scratch", "theoreme"],
        difficultyMode: "hard",
        includePreviousSteps: false,
        progressionByLevel: { ...defaultSettings.progressionByLevel, "6e": "start" },
        chapterLimitByLevel: { ...defaultSettings.chapterLimitByLevel, "6e": 1 }
      },
      allOfficialAutomatismes.map((item) => item.id)
    );

    expect(result).toHaveLength(0);
  });

  it("keeps explicitly selected theorem and algorithmics chapters visible despite stale exclusions", () => {
    ["4e-chap-11", "4e-chap-20"].forEach((chapterId) => {
      const result = filterAutomatismes(allOfficialAutomatismes, {
        ...defaultSettings,
        levels: ["4e"],
        selectedChapterIdsByLevel: { ...defaultSettings.selectedChapterIdsByLevel, "4e": [chapterId] },
        excludedTags: ["scratch", "algorithmique", "theoreme", "thales", "boucle", "variable"]
      });
      expect(result.some((item) => item.chapterId === chapterId)).toBe(true);
    });
  });

  it("honors detailed manual selections outside the active chapter filters", () => {
    const selected = allOfficialAutomatismes.find(
      (item) => item.levels.includes("3e") && item.domain === "trigonometrie"
    );

    if (!selected) {
      throw new Error("Expected at least one 3e trigonometry automatisme.");
    }

    const result = resolveAutomatismePool(allOfficialAutomatismes, {
      ...defaultSettings,
      levels: ["6e"],
      selectedAutomatismeIds: [selected.id],
      selectedDomains: ["nombres-calculs"],
      difficultyMode: "easy",
      includePreviousSteps: false,
      progressionByLevel: { ...defaultSettings.progressionByLevel, "6e": "start" },
      chapterLimitByLevel: { ...defaultSettings.chapterLimitByLevel, "6e": 1 }
    });

    expect(result.map((item) => item.id)).toEqual([selected.id]);
  });

  it("uses explicit multi-chapter selection before the cumulative chapter limit", () => {
    const selectedChapterIds = [
      siteProgressionChapters["6e"][0].id,
      siteProgressionChapters["6e"][4].id
    ];
    const result = filterAutomatismes(allOfficialAutomatismes, {
      ...defaultSettings,
      levels: ["6e"],
      progressionByLevel: { ...defaultSettings.progressionByLevel, "6e": "end" },
      chapterLimitByLevel: { ...defaultSettings.chapterLimitByLevel, "6e": 999 },
      selectedChapterIdsByLevel: {
        ...defaultSettings.selectedChapterIdsByLevel,
        "6e": selectedChapterIds
      },
      includePreviousSteps: true
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.chapterId && selectedChapterIds.includes(item.chapterId))).toBe(true);
    expect(new Set(result.map((item) => item.chapterId))).toEqual(new Set(selectedChapterIds));
  });

  it("does not keep automatic progression from other active levels when chapters are selected manually", () => {
    const selectedChapterId = siteProgressionChapters["3e"][1].id;
    const result = filterAutomatismes(allOfficialAutomatismes, {
      ...defaultSettings,
      levels: ["6e", "5e", "4e", "3e"],
      progressionByLevel: {
        "6e": "end",
        "5e": "end",
        "4e": "end",
        "3e": "end"
      },
      chapterLimitByLevel: { "6e": 999, "5e": 999, "4e": 999, "3e": 999 },
      selectedChapterIdsByLevel: {
        ...defaultSettings.selectedChapterIdsByLevel,
        "3e": [selectedChapterId]
      },
      includePreviousSteps: true
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result.every((item) => item.chapterId === selectedChapterId)).toBe(true);
  });

  it("keeps automatic decimal work no-calculator friendly", () => {
    const result = filterAutomatismes(allOfficialAutomatismes, {
      ...defaultSettings,
      levels: ["6e"],
      progressionByLevel: { ...defaultSettings.progressionByLevel, "6e": "end" },
      chapterLimitByLevel: { ...defaultSettings.chapterLimitByLevel, "6e": 999 },
      selectedDomains: ["decimaux"],
      includePreviousSteps: true
    });

    expect(result.length).toBeGreaterThan(0);
    expect(
      result.some(
        (item) =>
          item.tags.includes("decimaux") &&
          (item.statementTemplate.includes("× {{m}}") ||
            item.statementTemplate.includes("\\times {{m}}") ||
            item.statementTemplate.includes("\\times {{b}}"))
      )
    ).toBe(true);
    expect(
      result.some(
        (item) =>
          item.tags.includes("decimaux") &&
          /calculer/i.test(item.statementTemplate) &&
          /formatDecimalFrench\(a\)\s*(?:\\times|×|\+|-)/.test(item.statementTemplate)
      )
    ).toBe(false);
  });
});
