import { getChapterById, getChapterOrderIndex, getEffectiveChapterLevel, getOrderedChaptersForLevel } from "../data/siteProgression";
import type { AppSettings, Automatisme, ChapterInfo, Level } from "../types";

type ProgressionCustomizationSettings = Pick<
  AppSettings,
  | "chapterOrderByLevel"
  | "chapterLevelOverrides"
  | "chapterTitleOverrides"
  | "hiddenChapterIds"
  | "automatismeChapterOverrides"
>;

export function customizeChapter(chapter: ChapterInfo, settings: ProgressionCustomizationSettings): ChapterInfo {
  return {
    ...chapter,
    title: settings.chapterTitleOverrides[chapter.id] ?? chapter.title
  };
}

export function getCustomizedChaptersForLevel(
  level: Level,
  settings: ProgressionCustomizationSettings,
  includeHidden = false
): ChapterInfo[] {
  return getOrderedChaptersForLevel(level, settings.chapterOrderByLevel, settings.chapterLevelOverrides)
    .filter((chapter) => includeHidden || !settings.hiddenChapterIds.includes(chapter.id))
    .map((chapter) => customizeChapter(chapter, settings));
}

export function getEffectiveAutomatismeChapterId(
  automatisme: Automatisme,
  settings: Pick<AppSettings, "automatismeChapterOverrides">
): string | undefined {
  return settings.automatismeChapterOverrides[automatisme.id] ?? automatisme.chapterId;
}

export function applyProgressionCustomizations(
  automatismes: Automatisme[],
  settings: ProgressionCustomizationSettings
): Automatisme[] {
  return automatismes.map((automatisme) => {
    const chapterId = getEffectiveAutomatismeChapterId(automatisme, settings);
    const chapter = chapterId ? getChapterById(chapterId) : undefined;
    if (!chapterId || !chapter) return automatisme;

    const level = getEffectiveChapterLevel(chapter, settings.chapterLevelOverrides);
    return {
      ...automatisme,
      chapterId,
      chapterRank: getChapterOrderIndex(chapterId, level, settings.chapterOrderByLevel),
      chapterTitle: settings.chapterTitleOverrides[chapterId] ?? chapter.title,
      levels: [level]
    };
  });
}
