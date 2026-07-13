import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { GeneratedFigure } from "../types";

vi.mock("./ScratchFigure", () => ({ ScratchFigure: () => null }));

import { FigureView } from "./FigureView";

const renderSolid = (solid: Extract<GeneratedFigure, { kind: "solid" }>["solid"], variant?: number) =>
  renderToStaticMarkup(<FigureView figure={{ kind: "solid", solid, labels: [], variant }} />);

const pathCoordinates = (html: string, className: string) => {
  const path = html.match(new RegExp(`class="${className}" d="([^"]+)"`))?.[1];
  expect(path, `${className} path`).toBeDefined();
  return [...(path ?? "").matchAll(/-?\d+(?:\.\d+)?/g)].map(([value]) => Number(value));
};

describe("FigureView solids", () => {
  it.each(["bar", "pie", "line"] as const)("renders a colorful %s statistical chart", (chartType) => {
    const html = renderToStaticMarkup(
      <FigureView figure={{ kind: "chart", chartType, title: "Données test", labels: ["A", "B", "C"], values: ["12", "20", "16"], unit: "%" }} />
    );

    expect(html).toContain("Données test");
    expect(html).toContain("#2563eb");
    expect(html).toContain("#f97316");
    expect(html).toContain("#16a34a");
  });

  it("always displays the parallel symbol on Thales figures", () => {
    const html = renderToStaticMarkup(
      <FigureView
        figure={{
          kind: "thales",
          smallLeftLabel: "RS",
          bigLeftLabel: "RT",
          smallRightLabel: "RU",
          bigRightLabel: "RV",
          parallelLabel: "(SU) ? (TV)"
        }}
      />
    );

    expect(html).toContain("(SU) ∥ (TV)");
    expect(html).not.toContain("(SU) ? (TV)");
  });

  it("keeps an unknown length on a side instead of treating it as an angle", () => {
    const html = renderToStaticMarkup(
      <FigureView figure={{ kind: "triangle", labelA: "9 cm", labelB: "?", labelC: "12 cm" }} />
    );

    expect(html).toContain(">?</text>");
    expect(html).not.toContain('class="figure-helper"');
  });

  it("places the depth measurement of a cuboid on a visible edge", () => {
    const html = renderToStaticMarkup(
      <FigureView figure={{ kind: "solid", solid: "pave", labels: ["3 cm", "7 cm", "6 cm"] }} />
    );

    expect(html).toContain('x="146" y="152" transform="rotate(43 146 152)"');
    expect(html).not.toContain('x="150" y="324" transform="rotate(48 150 324)"');
  });

  it.each(["pave", "prisme", "pyramide", "cone", "cylindre", "sphere"] as const)(
    "draws the hidden edges of a %s with the dashed-edge class",
    (solid) => {
      expect(renderSolid(solid)).toContain('class="figure-hidden-edge"');
    }
  );

  it("shows a pyramid without a misleading centred lateral edge", () => {
    const html = renderSolid("pyramide");
    const [apexX, apexY] = pathCoordinates(html, "figure-height");
    const visibleEdges = pathCoordinates(html, "figure-line");
    const points = Array.from({ length: visibleEdges.length / 2 }, (_, index) => ({
      x: visibleEdges[index * 2], y: visibleEdges[index * 2 + 1]
    }));
    const lateralTargets = points.flatMap((point, index) =>
      point.x === apexX && point.y === apexY && points[index + 1] ? [points[index + 1]] : []
    );

    expect(lateralTargets.length).toBeGreaterThanOrEqual(2);
    lateralTargets.forEach((target) => {
      expect(Math.abs(apexX - target.x)).toBeGreaterThan(50);
    });
  });

  it("keeps the pyramid height and right-angle marker exactly perpendicular", () => {
    const html = renderSolid("pyramide");
    const [apexX, apexY, footX, footY] = pathCoordinates(html, "figure-height");
    const [markFootX, markFootY, markOnHeightX, markOnHeightY, markCornerX, markCornerY, markOnBaseX, markOnBaseY] =
      pathCoordinates(html, "figure-right-angle-mask");

    const heightVector = { x: apexX - footX, y: apexY - footY };
    const firstMarkSide = { x: markOnHeightX - markFootX, y: markOnHeightY - markFootY };
    const secondMarkSide = { x: markCornerX - markOnHeightX, y: markCornerY - markOnHeightY };
    const normalizedHeightAlignment = Math.abs(
      heightVector.x * firstMarkSide.y - heightVector.y * firstMarkSide.x
    ) / (Math.hypot(heightVector.x, heightVector.y) * Math.hypot(firstMarkSide.x, firstMarkSide.y));
    const normalizedMarkerDot = Math.abs(
      firstMarkSide.x * secondMarkSide.x + firstMarkSide.y * secondMarkSide.y
    ) / (Math.hypot(firstMarkSide.x, firstMarkSide.y) * Math.hypot(secondMarkSide.x, secondMarkSide.y));
    const markerHeightSideLength = Math.hypot(firstMarkSide.x, firstMarkSide.y);
    const markerBaseSideLength = Math.hypot(markOnBaseX - markFootX, markOnBaseY - markFootY);

    expect(normalizedHeightAlignment).toBeLessThan(1e-12);
    expect(normalizedMarkerDot).toBeLessThan(1e-12);
    expect([markFootX, markFootY]).toEqual([footX, footY]);
    expect(markerHeightSideLength).toBeCloseTo(markerBaseSideLength, 10);
    expect(html).toContain("figure-right-angle-mask");
    expect(html).toContain("figure-right-angle-mark");
    expect(html).toContain("figure-height-foot");
    expect(html).toContain(" Z");
  });

  it("keeps the height distinct from the rear hidden edge", () => {
    const html = renderSolid("pyramide");
    const [apexX, apexY, footX, footY] = pathCoordinates(html, "figure-height");
    const hiddenCoordinates = pathCoordinates(html, "figure-hidden-edge");
    const [hiddenApexX, hiddenApexY, rearX, rearY] = hiddenCoordinates.slice(-4);

    const heightVector = { x: footX - apexX, y: footY - apexY };
    const rearEdgeVector = { x: rearX - hiddenApexX, y: rearY - hiddenApexY };
    const cosine = (heightVector.x * rearEdgeVector.x + heightVector.y * rearEdgeVector.y)
      / (Math.hypot(heightVector.x, heightVector.y) * Math.hypot(rearEdgeVector.x, rearEdgeVector.y));
    const separationInDegrees = Math.acos(Math.min(1, Math.max(-1, cosine))) * 180 / Math.PI;

    expect(separationInDegrees).toBeGreaterThan(18);
    expect(html).not.toContain("figure-base-guide");
  });

  it("uses a white mask and a softer open right-angle mark", () => {
    const css = readFileSync(new URL("../styles/global.css", import.meta.url), "utf8");

    expect(css).toMatch(/\.figure-right-angle-mask\s*\{[^}]*fill:\s*#ffffff\s*!important;/s);
    expect(css).toMatch(/\.figure-right-angle-mark\s*\{[^}]*stroke:\s*#475569\s*!important;/s);
    expect(css).toMatch(/\.figure-right-angle-mark\s*\{[^}]*stroke-width:\s*4\.25;/s);
    expect(css).not.toContain(".figure-base-guide");
  });

  it.each([
    [0, 4], [1, 3], [2, 5], [3, 6], [4, 4], [5, 3]
  ] as const)("renders pyramid variant %i with a %i-sided base", (variant, sides) => {
    const html = renderSolid("pyramide", variant);

    expect(html).toContain(`data-pyramid-variant="${variant}"`);
    expect(html).toContain(`data-base-sides="${sides}"`);
    expect(html).toContain("figure-right-angle-mark");
  });

  it("provides six genuinely different pyramid drawings", () => {
    const variants = new Set(Array.from({ length: 6 }, (_, variant) => renderSolid("pyramide", variant)));
    expect(variants.size).toBe(6);
  });

  it("uses the calligraphic area symbol inside an SVG label", () => {
    const html = renderToStaticMarkup(
      <FigureView
        figure={{
          kind: "triangle",
          labelA: "base = 8 cm",
          labelB: "hauteur = 5 cm",
          labelC: "\\mathcal{A} = ?"
        }}
      />
    );

    expect(html).toContain("𝒜 = ?");
    expect(html).not.toContain("mathcal");
  });
});
