import type { AppSettings, Level, ProgressionStep } from "../types";
import { getChapterLimitFromProgression, siteProgressionChapters } from "../data/siteProgression";
import { LEVELS, PROGRESSION_STEPS, levelLabels, progressionShortLabels } from "../utils/labels";

type Props = {
  settings: AppSettings;
  onChange: (next: Partial<AppSettings>) => void;
};

export function LevelProgressionPicker({ settings, onChange }: Props) {
  const clearChapterSelection = (level: Level) => ({
    ...settings.selectedChapterIdsByLevel,
    [level]: []
  });

  const toggleLevel = (level: Level) => {
    const nextLevels = settings.levels.includes(level)
      ? settings.levels.filter((item) => item !== level)
      : [...settings.levels, level];

    onChange({ levels: nextLevels.length > 0 ? nextLevels : [level], selectedAutomatismeIds: [] });
  };

  const setProgression = (level: Level, step: ProgressionStep) => {
    onChange({
      progressionByLevel: {
        ...settings.progressionByLevel,
        [level]: step
      },
      chapterLimitByLevel: {
        ...settings.chapterLimitByLevel,
        [level]: getChapterLimitFromProgression(level, step)
      },
      selectedChapterIdsByLevel: clearChapterSelection(level),
      selectedAutomatismeIds: []
    });
  };

  const setChapterLimit = (level: Level, chapterRank: number) => {
    onChange({
      chapterLimitByLevel: {
        ...settings.chapterLimitByLevel,
        [level]: chapterRank
      },
      selectedChapterIdsByLevel: clearChapterSelection(level),
      selectedAutomatismeIds: []
    });
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Niveaux</p>
          <h2>Progression</h2>
        </div>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={settings.includePreviousSteps}
            onChange={(event) => onChange({ includePreviousSteps: event.target.checked })}
          />
          <span>Étapes précédentes</span>
        </label>
      </div>

      <div className="level-grid">
        {LEVELS.map((level) => {
          const selected = settings.levels.includes(level);
          return (
            <div className={selected ? "level-row selected" : "level-row"} key={level}>
              <label className="level-check">
                <input type="checkbox" checked={selected} onChange={() => toggleLevel(level)} />
                <span>{levelLabels[level]}</span>
              </label>

              <div className="level-controls">
                <div className="segmented compact" aria-label={`Progression ${level}`}>
                  {PROGRESSION_STEPS.map((step) => (
                    <button
                      key={step}
                      type="button"
                      className={settings.progressionByLevel[level] === step ? "selected" : ""}
                      disabled={!selected}
                      onClick={() => setProgression(level, step)}
                    >
                      {progressionShortLabels[step]}
                    </button>
                  ))}
                </div>
                <select
                  value={
                    settings.chapterLimitByLevel?.[level] ??
                    getChapterLimitFromProgression(level, settings.progressionByLevel[level])
                  }
                  disabled={!selected}
                  onChange={(event) => setChapterLimit(level, Number(event.target.value))}
                >
                  {siteProgressionChapters[level].map((chapterItem) => (
                    <option key={chapterItem.id} value={chapterItem.rank}>
                      Chap {chapterItem.rank} : {chapterItem.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
