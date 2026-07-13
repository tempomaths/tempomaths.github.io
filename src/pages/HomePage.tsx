import { useEffect, useRef, useState, type MouseEvent } from "react";
import {
  ArrowRight,
  BrainCircuit,
  CheckSquare,
  ListTree,
  Play,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Presentation,
  Shuffle,
  Timer
} from "lucide-react";
import type { AppSettings, Automatisme, Level, ProgressionStep } from "../types";
import { getLevelCoverage, getManualChapterSelectionCount } from "../data/curriculumCoverage";
import { PURE_MENTAL_TAG } from "../data/mentalCalculAutomatismes";
import { getChapterLimitFromProgression } from "../data/siteProgression";
import {
  LEVELS,
  PROGRESSION_STEPS,
  difficultyLabels,
  levelLabels,
  progressionLabels,
  progressionShortLabels
} from "../utils/labels";
import { getHighestSelectedLevel, sortLevelsBySchoolOrder } from "../utils/levelSelection";

type Props = {
  settings: AppSettings;
  automatismes: Automatisme[];
  eligibleCount: number;
  error: string;
  onSettingsChange: (next: Partial<AppSettings>) => void;
  onStart: () => void;
  onStartPreset: (next: Partial<AppSettings>) => void;
  onOpenAdvanced: () => void;
  onOpenProgression: () => void;
};

const questionCounts = [5, 10, 15, 20];
const durations = [15, 30, 45, 60];
const difficultyModes = ["mixed", "easy", "medium", "hard"] as const;
const presentationExcludedTags = [
  "methode",
  "vocabulaire",
  "redaction",
  "theoreme",
  "formule",
  "propriete",
  "reconnaissance",
  "controle",
  "notation",
  "geometrie-ciblee"
];

function withPresentationFilter(settings: AppSettings, preset: Partial<AppSettings>): Partial<AppSettings> {
  return {
    ...preset,
    excludedTags: [...new Set([...presentationExcludedTags, ...(preset.excludedTags ?? [])])]
  };
}

function emptyChapterSelection(): AppSettings["selectedChapterIdsByLevel"] {
  return {
    "6e": [],
    "5e": [],
    "4e": [],
    "3e": []
  };
}

