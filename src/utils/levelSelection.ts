import type { Level } from "../types";
import { LEVELS } from "./labels";

export function sortLevelsBySchoolOrder(levels: Level[]): Level[] {
  return [...levels].sort((left, right) => LEVELS.indexOf(left) - LEVELS.indexOf(right));
}

export function getHighestSelectedLevel(levels: Level[]): Level {
  const ordered = sortLevelsBySchoolOrder(levels);
  return ordered[ordered.length - 1] ?? "6e";
}

export function isCompletedLowerActiveLevel(activeLevels: Level[], level: Level): boolean {
  if (activeLevels.length <= 1 || !activeLevels.includes(level)) {
    return false;
  }

  return LEVELS.indexOf(level) < LEVELS.indexOf(getHighestSelectedLevel(activeLevels));
}
