import type { StoredPayload, TempoMathsProfile } from "../types";
import { normalizeStoredPayload } from "./storage";

const PROFILES_STORAGE_KEY = "tempomaths:profiles:v1";

function clonePayload(payload: StoredPayload): StoredPayload {
  return JSON.parse(JSON.stringify(payload)) as StoredPayload;
}

function createId(): string {
  const bytes = new Uint32Array(2);
  globalThis.crypto?.getRandomValues?.(bytes);
  return `profile:${Date.now().toString(36)}:${bytes[0].toString(36)}:${bytes[1].toString(36)}`;
}

function cleanProfileName(name: string): string {
  return name.trim().slice(0, 80) || "Mon profil TempoMaths";
}

export function createProfile(name: string, payload: StoredPayload): TempoMathsProfile {
  return {
    kind: "tempomaths-profile",
    formatVersion: 1,
    id: createId(),
    name: cleanProfileName(name),
    savedAt: new Date().toISOString(),
    payload: clonePayload(payload)
  };
}

export function loadLocalProfiles(): TempoMathsProfile[] {
  try {
    const raw = window.localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item) => {
      try {
        return [parseProfile(item)];
      } catch {
        return [];
      }
    });
  } catch {
    return [];
  }
}

export function saveLocalProfiles(profiles: TempoMathsProfile[]): void {
  window.localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

export function upsertLocalProfile(profile: TempoMathsProfile): TempoMathsProfile[] {
  const profiles = [profile, ...loadLocalProfiles().filter((item) => item.id !== profile.id)];
  saveLocalProfiles(profiles);
  return profiles;
}

export function deleteLocalProfile(profileId: string): TempoMathsProfile[] {
  const profiles = loadLocalProfiles().filter((item) => item.id !== profileId);
  saveLocalProfiles(profiles);
  return profiles;
}

export function serializeProfile(profile: TempoMathsProfile): string {
  return JSON.stringify(profile, null, 2);
}

export function parseProfile(input: string | unknown): TempoMathsProfile {
  const value = typeof input === "string" ? JSON.parse(input) : input;
  if (!value || typeof value !== "object") {
    throw new Error("Ce fichier ne contient pas un profil TempoMaths valide.");
  }

  const candidate = value as Partial<TempoMathsProfile>;
  if (
    candidate.kind !== "tempomaths-profile" ||
    candidate.formatVersion !== 1 ||
    typeof candidate.name !== "string" ||
    typeof candidate.id !== "string" ||
    typeof candidate.savedAt !== "string" ||
    !candidate.payload ||
    typeof candidate.payload !== "object" ||
    candidate.payload.version !== 1 ||
    !candidate.payload.settings ||
    typeof candidate.payload.settings !== "object"
  ) {
    throw new Error("Ce fichier ne contient pas un profil TempoMaths compatible.");
  }

  return {
    kind: "tempomaths-profile",
    formatVersion: 1,
    id: candidate.id,
    name: cleanProfileName(candidate.name),
    savedAt: candidate.savedAt,
    payload: normalizeStoredPayload(candidate.payload)
  };
}
