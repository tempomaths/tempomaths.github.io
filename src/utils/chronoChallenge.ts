import { PURE_MENTAL_TAG } from "../data/mentalCalculAutomatismes";
import type { Automatisme } from "../types";

const CHRONO_FRIENDLY_TAGS = new Set([
  "addition",
  "soustraction",
  "multiplication",
  "division",
  "tables",
  "calcul",
  "complement",
  "double",
  "moitie",
  "priorites",
  "decimaux",
  "fractions",
  "pourcentage",
  "proportionnalite",
  "conversion",
  "perimetre",
  "aire",
  "puissances",
  "racine",
  "equation",
  "fonctions",
  "probabilites"
]);

export function isChronoChallengeAutomatisme(automatisme: Automatisme): boolean {
  if (automatisme.figureTemplate) return false;
  if (automatisme.tags.includes(PURE_MENTAL_TAG)) return true;
  if (automatisme.statementTemplate.length > 180) return false;
  return automatisme.tags.some((tag) => CHRONO_FRIENDLY_TAGS.has(tag));
}

export function getChronoChallengeIds(automatismes: Automatisme[]): string[] {
  return automatismes.filter(isChronoChallengeAutomatisme).map((automatisme) => automatisme.id);
}
