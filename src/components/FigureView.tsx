import type { ReactNode } from "react";
import type { GeneratedFigure } from "../types";
import { repairVisibleText } from "../utils/textRepair";
import { ScratchFigure } from "./ScratchFigure";

type Props = {
  figure: GeneratedFigure;
  compact?: boolean;
};

type Point = {
  x: number;
  y: number;
};

type PyramidModel = {
  base: readonly Point[];
  apex: Point;
  heightFoot: Point;
  baseGuide: readonly [Point, Point];
  hiddenBaseEdges: readonly number[];
  hiddenLateralVertices: readonly number[];
  baseLabel: Point;
  heightLabel: Point;
};

const pyramidModels: readonly PyramidModel[] = [
  {
    base: [{ x: 100, y: 340 }, { x: 250, y: 250 }, { x: 525, y: 250 }, { x: 375, y: 340 }],
    apex: { x: 270, y: 60 }, heightFoot: { x: 270, y: 305 }, baseGuide: [{ x: 158, y: 305 }, { x: 433, y: 305 }],
    hiddenBaseEdges: [0, 1], hiddenLateralVertices: [1, 2],
    baseLabel: { x: 235, y: 382 }, heightLabel: { x: 294, y: 185 }
  },
  {
    base: [{ x: 100, y: 350 }, { x: 520, y: 350 }, { x: 330, y: 245 }],
    apex: { x: 300, y: 65 }, heightFoot: { x: 300, y: 310 }, baseGuide: [{ x: 188, y: 310 }, { x: 448, y: 310 }],
    hiddenBaseEdges: [1, 2], hiddenLateralVertices: [2],
    baseLabel: { x: 310, y: 390 }, heightLabel: { x: 324, y: 190 }
  },
  {
    base: [{ x: 85, y: 330 }, { x: 240, y: 385 }, { x: 480, y: 385 }, { x: 555, y: 310 }, { x: 300, y: 240 }],
    apex: { x: 300, y: 55 }, heightFoot: { x: 300, y: 315 }, baseGuide: [{ x: 121, y: 315 }, { x: 550, y: 315 }],
    hiddenBaseEdges: [3, 4], hiddenLateralVertices: [3, 4],
    baseLabel: { x: 225, y: 405 }, heightLabel: { x: 324, y: 184 }
  },
  {
    base: [{ x: 75, y: 320 }, { x: 200, y: 380 }, { x: 440, y: 380 }, { x: 560, y: 320 }, { x: 440, y: 250 }, { x: 200, y: 250 }],
    apex: { x: 300, y: 60 }, heightFoot: { x: 300, y: 315 }, baseGuide: [{ x: 85, y: 315 }, { x: 551, y: 315 }],
    hiddenBaseEdges: [3, 4, 5], hiddenLateralVertices: [4, 5],
    baseLabel: { x: 238, y: 405 }, heightLabel: { x: 324, y: 190 }
  },
  {
    base: [{ x: 110, y: 360 }, { x: 520, y: 360 }, { x: 435, y: 235 }, { x: 210, y: 235 }],
    apex: { x: 345, y: 60 }, heightFoot: { x: 345, y: 310 }, baseGuide: [{ x: 150, y: 310 }, { x: 486, y: 310 }],
    hiddenBaseEdges: [2, 3], hiddenLateralVertices: [2, 3],
    baseLabel: { x: 235, y: 405 }, heightLabel: { x: 369, y: 187 }
  },
  {
    base: [{ x: 90, y: 350 }, { x: 550, y: 350 }, { x: 250, y: 235 }],
    apex: { x: 330, y: 60 }, heightFoot: { x: 330, y: 310 }, baseGuide: [{ x: 146, y: 310 }, { x: 446, y: 310 }],
    hiddenBaseEdges: [1, 2], hiddenLateralVertices: [2],
    baseLabel: { x: 300, y: 395 }, heightLabel: { x: 354, y: 187 }
  }
];

const cleanLabel = (label = "") =>
  repairVisibleText(label)
    .replace(/\$/g, "")
    .replace(/\\dfrac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "$1/$2")
    .replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, "$1/$2")
    .replace(/\\circ/g, "°")
    .replace(/\^°/g, "°")
    .replace(/deg(?:res?)?/gi, "°")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\parallel/g, "∥")
    .replace(/\/\//g, "∥")
    .replace(/\\perp/g, "⊥")
    .replace(/\\mathcal\s*\{A\}/g, "𝒜")
    .replace(/\s+/g, " ")
    .trim();

const textAnchorMiddle = { textAnchor: "middle" as const };

function SvgFrame({ children, label, compact = false }: { children: ReactNode; label: string; compact?: boolean }) {
  return (
    <figure className={compact ? "question-figure svg-figure compact" : "question-figure svg-figure"}>
      <svg viewBox="0 0 640 420" role="img" aria-label={label}>
        {children}
      </svg>
    </figure>
  );
}

function PointLabel({ point, children, dx = 0, dy = 0 }: { point: Point; children: string; dx?: number; dy?: number }) {
  return (
    <text className="figure-point-label" x={point.x + dx} y={point.y + dy}>
      {children}
    </text>
  );
}

function MeasureLabel({ x, y, children, rotate = 0 }: { x: number; y: number; children: string; rotate?: number }) {
  if (!children) return null;
  return (
    <text className="figure-measure-label" x={x} y={y} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined} {...textAnchorMiddle}>
      {children}
    </text>
  );
}