export function HomePage({
  settings,
  automatismes,
  eligibleCount,
  error,
  onSettingsChange,
  onStart,
  onStartPreset,
  onOpenAdvanced,
  onOpenProgression
}: Props) {
  const [focusedChapterLevel, setFocusedChapterLevel] = useState<Level>(settings.levels[0] ?? "6e");
  const lastSelectedChapterByLevel = useRef<Partial<Record<Level, string>>>({});
  const activeLevels = sortLevelsBySchoolOrder(settings.levels.length > 0 ? settings.levels : (["6e"] as Level[]));
  const mainLevel = getHighestSelectedLevel(activeLevels);
  const mentalIdsForActiveLevels = automatismes
    .filter(
      (automatisme) =>
        automatisme.tags.includes(PURE_MENTAL_TAG) &&
        !automatisme.figureTemplate &&
        activeLevels.some((level) => automatisme.levels.includes(level))
    )
    .map((automatisme) => automatisme.id);
  const mentalIdsForAllLevels = automatismes
    .filter((automatisme) => automatisme.tags.includes(PURE_MENTAL_TAG) && !automatisme.figureTemplate)
    .map((automatisme) => automatisme.id);
  const mentalProjectionPreset = (preset: Partial<AppSettings>, allLevels = false): Partial<AppSettings> =>
    withPresentationFilter(settings, {
      includePreviousSteps: true,
      selectedDomains: [],
      selectedChapterIdsByLevel: emptyChapterSelection(),
      selectedAutomatismeIds: allLevels ? mentalIdsForAllLevels : mentalIdsForActiveLevels,
      excludedTags: [],
      difficultyMode: "mixed",
      orderMode: "random",
      seed: "",
      ...preset
    });
  const mainChapterLimit =
    settings.chapterLimitByLevel?.[mainLevel] ??
    getChapterLimitFromProgression(mainLevel, settings.progressionByLevel[mainLevel]);
  const levelCoverages = activeLevels.map((level) => getLevelCoverage(automatismes, settings, level));
  const visibleChapterLevel = activeLevels.includes(focusedChapterLevel) ? focusedChapterLevel : mainLevel;
  const visibleCoverage =
    levelCoverages.find((coverage) => coverage.level === visibleChapterLevel) ?? levelCoverages[0];
  const mainCoverage = levelCoverages.find((coverage) => coverage.level === mainLevel) ?? levelCoverages[0];
  const activeChapterCoverage =
    mainCoverage?.chapters.find((item) => item.effectiveRank === mainChapterLimit) ??
    mainCoverage?.chapters[0];
  const activeChapter = activeChapterCoverage?.chapter;
  const manualChapterSelectionCount = getManualChapterSelectionCount(settings);
  const headerScope = manualChapterSelectionCount > 0
    ? `${activeLevels.map((level) => levelLabels[level]).join(" + ")} · ${manualChapterSelectionCount} chapitres choisis`
    : `${levelLabels[mainLevel]} · ${progressionLabels[settings.progressionByLevel[mainLevel]]} · ${
        activeChapterCoverage && activeChapter
          ? `Chap ${activeChapter.rank} : ${activeChapter.title}`
          : "Progression"
      }`;

  useEffect(() => {
    if (!activeLevels.includes(focusedChapterLevel)) {
      setFocusedChapterLevel(mainLevel);
    }
  }, [activeLevels, focusedChapterLevel, mainLevel]);

  const clearChapterSelection = (level?: Level) => {
    const next = { ...settings.selectedChapterIdsByLevel };
    if (level) {
      next[level] = [];
      return next;
    }

    activeLevels.forEach((levelItem) => {
      next[levelItem] = [];
    });
    return next;
  };

  const toggleLevel = (level: Level) => {
    const isSelected = settings.levels.includes(level);
    const nextLevels = isSelected
      ? settings.levels.filter((item) => item !== level)
      : [...settings.levels, level];
    const normalizedLevels = sortLevelsBySchoolOrder(nextLevels.length > 0 ? nextLevels : [level]);
    setFocusedChapterLevel(isSelected ? normalizedLevels[0] : level);
    onSettingsChange({ levels: normalizedLevels, selectedAutomatismeIds: [] });
  };

  const setProgression = (step: ProgressionStep) => {
    onSettingsChange({
      progressionByLevel: {
        ...settings.progressionByLevel,
        [mainLevel]: step
      },
      chapterLimitByLevel: {
        ...settings.chapterLimitByLevel,
        [mainLevel]: getChapterLimitFromProgression(mainLevel, step)
      },
      selectedChapterIdsByLevel: clearChapterSelection(mainLevel),
      selectedAutomatismeIds: []
    });
  };

  const toggleChapter = (level: Level, chapterId: string, event?: MouseEvent<HTMLButtonElement>) => {
    const current = settings.selectedChapterIdsByLevel?.[level] ?? [];
    const coverage = levelCoverages.find((item) => item.level === level);
    const manualSelectionActive = getManualChapterSelectionCount(settings) > 0;
    const visibleSelection = manualSelectionActive
      ? current
      : coverage?.chapters.filter((item) => item.selected).map((item) => item.chapter.id) ?? current;
    const lastChapterId = lastSelectedChapterByLevel.current[level];
    const useRange = Boolean(event?.shiftKey && lastChapterId && coverage);
    const useToggle = Boolean(event?.ctrlKey || event?.metaKey);
    let nextIds: string[];

    if (useToggle) {
      nextIds = visibleSelection.includes(chapterId)
        ? visibleSelection.filter((id) => id !== chapterId)
        : [...visibleSelection, chapterId];
    } else if (useRange && coverage) {
      const orderedIds = coverage.chapters.map((item) => item.chapter.id);
      const start = orderedIds.indexOf(lastChapterId as string);
      const end = orderedIds.indexOf(chapterId);

      if (start >= 0 && end >= 0) {
        const [from, to] = start < end ? [start, end] : [end, start];
        nextIds = [...new Set([...visibleSelection, ...orderedIds.slice(from, to + 1)])];
      } else {
        nextIds = [chapterId];
      }
    } else {
      nextIds = [chapterId];
    }

    lastSelectedChapterByLevel.current[level] = chapterId;
    setFocusedChapterLevel(level);
    const nextLevels = settings.levels.includes(level) ? settings.levels : [...settings.levels, level];

    onSettingsChange({
      levels: nextLevels,
      selectedChapterIdsByLevel: {
        ...settings.selectedChapterIdsByLevel,
        [level]: nextIds
      },
      selectedAutomatismeIds: []
    });
  };

  return (
    <div className="home-command-screen">
      <section className="home-command-top app-page-header">
        <div className="home-command-title">
          <p className="eyebrow">TempoMaths v0.3</p>
          <h1>Tableau de bord</h1>
          <span>{headerScope}</span>
        </div>

        <div className="home-command-actions">
          {settings.selectedAutomatismeIds.length > 0 && (
            <button
              type="button"
              className="home-command-soft"
              onClick={() => onSettingsChange({ selectedAutomatismeIds: [] })}
            >
              <Sparkles size={16} />
              Auto
            </button>
          )}
          <button type="button" className="home-command-soft" onClick={onOpenProgression}>
            <ListTree size={16} />
            Progression
          </button>
          <button type="button" className="home-command-soft" onClick={onOpenAdvanced}>
            <SlidersHorizontal size={16} />
            Détaillé
          </button>
          <button type="button" className="home-command-launch" onClick={onStart}>
            <Play size={20} />
            <span>Lancer</span>
            <strong>{eligibleCount}</strong>
          </button>
        </div>
      </section>

      {error && (
        <div className="home-command-error">
          <ShieldCheck size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="home-command-controls">
        <article className="home-command-panel">
          <div className="home-command-panel-head">
            <span>Niveau</span>
            <strong>{settings.levels.join(" + ")}</strong>
          </div>
          <div className="home-command-levels">
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                className={settings.levels.includes(level) ? "selected" : ""}
                onClick={() => toggleLevel(level)}
              >
                {levelLabels[level]}
              </button>
            ))}
          </div>
        </article>

        <article className="home-command-panel">
          <div className="home-command-panel-head">
            <span>Période</span>
            <strong>{progressionShortLabels[settings.progressionByLevel[mainLevel]]}</strong>
          </div>
          <div className="home-command-periods">
            {PROGRESSION_STEPS.map((step) => (
              <button
                key={step}
                type="button"
                className={settings.progressionByLevel[mainLevel] === step ? "selected" : ""}
                onClick={() => setProgression(step)}
              >
                <strong>{progressionShortLabels[step]}</strong>
                <span>{progressionLabels[step]}</span>
              </button>
            ))}
          </div>
        </article>

        <article className="home-command-panel">
          <div className="home-command-panel-head">
            <span>Série</span>
            <strong>{settings.questionCount} questions</strong>
          </div>
          <div className="home-command-chips">
            {questionCounts.map((count) => (
              <button
                key={count}
                type="button"
                className={settings.questionCount === count ? "selected" : ""}
                onClick={() => onSettingsChange({ questionCount: count })}
              >
                {count}
              </button>
            ))}
            {durations.map((duration) => (
              <button
                key={duration}
                type="button"
                className={settings.durationSeconds === duration ? "selected" : ""}
                onClick={() => onSettingsChange({ durationSeconds: duration })}
              >
                {duration}s
              </button>
            ))}
          </div>
        </article>

        <article className="home-command-panel">
          <div className="home-command-panel-head">
            <span>Difficulté</span>
            <strong>{difficultyLabels[settings.difficultyMode]}</strong>
          </div>
          <div className="home-command-chips">
            {difficultyModes.map((mode) => (
              <button
                key={mode}
                type="button"
                className={settings.difficultyMode === mode ? "selected" : ""}
                onClick={() => onSettingsChange({ difficultyMode: mode })}
              >
                {difficultyLabels[mode]}
              </button>
            ))}
          </div>
        </article>
      </section>

      <section className="home-v02-workflows" aria-label="Parcours rapides">
          <button
            type="button"
            onClick={() =>
              onStartPreset(mentalProjectionPreset({
                questionCount: 10,
                durationSeconds: 20,
                showTimer: true,
                timerSize: "large",
                correctionMode: "immediate",
                slideshowMode: "training",
              }))
            }
          >
            <Presentation size={18} />
            <span>Maths mentales</span>
            <strong>10 diapos</strong>
          </button>
          <button
            type="button"
            onClick={() =>
              onStartPreset(mentalProjectionPreset({
                questionCount: 30,
                durationSeconds: 12,
                showTimer: true,
                timerSize: "large",
                correctionMode: "final",
                slideshowMode: "evaluation",
              }, true))
            }
          >
            <Timer size={18} />
            <span>Défi chrono</span>
            <strong>30 x 12s</strong>
          </button>
          <button
            type="button"
            onClick={() =>
              onStartPreset(mentalProjectionPreset({
                questionCount: 10,
                durationSeconds: 20,
                showTimer: true,
                correctionMode: "immediate",
                slideshowMode: "ritual",
                orderMode: "progressive",
                difficultyMode: "easy",
              }))
            }
          >
            <BrainCircuit size={18} />
            <span>Réactivation</span>
            <strong>progressif</strong>
          </button>
          <button
            type="button"
            onClick={() =>
              onStartPreset(mentalProjectionPreset({
                levels: LEVELS,
                questionCount: 20,
                durationSeconds: 20,
                showTimer: true,
                correctionMode: "immediate",
                slideshowMode: "training",
                orderMode: "random",
                difficultyMode: "mixed",
              }, true))
            }
          >
            <Shuffle size={18} />
            <span>Mix collège</span>
            <strong>6e-3e</strong>
          </button>
      </section>

      <section className="home-command-year">
        <div className="home-command-year-head">
          <div className="home-command-scope-toggle" role="group" aria-label="Périmètre des chapitres">
            <button
              type="button"
              className={!settings.includePreviousSteps ? "selected" : ""}
              onClick={() =>
                onSettingsChange({
                  includePreviousSteps: false,
                  selectedChapterIdsByLevel: clearChapterSelection(),
                  selectedAutomatismeIds: []
                })
              }
            >
              Chapitre seul
            </button>
            <button
              type="button"
              className={settings.includePreviousSteps ? "selected" : ""}
              onClick={() =>
                onSettingsChange({
                  includePreviousSteps: true,
                  selectedChapterIdsByLevel: clearChapterSelection(),
                  selectedAutomatismeIds: []
                })
              }
            >
              Depuis septembre
            </button>
          </div>
          <div className="home-command-year-summary">
            <CheckSquare size={16} />
            <span>
              {manualChapterSelectionCount > 0
                ? `${manualChapterSelectionCount} chapitres sélectionnés`
                : "Progression automatique"}
            </span>
          </div>
          {manualChapterSelectionCount > 0 ? (
            <button
              type="button"
              onClick={() =>
                onSettingsChange({
                  selectedChapterIdsByLevel: clearChapterSelection(),
                  selectedAutomatismeIds: []
                })
              }
            >
              <RotateCcw size={16} />
              Revenir auto
            </button>
          ) : (
            <button type="button" onClick={onOpenProgression}>
              Ordre / niveau
              <ArrowRight size={16} />
            </button>
          )}
        </div>

        <div className="home-command-level-stack">
          <div className="home-command-chapter-tabs">
            {levelCoverages.map((coverage) => {
              const manualForLevel = settings.selectedChapterIdsByLevel?.[coverage.level]?.length ?? 0;
              const selectedForLevel = coverage.chapters.filter((item) => item.selected).length;
              return (
                <button
                  key={coverage.level}
                  type="button"
                  className={coverage.level === visibleChapterLevel ? "selected" : ""}
                  onClick={() => setFocusedChapterLevel(coverage.level)}
                >
                  <strong>{levelLabels[coverage.level]}</strong>
                  <span>{manualForLevel > 0 ? `${manualForLevel}` : `${selectedForLevel}/${coverage.chapters.length}`}</span>
                </button>
              );
            })}
          </div>

          {visibleCoverage && (() => {
            const coverage = visibleCoverage;
            const manualForLevel = settings.selectedChapterIdsByLevel?.[coverage.level]?.length ?? 0;
            return (
              <div className="home-command-level-block" key={coverage.level}>
                <div className="home-command-chapter-grid">
                  {coverage.chapters.map(({ chapter, effectiveRank, selected }) => (
                    <button
                      key={chapter.id}
                      type="button"
                      className={[
                        "home-command-chapter",
                        selected ? "selected" : "",
                        manualForLevel === 0 && effectiveRank === coverage.chapterLimit ? "current" : ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={(event) => toggleChapter(coverage.level, chapter.id, event)}
                      title={`Chap ${chapter.rank} : ${chapter.title}`}
                    >
                      <span>{chapter.rank.toString().padStart(2, "0")}</span>
                      <strong>{chapter.title}</strong>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </section>
    </div>
  );
}
