import type { VariableSchema } from "../types";
import type { RandomSource } from "./random";
import { chooseRandom, randomDecimal, randomInt } from "./random";
import { formatDecimalFrench, formatFraction, gcd, roundTo, roundingRelation, simplifyFraction } from "./math";

type Variables = Record<string, string | number>;

export function generateVariables(schema: VariableSchema, rng: RandomSource): Variables {
  return Object.fromEntries(
    Object.entries(schema).map(([name, definition]) => {
      if (definition.type === "int") {
        let value = randomInt(definition.min, definition.max, rng);
        let guard = 0;
        while (definition.exclude?.includes(value) && guard < 20) {
          value = randomInt(definition.min, definition.max, rng);
          guard += 1;
        }
        return [name, value];
      }

      if (definition.type === "decimal") {
        return [name, randomDecimal(definition.min, definition.max, definition.decimals, rng)];
      }

      return [name, chooseRandom(definition.values, rng)];
    })
  );
}

export function renderTemplate(template: string, variables: Variables): string {
  return template.replace(/\{\{(.*?)\}\}/g, (_, rawExpression: string) => {
    const result = evaluateExpression(rawExpression.trim(), variables);
    return String(result);
  });
}

export function evaluateExpression(expression: string, variables: Variables): string | number {
  const variableNames = Object.keys(variables);
  const variableValues = Object.values(variables);

  const helpers = {
    formatDecimalFrench,
    formatFraction,
    gcd,
    roundTo,
    roundingRelation,
    simplifyFraction
  };

  const helperNames = Object.keys(helpers);
  const helperValues = Object.values(helpers);

  try {
    const fn = new Function(
      ...variableNames,
      ...helperNames,
      `"use strict"; return (${expression});`
    );
    const value = fn(...variableValues, ...helperValues) as unknown;
    if (typeof value === "number" && Number.isFinite(value)) {
      return Number.isInteger(value) ? value : roundTo(value, 3);
    }
    return String(value);
  } catch (error) {
    return `[${expression}]`;
  }
}
