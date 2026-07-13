import { describe, expect, it } from "vitest";
import { allOfficialAutomatismes } from "../data/allAutomatismes";
import { defaultSettings } from "../services/storage";
import type { GeneratorSettings } from "../types";
import { generateSeries } from "./generateSeries";

describe("generateSeries", () => {
  it("generates ten questions", () => {
    const series = generateSeries(allOfficialAutomatismes, {
      ...defaultSettings,
      levels: ["3e"],
      progressionByLevel: { ...defaultSettings.progressionByLevel, "3e": "end" },
      questionCount: 10,
      seed: "brevet"
    });

    expect(series.questions).toHaveLength(10);
  });

  it("replays the same seed exactly", () => {
    const settings: GeneratorSettings = {
      ...defaultSettings,
      levels: ["5e"],
      progressionByLevel: { ...defaultSettings.progressionByLevel, "5e": "end" },
      questionCount: 10,
      seed: "rituel"
    };

    const first = generateSeries(allOfficialAutomatismes, settings);
    const second = generateSeries(allOfficialAutomatismes, settings);

    expect(first.questions.map((question) => question.statement)).toEqual(
      second.questions.map((question) => question.statement)
    );
  });

  it("avoids duplicates when the pool is large enough", () => {
    const series = generateSeries(allOfficialAutomatismes, {
      ...defaultSettings,
      levels: ["3e"],
      progressionByLevel: { ...defaultSettings.progressionByLevel, "3e": "end" },
      questionCount: 10,
      seed: "unique"
    });

    const ids = series.questions.map((question) => question.automatismeId);
    expect(new Set(ids).size).toBe(ids.length);

    const templates = series.questions.map((question) => {
      const source = allOfficialAutomatismes.find((item) => item.id === question.automatismeId);
      return source?.statementTemplate.replace(/\{\{.*?\}\}/g, "{{}}");
    });
    expect(new Set(templates).size).toBe(templates.length);
  });

  it("covers every required chapter before filling the remaining questions", () => {
    const chapterIds = [...new Set(
      allOfficialAutomatismes
        .filter((item) => item.levels.includes("4e") && item.chapterId)
        .map((item) => item.chapterId!)
    )].slice(0, 4);
    const series = generateSeries(allOfficialAutomatismes, {
      ...defaultSettings,
      levels: ["4e"],
      progressionByLevel: { ...defaultSettings.progressionByLevel, "4e": "end" },
      selectedChapterIdsByLevel: { ...defaultSettings.selectedChapterIdsByLevel, "4e": chapterIds },
      questionCount: 8,
      seed: "chapter-coverage"
    }, [], { coverChapterIds: chapterIds });

    chapterIds.forEach((chapterId) => expect(series.questions.some((question) => question.chapterId === chapterId)).toBe(true));
  });

  it("refuses to repeat a model when the selected pool is too small", () => {
    const picked = allOfficialAutomatismes.filter((item) => item.levels.includes("6e")).slice(0, 2);

    expect(() =>
      generateSeries(allOfficialAutomatismes, {
        ...defaultSettings,
        levels: ["6e"],
        selectedAutomatismeIds: picked.map((item) => item.id),
        questionCount: 3,
        seed: "too-short"
      })
    ).toThrow(/Sélection trop courte/);
  });

  it("falls back to automatic mode when a stored manual selection is stale", () => {
    const series = generateSeries(allOfficialAutomatismes, {
      ...defaultSettings,
      selectedAutomatismeIds: ["missing-old-selection"],
      questionCount: 5,
      seed: "stale-selection"
    });

    expect(series.questions).toHaveLength(5);
  });

  it("throws when saved filters make the current point of the year empty", () => {
    expect(() =>
      generateSeries(allOfficialAutomatismes, {
        ...defaultSettings,
        levels: ["6e"],
        selectedDomains: ["trigonometrie"],
        difficultyMode: "hard",
        questionCount: 5,
        seed: "empty-saved-filters"
      })
    ).toThrow(/Aucun automatisme disponible/);
  });

  it("throws when the disabled list blocks every item", () => {
    expect(() =>
      generateSeries(
        allOfficialAutomatismes,
        {
          ...defaultSettings,
          questionCount: 5,
          seed: "all-disabled"
        },
        allOfficialAutomatismes.map((item) => item.id)
      )
    ).toThrow(/Aucun automatisme disponible/);
  });

  it("generates from detailed manual selections even outside the active progression", () => {
    const selected = allOfficialAutomatismes.find(
      (item) => item.levels.includes("3e") && item.domain === "trigonometrie"
    );

    if (!selected) {
      throw new Error("Expected at least one 3e trigonometry automatisme.");
    }

    const series = generateSeries(allOfficialAutomatismes, {
      ...defaultSettings,
      levels: ["6e"],
      selectedAutomatismeIds: [selected.id],
      selectedDomains: ["nombres-calculs"],
      difficultyMode: "easy",
      includePreviousSteps: false,
      progressionByLevel: { ...defaultSettings.progressionByLevel, "6e": "start" },
      chapterLimitByLevel: { ...defaultSettings.chapterLimitByLevel, "6e": 1 },
      questionCount: 1,
      seed: "manual-anywhere"
    });

    expect(series.questions).toHaveLength(1);
    expect(series.questions[0].automatismeId).toBe(selected.id);
  });
});