function ParallelCornerLabel({ children, x = 18 }: { children: string; x?: number }) {
  return (
    <g className="figure-corner-caption">
      <rect x={x} y="16" width="214" height="46" rx="12" />
      <text className="figure-caption" x={x + 16} y="47">{children}</text>
    </g>
  );
}

function AngleMark({
  vertex,
  first,
  second,
  label = "",
  radius = 38
}: {
  vertex: Point;
  first: Point;
  second: Point;
  label?: string;
  radius?: number;
}) {
  const vector = (point: Point) => ({ x: point.x - vertex.x, y: point.y - vertex.y });
  const normalize = ({ x, y }: Point) => {
    const length = Math.hypot(x, y) || 1;
    return { x: x / length, y: y / length };
  };
  const from = normalize(vector(first));
  const to = normalize(vector(second));
  const start = { x: vertex.x + from.x * radius, y: vertex.y + from.y * radius };
  const end = { x: vertex.x + to.x * radius, y: vertex.y + to.y * radius };
  const sweep = from.x * to.y - from.y * to.x > 0 ? 1 : 0;
  const middle = normalize({ x: from.x + to.x, y: from.y + to.y });
  const labelPoint = { x: vertex.x + middle.x * (radius + 20), y: vertex.y + middle.y * (radius + 20) };

  return (
    <>
      <path className="figure-helper" d={`M${start.x} ${start.y} A${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`} />
      {label && <MeasureLabel x={labelPoint.x} y={labelPoint.y}>{label}</MeasureLabel>}
    </>
  );
}

function inferRightTriangleVertices(legALabel: string, legBLabel: string) {
  const asSegment = (label: string) => {
    const match = cleanLabel(label).match(/^([A-Z])([A-Z])$/i);
    return match ? [match[1].toUpperCase(), match[2].toUpperCase()] as const : null;
  };
  const first = asSegment(legALabel);
  const second = asSegment(legBLabel);

  if (first && second) {
    const rightVertex = first.find((vertex) => second.includes(vertex));
    if (rightVertex) {
      const verticalVertex = first.find((vertex) => vertex !== rightVertex);
      const horizontalVertex = second.find((vertex) => vertex !== rightVertex);
      if (verticalVertex && horizontalVertex && verticalVertex !== horizontalVertex) {
        return { rightVertex, verticalVertex, horizontalVertex };
      }
    }
  }

  return { rightVertex: "A", verticalVertex: "B", horizontalVertex: "C" };
}

const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const interpolate = (a: Point, b: Point, ratio: number): Point => ({
  x: a.x + (b.x - a.x) * ratio,
  y: a.y + (b.y - a.y) * ratio
});
const unit = (from: Point, to: Point): Point => {
  const length = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return { x: (to.x - from.x) / length, y: (to.y - from.y) / length };
};

function SideMeasure({ a, b, opposite, label }: { a: Point; b: Point; opposite: Point; label: string }) {
  const middle = midpoint(a, b);
  const direction = unit(a, b);
  let normal = { x: -direction.y, y: direction.x };
  if ((middle.x - opposite.x) * normal.x + (middle.y - opposite.y) * normal.y < 0) {
    normal = { x: -normal.x, y: -normal.y };
  }
  let rotation = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
  if (rotation > 90) rotation -= 180;
  if (rotation < -90) rotation += 180;
  return <MeasureLabel x={middle.x + normal.x * 30} y={middle.y + normal.y * 30} rotate={rotation}>{label}</MeasureLabel>;
}

function RightAngleMark({
  vertex,
  first,
  second,
  className = "figure-helper",
  size = 34
}: {
  vertex: Point;
  first: Point;
  second: Point;
  className?: string;
  size?: number;
}) {
  const a = unit(vertex, first);
  const b = unit(vertex, second);
  const p1 = { x: vertex.x + a.x * size, y: vertex.y + a.y * size };
  const p2 = { x: p1.x + b.x * size, y: p1.y + b.y * size };
  const p3 = { x: vertex.x + b.x * size, y: vertex.y + b.y * size };
  return <path className={className} d={`M${p1.x} ${p1.y} L${p2.x} ${p2.y} L${p3.x} ${p3.y}`} />;
}

function VertexLabel({ point, center, children }: { point: Point; center: Point; children: string }) {
  const direction = unit(center, point);
  return <PointLabel point={point} dx={direction.x * 28 - 7} dy={direction.y * 28 + 7}>{children}</PointLabel>;
}

