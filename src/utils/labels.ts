import type { Level, MathDomain, ProgressionStep } from "../types";

export const LEVELS: Level[] = ["6e", "5e", "4e", "3e"];

export const PROGRESSION_STEPS: ProgressionStep[] = [
  "start",
  "trimester1",
  "trimester2",
  "end"
];

export const levelLabels: Record<Level, string> = {
  "6e": "6e",
  "5e": "5e",
  "4e": "4e",
  "3e": "3e"
};

export const progressionLabels: Record<ProgressionStep, string> = {
  start: "Début d'année",
  trimester1: "Fin du 1er trimestre",
  trimester2: "Fin du 2e trimestre",
  end: "Fin d'année"
};

export const progressionShortLabels: Record<ProgressionStep, string> = {
  start: "Début",
  trimester1: "T1",
  trimester2: "T2",
  end: "Année"
};

export const domainLabels: Record<MathDomain, string> = {
  "nombres-calculs": "Nombres et calculs",
  fractions: "Fractions",
  decimaux: "Décimaux",
  proportionnalite: "Proportionnalité",
  "grandeurs-mesures": "Grandeurs et mesures",
  geometrie: "Géométrie",
  "calcul-litteral": "Calcul littéral",
  equations: "Équations",
  puissances: "Puissances",
  statistiques: "Statistiques",
  probabilites: "Probabilités",
  algorithmique: "Algorithmique / Scratch",
  fonctions: "Fonctions",
  trigonometrie: "Trigonométrie",
  pythagore: "Pythagore",
  thales: "Thalès"
};

export const domainTone: Record<MathDomain, string> = {
  "nombres-calculs": "tone-blue",
  fractions: "tone-violet",
  decimaux: "tone-teal",
  proportionnalite: "tone-emerald",
  "grandeurs-mesures": "tone-amber",
  geometrie: "tone-indigo",
  "calcul-litteral": "tone-rose",
  equations: "tone-red",
  puissances: "tone-purple",
  statistiques: "tone-cyan",
  probabilites: "tone-lime",
  algorithmique: "tone-zinc",
  fonctions: "tone-sky",
  trigonometrie: "tone-orange",
  pythagore: "tone-fuchsia",
  thales: "tone-green"
};

export const difficultyLabels = {
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
  mixed: "Mixte"
} as const;
