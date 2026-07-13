import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultSettings, loadStorage, saveStorage } from "./storage";
import type { StoredPayload } from "../types";

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

const createPayload = (): StoredPayload => ({
  version: 1,
  settings: { ...defaultSettings, questionCount: 15 },
  customAutomatismes: [],
  favoriteIds: [],
  favoriteSlideshows: [],
  disabledIds: [],
  history: [],
  seriesResults: [],
  beltAchievements: []
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TempoMaths storage", () => {
  it("migrates the former AutoMaths key without losing data", () => {
    const localStorage = new MemoryStorage();
    localStorage.setItem("automaths-diapo:v1", JSON.stringify(createPayload()));
    vi.stubGlobal("window", { localStorage });

    expect(loadStorage().settings.questionCount).toBe(15);
    expect(localStorage.getItem("tempomaths")).not.toBeNull();
    expect(localStorage.getItem("automaths-diapo:v1")).toBeNull();
  });

  it("saves new data only under the TempoMaths key", () => {
    const localStorage = new MemoryStorage();
    localStorage.setItem("automaths-diapo:v1", "legacy");
    vi.stubGlobal("window", { localStorage });

    saveStorage(createPayload());

    expect(localStorage.getItem("tempomaths")).not.toBeNull();
    expect(localStorage.getItem("automaths-diapo:v1")).toBeNull();
  });
});