function drawRightTriangle(figure: Extract<GeneratedFigure, { kind: "right-triangle" }>, compact?: boolean) {
  const variants = [
    [{ x: 128, y: 318 }, { x: 128, y: 86 }, { x: 510, y: 318 }],
    [{ x: 510, y: 318 }, { x: 510, y: 86 }, { x: 128, y: 318 }],
    [{ x: 126, y: 94 }, { x: 126, y: 330 }, { x: 510, y: 94 }],
    [{ x: 505, y: 92 }, { x: 505, y: 330 }, { x: 124, y: 92 }],
    [{ x: 182, y: 300 }, { x: 91, y: 115 }, { x: 486, y: 151 }],
    [{ x: 455, y: 306 }, { x: 548, y: 119 }, { x: 151, y: 154 }]
  ] as const;
  const [right, vertical, horizontal] = variants[(figure.variant ?? 0) % variants.length];
  const legA = cleanLabel(figure.legALabel);
  const legB = cleanLabel(figure.legBLabel);
  const hyp = cleanLabel(figure.hypotenuseLabel ?? "");
  const inferred = inferRightTriangleVertices(figure.legALabel, figure.legBLabel);
  const [rightVertex, verticalVertex, horizontalVertex] = figure.vertexLabels ??
    [inferred.rightVertex, inferred.verticalVertex, inferred.horizontalVertex];
  const center = { x: (right.x + vertical.x + horizontal.x) / 3, y: (right.y + vertical.y + horizontal.y) / 3 };
  const isTrigonometry = Boolean(figure.angleLabel) || /oppos|adjacent|hypot.nuse/i.test(`${legA} ${legB} ${hyp}`);

  return (
    <SvgFrame label="Triangle rectangle" compact={compact}>
      <polygon className="figure-fill" points={`${right.x},${right.y} ${vertical.x},${vertical.y} ${horizontal.x},${horizontal.y}`} />
      <path className="figure-line" d={`M${right.x} ${right.y} L${vertical.x} ${vertical.y} L${horizontal.x} ${horizontal.y} Z`} />
      <RightAngleMark vertex={right} first={vertical} second={horizontal} />
      <VertexLabel point={right} center={center}>{rightVertex}</VertexLabel>
      <VertexLabel point={vertical} center={center}>{verticalVertex}</VertexLabel>
      <VertexLabel point={horizontal} center={center}>{horizontalVertex}</VertexLabel>
      <SideMeasure a={right} b={vertical} opposite={horizontal} label={legA} />
      <SideMeasure a={right} b={horizontal} opposite={vertical} label={legB} />
      <SideMeasure a={vertical} b={horizontal} opposite={right} label={hyp} />
      {isTrigonometry && <AngleMark vertex={horizontal} first={right} second={vertical} label={figure.angleLabel ?? "α"} />}
    </SvgFrame>
  );
}

function drawTriangle(figure: Extract<GeneratedFigure, { kind: "triangle" }>, compact?: boolean) {
  const variants = [
    [{ x: 92, y: 318 }, { x: 318, y: 74 }, { x: 548, y: 318 }],
    [{ x: 88, y: 112 }, { x: 506, y: 72 }, { x: 464, y: 346 }],
    [{ x: 124, y: 350 }, { x: 188, y: 78 }, { x: 558, y: 276 }],
    [{ x: 82, y: 246 }, { x: 480, y: 62 }, { x: 552, y: 350 }],
    [{ x: 112, y: 76 }, { x: 548, y: 178 }, { x: 234, y: 354 }],
    [{ x: 84, y: 344 }, { x: 522, y: 326 }, { x: 366, y: 62 }]
  ] as const;
  const [A, B, C] = variants[(figure.variant ?? 0) % variants.length];
  const center = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
  const labels = [cleanLabel(figure.labelA), cleanLabel(figure.labelB), cleanLabel(figure.labelC)];
  const angleMode = labels.some((label) => /°/.test(label)) ||
    (labels[0] === "?" && labels[1] === "" && labels[2] === "") ||
    (labels.slice(0, 2).every((label) => /^\d+(?:[.,]\d+)?\??$/.test(label)) && labels[2] === "?");
  const areaMode = /\bbase\b/i.test(labels[0]) && /(?:\bhauteur\b|\bh\s*=)/i.test(labels[1]);
  const baseDirection = { x: C.x - A.x, y: C.y - A.y };
  const baseLengthSquared = baseDirection.x ** 2 + baseDirection.y ** 2 || 1;
  const projectionRatio = ((B.x - A.x) * baseDirection.x + (B.y - A.y) * baseDirection.y) / baseLengthSquared;
  const heightFoot = {
    x: A.x + projectionRatio * baseDirection.x,
    y: A.y + projectionRatio * baseDirection.y
  };

  return (
    <SvgFrame label="Triangle" compact={compact}>
      <polygon className="figure-fill" points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} />
      <path className="figure-line" d={`M${A.x} ${A.y} L${B.x} ${B.y} L${C.x} ${C.y} Z`} />
      <VertexLabel point={A} center={center}>A</VertexLabel>
      <VertexLabel point={B} center={center}>B</VertexLabel>
      <VertexLabel point={C} center={center}>C</VertexLabel>
      {areaMode ? (
        <>
          <path className="figure-height" d={`M${B.x} ${B.y} L${heightFoot.x} ${heightFoot.y}`} />
          <RightAngleMark vertex={heightFoot} first={B} second={A} />
          <SideMeasure a={A} b={C} opposite={B} label={labels[0]} />
          <SideMeasure a={B} b={heightFoot} opposite={C} label={labels[1]} />
          {labels[2] && <MeasureLabel x={center.x} y={center.y + 18}>{labels[2]}</MeasureLabel>}
        </>
      ) : angleMode ? (
        <>
          <AngleMark vertex={A} first={B} second={C} label={labels[0]} />
          <AngleMark vertex={B} first={C} second={A} label={labels[1]} />
          <AngleMark vertex={C} first={A} second={B} label={labels[2]} />
        </>
      ) : (
        <>
          <SideMeasure a={A} b={B} opposite={C} label={labels[0]} />
          <SideMeasure a={B} b={C} opposite={A} label={labels[1]} />
          <SideMeasure a={C} b={A} opposite={B} label={labels[2]} />
        </>
      )}
    </SvgFrame>
  );
}

