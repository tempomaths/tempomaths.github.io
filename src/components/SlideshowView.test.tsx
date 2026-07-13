import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { allOfficialAutomatismes } from "../data/allAutomatismes";
import { generateSeries } from "../generator/generateSeries";
import { defaultSettings } from "../services/storage";
import { SlideshowView } from "./SlideshowView";

vi.mock("./FigureView", () => ({ FigureView: () => null }));

function render(training: boolean) {
  const generated = generateSeries(allOfficialAutomatismes, { ...defaultSettings, questionCount: 1 });
  const series = training ? {
    ...generated,
    trainingContext: { kind: "belt" as const, level: "6e" as const, beltKey: "white", beltLabel: "Ceinture blanche" }
  } : generated;
  return renderToStaticMarkup(<SlideshowView series={series} settings={defaultSettings} isFavorite={false} onToggleFavorite={vi.fn()} onExit={vi.fn()} onComplete={vi.fn()} />);
}

describe("SlideshowView modes", () => {
  it("reserves answer input and hides navigation aids in belt routes", () => {
    const html = render(true);
    expect(html).toContain("live-answer-panel");
    expect(html).not.toContain("Précédente");
    expect(html).not.toContain(">Correction<");
  });

  it("keeps previous and correction controls in classic slideshows", () => {
    const html = render(false);
    expect(html).not.toContain("live-answer-panel");
    expect(html).toContain("Précédente");
    expect(html).toContain("Correction");
  });
});
