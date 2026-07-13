import type { Automatisme, AppSettings, GeneratorSettings, Level, MathDomain, ProgressionStep } from "../types";
import { getChapterById, getChapterOrderIndex, getEffectiveChapterLevel } from "../data/siteProgression";
import { isCompletedLowerActiveLevel } from "./levelSelection";
import { PROGRESSION_STEPS } from "./labels";

export function getAllowedSteps(targetStep: ProgressionStep, includePrevious: boolean): ProgressionStep[] {
  if (!includePrevious) {
    return [targetStep];
  }

  const index = PROGRESSION_STEPS.indexOf(targetStep);
  return PROGRESSION_STEPS.slice(0, index + 1);
}

export function getAvailableDomains(
  automatismes: Automatisme[],
  settings: Pick<
    AppSettings,
    | "levels"
    | "progressionByLevel"
    | "chapterLimitByLevel"
    | "selectedChapterIdsByLevel"
    | "chapterOrderByLevel"
    | "chapterLevelOverrides"
    | "hiddenChapterIds"
    | "includePreviousSteps"
  >
): MathDomain[] {
  const domains = new Set<MathDomain>();
  const manualChapterMode = hasActiveManualChapterSelection(settings);
  automatismes.forEach((automatisme) => {
    const allowedForLevel = settings.levels.some((level) =>
      matchesLevelProgression(automatisme, level, settings, manualChapterMode)
    );
    if (allowedForLevel) {
      domains.add(automatisme.domain);
    }
  });
  return [...domains].sort();
}