function drawThales(figure: Extract<GeneratedFigure, { kind: "thales" }>, compact?: boolean) {
  const parallel = cleanLabel(figure.parallelLabel ?? "(MN) \\parallel (BC)").replace(/\?/g, "∥");
  const segment = (label: string) => cleanLabel(label).match(/([A-Z])([A-Z])/i)?.slice(1, 3).map((letter) => letter.toUpperCase()) ?? [];
  const smallLeft = segment(figure.smallLeftLabel);
  const bigLeft = segment(figure.bigLeftLabel);
  const smallRight = segment(figure.smallRightLabel);
  const bigRight = segment(figure.bigRightLabel);
  const isPapillon = figure.configuration === "papillon" ||
    /AB\)\s*(?:∥|\?|\/)\s*\(CD|OA|OC|OB|OD/.test(parallel) ||
    [figure.smallLeftLabel, figure.bigLeftLabel, figure.smallRightLabel, figure.bigRightLabel].some((label) =>
      /O[ABCD]|[ABCD]O/.test(label)
    );

  if (isPapillon) {
    const shared = smallLeft.find((letter) => smallRight.includes(letter) || bigLeft.includes(letter) || bigRight.includes(letter)) ?? "O";
    const outer = (pair: string[], fallback: string) => pair.find((letter) => letter !== shared) ?? fallback;
    const names = {
      O: shared,
      A: outer(smallLeft, "A"), C: outer(bigLeft, "C"),
      B: outer(smallRight, "B"), D: outer(bigRight, "D")
    };
    const rays = [
      [{ x: 1, y: .62 }, { x: .14, y: -1 }],
      [{ x: 1, y: -.42 }, { x: .34, y: 1 }],
      [{ x: .72, y: 1 }, { x: 1, y: -.34 }],
      [{ x: .82, y: -1 }, { x: 1, y: .28 }],
      [{ x: 1, y: .22 }, { x: -.18, y: 1 }],
      [{ x: .48, y: 1 }, { x: 1, y: .12 }]
    ] as const;
    const [uRaw, vRaw] = rays[(figure.variant ?? 0) % rays.length];
    const O = { x: 320, y: 210 };
    const normalize = (p: Point) => { const length = Math.hypot(p.x, p.y); return { x: p.x / length, y: p.y / length }; };
    const u = normalize(uRaw); const v = normalize(vRaw);
    const A = { x: O.x - u.x * 205, y: O.y - u.y * 205 };
    const C = { x: O.x + u.x * 205, y: O.y + u.y * 205 };
    const B = { x: O.x - v.x * 142, y: O.y - v.y * 142 };
    const D = { x: O.x + v.x * 142, y: O.y + v.y * 142 };
    const captionX = [A, B, C, D].some((point) => point.y < 125 && point.x < 270) ? 408 : 18;

    return (
      <SvgFrame label="Configuration papillon de Thales" compact={compact}>
        <path className="figure-fill" d={`M${A.x} ${A.y} L${B.x} ${B.y} L${D.x} ${D.y} L${C.x} ${C.y} Z`} />
        <path className="figure-line" d={`M${A.x} ${A.y} L${O.x} ${O.y} L${C.x} ${C.y}`} />
        <path className="figure-line" d={`M${B.x} ${B.y} L${O.x} ${O.y} L${D.x} ${D.y}`} />
        <path className="figure-accent-line" d={`M${A.x} ${A.y} L${B.x} ${B.y} M${D.x} ${D.y} L${C.x} ${C.y}`} />
        <circle className="figure-point" cx={O.x} cy={O.y} r="5" />
        <VertexLabel point={O} center={{ x: O.x + 30, y: O.y + 30 }}>{names.O}</VertexLabel>
        <VertexLabel point={A} center={O}>{names.A}</VertexLabel>
        <VertexLabel point={B} center={O}>{names.B}</VertexLabel>
        <VertexLabel point={C} center={O}>{names.C}</VertexLabel>
        <VertexLabel point={D} center={O}>{names.D}</VertexLabel>
        <ParallelCornerLabel x={captionX}>{parallel}</ParallelCornerLabel>
      </SvgFrame>
    );
  }

  const apex = smallLeft.find((letter) => smallRight.includes(letter)) ?? bigLeft.find((letter) => bigRight.includes(letter)) ?? "A";
  const other = (pair: string[], excluded: string[], fallback: string) => pair.find((letter) => letter !== apex && !excluded.includes(letter)) ?? fallback;
  const names = {
    A: apex,
    M: other(smallLeft, [], "M"), N: other(smallRight, [], "N"),
    B: other(bigLeft, smallLeft, "B"), C: other(bigRight, smallRight, "C")
  };
  const variants = [
    [{ x: 320, y: 54 }, { x: 88, y: 348 }, { x: 552, y: 348 }, .52],
    [{ x: 112, y: 68 }, { x: 82, y: 350 }, { x: 558, y: 270 }, .48],
    [{ x: 520, y: 66 }, { x: 84, y: 260 }, { x: 558, y: 350 }, .54],
    [{ x: 320, y: 366 }, { x: 72, y: 82 }, { x: 552, y: 118 }, .5],
    [{ x: 92, y: 300 }, { x: 256, y: 58 }, { x: 558, y: 332 }, .46],
    [{ x: 544, y: 292 }, { x: 388, y: 54 }, { x: 76, y: 336 }, .56]
  ] as const;
  const [A, B, C, ratio] = variants[(figure.variant ?? 0) % variants.length];
  const M = interpolate(A, B, ratio);
  const N = interpolate(A, C, ratio);
  const center = { x: (A.x + B.x + C.x) / 3, y: (A.y + B.y + C.y) / 3 };
  const captionX = [A, B, C, M, N].some((point) => point.y < 125 && point.x < 270) ? 408 : 18;

  return (
    <SvgFrame label="Configuration de Thales" compact={compact}>
      <polygon className="figure-fill" points={`${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y}`} />
      <path className="figure-line" d={`M${A.x} ${A.y} L${B.x} ${B.y} M${A.x} ${A.y} L${C.x} ${C.y} M${B.x} ${B.y} L${C.x} ${C.y}`} />
      <path className="figure-accent-line" d={`M${M.x} ${M.y} L${N.x} ${N.y}`} />
      <VertexLabel point={A} center={center}>{names.A}</VertexLabel>
      <VertexLabel point={B} center={center}>{names.B}</VertexLabel>
      <VertexLabel point={C} center={center}>{names.C}</VertexLabel>
      <VertexLabel point={M} center={N}>{names.M}</VertexLabel>
      <VertexLabel point={N} center={M}>{names.N}</VertexLabel>
      <ParallelCornerLabel x={captionX}>{parallel}</ParallelCornerLabel>
    </SvgFrame>
  );
}

