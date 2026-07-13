import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { allOfficialAutomatismes } from "../data/allAutomatismes";
import { generateSeries } from "../generator/generateSeries";
import { defaultSettings } from "../services/storage";
import type { SeriesResult } from "../types";
import { ResultsView } from "./ResultsView";

vi.mock("./FigureView", () => ({ FigureView: () => null }));

function renderBeltResult(percentage: number) {
  const series = {
    ...generateSeries(allOfficialAutomatismes, { ...defaultSettings, questionCount: 1, difficultyMode: "mixed" }),
    trainingContext: { kind: "belt" as const, level: "6e" as const, beltKey: "white", beltLabel: "Ceinture blanche" }
  };
  const correct = percentage >= 80;
  const result: SeriesResult = {
    seriesId: series.id,
    completedAt: "2026-07-13T12:00:00.000Z",
    attempts: [{ questionId: series.questions[0].id, userAnswer: correct ? series.questions[0].shortAnswer : "?", expectedAnswer: series.questions[0].shortAnswer, isCorrect: correct }],
    correctCount: correct ? 1 : 0,
    totalCount: 1,
    percentage
  };
  return renderToStaticMarkup(<ResultsView series={series} result={result} isFavorite={false} onToggleFavorite={vi.fn()} onBack={vi.fn()} onReplay={vi.fn()} onSimilar={vi.fn()} onNextChallenge={vi.fn()} hasNextChallenge />);
}

describe("ResultsView belt outcomes", () => {
  it("offers the diploma and next challenge after validation", () => {
    const html = renderBeltResult(100);
    expect(html).toContain("Diplôme de réussite");
    expect(html).toContain("Défi suivant");
    expect(html).toContain("Retour au parcours");
  });

  it("offers unlimited retries below the validation threshold", () => {
    const html = renderBeltResult(0);
    expect(html).toContain("Nouvelle tentative");
    expect(html).toContain("autant de fois que tu veux");
    expect(html).not.toContain("Diplôme de réussite");
  });

  it("keeps personalized journey cards out of classic slideshows", () => {
    const series = generateSeries(allOfficialAutomatismes, { ...defaultSettings, questionCount: 1 });
    const html = renderToStaticMarkup(<ResultsView series={series} result={null} isFavorite={false} onToggleFavorite={vi.fn()} onBack={vi.fn()} onReplay={vi.fn()} onSimilar={vi.fn()} onNextChallenge={vi.fn()} hasNextChallenge={false} />);

    expect(html).not.toContain("Parcours terminé");
    expect(html).not.toContain("training-result-hero");
    expect(html).not.toContain("Réessayer");
    expect(html).toContain("Série similaire");
    expect(html).toContain("Réponse");
  });
});
