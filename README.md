# TempoMaths v0.3

Application hors ligne pour générer et lancer des diaporamas d'automatismes mathématiques au collège.

Le dossier est actuellement en **Electron + React + TypeScript**. Tauri reste une bonne cible plus légère, mais il nécessite Rust/Cargo, absents de l'environnement local au moment du scaffold.

## Installation

```bash
npm install
```

## Lancement en développement

Version web Vite :

```bash
npm run dev
```

Application de bureau Electron :

```bash
npm run electron:dev
```

## Tests

```bash
npm test
```

## Build Windows

```bash
npm run build:win
```

Le build produit une sortie Windows dans `release/` :

- `release/win-unpacked/TempoMaths.exe` : lanceur hors ligne direct.
- `release/TempoMaths *.exe` : version portable ou installateur selon la cible générée.

Si la génération de l'installateur NSIS est bloquée par les privilèges Windows, utiliser :

```bash
npm run build:portable
```

Cette commande force une version portable sans étape d'édition/signature de l'exécutable.

## Contenu pédagogique

- Progressions 6e, 5e, 4e et 3e reprises depuis `https://josselin-mear.synology.me/`.
- Sélection par chapitre, avec option cumulative pour inclure les chapitres précédents.
- Grande base générative d'automatismes : calcul, fractions, géométrie, grandeurs, probabilités, algorithmique et Scratch.
- Questions générées au hasard à chaque lancement quand aucune graine n'est fixée.
- Corrections affichées à la fin par défaut.
- Rendu mathématique hors ligne avec KaTeX : fractions, puissances, équations et expressions typées proprement.
- Écran diaporama contraint à une fenêtre complète, sans scroll.
- Figures de géométrie et blocs Scratch générés dans certaines questions.
- Familles flash supplémentaires inspirées des usages de MathsMentales, en version simplifiée et rédigée pour le collège.

## Structure du projet

- `src/components` : composants réutilisables, navigation, diaporama, résultats.
- `src/pages` : écrans principaux de l'application.
- `src/data` : progression du site, curriculum modifiable et base générative d'automatismes.
- `src/types` : types TypeScript métier.
- `src/services` : stockage local et import/export JSON.
- `src/utils` : hasard seedé, maths, filtres, rendu de templates.
- `src/generator` : génération d'une question et d'une série.
- `src/slideshow` : logique de timer.
- `src/styles` : styles globaux.

## Ajouter un automatisme

Ajouter une entrée dans `src/data/largeAutomatismes.ts` ou dans l'éditeur local avec les champs :

- `id`, `title`, `level`, `progressionStep`, `domain`, `subdomain`
- `difficulty`
- `statementTemplate`, `answerTemplate`, `correctionTemplate`
- `variablesSchema`
- `tags`

Les templates acceptent des variables entre doubles accolades :

```ts
statementTemplate: "Calculer {{a}} × {{b}}.",
answerTemplate: "{{a*b}}",
correctionTemplate: "{{a}} × {{b}} = {{a*b}}.",
variablesSchema: {
  a: { type: "int", min: 2, max: 9 },
  b: { type: "int", min: 2, max: 9 }
}
```

On peut aussi créer un automatisme personnel dans l'écran `Éditeur`, puis l'exporter avec les données locales.

## Modifier la progression

La progression par chapitres est dans `src/data/siteProgression.ts`.

Le curriculum trimestriel historique reste dans `src/data/curriculum.ts` pour les raccourcis de période.

Chaque entrée indique :

- niveau
- période
- domaines autorisés
- automatismes recommandés
- prérequis
- notions exclues avant la période

La progressivité cumulative est gérée dans `src/utils/filters.ts`.

## Références officielles à vérifier

- Programmes du collège : https://www.education.gouv.fr/les-programmes-du-college-470408
- Ressources mathématiques cycle 3 : https://eduscol.education.fr/5712/ressources-d-accompagnement-du-programme-de-mathematiques-au-cycle-3
- Ressources mathématiques cycle 4 : https://eduscol.education.fr/5736/ressources-d-accompagnement-du-programme-de-mathematiques-au-cycle-4
- Repères et attendus : https://eduscol.education.fr/6910/reperes-annuels-de-progression-et-attendus-de-fin-d-annee-du-cp-la-troisieme

## Version 2 proposée

- Éditeur complet avec validation avancée des variables.
- Export PDF imprimable.
- Partage de séries.
- Statistiques de réutilisation.
- Profils de classes.
- Mode évaluation.
- Import depuis tableur.
- Génération de fiches papier.

## Note pédagogique

La base fournie est volontairement large et générative. Elle doit rester vérifiée dans l'usage réel de classe, surtout pour ajuster le niveau de difficulté fin par chapitre.