function drawThalesSketch(labels: string[], compact?: boolean, variant?: number) {
  const [left, right, caption] = labels.map(cleanLabel);
  return drawThales(
    {
      kind: "thales",
      smallLeftLabel: left,
      bigLeftLabel: left.startsWith("AB") ? left : "",
      smallRightLabel: right,
      bigRightLabel: "",
      parallelLabel: "(MN) \\parallel (BC)",
      variant
    },
    compact
  );
}

function drawRectangle(figure: Extract<GeneratedFigure, { kind: "rectangle" }>, compact?: boolean) {
  const width = cleanLabel(figure.widthLabel);
  const height = cleanLabel(figure.heightLabel);
  return (
    <SvgFrame label="Rectangle" compact={compact}>
      <rect className="figure-fill" x="110" y="110" width="420" height="220" rx="2" />
      <rect className="figure-line" x="110" y="110" width="420" height="220" rx="2" />
      <PointLabel point={{ x: 110, y: 110 }} dx={-28} dy={-16}>A</PointLabel>
      <PointLabel point={{ x: 530, y: 110 }} dx={18} dy={-16}>B</PointLabel>
      <PointLabel point={{ x: 530, y: 330 }} dx={18} dy={30}>C</PointLabel>
      <PointLabel point={{ x: 110, y: 330 }} dx={-28} dy={30}>D</PointLabel>
      <MeasureLabel x={320} y={82}>{width}</MeasureLabel>
      <MeasureLabel x={570} y={224} rotate={90}>{height}</MeasureLabel>
    </SvgFrame>
  );
}

function drawParallelLines(figure: Extract<GeneratedFigure, { kind: "parallel-lines" }>, compact?: boolean) {
  const angle = cleanLabel(figure.angleLabel);
  const lowerIntersection = { x: 242.62, y: 298 };
  const upperIntersection = { x: 391.59, y: 132 };
  const isAlternateInterior = figure.anglePair === "alternate-interior";
  return (
    <SvgFrame label="Droites parallèles" compact={compact}>
      <path className="figure-line" d="M78 298 H562 M78 132 H562" />
      <path className="figure-accent-line" d="M178 370 L458 58" />
      {/* Correspondants : même secteur. Alternes-internes : secteurs intérieurs opposés. */}
      <AngleMark vertex={lowerIntersection} first={{ x: 562, y: 298 }} second={{ x: 458, y: 58 }} label={angle} radius={40} />
      <AngleMark
        vertex={upperIntersection}
        first={isAlternateInterior ? { x: 78, y: 132 } : { x: 562, y: 132 }}
        second={isAlternateInterior ? { x: 178, y: 370 } : { x: 458, y: 58 }}
        radius={40}
      />
      <text className="figure-caption" x="570" y="306">d</text>
      <text className="figure-caption" x="570" y="140">d'</text>
    </SvgFrame>
  );
}

