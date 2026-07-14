import { useRef, useState, type ChangeEvent } from "react";
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
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const imported = parseProfile(await file.text());
      const localCopy = createProfile(imported.name, imported.payload);
      setProfiles(upsertLocalProfile(localCopy));
      onRestore(localCopy.payload);
      setProfileName(localCopy.name);
      setMessage(`Le profil « ${localCopy.name} » est importé, enregistré et maintenant actif.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Import du profil impossible.");
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-hero">
        <div className="profile-hero-icon"><UserRound size={30} /></div>
        <div>
          <span className="profile-eyebrow">Vos données TempoMaths</span>
          <h1>Profil</h1>
          <p>Enregistrez votre travail ou récupérez-le sur un autre ordinateur.</p>
        </div>
      </header>

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
              <span className="profile-choice-label">Sur cet appareil</span>
              <h2>Sauvegarder mon travail</h2>
              <p>Donnez un nom à l’état actuel de TempoMaths.</p>
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
          <button className="profile-primary-button profile-main-action" type="button" onClick={saveCurrentLocally}>
            <Save size={18} /> Sauvegarder maintenant
          </button>
          <p className="profile-scope-note">
            Tout est inclus : progressions, diapos, favoris, historique et parcours de ceintures.
          </p>
        </section>

        <section className="profile-card profile-import-card">
          <div className="profile-card-heading">
            <FileUp size={23} />
            <div>
              <span className="profile-choice-label">Depuis un fichier</span>
              <h2>Récupérer mon travail</h2>
              <p>Choisissez le fichier téléchargé depuis TempoMaths sur votre autre ordinateur.</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            className="profile-file-input"
            type="file"
            accept=".json,.tempomaths-profile.json,application/json"
            onChange={handleImport}
          />
          <button className="profile-primary-button profile-main-action" type="button" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={18} /> Importer un profil
          </button>
          <p className="profile-scope-note">
            Le profil sera automatiquement enregistré sur ce PC et immédiatement activé.
          </p>
        </section>
      </div>

      <section className="profile-card profile-library">
        <div className="profile-card-heading">
          <FolderClock size={23} />
          <div>
            <h2>Mes sauvegardes</h2>
            <p>Utilisez une sauvegarde ici, ou téléchargez-la pour l’emporter sur un autre PC.</p>
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
                    <RefreshCw size={17} /> Utiliser
                  </button>
                  <button className="profile-secondary-button" type="button" onClick={() => downloadProfile(profile)}>
                    <Download size={17} /> Télécharger
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
