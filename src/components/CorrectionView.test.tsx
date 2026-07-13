import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CorrectionView } from "./CorrectionView";

describe("CorrectionView", () => {
  it("replaces a comma before a transition without displaying ',.'", () => {
    const html = renderToStaticMarkup(
      <CorrectionView answer="19/4" correction="$3=12/4$, donc $3+7/4=19/4$." />
    );

    expect(html).not.toContain(",.");
    expect(html).toContain("Donc");
  });

  it("can hide the written answer while keeping the correction method", () => {
    const html = renderToStaticMarkup(
      <CorrectionView answer="42" correction="On calcule $6\\times7=42$." detailed={false} showAnswer={false} />
    );

    expect(html).not.toContain("Réponse");
    expect(html).toContain("On calcule");
  });
});
