import type { Automatisme } from "../types";

type FamilyRule = {
  key: string;
  label: string;
  tags: string[];
};

const rules: FamilyRule[] = [
  { key: "flash", label: "Questions flash", tags: ["flash"] },
  { key: "calcul", label: "Calcul mental", tags: ["calcul", "complement", "division"] },
  { key: "priorites", label: "Priorités opératoires", tags: ["priorites"] },
  { key: "fractions", label: "Fractions", tags: ["fractions"] },
  { key: "decimaux", label: "Décimaux", tags: ["decimaux"] },
  { key: "proportionnalite", label: "Proportionnalité", tags: ["proportionnalite", "pourcentage"] },
  { key: "geometrie", label: "Géométrie", tags: ["geometrie", "angles", "paralleles", "perimetre", "aire"] },
  { key: "pythagore", label: "Pythagore", tags: ["pythagore"] },
  { key: "thales", label: "Thalès", tags: ["thales"] },
  { key: "litteral", label: "Calcul littéral", tags: ["litteral"] },
  { key: "equations", label: "Équations", tags: ["equations"] },
  { key: "fonctions", label: "Fonctions", tags: ["fonctions"] },
  { key: "statistiques", label: "Statistiques", tags: ["statistiques"] },
  { key: "probabilites", label: "Probabilités", tags: ["probabilites"] },
  { key: "scratch", label: "Scratch / algorithmique", tags: ["scratch", "algorithmique", "programme"] }
];

export function getAutomatismeFamily(automatisme: Automatisme): { key: string; label: string } {
  const tagSet = new Set(automatisme.tags);
  const rule = rules.find((item) => item.tags.some((tag) => tagSet.has(tag)));
  if (rule) {
    return { key: rule.key, label: rule.label };
  }

  return {
    key: automatisme.domain,
    label: automatisme.subdomain
  };
}

export function getFamilySortLabel(automatisme: Automatisme): string {
  const family = getAutomatismeFamily(automatisme);
  return `${automatisme.levels[0]}-${automatisme.chapterRank ?? 0}-${family.label}`;
}
