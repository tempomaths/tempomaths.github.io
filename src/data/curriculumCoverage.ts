import type { AppSettings, Automatisme, ChapterInfo, Level, MathDomain } from "../types";
import {
  createDefaultChapterOrderByLevel,
  createDefaultChapterSelectionByLevel,
  getChapterLimitFromProgression,
  getEffectiveChapterLevel,
  siteProgressionChapters
} from "./siteProgression";
import { isCompletedLowerActiveLevel } from "../utils/levelSelection";
import { getCustomizedChaptersForLevel } from "../utils/progressionCustomization";

export type ChapterCoverage = {
  chapter: ChapterInfo;
  effectiveRank: number;
  count: number;
  selected: boolean;
  domains: MathDomain[];
  difficultyMin: number;
  difficultyMax: number;
};

export type LevelCoverage = {
  level: Level;
  chapterLimit: number;
  chapters: ChapterCoverage[];
  total: number;
  covered: number;
  selectedTotal: number;
};

export function getChapterAutomatismes(automatismes: Automatisme[], chapterId: string): Automatisme[] {
  return automatismes.filter((item) => item.chapterId === chapterId);
}

export function getEffectiveChapterLimit(settings: AppSettings, level: Level): number {
  const chapterCount = getCustomizedChaptersForLevel(level, settings).length;

  if (isCompletedLowerActiveLevel(settings.levels, level)) {
    return Math.max(1, chapterCount);
  }

  const limit = (
    settings.chapterLimitByLevel?.[level] ??
    getChapterLimitFromProgression(level, settings.progressionByLevel[level])
  );

  return Math.min(Math.max(1, limit), Math.max(1, chapterCount));
}

export function getManualChapterSelectionCount(settings: AppSettings, level?: Level): number {
  if (level) {
    return settings.selectedChapterIdsByLevel?.[level]?.length ?? 0;
  }

  return settings.levels.reduce(
    (sum, levelItem) => sum + (settings.selectedChapterIdsByLevel?.[levelItem]?.length ?? 0),
    0
  );
}

export function isChapterSelected(settings: AppSettings, chapter: ChapterInfo): boolean {
  if (settings.hiddenChapterIds.includes(chapter.id)) {
    return false;
  }
  const level = getEffectiveChapterLevel(chapter, settings.chapterLevelOverrides);
  const manualSelection = settings.selectedChapterIdsByLevel?.[level] ?? [];
  const manualSelectionActive = getManualChapterSelectionCount(settings) > 0;

  if (manualSelectionActive) {
    return manualSelection.includes(chapter.id);
  }

  if (isCompletedLowerActiveLevel(settings.levels, level)) {
    return true;
  }

  const limit = getEffectiveChapterLimit(settings, level);
  const rank = getCustomizedChaptersForLevel(level, settings).findIndex((item) => item.id === chapter.id) + 1;
  return settings.includePreviousSteps ? rank <= limit : rank === limit;
}

export function getLevelCoverage(
  automatismes: Automatisme[],
  settings: AppSettings,
  level: Level
): LevelCoverage {
  const chapterLimit = getEffectiveChapterLimit(settings, level);
  const chapters = getCustomizedChaptersForLevel(level, settings).map((chapter, index) => {
    const items = getChapterAutomatismes(automatismes, chapter.id);
    const difficulties = items.map((item) => item.difficulty);
    return {
      chapter,
      effectiveRank: index + 1,
      count: items.length,
      selected: isChapterSelected(settings, chapter),
      domains: [...new Set(items.map((item) => item.domain))],
      difficultyMin: difficulties.length ? Math.min(...difficulties) : 0,
      difficultyMax: difficulties.length ? Math.max(...difficulties) : 0
    };
  });

  return {
    level,
    chapterLimit,
    chapters,
    total: chapters.reduce((sum, item) => sum + item.count, 0),
    covered: chapters.filter((item) => item.count > 0).length,
    selectedTotal: chapters.filter((item) => item.selected).reduce((sum, item) => sum + item.count, 0)
  };
}

export function getGlobalCoverage(automatismes: Automatisme[], settings: AppSettings): LevelCoverage[] {
  return settings.levels.map((level) => getLevelCoverage(automatismes, settings, level));
}

export function getWeakChapters(automatismes: Automatisme[], minimumCount: number): ChapterCoverage[] {
  return (Object.keys(siteProgressionChapters) as Level[])
    .flatMap((level) => getLevelCoverage(automatismes, {
      levels: [level],
      progressionByLevel: { "6e": "end", "5e": "end", "4e": "end", "3e": "end" },
      chapterLimitByLevel: { "6e": 999, "5e": 999, "4e": 999, "3e": 999 },
      selectedChapterIdsByLevel: createDefaultChapterSelectionByLevel(),
      chapterOrderByLevel: createDefaultChapterOrderByLevel(),
      chapterLevelOverrides: {},
      chapterTitleOverrides: {},
      hiddenChapterIds: [],
      automatismeChapterOverrides: {},
      includePreviousSteps: true,
      selectedDomains: [],
      questionCount: 10,
      durationSeconds: 30,
      durationByDifficulty: false,
      readingSeconds: 0,
      showTimer: true,
      timerSize: "large",
      autoPauseBetweenQuestions: false,
      correctionMode: "final",
      detailedCorrections: true,
      orderMode: "random",
      difficultyMode: "mixed",
      selectedAutomatismeIds: [],
      excludedTags: [],
      avoidSeenQuestions: false,
      slideshowMode: "ritual",
      seed: "",
      theme: "dark",
      dysMode: false,
      fontScale: 1,
      reduceMotion: false
    }, level).chapters)
    .filter((item) => item.count < minimumCount);
}
