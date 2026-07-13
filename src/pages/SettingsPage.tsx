import type { AppSettings, AppTheme } from "../types";

type Props = {
  settings: AppSettings;
  onSettingsChange: (next: Partial<AppSettings>) => void;
};

export function SettingsPage({ settings, onSettingsChange }: Props) {
  return (
    <div className="page-grid two-columns">
      <section className="page-heading app-page-header">
        <div>
          <p className="eyebrow">Paramètres</p>
          <h1>Affichage et accessibilité</h1>
          <span>Personnalisez le confort visuel de toute l’interface.</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Thème</p>
            <h2>Interface</h2>
          </div>
        </div>
        <div className="segmented">
          {(["light", "dark"] as AppTheme[]).map((theme) => (
            <button
              key={theme}
              type="button"
              className={settings.theme === theme ? "selected" : ""}
              onClick={() => onSettingsChange({ theme })}
            >
              {theme === "light" ? "Clair" : "Sombre"}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="control-stack">
          <label className="switch-row">
            <input
              type="checkbox"
              checked={settings.dysMode}
              onChange={(event) => onSettingsChange({ dysMode: event.target.checked })}
            />
            <span>Mode dys / PAP</span>
          </label>
          <label className="switch-row">
            <input
              type="checkbox"
              checked={settings.reduceMotion}
              onChange={(event) => onSettingsChange({ reduceMotion: event.target.checked })}
            />
            <span>Animations réduites</span>
          </label>
          <label className="field">
            <span>Taille des textes</span>
            <input
              type="range"
              min={0.9}
              max={1.35}
              step={0.05}
              value={settings.fontScale}
              onChange={(event) => onSettingsChange({ fontScale: Number(event.target.value) })}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
