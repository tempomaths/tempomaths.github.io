import { useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  CheckCircle2,
  Download,
  FileUp,
  FolderClock,
  HardDriveDownload,
  RefreshCw,
  Save,
  Trash2,
  UserRound
} from "lucide-react";
import type { StoredPayload, TempoMathsProfile } from "../types";
import {
  createProfile,
  deleteLocalProfile,
  loadLocalProfiles,
  parseProfile,
  serializeProfile,
  upsertLocalProfile
} from "../services/profiles";

type ProfilePageProps = {
  stored: StoredPayload;
  onRestore: (payload: StoredPayload) => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function downloadProfile(profile: TempoMathsProfile): void {
  const safeName = profile.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "profil-tempomaths";
  const blob = new Blob([serializeProfile(profile)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeName}.tempomaths-profile.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ProfilePage({ stored, onRestore }: ProfilePageProps) {
  const [profileName, setProfileName] = useState("Mon profil TempoMaths");
  const [profiles, setProfiles] = useState<TempoMathsProfile[]>(() => loadLocalProfiles());
  const [importedProfile, setImportedProfile] = useState<TempoMathsProfile | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const summary = useMemo(() => {
    const settings = stored.settings;
    const progressionChanges =
      Object.keys(settings.chapterTitleOverrides).length +
      Object.keys(settings.chapterLevelOverrides).length +
      settings.hiddenChapterIds.length +
      Object.values(settings.automatismeChapterOverrides).length +
      Object.values(settings.automatismeAdditionalChapterIds).reduce((total, ids) => total + ids.length, 0);
    return {
      progressionChanges,
      customSlides: stored.customAutomatismes.length,
      favorites: stored.favoriteSlideshows.length,
      belts: stored.beltAchievements.length
    };
  }, [stored]);

  const clearStatus = () => {
    setMessage("");
    setError("");
  };

  const saveCurrentLocally = () => {
    clearStatus();
    const profile = createProfile(profileName, stored);
    setProfiles(upsertLocalProfile(profile));
    setProfileName(profile.name);
    setMessage(`Le profil « ${profile.name} » est sauvegardé sur cet appareil.`);
  };

  const exportCurrent = () => {
    clearStatus();
    const profile = createProfile(profileName, stored);
    downloadProfile(profile);
    setMessage("Le fichier du profil est prêt à être transféré sur un autre ordinateur.");
  };

  const restoreProfile = (profile: TempoMathsProfile) => {
    clearStatus();
    onRestore(profile.payload);
    setProfileName(profile.name);
    setMessage(`Le profil « ${profile.name} » a été chargé. Toutes ses données sont maintenant actives.`);
  };

  const handleImport = async (event: ChangeEvent<HTMLInputElement>) => {
    clearStatus();
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const profile = parseProfile(await file.text());
      setImportedProfile(profile);
      setMessage(`Le fichier « ${profile.name} » est valide. Vous pouvez maintenant le charger.`);
    } catch (caught) {
      setImportedProfile(null);
      setError(caught instanceof Error ? caught.message : "Import du profil impossible.");
    }
  };

  const keepImportedLocally = () => {
    if (!importedProfile) return;
    const localCopy = createProfile(importedProfile.name, importedProfile.payload);
    setProfiles(upsertLocalProfile(localCopy));
    setMessage(`Le profil « ${localCopy.name} » est conservé sur cet appareil.`);
  };

  return (
    <div className="profile-page">
      <header className="profile-hero">
        <div className="profile-hero-icon"><UserRound size={30} /></div>
        <div>
          <span className="profile-eyebrow">Sauvegarde complète</span>
          <h1>Profil</h1>
          <p>Gardez toute votre configuration TempoMaths et retrouvez-la sur ce PC ou un autre.</p>
        </div>
      </header>

      <section className="profile-summary" aria-label="Contenu du profil actuel">
        <article><strong>{summary.progressionChanges}</strong><span>modifications de progression</span></article>
        <article><strong>{summary.customSlides}</strong><span>diapos créées</span></article>
        <article><strong>{summary.favorites}</strong><span>diaporamas favoris</span></article>
        <article><strong>{summary.belts}</strong><span>étapes de ceinture enregistrées</span></article>
      </section>

      {(message || error) && (
        <div className={error ? "profile-alert error" : "profile-alert success"} role="status">
          {error ? <FileUp size={19} /> : <CheckCircle2 size={19} />}
          <span>{error || message}</span>
        </div>
      )}

      <div className="profile-grid">
        <section className="profile-card profile-save-card">
          <div className="profile-card-heading">
            <HardDriveDownload size={23} />
            <div>
              <h2>Sauvegarder le profil actuel</h2>
              <p>La copie locale permet de retrouver plusieurs configurations sur ce même appareil.</p>
            </div>
          </div>
          <label className="profile-name-field">
            <span>Nom du profil</span>
            <input
              value={profileName}
              maxLength={80}
              onChange={(event) => setProfileName(event.target.value)}
              placeholder="Ex. Collège 2026-2027"
            />
          </label>
          <div className="profile-actions">
            <button className="profile-primary-button" type="button" onClick={saveCurrentLocally}>
              <Save size={18} /> Sauvegarder sur cet appareil
            </button>
            <button className="profile-secondary-button" type="button" onClick={exportCurrent}>
              <Download size={18} /> Exporter vers un fichier
            </button>
          </div>
          <p className="profile-scope-note">
            Inclus : réglages, progressions modifiées, chapitres et diapos masqués ou déplacés, diapos créées,
            favoris, historique, résultats et parcours de ceintures.
          </p>
        </section>

        <section className="profile-card profile-import-card">
          <div className="profile-card-heading">
            <FileUp size={23} />
            <div>
              <h2>Charger depuis un autre PC</h2>
              <p>Sélectionnez un fichier <code>.tempomaths-profile.json</code> précédemment exporté.</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            className="profile-file-input"
            type="file"
            accept=".json,.tempomaths-profile.json,application/json"
            onChange={handleImport}
          />
          <button className="profile-primary-button" type="button" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={18} /> Choisir un fichier de profil
          </button>
          {importedProfile && (
            <div className="profile-import-preview">
              <div>
                <strong>{importedProfile.name}</strong>
                <span>Sauvegardé le {formatDate(importedProfile.savedAt)}</span>
              </div>
              <div className="profile-actions">
                <button className="profile-primary-button" type="button" onClick={() => restoreProfile(importedProfile)}>
                  <RefreshCw size={17} /> Charger ce profil
                </button>
                <button className="profile-secondary-button" type="button" onClick={keepImportedLocally}>
                  <Save size={17} /> Conserver sur ce PC
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <section className="profile-card profile-library">
        <div className="profile-card-heading">
          <FolderClock size={23} />
          <div>
            <h2>Profils enregistrés sur cet appareil</h2>
            <p>Charger un profil remplace les données actuellement actives par celles de sa sauvegarde.</p>
          </div>
        </div>
        {profiles.length === 0 ? (
          <div className="profile-empty">Aucun profil local pour le moment.</div>
        ) : (
          <div className="profile-list">
            {profiles.map((profile) => (
              <article key={profile.id}>
                <div className="profile-list-copy">
                  <strong>{profile.name}</strong>
                  <span>Sauvegardé le {formatDate(profile.savedAt)}</span>
                  <small>
                    {profile.payload.customAutomatismes.length} diapo(s) créée(s) · {profile.payload.beltAchievements.length} étape(s) de ceinture
                  </small>
                </div>
                <div className="profile-list-actions">
                  <button className="profile-primary-button" type="button" onClick={() => restoreProfile(profile)}>
                    <RefreshCw size={17} /> Charger
                  </button>
                  <button className="profile-secondary-button" type="button" onClick={() => downloadProfile(profile)}>
                    <Download size={17} /> Exporter
                  </button>
                  <button
                    className="profile-delete-button"
                    type="button"
                    onClick={() => {
                      setProfiles(deleteLocalProfile(profile.id));
                      setMessage(`Le profil « ${profile.name} » a été supprimé de cet appareil.`);
                    }}
                    aria-label={`Supprimer le profil ${profile.name}`}
                  >
                    <Trash2 size={17} /> Supprimer
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
