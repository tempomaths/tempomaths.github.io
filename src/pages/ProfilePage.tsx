import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { CheckCircle2, Download, FileUp, Save, Trash2, UserRound } from "lucide-react";
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
  const initialProfiles = useMemo(() => loadLocalProfiles(), []);
  const [profileName, setProfileName] = useState("Mon profil TempoMaths");
  const [profiles, setProfiles] = useState<TempoMathsProfile[]>(initialProfiles);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedProfile = profiles.find((profile) => profile.id === selectedProfileId) ?? null;

  const clearStatus = () => {
    setMessage("");
    setError("");
  };

  const activateProfile = (profile: TempoMathsProfile) => {
    clearStatus();
    setSelectedProfileId(profile.id);
    onRestore(profile.payload);
    setMessage(`Le profil « ${profile.name} » est maintenant actif.`);
  };

  const saveCurrentProfile = () => {
    clearStatus();
    const profile = createProfile(profileName, stored);
    const nextProfiles = upsertLocalProfile(profile);
    setProfiles(nextProfiles);
    setSelectedProfileId(profile.id);
    setProfileName(profile.name);
    setMessage(`Le profil « ${profile.name} » est enregistré.`);
  };

  const handleProfileSelection = (event: ChangeEvent<HTMLSelectElement>) => {
    const profile = profiles.find((item) => item.id === event.target.value);
    if (profile) activateProfile(profile);
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
      setSelectedProfileId(localCopy.id);
      onRestore(localCopy.payload);
      setMessage(`Le profil « ${localCopy.name} » a été chargé depuis le fichier.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Chargement du profil impossible.");
    }
  };

  const removeSelectedProfile = () => {
    if (!selectedProfile) return;
    const nextProfiles = deleteLocalProfile(selectedProfile.id);
    setProfiles(nextProfiles);
    setSelectedProfileId("");
    setMessage(`Le profil « ${selectedProfile.name} » a été supprimé.`);
  };

  return (
    <div className="profile-page profile-page-simple">
      <header className="profile-hero">
        <div className="profile-hero-icon"><UserRound size={30} /></div>
        <div>
          <span className="profile-eyebrow">Vos données TempoMaths</span>
          <h1>Profil</h1>
          <p>Choisissez un profil enregistré ou transférez-le sur un autre ordinateur.</p>
        </div>
      </header>

      {(message || error) && (
        <div className={error ? "profile-alert error" : "profile-alert success"} role="status">
          {error ? <FileUp size={19} /> : <CheckCircle2 size={19} />}
          <span>{error || message}</span>
        </div>
      )}

      <section className="profile-card profile-control-card">
        <div className="profile-section-title">
          <span>1</span>
          <div>
            <h2>Choisir un profil</h2>
            <p>La sélection charge automatiquement toutes les données du profil.</p>
          </div>
        </div>

        <label className="profile-select-field">
          <span>Profil enregistré</span>
          <select value={selectedProfileId} onChange={handleProfileSelection}>
            <option value="" disabled>{profiles.length ? "Choisir un profil…" : "Aucun profil enregistré"}</option>
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} — {formatDate(profile.savedAt)}
              </option>
            ))}
          </select>
        </label>

        {selectedProfile && (
          <div className="profile-selected-details">
            <span>{selectedProfile.payload.customAutomatismes.length} diapo(s) créée(s)</span>
            <span>{selectedProfile.payload.beltAchievements.length} étape(s) de ceinture</span>
          </div>
        )}
      </section>

      <section className="profile-card profile-control-card">
        <div className="profile-section-title">
          <span>2</span>
          <div>
            <h2>Enregistrer le profil actuel</h2>
            <p>Progressions, diapos, favoris, historique et ceintures seront inclus.</p>
          </div>
        </div>
        <div className="profile-save-row">
          <label className="profile-name-field">
            <span>Nom du nouveau profil</span>
            <input
              value={profileName}
              maxLength={80}
              onChange={(event) => setProfileName(event.target.value)}
              placeholder="Ex. Collège 2026-2027"
            />
          </label>
          <button className="profile-primary-button" type="button" onClick={saveCurrentProfile}>
            <Save size={18} /> Enregistrer ce profil
          </button>
        </div>
      </section>

      <section className="profile-card profile-control-card">
        <div className="profile-section-title">
          <span>3</span>
          <div>
            <h2>Transférer mon profil</h2>
            <p>Sauvegardez le profil choisi, puis chargez ce fichier sur l’autre ordinateur.</p>
          </div>
        </div>
        <input
          ref={fileInputRef}
          className="profile-file-input"
          type="file"
          accept=".json,.tempomaths-profile.json,application/json"
          onChange={handleImport}
        />
        <div className="profile-json-actions">
          <button
            className="profile-secondary-button"
            type="button"
            disabled={!selectedProfile}
            onClick={() => selectedProfile && downloadProfile(selectedProfile)}
          >
            <Download size={18} /> Sauvegarder mon profil
          </button>
          <button className="profile-primary-button" type="button" onClick={() => fileInputRef.current?.click()}>
            <FileUp size={18} /> Charger un profil
          </button>
          <button
            className="profile-delete-button"
            type="button"
            disabled={!selectedProfile}
            onClick={removeSelectedProfile}
          >
            <Trash2 size={18} /> Supprimer le profil choisi
          </button>
        </div>
      </section>
    </div>
  );
}
