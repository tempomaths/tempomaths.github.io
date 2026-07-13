import type { AppSettings, DifficultyMode } from "../types";
import { difficultyLabels } from "../utils/labels";

const questionCounts = [5, 10, 15, 20];
const durations = [10, 15, 20, 30, 45, 60];
const difficulties: DifficultyMode[] = ["mixed", "easy", "medium", "hard"];

type Props = {
  settings: AppSettings;
  onChange: (next: Partial<AppSettings>) => void;
};

export function QuickSettings({ settings, onChange }: Props) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Diaporama</p>
          <h2>Format rapide</h2>
        </div>
      </div>

      <div className="control-stack">
        <div className="control-group">
          <span>Questions</span>
          <div className="segmented">
            {questionCounts.map((count) => (
              <button
                key={count}
                type="button"
                className={settings.questionCount === count ? "selected" : ""}
                onClick={() => onChange({ questionCount: count })}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <span>Durée</span>
          <div className="segmented">
            {durations.map((duration) => (
              <button
                key={duration}
                type="button"
                className={settings.durationSeconds === duration ? "selected" : ""}
                onClick={() => onChange({ durationSeconds: duration })}
              >
                {duration} s
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <span>Difficulté</span>
          <div className="segmented">
            {difficulties.map((difficulty) => (
              <button
                key={difficulty}
                type="button"
                className={settings.difficultyMode === difficulty ? "selected" : ""}
                onClick={() => onChange({ difficultyMode: difficulty })}
              >
                {difficultyLabels[difficulty]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
