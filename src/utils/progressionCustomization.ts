import { getChapterById, getChapterOrderIndex, getEffectiveChapterLevel, getOrderedChaptersForLevel } from "../data/siteProgression";
import type { AppSettings, Automatisme, ChapterInfo, Level } from "../types";

type ProgressionCustomizationSettings = Pick<
  AppSettings,
  | "chapterOrderByLevel"
  | "chapterLevelOverrides"
  | "chapterTitleOverrides"
  | "hiddenChapterIds"
  | "automatismeChapterOverrides"
  | "automatismeAdditionalChapterIds"
>;

const ADDITIONAL_CHAPTER_SEPARATOR = "::chapter:";

export function createAdditionalAutomatismeId(automatismeId: string, chapterId: string): string {
  return `${automatismeId}${ADDITIONAL_CHAPTER_SEPARATOR}${chapterId}`;
}

export function parseAdditionalAutomatismeId(id: string): { sourceId: string; chapterId: string } | undefined {
  const separatorIndex = id.lastIndexOf(ADDITIONAL_CHAPTER_SEPARATOR);
  if (separatorIndex < 0) return undefined;
  return {
    sourceId: id.slice(0, separatorIndex),
    chapterId: id.slice(separatorIndex + ADDITIONAL_CHAPTER_SEPARATOR.length)
  };
}

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
  const customizeAutomatisme = (automatisme: Automatisme, chapterId: string, id = automatisme.id): Automatisme => {
    const chapter = chapterId ? getChapterById(chapterId) : undefined;
    if (!chapterId || !chapter) return automatisme;

    const level = getEffectiveChapterLevel(chapter, settings.chapterLevelOverrides);
    return {
      ...automatisme,
      id,
      chapterId,
      chapterRank: getChapterOrderIndex(chapterId, level, settings.chapterOrderByLevel),
      chapterTitle: settings.chapterTitleOverrides[chapterId] ?? chapter.title,
      levels: [level]
    };
  };

  return automatismes.flatMap((automatisme) => {
    const primaryChapterId = getEffectiveAutomatismeChapterId(automatisme, settings);
    const primary = primaryChapterId ? customizeAutomatisme(automatisme, primaryChapterId) : automatisme;
    const additionalChapterIds = [...new Set(settings.automatismeAdditionalChapterIds[automatisme.id] ?? [])]
      .filter((chapterId) => chapterId !== primaryChapterId && getChapterById(chapterId));

    return [
      primary,
      ...additionalChapterIds.map((chapterId) => customizeAutomatisme(
        automatisme,
        chapterId,
        createAdditionalAutomatismeId(automatisme.id, chapterId)
      ))
    ];
  });
}
