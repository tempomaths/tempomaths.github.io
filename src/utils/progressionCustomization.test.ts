import { describe, expect, it } from "vitest";
import { allOfficialAutomatismes } from "../data/allAutomatismes";
import { defaultSettings } from "../services/storage";
import {
  applyProgressionCustomizations,
  getCustomizedChaptersForLevel
} from "./progressionCustomization";

describe("progression customization", () => {
  it("renames and hides chapters without changing the official source", () => {
    const source = getCustomizedChaptersForLevel("6e", defaultSettings, true);
    const first = source[0];
    const customized = {
      ...defaultSettings,
      chapterTitleOverrides: { [first.id]: "Mon chapitre personnalisé" },
      hiddenChapterIds: [source[1].id]
    };

    const visible = getCustomizedChaptersForLevel("6e", customized);

    expect(visible[0].title).toBe("Mon chapitre personnalisé");
    expect(visible.some((chapter) => chapter.id === source[1].id)).toBe(false);
    expect(source[0].title).not.toBe("Mon chapitre personnalisé");
  });

  it("moves a slide to another chapter and applies its customized title", () => {
    const source = allOfficialAutomatismes.find((item) => item.chapterId === "6e-chap-01");
    expect(source).toBeDefined();
    const customized = {
      ...defaultSettings,
      chapterTitleOverrides: { "5e-chap-01": "Calculs personnalisés" },
      automatismeChapterOverrides: { [source!.id]: "5e-chap-01" }
    };

    const moved = applyProgressionCustomizations([source!], customized)[0];

    expect(moved.chapterId).toBe("5e-chap-01");
    expect(moved.chapterTitle).toBe("Calculs personnalisés");
    expect(moved.levels).toEqual(["5e"]);
  });
});
