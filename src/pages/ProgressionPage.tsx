import { useState, type CSSProperties, type DragEvent } from "react";
import { ArrowDown, ArrowUp, GripVertical, Layers3, ListTree, RotateCcw } from "lucide-react";
import type { AppSettings, Automatisme, ChapterInfo, Level } from "../types";
import {
  createDefaultChapterOrderByLevel,
  createDefaultChapterSelectionByLevel,
  getEffectiveChapterLevel,
  progressionLevels
} from "../data/siteProgression";
import { domainLabels, levelLabels } from "../utils/labels";
import { getCustomizedChaptersForLevel } from "../utils/progressionCustomization";

type Props = {
  settings: AppSettings;
  automatismes: Automatisme[];
  onSettingsChange: (next: Partial<AppSettings>) => void;
};

function countChapterAutomatismes(automatismes: Automatisme[], chapterId: string): number {
  return automatismes.filter((item) => item.chapterId === chapterId).length;
}

export function ProgressionPage({ settings, automatismes, onSettingsChange }: Props) {
  const [visibleLevels, setVisibleLevels] = useState<Level[]>(
    progressionLevels.filter((level) => settings.levels.includes(level)).length > 0
      ? progressionLevels.filter((level) => settings.levels.includes(level))
      : ["6e"]
  );
  const [draggedChapter, setDraggedChapter] = useState<{ level: Level; chapterId: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<{ level: Level; index: number } | null>(null);
  const chaptersByLevel = progressionLevels.map((level) => ({
    level,
    chapters: getCustomizedChaptersForLevel(level, settings, true)
  }));
  const visibleChaptersByLevel = chaptersByLevel.filter((item) => visibleLevels.includes(item.level));
  const totalChapters = visibleChaptersByLevel.reduce((sum, item) => sum + item.chapters.length, 0);
  const movedChapters = Object.keys(settings.chapterLevelOverrides).length;

  const toggleVisibleLevel = (level: Level) => {
    const nextLevels = visibleLevels.includes(level)
      ? visibleLevels.filter((item) => item !== level)
      : progressionLevels.filter((item) => [...visibleLevels, level].includes(item));
    setVisibleLevels(nextLevels.length > 0 ? nextLevels : [level]);
  };

  const moveChapter = (level: Level, chapterId: string, direction: -1 | 1) => {
    const order = getCustomizedChaptersForLevel(level, settings, true)
      .map((chapterItem) => chapterItem.id);
    const index = order.indexOf(chapterId);
    const nextIndex = index + direction;

    if (index < 0 || nextIndex < 0 || nextIndex >= order.length) {
      return;
    }

    const nextOrder = [...order];
    const [chapterToMove] = nextOrder.splice(index, 1);
    nextOrder.splice(nextIndex, 0, chapterToMove);

    onSettingsChange({
      chapterOrderByLevel: {
        ...settings.chapterOrderByLevel,
        [level]: nextOrder
      },
      selectedAutomatismeIds: []
    });
  };

  const moveChapterToPosition = (chapter: ChapterInfo, nextLevel: Level, targetIndex: number) => {
    const wasSelected = progressionLevels.some(
      (level) => settings.selectedChapterIdsByLevel[level]?.includes(chapter.id) ?? false
    );
    const nextOverrides = { ...settings.chapterLevelOverrides };
    if (nextLevel === chapter.level) {
      delete nextOverrides[chapter.id];
    } else {
      nextOverrides[chapter.id] = nextLevel;
    }

    const nextOrderByLevel = { ...settings.chapterOrderByLevel };
    progressionLevels.forEach((level) => {
      nextOrderByLevel[level] = getCustomizedChaptersForLevel(level, settings, true)
        .map((chapterItem) => chapterItem.id)
        .filter((id) => id !== chapter.id);
    });
    const nextLevelOrder = [...(nextOrderByLevel[nextLevel] ?? [])];
    nextLevelOrder.splice(Math.min(Math.max(0, targetIndex), nextLevelOrder.length), 0, chapter.id);
    nextOrderByLevel[nextLevel] = nextLevelOrder;

    const nextSelection = { ...settings.selectedChapterIdsByLevel };
    progressionLevels.forEach((level) => {
      nextSelection[level] = (nextSelection[level] ?? []).filter((id) => id !== chapter.id);
    });
    if (wasSelected) {
      nextSelection[nextLevel] = [...(nextSelection[nextLevel] ?? []), chapter.id];
    }

    onSettingsChange({
      levels: settings.levels.includes(nextLevel) ? settings.levels : [...settings.levels, nextLevel],
      chapterLevelOverrides: nextOverrides,
      chapterOrderByLevel: nextOrderByLevel,
      selectedChapterIdsByLevel: nextSelection,
      selectedAutomatismeIds: []
    });

    setDraggedChapter(null);
    setDropTarget(null);
    if (!visibleLevels.includes(nextLevel)) {
      setVisibleLevels(progressionLevels.filter((level) => [...visibleLevels, nextLevel].includes(level)));
    }
  };

  const findDraggedChapter = () => {
    if (!draggedChapter) {
      return undefined;
    }

    return chaptersByLevel
      .find((item) => item.level === draggedChapter.level)
      ?.chapters.find((chapter) => chapter.id === draggedChapter.chapterId);
  };

  const dropDraggedChapter = (event: DragEvent, level: Level, targetIndex: number) => {
    event.preventDefault();
    const chapter = findDraggedChapter();
    if (!chapter) {
      setDraggedChapter(null);
      setDropTarget(null);
      return;
    }

    moveChapterToPosition(chapter, level, targetIndex);
  };

  const setChapterLevel = (chapter: ChapterInfo, nextLevel: Level) => {
    const currentLevel = getEffectiveChapterLevel(chapter, settings.chapterLevelOverrides);
    if (currentLevel === nextLevel) {
      return;
    }

    const wasSelected = settings.selectedChapterIdsByLevel[currentLevel]?.includes(chapter.id) ?? false;
    const nextOverrides = { ...settings.chapterLevelOverrides };
    if (nextLevel === chapter.level) {
      delete nextOverrides[chapter.id];
    } else {
      nextOverrides[chapter.id] = nextLevel;
    }

    const nextOrderByLevel = { ...settings.chapterOrderByLevel };
    progressionLevels.forEach((level) => {
      nextOrderByLevel[level] = (nextOrderByLevel[level] ?? []).filter((id) => id !== chapter.id);
    });
    nextOrderByLevel[nextLevel] = [...(nextOrderByLevel[nextLevel] ?? []), chapter.id];

    const nextSelection = { ...settings.selectedChapterIdsByLevel };
    progressionLevels.forEach((level) => {
      nextSelection[level] = (nextSelection[level] ?? []).filter((id) => id !== chapter.id);
    });
    if (wasSelected) {
      nextSelection[nextLevel] = [...(nextSelection[nextLevel] ?? []), chapter.id];
    }

    onSettingsChange({
      levels: settings.levels.includes(nextLevel) ? settings.levels : [...settings.levels, nextLevel],
      chapterLevelOverrides: nextOverrides,
      chapterOrderByLevel: nextOrderByLevel,
      selectedChapterIdsByLevel: nextSelection,
      selectedAutomatismeIds: []
    });
    if (!visibleLevels.includes(nextLevel)) {
      setVisibleLevels(progressionLevels.filter((level) => [...visibleLevels, nextLevel].includes(level)));
    }
  };

  const resetProgression = () => {
    onSettingsChange({
      chapterOrderByLevel: createDefaultChapterOrderByLevel(),
      chapterLevelOverrides: {},
      selectedChapterIdsByLevel: createDefaultChapterSelectionByLevel(),
      selectedAutomatismeIds: []
    });
  };

  return (
    <div className="progression-v1-screen">
      <section className="progression-v1-top app-page-header">
        <div>
          <p className="eyebrow">Progression</p>
          <h1>Ordre et niveaux</h1>
          <span>Organisez les chapitres selon votre progression annuelle.</span>
        </div>
        <div className="progression-v1-stats">
          <article>
            <ListTree size={17} />
            <span>Chapitres</span>
            <strong>{totalChapters}</strong>
          </article>
          <article>
            <Layers3 size={17} />
            <span>Déplacés</span>
            <strong>{movedChapters}</strong>
          </article>
          <button type="button" onClick={resetProgression}>
            <RotateCcw size={16} />
            Réinitialiser
          </button>
        </div>
      </section>

      <section className="progression-v1-levels" aria-label="Niveau affiché">
        {progressionLevels.map((level) => (
          <button
            key={level}
            type="button"
            className={visibleLevels.includes(level) ? "selected" : ""}
            onClick={() => toggleVisibleLevel(level)}
          >
            {levelLabels[level]}
          </button>
        ))}
      </section>

      <section
        className="progression-v1-board"
        style={{ "--progression-columns": visibleChaptersByLevel.length } as CSSProperties}
      >
        {visibleChaptersByLevel.map(({ level, chapters }) => (
          <article className="progression-v1-column" key={level}>
            <header>
              <strong>{levelLabels[level]}</strong>
              <span>{chapters.length} chapitres</span>
            </header>
            <div className="progression-v1-list">
              <div
                className={[
                  "progression-v1-drop-zone",
                  dropTarget?.level === level && dropTarget.index === 0 ? "active" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTarget({ level, index: 0 });
                }}
                onDrop={(event) => dropDraggedChapter(event, level, 0)}
              />
              {chapters.map((chapter, index) => {
                const sourceLevel = chapter.level !== level ? ` · origine ${levelLabels[chapter.level]}` : "";
                return (
                  <div
                    className={[
                      "progression-v1-row",
                      draggedChapter?.chapterId === chapter.id ? "dragging" : "",
                      dropTarget?.level === level && dropTarget.index === index + 1 ? "drop-after" : ""
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={chapter.id}
                    draggable
                    onDragStart={(event) => {
                      const target = event.target as HTMLElement;
                      if (target.closest("button, select")) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.effectAllowed = "move";
                      event.dataTransfer.setData("text/plain", chapter.id);
                      setDraggedChapter({ level, chapterId: chapter.id });
                    }}
                    onDragEnd={() => {
                      setDraggedChapter(null);
                      setDropTarget(null);
                    }}
                    onDragOver={(event) => {
                      event.preventDefault();
                      const rect = event.currentTarget.getBoundingClientRect();
                      const after = event.clientY > rect.top + rect.height / 2;
                      setDropTarget({ level, index: index + (after ? 1 : 0) });
                    }}
                    onDrop={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect();
                      const after = event.clientY > rect.top + rect.height / 2;
                      dropDraggedChapter(event, level, index + (after ? 1 : 0));
                    }}
                  >
                    <span className="progression-v1-drag-handle" aria-hidden="true">
                      <GripVertical size={15} />
                    </span>
                    <span className="progression-v1-rank">{index + 1}</span>
                    <div className="progression-v1-title">
                      <strong>{chapter.title}</strong>
                      <small>
                        {domainLabels[chapter.domain]} · {countChapterAutomatismes(automatismes, chapter.id)} automatismes
                        {sourceLevel}
                      </small>
                      <small>Savoirs : {chapter.savoirs.join(" · ")}</small>
                      <small>Compétences : {chapter.competences.join(" · ")}</small>
                    </div>
                    <select
                      value={level}
                      onChange={(event) => setChapterLevel(chapter, event.target.value as Level)}
                      aria-label={`Niveau de ${chapter.title}`}
                    >
                      {progressionLevels.map((levelItem) => (
                        <option key={levelItem} value={levelItem}>
                          {levelLabels[levelItem]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => moveChapter(level, chapter.id, -1)}
                      aria-label={`Monter ${chapter.title}`}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={index === chapters.length - 1}
                      onClick={() => moveChapter(level, chapter.id, 1)}
                      aria-label={`Descendre ${chapter.title}`}
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                );
              })}
              <div
                className={[
                  "progression-v1-drop-zone",
                  dropTarget?.level === level && dropTarget.index === chapters.length ? "active" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTarget({ level, index: chapters.length });
                }}
                onDrop={(event) => dropDraggedChapter(event, level, chapters.length)}
              />
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
