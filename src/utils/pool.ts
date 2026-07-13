import type { Automatisme, GeneratorSettings } from "../types";
import { filterAutomatismes } from "./filters";

export function resolveAutomatismePool(
  automatismes: Automatisme[],
  settings: GeneratorSettings,
  disabledIds: string[] = []
): Automatisme[] {
  const exactPool = filterAutomatismes(automatismes, settings, disabledIds);
  if (exactPool.length > 0) {
    return exactPool;
  }

  if (settings.selectedAutomatismeIds.length > 0) {
    return filterAutomatismes(
      automatismes,
      {
        ...settings,
        selectedAutomatismeIds: []
      },
      disabledIds
    );
  }

  return exactPool;
}