function drawCircle(figure: Extract<GeneratedFigure, { kind: "circle" }>, compact?: boolean) {
  const radius = cleanLabel(figure.radiusLabel);
  return (
    <SvgFrame label="Cercle" compact={compact}>
      <circle className="figure-fill" cx="320" cy="210" r="130" />
      <circle className="figure-line" cx="320" cy="210" r="130" />
      <path className="figure-accent-line" d="M320 210 H450" />
      <circle className="figure-point" cx="320" cy="210" r="5" />
      <PointLabel point={{ x: 320, y: 210 }} dx={-34} dy={-12}>O</PointLabel>
      <MeasureLabel x={388} y={196}>{radius}</MeasureLabel>
    </SvgFrame>
  );
}

function drawSolid(figure: Extract<GeneratedFigure, { kind: "solid" }>, compact?: boolean) {
  const labels = figure.labels.map(cleanLabel);
  const name = figure.solid === "pave" ? "Pavé droit" : figure.solid === "prisme" ? "Prisme droit" : figure.solid === "pyramide" ? "Pyramide" : figure.solid === "cone" ? "Cône" : figure.solid === "cylindre" ? "Cylindre" : "Sphère";

  if (figure.solid === "prisme") {
    return (
      <SvgFrame label={name} compact={compact}>
        <path className="figure-fill" d="M150 324 L260 104 L370 324 Z M245 270 L355 50 L465 270 Z" />
        <path className="figure-line" d="M150 324 L260 104 L370 324 Z M355 50 L465 270 L245 270 M260 104 L355 50 M370 324 L465 270" />
        <path className="figure-hidden-edge" d="M150 324 L245 270 M245 270 L355 50" />
        <MeasureLabel x={255} y={360}>{labels[0] ?? ""}</MeasureLabel>
        <MeasureLabel x={420} y={326}>{labels[1] ?? ""}</MeasureLabel>
        <MeasureLabel x={424} y={146} rotate={63}>{labels[2] ?? ""}</MeasureLabel>
      </SvgFrame>
    );
  }

  if (figure.solid === "pyramide") {
    const variant = Math.abs(figure.variant ?? 0) % pyramidModels.length;
    const model = pyramidModels[variant];
    const hiddenBaseEdges = new Set(model.hiddenBaseEdges);
    const hiddenLateralVertices = new Set(model.hiddenLateralVertices);
    const [referenceBaseStart, referenceBaseEnd] = model.baseGuide;
    const baseDirection = unit(referenceBaseStart, referenceBaseEnd);
    const intendedHeightDirection = unit(model.heightFoot, model.apex);
    const firstNormal = { x: -baseDirection.y, y: baseDirection.x };
    const normalSign = firstNormal.x * intendedHeightDirection.x + firstNormal.y * intendedHeightDirection.y >= 0 ? 1 : -1;
    const heightDirection = { x: firstNormal.x * normalSign, y: firstNormal.y * normalSign };
    const heightLength = Math.hypot(model.apex.x - model.heightFoot.x, model.apex.y - model.heightFoot.y);
    const apex = {
      x: model.heightFoot.x + heightDirection.x * heightLength,
      y: model.heightFoot.y + heightDirection.y * heightLength
    };
    const markerSize = 22;
    const markerOnHeight = {
      x: model.heightFoot.x + heightDirection.x * markerSize,
      y: model.heightFoot.y + heightDirection.y * markerSize
    };
    const markerOnBase = {
      x: model.heightFoot.x + baseDirection.x * markerSize,
      y: model.heightFoot.y + baseDirection.y * markerSize
    };
    const markerCorner = {
      x: markerOnHeight.x + baseDirection.x * markerSize,
      y: markerOnHeight.y + baseDirection.y * markerSize
    };
    const basePolygon = `M${model.base.map((point) => `${point.x} ${point.y}`).join(" L")} Z`;
    const faceFill = model.base.map((point, index) => {
      const next = model.base[(index + 1) % model.base.length];
      return `M${apex.x} ${apex.y} L${point.x} ${point.y} L${next.x} ${next.y} Z`;
    }).join(" ");
    const baseEdges = (hidden: boolean) => model.base.map((point, index) => {
      if (hiddenBaseEdges.has(index) !== hidden) return "";
      const next = model.base[(index + 1) % model.base.length];
      return `M${point.x} ${point.y} L${next.x} ${next.y}`;
    }).filter(Boolean).join(" ");
    const lateralEdges = (hidden: boolean) => model.base.map((point, index) =>
      hiddenLateralVertices.has(index) === hidden
        ? `M${apex.x} ${apex.y} L${point.x} ${point.y}`
        : ""
    ).filter(Boolean).join(" ");

    return (
      <SvgFrame label={`${name} à base de ${model.base.length} côtés`} compact={compact}>
        <g className="pyramid-geometry" data-pyramid-variant={variant} data-base-sides={model.base.length}>
          <path className="figure-fill" d={`${basePolygon} ${faceFill}`} />
          <path className="figure-line" d={`${baseEdges(false)} ${lateralEdges(false)}`} />
          <path className="figure-hidden-edge" d={`${baseEdges(true)} ${lateralEdges(true)}`} />
          <path className="figure-height" d={`M${apex.x} ${apex.y} L${model.heightFoot.x} ${model.heightFoot.y}`} />
          <path
            className="figure-right-angle-mask"
            d={`M${model.heightFoot.x} ${model.heightFoot.y} L${markerOnHeight.x} ${markerOnHeight.y} L${markerCorner.x} ${markerCorner.y} L${markerOnBase.x} ${markerOnBase.y} Z`}
          />
          <path
            className="figure-right-angle-mark"
            d={`M${markerOnHeight.x} ${markerOnHeight.y} L${markerCorner.x} ${markerCorner.y} L${markerOnBase.x} ${markerOnBase.y} L${model.heightFoot.x} ${model.heightFoot.y}`}
          />
          <circle className="figure-height-foot" cx={model.heightFoot.x} cy={model.heightFoot.y} r="4.5" />
          <MeasureLabel x={model.heightLabel.x} y={model.heightLabel.y}>{labels[1] ?? labels[0] ?? ""}</MeasureLabel>
          <MeasureLabel x={model.baseLabel.x} y={model.baseLabel.y}>{labels[0] ?? ""}</MeasureLabel>
        </g>
      </SvgFrame>
    );
  }

  if (figure.solid === "cone") {
    return (
      <SvgFrame label={name} compact={compact}>
        <path className="figure-fill" d="M320 54 L142 326 A178 50 0 0 0 498 326 Z" />
        <path className="figure-line" d="M320 54 L142 326 M320 54 L498 326 M142 326 A178 50 0 0 0 498 326" />
        <path className="figure-hidden-edge" d="M142 326 A178 50 0 0 1 498 326" />
        <path className="figure-helper figure-dashed-helper" d="M320 54 V326" />
        <path className="figure-helper" d="M320 326 H498" />
        <circle className="figure-point" cx="320" cy="326" r="4" />
        <MeasureLabel x={335} y={195}>{labels[1] ?? ""}</MeasureLabel>
        <MeasureLabel x={410} y={310}>{labels[0] ?? ""}</MeasureLabel>
      </SvgFrame>
    );
  }

  if (figure.solid === "cylindre") {
    return (
      <SvgFrame label={name} compact={compact}>
        <path className="figure-fill" d="M154 118 A166 48 0 0 1 486 118 V326 A166 48 0 0 1 154 326 Z" />
        <ellipse className="figure-line" cx="320" cy="118" rx="166" ry="48" />
        <path className="figure-line" d="M154 118 V326 M486 118 V326 M154 326 A166 48 0 0 0 486 326" />
        <path className="figure-hidden-edge" d="M154 326 A166 48 0 0 1 486 326" />
        <path className="figure-helper figure-dashed-helper" d="M320 118 V326" />
        <path className="figure-helper" d="M320 326 H486" />
        <circle className="figure-point" cx="320" cy="326" r="4" />
        <MeasureLabel x={405} y={308}>{labels[0] ?? ""}</MeasureLabel>
        <MeasureLabel x={338} y={230}>{labels[1] ?? ""}</MeasureLabel>
      </SvgFrame>
    );
  }

  if (figure.solid === "sphere") {
    return (
      <SvgFrame label={name} compact={compact}>
        <circle className="figure-fill" cx="320" cy="220" r="154" />
        <circle className="figure-line" cx="320" cy="220" r="154" />
        <path className="figure-helper" d="M166 220 A154 48 0 0 0 474 220" />
        <path className="figure-hidden-edge" d="M166 220 A154 48 0 0 1 474 220" />
        <path className="figure-helper" d="M320 66 C250 116 250 324 320 374 M320 66 C390 116 390 324 320 374" />
        <path className="figure-accent-line" d="M320 220 H474" />
        <circle className="figure-point" cx="320" cy="220" r="5" />
        <PointLabel point={{ x: 320, y: 220 }} dx={-30} dy={-12}>O</PointLabel>
        <MeasureLabel x={400} y={205}>{labels[0] ?? ""}</MeasureLabel>
      </SvgFrame>
    );
  }

  return (
    <SvgFrame label={name} compact={compact}>
      <path className="figure-fill" d="M190 170 H480 V335 H190 Z M120 105 H410 L480 170 H190 Z M410 105 L480 170 V335 L410 270 Z" />
      <path className="figure-line" d="M190 170 H480 V335 H190 Z M120 105 H410 V270 M120 105 L190 170 M410 105 L480 170 M410 270 L480 335" />
      <path className="figure-hidden-edge" d="M120 105 V270 H410 M120 270 L190 335" />
      <MeasureLabel x={335} y={84}>{labels[0] ?? ""}</MeasureLabel>
      <MeasureLabel x={518} y={254} rotate={90}>{labels[1] ?? ""}</MeasureLabel>
      <MeasureLabel x={146} y={152} rotate={43}>{labels[2] ?? ""}</MeasureLabel>
    </SvgFrame>
  );
}

