import { Play } from "lucide-react";
import type { AppSettings, Automatisme } from "../types";
import { DomainFilter } from "../components/DomainFilter";
import { LevelProgressionPicker } from "../components/LevelProgressionPicker";
import { QuickSettings } from "../components/QuickSettings";

type Props = {
  settings: AppSettings;
  automatismes: Automatisme[];
  eligibleCount: number;
  error: string;
  onSettingsChange: (next: Partial<AppSettings>) => void;
  onStart: () => void;
};

export function QuickCreatePage({
  settings,
  automatismes,
  eligibleCount,
  error,
  onSettingsChange,
  onStart
}: Props) {
  return (
    <div className="page-grid two-columns">
      <section className="page-heading">
        <div>
          <p className="eyebrow">Création rapide</p>
          <h1>Préparer une série</h1>
        </div>
        <button type="button" className="primary-button big" onClick={onStart}>
          <Play size={20} />
          Lancer le diaporama
        </button>
      </section>

      {error && <p className="error-line wide">{error}</p>}

      <LevelProgressionPicker settings={settings} onChange={onSettingsChange} />
      <QuickSettings settings={settings} onChange={onSettingsChange} />
      <DomainFilter settings={settings} automatismes={automatismes} onChange={onSettingsChange} />

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Seed</p>
            <h2>Reproductibilité</h2>
          </div>
        </div>
        <div className="control-stack">
          <label className="field">
            <span>Seed</span>
            <input
              value={settings.seed}
              placeholder="Auto si vide"
              onChange={(event) => onSettingsChange({ seed: event.target.value })}
            />
          </label>
          <div className="summary-strip">
            <strong>{eligibleCount}</strong>
            <span>modèles correspondent aux filtres actuels</span>
          </div>
        </div>
      </section>
    </div>
  );
}
