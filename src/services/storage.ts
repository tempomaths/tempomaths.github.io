import type { AppSettings, Automatisme, GeneratedSeries, StoredPayload } from "../types";
import {
  allSiteProgressionChapterIds,
  createDefaultChapterOrderByLevel,
  createDefaultChapterSelectionByLevel,
  getChapterById,
  getChapterLimitFromProgression,
  getEffectiveChapterLevel,
  getOrderedChaptersForLevel,
  progressionLevels,
  siteProgressionChapters
} from "../data/siteProgression";

const STORAGE_KEY = "automaths-diapo:v1";

export const defaultSettings: AppSettings = {
  levels: ["6e"],
  progressionByLevel: {
    "6e": "trimester1",
    "5e": "trimester1",
    "4e": "trimester1",
    "3e": "trimester1"
  },
  chapterLimitByLevel: {
    "6e": getChapterLimitFromProgression("6e", "trimester1"),
    "5e": getChapterLimitFromProgression("5e", "trimester1"),
    "4e": getChapterLimitFromProgression("4e", "trimester1"),
    "3e": getChapterLimitFromProgression("3e", "trimester1")
  },
  selectedChapterIdsByLevel: createDefaultChapterSelectionByLevel(),
  chapterOrderByLevel: createDefaultChapterOrderByLevel(),
  chapterLevelOverrides: {},
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
  avoidSeenQuestions: true,
  slideshowMode: "ritual",
  seed: "",
  theme: "light",
  dysMode: false,
  fontScale: 1,
  reduceMotion: false
};

function clampChapterLimitByLevel(value: AppSettings["chapterLimitByLevel"]): AppSettings["chapterLimitByLevel"] {
  return {
    "6e": Math.min(Math.max(1, value["6e"]), siteProgressionChapters["6e"].length),
    "5e": Math.min(Math.max(1, value["5e"]), siteProgressionChapters["5e"].length),
    "4e": Math.min(Math.max(1, value["4e"]), siteProgressionChapters["4e"].length),
    "3e": Math.min(Math.max(1, value["3e"]), siteProgressionChapters["3e"].length)
  };
}

function cleanSelectedAutomatismeIds(ids: string[] = []): string[] {
  if (ids.length > 0 && ids.every((id) => id.startsWith("dnb-officiel:"))) {
    return [];
  }

  return ids;
}

function cleanChapterLevelOverrides(
  value: Partial<AppSettings["chapterLevelOverrides"]> = {}
): AppSettings["chapterLevelOverrides"] {
  const clean: AppSettings["chapterLevelOverrides"] = {};
  Object.entries(value).forEach(([chapterId, level]) => {
    if (level && allSiteProgressionChapterIds.has(chapterId) && progressionLevels.includes(level)) {
      clean[chapterId] = level;
    }
  });
  return clean;
}

function cleanChapterOrderByLevel(
  value: Partial<AppSettings["chapterOrderByLevel"]> = {},
  overrides: AppSettings["chapterLevelOverrides"] = {}
): AppSettings["chapterOrderByLevel"] {
  return Object.fromEntries(
    progressionLevels.map((level) => {
      const relevantIds = getOrderedChaptersForLevel(level, createDefaultChapterOrderByLevel(), overrides)
        .map((chapterItem) => chapterItem.id);
      const relevantSet = new Set(relevantIds);
      const provided = [...new Set(value[level] ?? [])]
        .filter((chapterId) => allSiteProgressionChapterIds.has(chapterId) && relevantSet.has(chapterId));

      return [level, [...provided, ...relevantIds.filter((chapterId) => !provided.includes(chapterId))]];
    })
  ) as AppSettings["chapterOrderByLevel"];
}

function cleanChapterSelectionByLevel(
  value: Partial<AppSettings["selectedChapterIdsByLevel"]> = {},
  overrides: AppSettings["chapterLevelOverrides"] = {}
): AppSettings["selectedChapterIdsByLevel"] {
  return Object.fromEntries(
    progressionLevels.map((level) => {
      const ids = [...new Set(value[level] ?? [])].filter((chapterId) => {
        const chapter = getChapterById(chapterId);
        return chapter && getEffectiveChapterLevel(chapter, overrides) === level;
      });
      return [level, ids];
    })
  ) as AppSettings["selectedChapterIdsByLevel"];
}

export function loadStorage(): StoredPayload {
  const fallback: StoredPayload = {
    version: 1,
    settings: defaultSettings,
    customAutomatismes: [],
    favoriteIds: [],
    favoriteSlideshows: [],
    disabledIds: [],
    history: [],
    seriesResults: [],
    beltAchievements: []
  };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return fallback;
    }
    const parsed = JSON.parse(raw) as Partial<StoredPayload>;
    const mergedChapterLimitByLevel = clampChapterLimitByLevel({
      ...defaultSettings.chapterLimitByLevel,
      ...parsed.settings?.chapterLimitByLevel
    });
    const mergedChapterLevelOverrides = cleanChapterLevelOverrides(parsed.settings?.chapterLevelOverrides);
    const mergedChapterOrderByLevel = cleanChapterOrderByLevel(
      parsed.settings?.chapterOrderByLevel,
      mergedChapterLevelOverrides
    );
    const mergedChapterSelectionByLevel = cleanChapterSelectionByLevel(
      parsed.settings?.selectedChapterIdsByLevel,
      mergedChapterLevelOverrides
    );

    return {
      ...fallback,
      ...parsed,
      settings: {
        ...defaultSettings,
        ...parsed.settings,
        progressionByLevel: {
          ...defaultSettings.progressionByLevel,
          ...parsed.settings?.progressionByLevel
        },
        chapterLimitByLevel: mergedChapterLimitByLevel,
        selectedChapterIdsByLevel: mergedChapterSelectionByLevel,
        chapterOrderByLevel: mergedChapterOrderByLevel,
        chapterLevelOverrides: mergedChapterLevelOverrides,
        selectedAutomatismeIds: cleanSelectedAutomatismeIds(parsed.settings?.selectedAutomatismeIds ?? [])
      },
      customAutomatismes: parsed.customAutomatismes ?? [],
      favoriteIds: parsed.favoriteIds ?? [],
      favoriteSlideshows: parsed.favoriteSlideshows ?? [],
      disabledIds: parsed.disabledIds ?? [],
      history: parsed.history ?? [],
      seriesResults: parsed.seriesResults ?? [],
      beltAchievements: parsed.beltAchievements ?? []
    };
  } catch {
    return fallback;
  }
}

export function saveStorage(payload: StoredPayload): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function updateStoredSettings(settings: AppSettings): void {
  const current = loadStorage();
  saveStorage({ ...current, settings });
}

export function updateCustomAutomatismes(customAutomatismes: Automatisme[]): void {
  const current = loadStorage();
  saveStorage({ ...current, customAutomatismes });
}

export function saveSeriesToHistory(series: GeneratedSeries): void {
  const current = loadStorage();
  const history = [series, ...current.history].slice(0, 30);
  saveStorage({ ...current, history });
}
