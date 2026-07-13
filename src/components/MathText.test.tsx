import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MathText } from "./MathText";

describe("MathText", () => {
  it("renders geometric letters with the mathematical font outside explicit delimiters", () => {
    const html = renderToStaticMarkup(
      <MathText text="DNB : dans le triangle ABC, A' et O définissent le segment [AB] et la droite (AB)." />
    );
    const renderedMathParts = html.match(/class="math-render/g) ?? [];

    expect(renderedMathParts).toHaveLength(5);
    expect(html).toContain("DNB");
    expect(html).toContain("katex");
  });

  it("does not treat the litre symbol as a geometric point", () => {
    const html = renderToStaticMarkup(<MathText text="Le récipient contient 5 L." />);
    expect(html).not.toContain("class=\"math-render");
  });

  it("renders the area symbol as a calligraphic capital A", () => {
    const html = renderToStaticMarkup(<MathText text={String.raw`$\mathcal{A}=b\times h$`} />);

    expect(html).toContain('mathvariant="script"');
    expect(html).toContain('class="mord mathcal"');
  });

  it("renders the volume symbol as a calligraphic capital V", () => {
    const html = renderToStaticMarkup(<MathText text={String.raw`$V=3\times4\times5$`} />);

    expect(html).toContain('mathvariant="script"');
    expect(html).toContain('class="mord mathcal"');
    expect(html).not.toContain('mathnormal">V');
  });
});