const chartPalette = ["#2563eb", "#f97316", "#16a34a", "#db2777", "#7c3aed", "#0891b2"];

function drawChart(figure: Extract<GeneratedFigure, { kind: "chart" }>, compact?: boolean) {
  const values = figure.values.map((value) => Number(cleanLabel(value).replace(",", ".")) || 0);
  const colors = values.map((_, index) => figure.colors?.[index] ?? chartPalette[index % chartPalette.length]);
  const unit = cleanLabel(figure.unit ?? "");
  const valueLabel = (value: number) => `${String(value).replace(".", ",")}${unit ? ` ${unit}` : ""}`;

  if (figure.chartType === "pie") {
    const total = values.reduce((sum, value) => sum + Math.max(0, value), 0) || 1;
    let angle = -Math.PI / 2;
    const slices = values.map((value, index) => {
      const sliceAngle = Math.max(0, value) / total * Math.PI * 2;
      const end = angle + sliceAngle;
      const startPoint = { x: 220 + 126 * Math.cos(angle), y: 225 + 126 * Math.sin(angle) };
      const endPoint = { x: 220 + 126 * Math.cos(end), y: 225 + 126 * Math.sin(end) };
      const path = `M220 225 L${startPoint.x} ${startPoint.y} A126 126 0 ${sliceAngle > Math.PI ? 1 : 0} 1 ${endPoint.x} ${endPoint.y} Z`;
      angle = end;
      return <path key={`${figure.labels[index]}-${index}`} d={path} fill={colors[index]} stroke="#ffffff" strokeWidth="4" />;
    });

    return (
      <SvgFrame label={`Diagramme circulaire : ${figure.title}`} compact={compact}>
        <text x="320" y="34" className="figure-chart-title" textAnchor="middle">{cleanLabel(figure.title)}</text>
        {slices}
        {figure.labels.map((label, index) => (
          <g key={`${label}-${index}`}>
            <rect x="390" y={105 + index * 48} width="22" height="22" rx="5" fill={colors[index]} />
            <text x="424" y={122 + index * 48} className="figure-chart-label">{cleanLabel(label)}</text>
            <text x="424" y={140 + index * 48} className="figure-chart-value">{valueLabel(values[index])}</text>
          </g>
        ))}
      </SvgFrame>
    );
  }

  const max = Math.max(...values, 1);
  const left = 72;
  const top = 70;
  const bottom = 344;
  const width = 500;
  const height = bottom - top;
  const y = (value: number) => bottom - value / max * (height - 24);

  if (figure.chartType === "line") {
    const step = width / Math.max(1, values.length - 1);
    const points = values.map((value, index) => ({ x: left + index * step, y: y(value) }));
    const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");
    return (
      <SvgFrame label={`Courbe statistique : ${figure.title}`} compact={compact}>
        <text x="320" y="34" className="figure-chart-title" textAnchor="middle">{cleanLabel(figure.title)}</text>
        <path d={`M${left} ${top} V${bottom} H${left + width}`} fill="none" stroke="#64748b" strokeWidth="3" />
        {[0.25, 0.5, 0.75, 1].map((ratio) => <path key={ratio} d={`M${left} ${bottom - ratio * (height - 24)} H${left + width}`} stroke="#cbd5e1" strokeDasharray="6 7" />)}
        <polyline points={polyline} fill="none" stroke="#2563eb" strokeWidth="7" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <g key={`${figure.labels[index]}-${index}`}>
            <circle cx={point.x} cy={point.y} r="9" fill={colors[index]} stroke="#ffffff" strokeWidth="3" />
            <text x={point.x} y={point.y - 16} className="figure-chart-value" textAnchor="middle">{valueLabel(values[index])}</text>
            <text x={point.x} y="374" className="figure-chart-label" textAnchor="middle">{cleanLabel(figure.labels[index])}</text>
          </g>
        ))}
      </SvgFrame>
    );
  }

  const slot = width / values.length;
  const barWidth = Math.min(76, slot * 0.62);
  return (
    <SvgFrame label={`Diagramme en bâtons : ${figure.title}`} compact={compact}>
      <text x="320" y="34" className="figure-chart-title" textAnchor="middle">{cleanLabel(figure.title)}</text>
      <path d={`M${left} ${top} V${bottom} H${left + width}`} fill="none" stroke="#64748b" strokeWidth="3" />
      {values.map((value, index) => {
        const x = left + slot * index + (slot - barWidth) / 2;
        const barTop = y(value);
        return (
          <g key={`${figure.labels[index]}-${index}`}>
            <rect x={x} y={barTop} width={barWidth} height={bottom - barTop} rx="9" fill={colors[index]} />
            <text x={x + barWidth / 2} y={barTop - 12} className="figure-chart-value" textAnchor="middle">{valueLabel(value)}</text>
            <text x={x + barWidth / 2} y="374" className="figure-chart-label" textAnchor="middle">{cleanLabel(figure.labels[index])}</text>
          </g>
        );
      })}
    </SvgFrame>
  );
}

export function FigureView({ figure, compact = false }: Props) {
  if (figure.kind === "scratch") {
    return <ScratchFigure blocks={figure.blocks} compact={compact} />;
  }

  if (figure.kind === "right-triangle") return drawRightTriangle(figure, compact);
  if (figure.kind === "thales") return drawThales(figure, compact);
  if (figure.kind === "rectangle") return drawRectangle(figure, compact);
  if (figure.kind === "parallel-lines") return drawParallelLines(figure, compact);
  if (figure.kind === "circle") return drawCircle(figure, compact);
  if (figure.kind === "chart") return drawChart(figure, compact);
  if (figure.kind === "solid") return drawSolid(figure, compact);

  const labels = [figure.labelA, figure.labelB, figure.labelC];
  if (labels.some((label) => /(?:^|\s)(AM|AB|AN|AC|MN|BC)\b|Thal|\/\/|parallel/i.test(label))) {
    return drawThalesSketch(labels, compact, figure.variant);
  }

  return drawTriangle(figure, compact);
}
