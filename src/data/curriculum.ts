import type { CurriculumEntry } from "../types";

export const curriculum: CurriculumEntry[] = [
  {
    level: "6e",
    progressionStep: "start",
    domains: ["nombres-calculs", "grandeurs-mesures", "geometrie"],
    recommendedAutomatisms: [
      "Tables d'addition",
      "Tables de multiplication",
      "Ordre des entiers",
      "Doubles et moitiés simples",
      "Conversions très simples"
    ],
    prerequisites: ["Numération entière", "Calcul mental élémentaire"],
    excludedBefore: ["Équations", "Thalès", "Trigonométrie"]
  },
  {
    level: "6e",
    progressionStep: "trimester1",
    domains: ["nombres-calculs", "decimaux", "fractions", "grandeurs-mesures", "geometrie"],
    recommendedAutomatisms: [
      "Décimaux simples",
      "Additions et soustractions décimales",
      "Fractions comme partage",
      "Périmètres simples"
    ],
    prerequisites: ["Entiers et tables", "Repérage sur demi-droite graduée"],
    excludedBefore: ["Calcul littéral", "Fonctions"]
  },
  {
    level: "6e",
    progressionStep: "trimester2",
    domains: [
      "nombres-calculs",
      "decimaux",
      "fractions",
      "proportionnalite",
      "grandeurs-mesures",
      "geometrie"
    ],
    recommendedAutomatisms: [
      "Proportionnalité intuitive",
      "Fractions décimales",
      "Aires simples",
      "Divisions exactes"
    ],
    prerequisites: ["Décimaux simples", "Sens des opérations"],
    excludedBefore: ["Puissances", "Probabilités formalisées"]
  },
  {
    level: "6e",
    progressionStep: "end",
    domains: [
      "nombres-calculs",
      "decimaux",
      "fractions",
      "proportionnalite",
      "grandeurs-mesures",
      "geometrie",
      "statistiques",
      "algorithmique"
    ],
    recommendedAutomatisms: [
      "Synthèse annuelle",
      "Problèmes courts",
      "Conversions",
      "Lecture de graphiques simples"
    ],
    prerequisites: ["Progression annuelle de 6e"],
    excludedBefore: ["Équations du premier degré"]
  },
  {
    level: "5e",
    progressionStep: "start",
    domains: ["nombres-calculs", "fractions", "decimaux", "grandeurs-mesures", "geometrie"],
    recommendedAutomatisms: [
      "Réactivation décimaux",
      "Fractions simples",
      "Priorités opératoires",
      "Aires et périmètres"
    ],
    prerequisites: ["Automatismes de 6e"],
    excludedBefore: ["Puissances", "Thalès"]
  },
  {
    level: "5e",
    progressionStep: "trimester1",
    domains: [
      "nombres-calculs",
      "fractions",
      "proportionnalite",
      "grandeurs-mesures",
      "geometrie",
      "statistiques"
    ],
    recommendedAutomatisms: [
      "Fractions d'une quantité",
      "Proportionnalité",
      "Conversions",
      "Moyennes simples"
    ],
    prerequisites: ["Fractions simples", "Multiplications décimales"],
    excludedBefore: ["Équations formelles"]
  },
  {
    level: "5e",
    progressionStep: "trimester2",
    domains: [
      "nombres-calculs",
      "fractions",
      "proportionnalite",
      "grandeurs-mesures",
      "geometrie",
      "statistiques",
      "probabilites"
    ],
    recommendedAutomatisms: [
      "Nombres relatifs en contexte",
      "Pourcentages simples",
      "Angles de triangles",
      "Probabilités simples"
    ],
    prerequisites: ["Repérage et comparaison", "Proportionnalité"],
    excludedBefore: ["Trigonométrie"]
  },
  {
    level: "5e",
    progressionStep: "end",
    domains: [
      "nombres-calculs",
      "fractions",
      "proportionnalite",
      "grandeurs-mesures",
      "geometrie",
      "statistiques",
      "probabilites",
      "algorithmique"
    ],
    recommendedAutomatisms: ["Synthèse 5e", "Problèmes à étapes", "Programmes de calcul"],
    prerequisites: ["Progression annuelle de 5e"],
    excludedBefore: ["Fonctions affines"]
  },
  {
    level: "4e",
    progressionStep: "start",
    domains: ["nombres-calculs", "fractions", "proportionnalite", "geometrie", "statistiques"],
    recommendedAutomatisms: [
      "Nombres relatifs",
      "Fractions opératoires",
      "Pourcentages",
      "Moyennes"
    ],
    prerequisites: ["Automatismes de 5e"],
    excludedBefore: ["Trigonométrie", "Fonctions"]
  },
  {
    level: "4e",
    progressionStep: "trimester1",
    domains: [
      "nombres-calculs",
      "fractions",
      "calcul-litteral",
      "equations",
      "proportionnalite",
      "pythagore"
    ],
    recommendedAutomatisms: [
      "Calcul littéral simple",
      "Équations du type x+a=b",
      "Pythagore direct",
      "Fractions"
    ],
    prerequisites: ["Relatifs", "Expressions numériques"],
    excludedBefore: ["Thalès", "Trigonométrie"]
  },
  {
    level: "4e",
    progressionStep: "trimester2",
    domains: [
      "nombres-calculs",
      "fractions",
      "calcul-litteral",
      "equations",
      "puissances",
      "pythagore",
      "probabilites"
    ],
    recommendedAutomatisms: [
      "Puissances de 10",
      "Équations simples",
      "Probabilités",
      "Pythagore réciproque"
    ],
    prerequisites: ["Calcul littéral", "Carrés usuels"],
    excludedBefore: ["Trigonométrie"]
  },
  {
    level: "4e",
    progressionStep: "end",
    domains: [
      "nombres-calculs",
      "fractions",
      "calcul-litteral",
      "equations",
      "puissances",
      "proportionnalite",
      "geometrie",
      "pythagore",
      "statistiques",
      "probabilites",
      "algorithmique"
    ],
    recommendedAutomatisms: ["Synthèse 4e", "Problèmes courts", "Littéral et géométrie"],
    prerequisites: ["Progression annuelle de 4e"],
    excludedBefore: ["Thalès approfondi"]
  },
  {
    level: "3e",
    progressionStep: "start",
    domains: [
      "nombres-calculs",
      "fractions",
      "calcul-litteral",
      "equations",
      "puissances",
      "pythagore",
      "statistiques"
    ],
    recommendedAutomatisms: [
      "Réactivation 4e",
      "Puissances",
      "Équations",
      "Pythagore",
      "Moyennes"
    ],
    prerequisites: ["Automatismes de 4e"],
    excludedBefore: ["Trigonométrie"]
  },
  {
    level: "3e",
    progressionStep: "trimester1",
    domains: [
      "calcul-litteral",
      "equations",
      "puissances",
      "fonctions",
      "pythagore",
      "thales",
      "statistiques"
    ],
    recommendedAutomatisms: [
      "Fonctions linéaires",
      "Thalès direct",
      "Équations",
      "Notation scientifique"
    ],
    prerequisites: ["Proportionnalité", "Calcul littéral"],
    excludedBefore: ["Trigonométrie"]
  },
  {
    level: "3e",
    progressionStep: "trimester2",
    domains: [
      "calcul-litteral",
      "equations",
      "puissances",
      "fonctions",
      "trigonometrie",
      "thales",
      "probabilites"
    ],
    recommendedAutomatisms: [
      "Fonctions affines",
      "Trigonométrie dans le triangle rectangle",
      "Probabilités",
      "Développements simples"
    ],
    prerequisites: ["Pythagore", "Rapports de longueurs"],
    excludedBefore: ["Synthèse brevet"]
  },
  {
    level: "3e",
    progressionStep: "end",
    domains: [
      "nombres-calculs",
      "fractions",
      "calcul-litteral",
      "equations",
      "puissances",
      "proportionnalite",
      "fonctions",
      "trigonometrie",
      "pythagore",
      "thales",
      "statistiques",
      "probabilites",
      "algorithmique"
    ],
    recommendedAutomatisms: [
      "Synthèse brevet",
      "Problèmes à étapes",
      "Fonctions",
      "Géométrie calculatoire"
    ],
    prerequisites: ["Progression annuelle de 3e"],
    excludedBefore: []
  }
];
