import type { Automatisme, GeneratedSeries, GeneratorSettings, Level } from "../types";
import { progressionLabels } from "../utils/labels";
import { resolveAutomatismePool } from "../utils/pool";
import { seededRandom, shuffle } from "../utils/random";
import { generateQuestion } from "./generateQuestion";

function resolveDuration(difficulty: Automatisme["difficulty"], settings: GeneratorSettings): number {
  if (!settings.durationByDifficulty) {
    return settings.durationSeconds;
  }
  if (difficulty <= 2) {
    return Math.max(10, settings.durationSeconds - 10);
  }
  if (difficulty >= 4) {
    return settings.durationSeconds + 15;
  }
  return settings.durationSeconds;
}

function resolveLevel(automatisme: Automatisme, settings: GeneratorSettings): Level {
  return settings.levels.find((level) => automatisme.levels.includes(level)) ?? automatisme.levels[0];
}

function createRuntimeSeed(): string {
  const bytes = new Uint32Array(2);
  globalThis.crypto?.getRandomValues?.(bytes);
  const entropy = bytes[0] || Math.floor(Math.random() * 0xffffffff);
  const extra = bytes[1] || Math.floor(Math.random() * 0xffffffff);
  return `${Date.now().toString(36)}-${entropy.toString(36)}-${extra.toString(36)}`;
}

function modelSignature(automatisme: Automatisme): string {
  return `${automatisme.domain}:${automatisme.title}:${automatisme.statementTemplate}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\{\{.*?\}\}/g, "{{}}")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function keepUniqueModels(pool: Automatisme[]): Automatisme[] {
  const signatures = new Set<string>();
  return pool.filter((automatisme) => {
    const signature = modelSignature(automatisme);
    if (signatures.has(signature)) {
      return false;
    }
    signatures.add(signature);
    return true;
  });
}

export function generateSeries(
  automatismes: Automatisme[],
  settings: GeneratorSettings,
  disabledIds: string[] = [],
  options: { coverChapterIds?: string[] } = {}
): GeneratedSeries {
  const seed = settings.seed.trim() || createRuntimeSeed();
  const rng = seededRandom(seed);
  const pool = resolveAutomatismePool(automatismes, settings, disabledIds);

  if (pool.length === 0) {
    const selected = settings.levels
      .map((level) => `${level} ${progressionLabels[settings.progressionByLevel[level]]}`)
      .join(", ");
    throw new Error(`Aucun automatisme disponible pour ${selected}.`);
  }

  if (pool.length < settings.questionCount) {
    throw new Error(
      `Sélection trop courte : ${pool.length} automatisme${pool.length > 1 ? "s" : ""} disponible${
        pool.length > 1 ? "s" : ""
      } pour ${settings.questionCount} questions. Ajoute des familles ou baisse le nombre de diapositives.`
    );
  }

  const orderedPool =
    settings.orderMode === "progressive"
      ? [...pool].sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id))
      : shuffle(pool, rng);
  const uniquePool = keepUniqueModels(orderedPool);

  if (uniquePool.length < settings.questionCount) {
    throw new Error(
      `Sélection trop répétitive : ${uniquePool.length} modèle${uniquePool.length > 1 ? "s" : ""} vraiment distinct${
        uniquePool.length > 1 ? "s" : ""
      } pour ${settings.questionCount} questions. Ajoute des familles ou baisse le nombre de diapositives.`
    );
  }

  const requiredChapterIds = [...new Set(options.coverChapterIds ?? [])];
  if (requiredChapterIds.length > settings.questionCount) {
    throw new Error(
      `La série doit contenir au moins ${requiredChapterIds.length} questions pour couvrir tous les chapitres annoncés.`
    );
  }

  const selectedModels: Automatisme[] = [];
  const selectedModelIds = new Set<string>();
  requiredChapterIds.forEach((chapterId) => {
    const candidate = uniquePool.find(
      (automatisme) => automatisme.chapterId === chapterId && !selectedModelIds.has(automatisme.id)
    );
    if (!candidate) {
      throw new Error(`Le chapitre ${chapterId} ne contient aucun automatisme disponible pour ce parcours.`);
    }
    selectedModels.push(candidate);
    selectedModelIds.add(candidate.id);
  });

  uniquePool.forEach((automatisme) => {
    if (selectedModels.length < settings.questionCount && !selectedModelIds.has(automatisme.id)) {
      selectedModels.push(automatisme);
      selectedModelIds.add(automatisme.id);
    }
  });

  const selected = selectedModels.map((automatisme, index) => {
    return generateQuestion(
      automatisme,
      `${seed}:${index}`,
      resolveDuration(automatisme.difficulty, settings),
      resolveLevel(automatisme, settings)
    );
  });

  return {
    id: `series:${seed}:${selected.length}`,
    seed,
    createdAt: new Date().toISOString(),
    settings,
    questions: selected
  };
}
