import { afterEach, describe, expect, it, vi } from "vitest";
import type { StoredPayload } from "../types";
import { createDefaultStoredPayload } from "./storage";
import {
  createProfile,
  deleteLocalProfile,
  loadLocalProfiles,
  parseProfile,
  serializeProfile,
  upsertLocalProfile
} from "./profiles";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function createCustomizedPayload(): StoredPayload {
  const payload = createDefaultStoredPayload();
  return {
    ...payload,
    settings: {
      ...payload.settings,
      chapterTitleOverrides: { "6e-chap-01": "Mon chapitre personnalisé" },
      hiddenChapterIds: ["6e-chap-02"],
      automatismeAdditionalChapterIds: { "calcul-test": ["5e-chap-03"] }
    },
    favoriteIds: ["calcul-test"],
    disabledIds: ["calcul-cache"],
    beltAchievements: [{
      level: "6e",
      beltKey: "blanche",
      beltLabel: "Ceinture blanche",
      bestCorrect: 8,
      totalQuestions: 10,
      bestPercentage: 80,
      attempts: 2,
      lastCompletedAt: "2026-07-14T08:00:00.000Z"
    }]
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TempoMaths profiles", () => {
  it("exports and restores all progression and belt data", () => {
    const profile = createProfile("Classe 6e", createCustomizedPayload());
    const restored = parseProfile(serializeProfile(profile));

    expect(restored.name).toBe("Classe 6e");
    expect(restored.payload.settings.chapterTitleOverrides["6e-chap-01"]).toBe("Mon chapitre personnalisé");
    expect(restored.payload.settings.hiddenChapterIds).toEqual(["6e-chap-02"]);
    expect(restored.payload.settings.automatismeAdditionalChapterIds["calcul-test"]).toEqual(["5e-chap-03"]);
    expect(restored.payload.favoriteIds).toEqual(["calcul-test"]);
    expect(restored.payload.disabledIds).toEqual(["calcul-cache"]);
    expect(restored.payload.beltAchievements[0].bestPercentage).toBe(80);
  });

  it("stores several profiles separately on the same device", () => {
    const localStorage = new MemoryStorage();
    vi.stubGlobal("window", { localStorage });

    const first = createProfile("Profil A", createCustomizedPayload());
    const second = createProfile("Profil B", createDefaultStoredPayload());
    upsertLocalProfile(first);
    upsertLocalProfile(second);

    expect(loadLocalProfiles().map((profile) => profile.name)).toEqual(["Profil B", "Profil A"]);
    expect(deleteLocalProfile(second.id).map((profile) => profile.name)).toEqual(["Profil A"]);
  });

  it("rejects files that are not compatible TempoMaths profiles", () => {
    expect(() => parseProfile('{"kind":"another-app"}')).toThrow(/compatible|valide/);
  });
});