export function matchesDifficulty(
  difficulty: Automatisme["difficulty"],
  difficultyMode: GeneratorSettings["difficultyMode"]
): boolean {
  if (difficultyMode === "mixed") {
    return true;
  }
  if (difficultyMode === "easy") {
    return difficulty <= 2;
  }
  if (difficultyMode === "medium") {
    return difficulty >= 2 && difficulty <= 4;
  }
  return difficulty >= 4;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function isNoCalculatorFriendly(automatisme: Automatisme): boolean {
  const hasDecimalVariable = Object.values(automatisme.variablesSchema).some((definition) => definition.type === "decimal");

  if (!automatisme.tags.includes("decimaux") && !hasDecimalVariable) {
    return true;
  }

  const statement = normalizeText(automatisme.statementTemplate);
  const safeDecimalPatterns = [
    "comparer",
    "encadrer",
    "arrondir",
    "rang",
    "ecrire",
    "convertir",
    "decomposition",
    "fraction decimale",
    "\\div 10",
    "\\div 100",
    "\\div 1000",
    "÷ 10",
    "÷ 100",
    "÷ 1000",
    "diviser par 10",
    "diviser par 100",
    "diviser par 1000",
    "\\times 10",
    "\\times 100",
    "\\times 1000",
    "\\times {{m}}",
    "\\times 0,1",
    "\\times 0{,}1",
    "× 10",
    "× 100",
    "× 1000",
    "× 0,1",
    "× {{m}}",
    "multiplier par 10",
    "multiplier par 100",
    "multiplier par 1000"
  ];

  if (safeDecimalPatterns.some((pattern) => statement.includes(pattern))) {
    return true;
  }

  const isArithmeticDecimal =
    /\bcalcul(e|er)?\b/.test(statement) ||
    automatisme.tags.some((tag) => ["calcul", "addition", "soustraction", "multiplication", "division"].includes(tag));

  return !(hasDecimalVariable && isArithmeticDecimal);
}

function matchesLevelProgression(
  automatisme: Automatisme,
  level: Level,
  settings: Pick<
    AppSettings,
    | "levels"
    | "progressionByLevel"
    | "chapterLimitByLevel"
    | "selectedChapterIdsByLevel"
    | "chapterOrderByLevel"
    | "chapterLevelOverrides"
    | "hiddenChapterIds"
    | "includePreviousSteps"
  >,
  manualChapterMode: boolean
): boolean {
  const sourceChapter = automatisme.chapterId ? getChapterById(automatisme.chapterId) : undefined;
  const effectiveLevels = sourceChapter
    ? [getEffectiveChapterLevel(sourceChapter, settings.chapterLevelOverrides)]
    : automatisme.levels;

  if (!effectiveLevels.includes(level)) {
    return false;
  }

  const selectedChapterIds = settings.selectedChapterIdsByLevel?.[level] ?? [];
  if (manualChapterMode) {
    return Boolean(automatisme.chapterId && selectedChapterIds.includes(automatisme.chapterId));
  }

  if (isCompletedLowerActiveLevel(settings.levels, level)) {
    return true;
  }

  const targetChapter = settings.chapterLimitByLevel?.[level] ?? 0;
  const visibleChapterOrder = (settings.chapterOrderByLevel[level] ?? [])
    .filter((chapterId) => !(settings.hiddenChapterIds ?? []).includes(chapterId));
  const visibleChapterIndex = automatisme.chapterId ? visibleChapterOrder.indexOf(automatisme.chapterId) : -1;
  const chapterRank = automatisme.chapterId
    ? (visibleChapterIndex >= 0
        ? visibleChapterIndex + 1
        : getChapterOrderIndex(automatisme.chapterId, level, settings.chapterOrderByLevel))
    : automatisme.chapterRank;

  if (typeof chapterRank === "number" && chapterRank < 999 && targetChapter > 0) {
    return settings.includePreviousSteps
      ? chapterRank <= targetChapter
      : chapterRank === targetChapter;
  }

  const allowedSteps = getAllowedSteps(
    settings.progressionByLevel[level],
    settings.includePreviousSteps
  );
  return allowedSteps.includes(automatisme.progressionStep);
}

function hasActiveManualChapterSelection(
  settings: Pick<AppSettings, "levels" | "selectedChapterIdsByLevel">
): boolean {
  return settings.levels.some((level) => (settings.selectedChapterIdsByLevel?.[level] ?? []).length > 0);
}

export function filterAutomatismes(
  automatismes: Automatisme[],
  settings: Pick<
    AppSettings,
    | "levels"
    | "progressionByLevel"
    | "chapterLimitByLevel"
    | "selectedChapterIdsByLevel"
    | "chapterOrderByLevel"
    | "chapterLevelOverrides"
    | "hiddenChapterIds"
    | "includePreviousSteps"
    | "selectedDomains"
    | "difficultyMode"
    | "selectedAutomatismeIds"
    | "excludedTags"
  >,
  disabledIds: string[] = []
): Automatisme[] {
  const manualSelection = settings.selectedAutomatismeIds.length > 0;
  const manualChapterMode = hasActiveManualChapterSelection(settings);

  return automatismes.filter((automatisme) => {
    if (disabledIds.includes(automatisme.id)) {
      return false;
    }

    if (automatisme.chapterId && (settings.hiddenChapterIds ?? []).includes(automatisme.chapterId)) {
      return false;
    }

    if (manualSelection) {
      return settings.selectedAutomatismeIds.includes(automatisme.id);
    }

    const levelMatches = settings.levels.some((level) =>
      matchesLevelProgression(automatisme, level, settings, manualChapterMode)
    );

    if (!levelMatches) {
      return false;
    }

    if (
      settings.selectedDomains.length > 0 &&
      !settings.selectedDomains.includes(automatisme.domain)
    ) {
      return false;
    }

    if (!matchesDifficulty(automatisme.difficulty, settings.difficultyMode)) {
      return false;
    }

    if (!isNoCalculatorFriendly(automatisme)) {
      return false;
    }

    // Choosing a chapter is an explicit request: stale preset exclusions must
    // never empty that chapter (notably Thalès and algorithmics/Scratch).
    return manualChapterMode || !automatisme.tags.some((tag) => settings.excludedTags.includes(tag));
  });
}
