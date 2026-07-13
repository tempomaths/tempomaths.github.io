import { describe, expect, it } from "vitest";
import { allOfficialAutomatismes } from "../data/allAutomatismes";
import { generateSeries } from "../generator/generateSeries";
import { defaultSettings } from "../services/storage";
import { LEVELS } from "./labels";
import { getChronoChallengeIds } from "./chronoChallenge";

describe("chrono challenge", () => {
  it("always provides enough distinct short models for the 30-question preset", () => {
    const selectedAutomatismeIds = getChronoChallengeIds(allOfficialAutomatismes);
    const settings = {
      ...defaultSettings,
      levels: LEVELS,
      selectedChapterIdsByLevel: { "6e": [], "5e": [], "4e": [], "3e": [] },
      selectedAutomatismeIds,
      questionCount: 30,
      durationSeconds: 12,
      seed: "chrono-30"
    };

    expect(selectedAutomatismeIds.length).toBeGreaterThanOrEqual(30);
    expect(generateSeries(allOfficialAutomatismes, settings).questions).toHaveLength(30);
  });
});
