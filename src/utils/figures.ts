import type { FigureTemplate, GeneratedFigure } from "../types";
import { repairVisibleText } from "./textRepair";
import { renderTemplate } from "./templates";
import { cleanScratchText } from "./scratchSyntax";

function renderFigureLabel(template: string, variables: Record<string, string | number>): string {
  return repairVisibleText(renderTemplate(template, variables));
}

export function renderFigureTemplate(
  figureTemplate: FigureTemplate | undefined,
  variables: Record<string, string | number>
): GeneratedFigure | undefined {
  if (!figureTemplate) {
    return undefined;
  }

  if (figureTemplate.kind === "scratch") {
    return {
      ...figureTemplate,
      blocks: figureTemplate.blocks.map((block) =>
        cleanScratchText(renderTemplate(block, variables))
      )
    };
  }

  if (figureTemplate.kind === "rectangle") {
    return {
      ...figureTemplate,
      widthLabel: renderFigureLabel(figureTemplate.widthLabel, variables),
      heightLabel: renderFigureLabel(figureTemplate.heightLabel, variables)
    };
  }

  if (figureTemplate.kind === "right-triangle") {
    return {
      ...figureTemplate,
      legALabel: renderFigureLabel(figureTemplate.legALabel, variables),
      legBLabel: renderFigureLabel(figureTemplate.legBLabel, variables),
      hypotenuseLabel: figureTemplate.hypotenuseLabel
        ? renderFigureLabel(figureTemplate.hypotenuseLabel, variables)
        : undefined
    };
  }

  if (figureTemplate.kind === "triangle") {
    return {
      ...figureTemplate,
      labelA: renderFigureLabel(figureTemplate.labelA, variables),
      labelB: renderFigureLabel(figureTemplate.labelB, variables),
      labelC: renderFigureLabel(figureTemplate.labelC, variables)
    };
  }

  if (figureTemplate.kind === "parallel-lines") {
    return {
      ...figureTemplate,
      angleLabel: renderFigureLabel(figureTemplate.angleLabel, variables)
    };
  }

  if (figureTemplate.kind === "thales") {
    return {
      ...figureTemplate,
      smallLeftLabel: renderFigureLabel(figureTemplate.smallLeftLabel, variables),
      bigLeftLabel: renderFigureLabel(figureTemplate.bigLeftLabel, variables),
      smallRightLabel: renderFigureLabel(figureTemplate.smallRightLabel, variables),
      bigRightLabel: renderFigureLabel(figureTemplate.bigRightLabel, variables),
      parallelLabel: figureTemplate.parallelLabel
        ? renderFigureLabel(figureTemplate.parallelLabel, variables)
        : undefined
    };
  }

  if (figureTemplate.kind === "circle") {
    return {
      ...figureTemplate,
      radiusLabel: renderFigureLabel(figureTemplate.radiusLabel, variables)
    };
  }

  if (figureTemplate.kind === "chart") {
    return {
      ...figureTemplate,
      title: renderFigureLabel(figureTemplate.title, variables),
      labels: figureTemplate.labels.map((label) => renderFigureLabel(label, variables)),
      values: figureTemplate.values.map((value) => renderFigureLabel(value, variables)),
      unit: figureTemplate.unit ? renderFigureLabel(figureTemplate.unit, variables) : undefined
    };
  }

  return {
    ...figureTemplate,
    labels: figureTemplate.labels.map((label) => renderFigureLabel(label, variables))
  };
}
