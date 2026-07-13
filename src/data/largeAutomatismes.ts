import type { Automatisme, ChapterInfo, FigureTemplate, ProgressionStep, VariableSchema } from "../types";
import { chapterCompletionTemplates } from "./chapterCompletionTemplates";
import { siteProgressionChapters } from "./siteProgression";

type TemplateSeed = {
  title: string;
  subdomain: string;
  difficulty?: Automatisme["difficulty"];
  statementTemplate: string;
  answerTemplate: string;
  correctionTemplate: string;
  variablesSchema: VariableSchema;
  tags?: string[];
  duration?: number;
  figureTemplate?: FigureTemplate;
};

const sourceNote =
  "Base generative alignee sur la progression Mythes & Matiques et structuree avec les programmes officiels de mathematiques cycle 3 BO 17/04/2025 et cycle 4 BO 05/03/2026.";

function phrasedStatement(statementTemplate: string): string {
  const replacements: Array<[RegExp, string]> = [
    [/^Calculer\b/i, "Calcule"],
    [/^Résoudre\b/i, "Résous"],
    [/^Resoudre\b/i, "Résous"],
    [/^Réduire\b/i, "Réduis"],
    [/^Reduire\b/i, "Réduis"],
    [/^Développer\b/i, "Développe"],
    [/^Developper\b/i, "Développe"],
    [/^Factoriser\b/i, "Factorise"],
    [/^Simplifier\b/i, "Simplifie"],
    [/^Comparer\b/i, "Compare"],
    [/^Écrire\b/i, "Écris"],
    [/^Ecrire\b/i, "Écris"],
    [/^Compléter\b/i, "Complète"],
    [/^Completer\b/i, "Complète"],
    [/^Déterminer\b/i, "Détermine"],
    [/^Determiner\b/i, "Détermine"],
    [/^Donner\b/i, "Donne"],
    [/^Convertir\b/i, "Convertis"],
    [/^Effectuer\b/i, "Effectue"],
    [/^Trouver\b/i, "Trouve"],
    [/^Identifier\b/i, "Identifie"],
    [/^Encadrer\b/i, "Encadre"]
  ];

  const trimmed = statementTemplate.trim();
  const phrased = replacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    trimmed
  );

  return /[.!?]$/.test(phrased) ? phrased : `${phrased}.`;
}

function stepForChapter(chapter: ChapterInfo): ProgressionStep {
  const max = siteProgressionChapters[chapter.level].length;
  if (chapter.rank <= Math.ceil(max * 0.18)) return "start";
  if (chapter.rank <= Math.ceil(max * 0.35)) return "trimester1";
  if (chapter.rank <= Math.ceil(max * 0.68)) return "trimester2";
  return "end";
}

function difficultyForChapter(chapter: ChapterInfo): Automatisme["difficulty"] {
  const base = chapter.level === "6e" ? 2 : chapter.level === "5e" ? 3 : chapter.level === "4e" ? 4 : 4;
  const bump = chapter.rank > siteProgressionChapters[chapter.level].length * 0.58 ? 1 : 0;
  return Math.min(5, base + bump) as Automatisme["difficulty"];
}

function replaceStandaloneXOutsideExpressions(value: string): string {
  return value
    .split(/(\{\{.*?\}\})/g)
    .map((part) => (part.startsWith("{{") && part.endsWith("}}") ? part : part.replace(/(^|[^A-Za-zÀ-ÿ])x([^A-Za-zÀ-ÿ]|$)/g, "$1×$2")))
    .join("");
}

function replaceFigureLiteralX(figureTemplate: FigureTemplate | undefined): FigureTemplate | undefined {
  if (!figureTemplate) return undefined;
  if (figureTemplate.kind === "scratch") return figureTemplate;
  return JSON.parse(
    JSON.stringify(figureTemplate, (_key, value) =>
      typeof value === "string" ? replaceStandaloneXOutsideExpressions(value) : value
    )
  ) as FigureTemplate;
}

function sixthGradeQuestionMarkTemplate(chapter: ChapterInfo, seed: TemplateSeed): TemplateSeed {
  if (chapter.level !== "6e" || chapter.domain === "calcul-litteral") return seed;
  return {
    ...seed,
    statementTemplate: replaceStandaloneXOutsideExpressions(seed.statementTemplate),
    answerTemplate: replaceStandaloneXOutsideExpressions(seed.answerTemplate),
    correctionTemplate: replaceStandaloneXOutsideExpressions(seed.correctionTemplate),
    figureTemplate: replaceFigureLiteralX(seed.figureTemplate)
  };
}

function defaultTheoremFigure(chapter: ChapterInfo, seed: TemplateSeed): FigureTemplate | undefined {
  const tags = new Set(seed.tags ?? []);
  if (chapter.domain === "pythagore" || tags.has("pythagore")) {
    if (chapter.id === "4e-chap-09") {
      return { kind: "triangle", labelA: "a", labelB: "b", labelC: "c" };
    }
    return { kind: "right-triangle", legALabel: "AB", legBLabel: "AC", hypotenuseLabel: "BC" };
  }

  if (chapter.domain === "thales" || tags.has("thales")) {
    return {
      kind: "thales",
      smallLeftLabel: "AM",
      bigLeftLabel: "AB",
      smallRightLabel: "AN",
      bigRightLabel: "AC",
      parallelLabel: "(MN) \\parallel (BC)"
    };
  }

  return undefined;
}

function makeAutomatisme(chapter: ChapterInfo, seed: TemplateSeed, index: number): Automatisme {
  const displaySeed = sixthGradeQuestionMarkTemplate(chapter, seed);
  const baseFigureTemplate = displaySeed.figureTemplate ?? defaultTheoremFigure(chapter, displaySeed);
  const figureTemplate = baseFigureTemplate?.kind === "thales" && displaySeed.tags?.includes("papillon")
    ? { ...baseFigureTemplate, configuration: "papillon" as const }
    : baseFigureTemplate;
  return {
    id: `site-${chapter.id}-${index.toString().padStart(2, "0")}`,
    title: displaySeed.title,
    levels: [chapter.level],
    progressionStep: stepForChapter(chapter),
    chapterId: chapter.id,
    chapterRank: chapter.rank,
    chapterTitle: chapter.title,
    domain: chapter.domain,
    subdomain: displaySeed.subdomain,
    difficulty: displaySeed.difficulty ?? difficultyForChapter(chapter),
    statementTemplate: phrasedStatement(displaySeed.statementTemplate),
    correctionTemplate: displaySeed.correctionTemplate,
    answerTemplate: displaySeed.answerTemplate,
    variablesSchema: displaySeed.variablesSchema,
    defaultDurationSeconds: displaySeed.duration ?? 30,
    tags: [
      chapter.id,
      chapter.title.toLowerCase(),
      ...chapter.savoirs.map((item) => item.toLowerCase()),
      ...chapter.competences.map((item) => item.toLowerCase()),
      ...(displaySeed.tags ?? [])
    ],
    figureTemplate,
    sourceNote,
    status: "official"
  };
}

function numberTemplates(chapter: ChapterInfo): TemplateSeed[] {
  const relative = chapter.title.toLowerCase().includes("relatif");
  const priority = chapter.title.toLowerCase().includes("prior");

  if (relative) {
    return [
      {
        title: "Addition de relatifs",
        subdomain: chapter.title,
        statementTemplate: "Calculer $(-{{a}})+{{b}}$.",
        answerTemplate: "{{b-a}}",
        correctionTemplate: "$-{{a}}+{{b}}={{b-a}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 20 }, b: { type: "int", min: 2, max: 20 } },
        tags: ["relatifs"]
      },
      {
        title: "Soustraction de relatifs",
        subdomain: chapter.title,
        statementTemplate: "Calculer {{a}} - (-{{b}}).",
        answerTemplate: "{{a+b}}",
        correctionTemplate: "Soustraire -{{b}}, c'est ajouter {{b}} : {{a}} + {{b}} = {{a+b}}.",
        variablesSchema: { a: { type: "int", min: -12, max: 15 }, b: { type: "int", min: 2, max: 18 } },
        tags: ["relatifs"]
      },
      {
        title: "Produit de relatifs",
        subdomain: chapter.title,
        statementTemplate: "Calculer (-{{a}}) × (-{{b}}).",
        answerTemplate: "{{a*b}}",
        correctionTemplate: "Le produit de deux nombres négatifs est positif : {{a}} × {{b}} = {{a*b}}.",
        variablesSchema: { a: { type: "int", min: 2, max: 12 }, b: { type: "int", min: 2, max: 12 } },
        tags: ["relatifs"]
      },
      {
        title: "Comparer des relatifs",
        subdomain: chapter.title,
        statementTemplate: "Comparer avec < ou > : -{{a}} ... -{{b}}.",
        answerTemplate: "{{a===b ? '=' : a>b ? '<' : '>'}}",
        correctionTemplate: "Parmi deux nombres négatifs, le plus proche de 0 est le plus grand : $-{{a}} {{a===b ? '=' : a>b ? '<' : '>'}} -{{b}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 25 }, b: { type: "int", min: 2, max: 25 } },
        tags: ["relatifs", "ordre"]
      }
    ];
  }

  if (priority) {
    return [
      {
        title: "Priorit? multiplication",
        subdomain: chapter.title,
        statementTemplate: "Calculer {{a}} + {{b}} × {{c}}.",
        answerTemplate: "{{a+b*c}}",
        correctionTemplate: "On commence par {{b}} × {{c}} = {{b*c}}, puis {{a}} + {{b*c}} = {{a+b*c}}.",
        variablesSchema: { a: { type: "int", min: 2, max: 30 }, b: { type: "int", min: 2, max: 9 }, c: { type: "int", min: 2, max: 9 } },
        tags: ["priorites"]
      },
      {
        title: "Parenth?ses prioritaires",
        subdomain: chapter.title,
        statementTemplate: "Calculer ({{a}} + {{b}}) × {{c}}.",
        answerTemplate: "{{(a+b)*c}}",
        correctionTemplate: "On calcule la parenthèse : {{a}} + {{b}} = {{a+b}}, puis {{a+b}} × {{c}} = {{(a+b)*c}}.",
        variablesSchema: { a: { type: "int", min: 2, max: 18 }, b: { type: "int", min: 2, max: 18 }, c: { type: "int", min: 2, max: 7 } },
        tags: ["priorites"]
      },
      {
        title: "Priorit? division",
        subdomain: chapter.title,
        statementTemplate: "Calculer {{a}} + {{b*c}} ÷ {{c}}.",
        answerTemplate: "{{a+b}}",
        correctionTemplate: "On commence par la division : {{b*c}} ÷ {{c}} = {{b}}, puis {{a}} + {{b}} = {{a+b}}.",
        variablesSchema: { a: { type: "int", min: 2, max: 30 }, b: { type: "int", min: 2, max: 12 }, c: { type: "int", min: 2, max: 8 } },
        tags: ["priorites"]
      },
      {
        title: "Expression ? ?tapes",
        subdomain: chapter.title,
        statementTemplate: "Calculer {{a}} × {{b}} - {{c}}.",
        answerTemplate: "{{a*b-c}}",
        correctionTemplate: "{{a}} × {{b}} = {{a*b}}, puis {{a*b}} - {{c}} = {{a*b-c}}.",
        variablesSchema: { a: { type: "int", min: 3, max: 12 }, b: { type: "int", min: 3, max: 12 }, c: { type: "int", min: 2, max: 30 } },
        tags: ["priorites"]
      }
    ];
  }

  return [
    {
      title: "Addition mentale",
      subdomain: chapter.title,
      statementTemplate: "Calculer {{a}} + {{b}}.",
      answerTemplate: "{{a+b}}",
      correctionTemplate: "{{a}} + {{b}} = {{a+b}}.",
      variablesSchema: { a: { type: "int", min: 35, max: 650 }, b: { type: "int", min: 18, max: 280 } },
      tags: ["calcul"]
    },
    {
      title: "Multiplication mentale",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{a}}\\times{{b}}$.",
      answerTemplate: "{{a*b}}",
      correctionTemplate: "$ {{a}}\\times{{b}}={{a*b}}$.",
      variablesSchema: { a: { type: "int", min: 4, max: 19 }, b: { type: "int", min: 4, max: 16 } },
      tags: ["calcul"]
    },
    {
      title: "Division exacte",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{a*b}}\\div{{b}}$.",
      answerTemplate: "{{a}}",
      correctionTemplate: "$ {{a*b}}\\div{{b}}={{a}}$ car ${{a}}\\times{{b}}={{a*b}}$.",
      variablesSchema: { a: { type: "int", min: 8, max: 55 }, b: { type: "int", min: 3, max: 15 } },
      tags: ["division"]
    },
    {
      title: "Compl?ment",
      subdomain: chapter.title,
      statementTemplate: "Compl?ter : {{a}} + ... = {{target}}.",
      answerTemplate: "{{target-a}}",
      correctionTemplate: "{{target}} - {{a}} = {{target-a}}, donc le compl?ment est {{target-a}}.",
      variablesSchema: { a: { type: "int", min: 37, max: 480 }, target: { type: "choice", values: [500, 1000] } },
      tags: ["complement"]
    }
  ];
}

function decimalTemplates(chapter: ChapterInfo): TemplateSeed[] {
  return [
    {
      title: "Addition d?cimale",
      subdomain: chapter.title,
      statementTemplate: "Calculer {{formatDecimalFrench(a)}} + {{formatDecimalFrench(b)}}.",
      answerTemplate: "{{formatDecimalFrench(a+b)}}",
      correctionTemplate: "On aligne les unit?s et les dixi?mes : {{formatDecimalFrench(a)}} + {{formatDecimalFrench(b)}} = {{formatDecimalFrench(a+b)}}.",
      variablesSchema: { a: { type: "decimal", min: 1.2, max: 25.8, decimals: 1 }, b: { type: "decimal", min: 0.3, max: 12.7, decimals: 1 } },
      tags: ["decimaux"]
    },
    {
      title: "Soustraction d?cimale",
      subdomain: chapter.title,
      statementTemplate: "Calculer {{formatDecimalFrench(a+b)}} - {{formatDecimalFrench(b)}}.",
      answerTemplate: "{{formatDecimalFrench(a)}}",
      correctionTemplate: "{{formatDecimalFrench(a+b)}} - {{formatDecimalFrench(b)}} = {{formatDecimalFrench(a)}}.",
      variablesSchema: { a: { type: "decimal", min: 2.1, max: 25.9, decimals: 1 }, b: { type: "decimal", min: 0.2, max: 9.8, decimals: 1 } },
      tags: ["decimaux"]
    },
    {
      title: "Multiplier un d?cimal",
      subdomain: chapter.title,
      statementTemplate: "Calculer {{formatDecimalFrench(a)}} × {{b}}.",
      answerTemplate: "{{formatDecimalFrench(a*b)}}",
      correctionTemplate: "{{formatDecimalFrench(a)}} × {{b}} = {{formatDecimalFrench(a*b)}}.",
      variablesSchema: { a: { type: "decimal", min: 1.2, max: 12.8, decimals: 1 }, b: { type: "int", min: 2, max: 9 } },
      tags: ["decimaux"]
    },
    {
      title: "Multiplier par 10, 100 ou 1000",
      subdomain: chapter.title,
      statementTemplate: "Calculer {{formatDecimalFrench(a)}} × {{m}}.",
      answerTemplate: "{{formatDecimalFrench(a*m)}}",
      correctionTemplate: "Multiplier par {{m}} d?cale la virgule : r?sultat {{formatDecimalFrench(a*m)}}.",
      variablesSchema: { a: { type: "decimal", min: 0.4, max: 19.9, decimals: 1 }, m: { type: "choice", values: [10, 100, 1000] } },
      tags: ["decimaux"]
    }
  ];
}

function fractionTemplates(chapter: ChapterInfo): TemplateSeed[] {
  const sixthGrade: TemplateSeed[] = [
    {
      title: "Fraction partage",
      subdomain: chapter.title,
      statementTemplate: "Une unité est partagée en ${{den}}$ parts égales. Quelle fraction représente {{num}} parts ?",
      answerTemplate: "$\\dfrac{ {{num}} }{ {{den}} }$",
      correctionTemplate: "$ {{num}}$ parts sur ${{den}}$ parts égales représentent $\\dfrac{ {{num}} }{ {{den}} }$ de l'unité.",
      variablesSchema: { num: { type: "int", min: 1, max: 3 }, den: { type: "choice", values: [4, 5, 6, 8, 10] } },
      tags: ["fractions", "partage"]
    },
    {
      title: "Fraction d'une quantité",
      subdomain: chapter.title,
      statementTemplate: "Calculer $\\dfrac{ {{num}} }{ {{den}} }$ de ${{den*c}}$.",
      answerTemplate: "{{num*c}}",
      correctionTemplate: "$\\dfrac1{ {{den}} }$ de ${{den*c}}$ vaut ${{c}}$, donc $\\dfrac{ {{num}} }{ {{den}} }$ vaut ${{num}}\\times {{c}}={{num*c}}$.",
      variablesSchema: { num: { type: "int", min: 1, max: 5 }, den: { type: "choice", values: [3, 4, 5, 6, 8, 10] }, c: { type: "int", min: 2, max: 18 } },
      tags: ["fractions", "quantite"]
    },
    {
      title: "Fractions égales",
      subdomain: chapter.title,
      statementTemplate: "Compl?ter : $\\dfrac{ {{a}} }{ {{b}} }=\\dfrac{ {{a*k}} }{ \\Box }$.",
      answerTemplate: "{{b*k}}",
      correctionTemplate: "On multiplie le num?rateur par ${{k}}$, donc on multiplie aussi le d?nominateur par ${{k}}$ : ${{b}}\\times {{k}}={{b*k}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 5 }, b: { type: "choice", values: [2, 3, 4, 5, 6, 8] }, k: { type: "int", min: 2, max: 6 } },
      tags: ["fractions", "egalite"]
    },
    {
      title: "Comparer à 1",
      subdomain: chapter.title,
      statementTemplate: "Compare $\\dfrac{ {{num}} }{ {{den}} }$ avec $1$.",
      answerTemplate: "{{num < den ? '< 1' : num === den ? '= 1' : '> 1'}}",
      correctionTemplate: "On compare le num?rateur et le d?nominateur : ${{num}}$ {{num < den ? '<' : num === den ? '=' : '>'}} ${{den}}$, donc $\\dfrac{ {{num}} }{ {{den}} }$ {{num < den ? '<' : num === den ? '=' : '>'}} $1$.",
      variablesSchema: { num: { type: "int", min: 2, max: 12 }, den: { type: "int", min: 2, max: 12 } },
      tags: ["fractions", "comparaison"]
    },
    {
      title: "Fraction décimale",
      subdomain: chapter.title,
      statementTemplate: "?crire $\\dfrac{ {{a}} }{10}$ sous forme d?cimale.",
      answerTemplate: "{{formatDecimalFrench(a/10)}}",
      correctionTemplate: "Le d?nominateur $10$ indique des dixi?mes : $\\dfrac{ {{a}} }{10}={{formatDecimalFrench(a/10)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 49 } },
      tags: ["fractions", "decimaux", "fraction decimale"]
    },
    {
      title: "Droite graduée",
      subdomain: chapter.title,
      statementTemplate: "Sur une droite graduée en ${{den}}$ parts par unité, quelle abscisse correspond à la ${{num}}^e$ graduation ?",
      answerTemplate: "$\\dfrac{ {{num}} }{ {{den}} }$",
      correctionTemplate: "Chaque graduation vaut $\\dfrac1{ {{den}} }$. La ${{num}}^e$ graduation correspond donc à $\\dfrac{ {{num}} }{ {{den}} }$.",
      variablesSchema: { num: { type: "int", min: 1, max: 12 }, den: { type: "choice", values: [2, 4, 5, 8, 10] } },
      tags: ["fractions", "droite-graduee"]
    }
  ];

  if (chapter.level === "6e") {
    return sixthGrade;
  }

  return [
    {
      title: "Fraction d'une quantit?",
      subdomain: chapter.title,
      statementTemplate: "Calculer $\\dfrac{ {{num}} }{ {{den}} }$ de ${{den*c}}$.",
      answerTemplate: "{{num*c}}",
      correctionTemplate: "$\\dfrac1{ {{den}} }$ de ${{den*c}}$ vaut ${{c}}$, donc $\\dfrac{ {{num}} }{ {{den}} }$ vaut ${{num}}\\times {{c}}={{num*c}}$.",
      variablesSchema: { num: { type: "int", min: 1, max: 5 }, den: { type: "choice", values: [3, 4, 5, 6, 8, 10] }, c: { type: "int", min: 3, max: 20 } },
      tags: ["fractions"]
    },
    {
      title: "Simplifier une fraction",
      subdomain: chapter.title,
      statementTemplate: "Simplifier $\\dfrac{ {{k*a}} }{ {{k*b}} }$.",
      answerTemplate: "{{formatFraction(k*a,k*b)}}",
      correctionTemplate: "On divise le num?rateur et le d?nominateur par ${{k}}$ : $\\dfrac{ {{k*a}} }{ {{k*b}} }={{formatFraction(k*a,k*b)}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 11 }, k: { type: "int", min: 2, max: 8 } },
      tags: ["fractions"]
    },
    {
      title: "Addition de fractions à dénominateurs multiples",
      subdomain: chapter.title,
      statementTemplate: "Calculer $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ {{b}} }{ {{den*k}} }$.",
      answerTemplate: "{{formatFraction(a*k+b,den*k)}}",
      correctionTemplate: "On utilise le d?nominateur commun ${{den*k}}$ : $\\dfrac{ {{a}} }{ {{den}} }=\\dfrac{ {{a*k}} }{ {{den*k}} }$, donc $\\dfrac{ {{a*k}}+{{b}} }{ {{den*k}} }={{formatFraction(a*k+b,den*k)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 7 }, b: { type: "int", min: 1, max: 9 }, den: { type: "choice", values: [3, 4, 5, 6, 8] }, k: { type: "choice", values: [2, 3, 4] } },
      tags: ["fractions", "denominateurs-multiples"]
    },
    {
      title: chapter.level === "5e" ? "Soustraction de fractions à dénominateurs multiples" : "Soustraction de fractions avec relatifs",
      subdomain: chapter.title,
      statementTemplate:
        chapter.level === "5e"
          ? "Calculer $\\dfrac{ {{a*k+b}} }{ {{den*k}} }-\\dfrac{ {{a}} }{ {{den}} }$."
          : "Calculer $\\dfrac{ -{{a}} }{ {{den}} }+\\dfrac{ {{b}} }{ {{den*k}} }$.",
      answerTemplate: chapter.level === "5e" ? "{{formatFraction(b,den*k)}}" : "{{formatFraction(-a*k+b,den*k)}}",
      correctionTemplate:
        chapter.level === "5e"
          ? "On convertit $\\dfrac{ {{a}} }{ {{den}} }=\\dfrac{ {{a*k}} }{ {{den*k}} }$, donc $\\dfrac{ {{a*k+b}}-{{a*k}} }{ {{den*k}} }={{formatFraction(b,den*k)}}$."
          : "On convertit $\\dfrac{ -{{a}} }{ {{den}} }=\\dfrac{ {{-a*k}} }{ {{den*k}} }$, donc $\\dfrac{ {{-a*k}}+{{b}} }{ {{den*k}} }={{formatFraction(-a*k+b,den*k)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 7 }, b: { type: "int", min: 1, max: 10 }, den: { type: "choice", values: [3, 4, 5, 6, 8] }, k: { type: "choice", values: [2, 3, 4] } },
      tags: ["fractions", "denominateurs-multiples", ...(chapter.level === "5e" ? [] : ["relatifs"])]
    },
    {
      title: "Produit de fractions",
      subdomain: chapter.title,
      statementTemplate: "Calculer $\\dfrac{ {{a}} }{ {{b}} }\\times\\dfrac{ {{c}} }{ {{d}} }$.",
      answerTemplate: "{{formatFraction(a*c,b*d)}}",
      correctionTemplate: "On multiplie les num?rateurs et les d?nominateurs : $\\dfrac{ {{a}} }{ {{b}} }\\times\\dfrac{ {{c}} }{ {{d}} }=\\dfrac{ {{a*c}} }{ {{b*d}} }={{formatFraction(a*c,b*d)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 6 }, b: { type: "int", min: 2, max: 9 }, c: { type: "int", min: 1, max: 6 }, d: { type: "int", min: 2, max: 9 } },
      tags: ["fractions"]
    }
  ];
}

function proportionTemplates(chapter: ChapterInfo): TemplateSeed[] {
  return [
      {
        title: "Produit en croix",
        subdomain: chapter.title,
        statementTemplate: "Dans un tableau proportionnel : {{a}} correspond à {{a*p}}. À combien correspond {{c}} ?",
        answerTemplate: "{{p*c}}",
        correctionTemplate: "Le coefficient est {{p}}, donc {{c}} correspond à {{c}} × {{p}} = {{p*c}}.",
        variablesSchema: { a: { type: "choice", values: [2, 3, 4, 5, 6] }, p: { type: "int", min: 2, max: 9 }, c: { type: "choice", values: [4, 6, 8, 9, 10, 12] } },
        tags: ["proportionnalite"]
      },
    {
      title: "Pourcentage simple",
      subdomain: chapter.title,
      statementTemplate: "Calculer {{pct}} % de {{base}}.",
      answerTemplate: "{{base*pct/100}}",
      correctionTemplate: "{{pct}} % de {{base}} = {{base}} × {{pct}} ÷ 100 = {{base*pct/100}}.",
      variablesSchema: { pct: { type: "choice", values: [5, 10, 20, 25, 50] }, base: { type: "choice", values: [40, 60, 80, 100, 120, 200] } },
      tags: ["pourcentage"]
    },
    {
      title: "Augmentation",
      subdomain: chapter.title,
      statementTemplate: "Augmenter {{base}} de {{pct}} %.",
      answerTemplate: "{{formatDecimalFrench(base*(1+pct/100))}}",
      correctionTemplate: "On multiplie par {{formatDecimalFrench(1+pct/100)}} : {{formatDecimalFrench(base*(1+pct/100))}}.",
      variablesSchema: { base: { type: "choice", values: [50, 80, 100, 120, 200] }, pct: { type: "choice", values: [5, 10, 20, 25] } },
      tags: ["pourcentage"]
    },
    {
      title: "Prix proportionnel",
      subdomain: chapter.title,
      statementTemplate: "{{a}} objets co?tent {{a*p}} euros. Combien co?tent {{q}} objets ?",
      answerTemplate: "{{p*q}} euros",
      correctionTemplate: "Un objet co?te {{p}} euros, donc {{q}} objets co?tent {{p}} × {{q}} = {{p*q}} euros.",
      variablesSchema: { a: { type: "int", min: 2, max: 5 }, p: { type: "int", min: 2, max: 12 }, q: { type: "int", min: 3, max: 12 } },
      tags: ["proportionnalite"]
    }
  ];
}

function geometryTemplates(chapter: ChapterInfo): TemplateSeed[] {
  const lower = chapter.title.toLowerCase();
  const normalized = lower.normalize("NFD").replace(/\p{Diacritic}/gu, "");
  if (lower.includes("pythagore") || chapter.domain === "pythagore") {
    return [
      {
        title: "Egalite de Pythagore rectangle en A",
        subdomain: chapter.title,
        difficulty: 3,
        statementTemplate: "Dans le triangle $ABC$ rectangle en $A$, ecris l'egalite de Pythagore.",
        answerTemplate: "$BC^2=AB^2+AC^2$",
        correctionTemplate: "L'hypotenuse est $BC$, donc $BC^2=AB^2+AC^2$.",
        variablesSchema: {},
        figureTemplate: { kind: "right-triangle", legALabel: "AB", legBLabel: "AC", hypotenuseLabel: "BC" },
        tags: ["pythagore", "egalite", "redaction"]
      },
      {
        title: "Egalite de Pythagore rectangle en B",
        subdomain: chapter.title,
        difficulty: 3,
        statementTemplate: "Dans le triangle $ABC$ rectangle en $B$, ecris l'egalite de Pythagore.",
        answerTemplate: "$AC^2=AB^2+BC^2$",
        correctionTemplate: "L'hypotenuse est $AC$, donc $AC^2=AB^2+BC^2$.",
        variablesSchema: {},
        figureTemplate: { kind: "right-triangle", legALabel: "AB", legBLabel: "BC", hypotenuseLabel: "AC" },
        tags: ["pythagore", "egalite", "redaction"]
      },
      {
        title: "Triplet 3-4-5",
        subdomain: chapter.title,
        difficulty: 3,
        statementTemplate: "Un triangle a pour cotes $3$, $4$ et $5$. Verifie l'egalite de Pythagore.",
        answerTemplate: "$3^2+4^2=5^2$",
        correctionTemplate: "$3^2+4^2=9+16=25$ et $5^2=25$.",
        variablesSchema: {},
        figureTemplate: { kind: "triangle", labelA: "3", labelB: "4", labelC: "5" },
        tags: ["pythagore", "triplet", "reciproque"]
      },
      {
        title: "Triplet 5-12-13",
        subdomain: chapter.title,
        difficulty: 3,
        statementTemplate: "Un triangle a pour cotes $5$, $12$ et $13$. Verifie l'egalite de Pythagore.",
        answerTemplate: "$5^2+12^2=13^2$",
        correctionTemplate: "$5^2+12^2=25+144=169$ et $13^2=169$.",
        variablesSchema: {},
        figureTemplate: { kind: "triangle", labelA: "5", labelB: "12", labelC: "13" },
        tags: ["pythagore", "triplet", "reciproque"]
      },
      {
        title: "Triplet multiple",
        subdomain: chapter.title,
        difficulty: 3,
        statementTemplate: "Un triangle a pour cotes ${{3*k}}$, ${{4*k}}$ et ${{5*k}}$. Verifie l'egalite de Pythagore.",
        answerTemplate: "$({{3*k}})^2+({{4*k}})^2=({{5*k}})^2$",
        correctionTemplate: "$({{3*k}})^2+({{4*k}})^2={{9*k*k}}+{{16*k*k}}={{25*k*k}}$ et $({{5*k}})^2={{25*k*k}}$.",
        variablesSchema: { k: { type: "int", min: 2, max: 6 } },
        figureTemplate: { kind: "triangle", labelA: "{{3*k}}", labelB: "{{4*k}}", labelC: "{{5*k}}" },
        tags: ["pythagore", "triplet", "reciproque"]
      },
      {
        title: "Non-triplet simple",
        subdomain: chapter.title,
        difficulty: 3,
        statementTemplate: "Un triangle a pour cotes $3$, $4$ et $6$. Verifie si l'egalite de Pythagore est vraie.",
        answerTemplate: "Non",
        correctionTemplate: "$3^2+4^2=25$ mais $6^2=36$. Les deux valeurs sont differentes.",
        variablesSchema: {},
        figureTemplate: { kind: "triangle", labelA: "3", labelB: "4", labelC: "6" },
        tags: ["pythagore", "contraposee"]
      }
    ];
  }

  if (chapter.domain === "thales") {
    return [
      {
        title: "Rapports de Thales dans un triangle",
        subdomain: chapter.title,
        statementTemplate: "Dans le triangle $ABC$, $M\\in[AB]$, $N\\in[AC]$ et $(MN)\\parallel(BC)$. Ecris les trois rapports de Thales.",
        answerTemplate: "$\\dfrac{AM}{AB}=\\dfrac{AN}{AC}=\\dfrac{MN}{BC}$",
        correctionTemplate: "Les longueurs du petit triangle se placent au numerateur et celles du grand triangle au denominateur.",
        variablesSchema: {},
        tags: ["thales", "rapports", "redaction"]
      },
      {
        title: "Trois rapports dans un triangle",
        subdomain: chapter.title,
        statementTemplate: "Dans cette configuration, ecris les trois rapports petit triangle sur grand triangle.",
        answerTemplate: "$\\dfrac{AM}{AB}=\\dfrac{AN}{AC}=\\dfrac{MN}{BC}$",
        correctionTemplate: "On garde le meme ordre : petit triangle sur grand triangle.",
        variablesSchema: {},
        tags: ["thales", "rapports", "redaction"]
      },
      {
        title: "Rapports grand sur petit",
        subdomain: chapter.title,
        difficulty: 4,
        statementTemplate: "Dans le triangle $ABC$, $M\\in[AB]$, $N\\in[AC]$ et $(MN)\\parallel(BC)$. Ecris les rapports grand sur petit.",
        answerTemplate: "$\\dfrac{AB}{AM}=\\dfrac{AC}{AN}=\\dfrac{BC}{MN}$",
        correctionTemplate: "On garde le meme ordre dans chaque rapport : grand cote sur petit cote.",
        variablesSchema: {},
        tags: ["thales", "rapports", "redaction"]
      },
      {
        title: "Papillon rapports directs",
        subdomain: chapter.title,
        statementTemplate: "Dans le cas papillon, $(AB)\\parallel(CD)$ et les secantes se coupent en $O$. Ecris les trois rapports de Thales.",
        answerTemplate: "$\\dfrac{OA}{OC}=\\dfrac{OB}{OD}=\\dfrac{AB}{CD}$",
        correctionTemplate: "Les longueurs issues du meme triangle restent dans le meme rapport.",
        variablesSchema: {},
        figureTemplate: { kind: "thales", smallLeftLabel: "OA", bigLeftLabel: "OC", smallRightLabel: "OB", bigRightLabel: "OD", parallelLabel: "(AB) \\parallel (CD)" },
        tags: ["thales", "rapports", "papillon", "redaction"]
      },
      {
        title: "Papillon trois rapports",
        subdomain: chapter.title,
        statementTemplate: "Dans le cas papillon, ecris les trois rapports en commencant par le triangle $OAB$.",
        answerTemplate: "$\\dfrac{OA}{OC}=\\dfrac{OB}{OD}=\\dfrac{AB}{CD}$",
        correctionTemplate: "Les longueurs du triangle $OAB$ sont au numerateur.",
        variablesSchema: {},
        figureTemplate: { kind: "thales", smallLeftLabel: "OA", bigLeftLabel: "OC", smallRightLabel: "OB", bigRightLabel: "OD", parallelLabel: "(AB) \\parallel (CD)" },
        tags: ["thales", "rapports", "papillon", "redaction"]
      },
      {
        title: "Papillon rapports inverses",
        subdomain: chapter.title,
        difficulty: 4,
        statementTemplate: "Dans le cas papillon, ecris les rapports en commencant par le triangle $OCD$.",
        answerTemplate: "$\\dfrac{OC}{OA}=\\dfrac{OD}{OB}=\\dfrac{CD}{AB}$",
        correctionTemplate: "On inverse tous les rapports pour commencer par le triangle $OCD$.",
        variablesSchema: {},
        figureTemplate: { kind: "thales", smallLeftLabel: "OA", bigLeftLabel: "OC", smallRightLabel: "OB", bigRightLabel: "OD", parallelLabel: "(AB) \\parallel (CD)" },
        tags: ["thales", "rapports", "papillon", "redaction"]
      },
      {
        title: "Rapports pour la reciproque",
        subdomain: chapter.title,
        difficulty: 5,
        statementTemplate: "Pour tester si $(MN)$ et $(BC)$ sont paralleles, ecris les trois rapports de Thales.",
        answerTemplate: "$\\dfrac{AM}{AB}=\\dfrac{AN}{AC}=\\dfrac{MN}{BC}$",
        correctionTemplate: "On compare les rapports portes par les deux secantes et le rapport des cotes paralleles.",
        variablesSchema: {},
        tags: ["thales", "rapports", "reciproque", "redaction"]
      }
    ];
  }

  if (normalized.includes("representation spatiale")) {
    return [
      {
        title: "Faces d'un pav? droit",
        subdomain: chapter.title,
        statementTemplate: "Combien de faces poss?de un pav? droit ?",
        answerTemplate: "6",
        correctionTemplate: "Un pav? droit poss?de 6 faces : dessus, dessous, avant, arri?re, gauche et droite.",
        variablesSchema: {},
        figureTemplate: { kind: "solid", solid: "pave", labels: ["L", "l", "h"] },
        tags: ["espace", "solides"]
      },
      {
        title: "Ar?tes d'un cube",
        subdomain: chapter.title,
        statementTemplate: "Combien d'ar?tes poss?de un cube ?",
        answerTemplate: "12",
        correctionTemplate: "Un cube poss?de 12 ar?tes : 4 en haut, 4 en bas et 4 verticales.",
        variablesSchema: {},
        figureTemplate: { kind: "solid", solid: "pave", labels: ["c", "c", "c"] },
        tags: ["espace", "solides"]
      },
      {
        title: "Sommets d'un pav? droit",
        subdomain: chapter.title,
        statementTemplate: "Combien de sommets poss?de un pav? droit ?",
        answerTemplate: "8",
        correctionTemplate: "Un pav? droit poss?de 8 sommets : 4 sur la face du bas et 4 sur la face du haut.",
        variablesSchema: {},
        figureTemplate: { kind: "solid", solid: "pave", labels: ["8 sommets", "12 ar?tes", "6 faces"] },
        tags: ["espace", "solides"]
      }
    ];
  }

  if (normalized.includes("symetrie")) {
    return [
      {
        title: "Distance ? l'axe",
        subdomain: chapter.title,
        statementTemplate: "Un point A est ? {{d}} cm d'un axe de sym?trie. Son image A' est ? quelle distance de cet axe ?",
        answerTemplate: "{{d}} cm",
        correctionTemplate: "Par sym?trie axiale, un point et son image sont ? la m?me distance de l'axe.",
        variablesSchema: { d: { type: "int", min: 2, max: 12 } },
        tags: ["symetrie"]
      },
      {
        title: "Distance point-image",
        subdomain: chapter.title,
        statementTemplate: "Un point A est ? {{d}} cm d'un axe de sym?trie. Quelle est la distance AA' ?",
        answerTemplate: "{{2*d}} cm",
        correctionTemplate: "L'axe est la m?diatrice de [AA'], donc AA' = {{d}} + {{d}} = {{2*d}} cm.",
        variablesSchema: { d: { type: "int", min: 2, max: 10 } },
        tags: ["symetrie", "distance"]
      },
      {
        title: "Sym?trie centrale",
        subdomain: chapter.title,
        statementTemplate: "O est le centre de sym?trie et OA = {{d}} cm. Calculer AA'.",
        answerTemplate: "{{2*d}} cm",
        correctionTemplate: "En symétrie centrale, O est le milieu de [AA']. Donc AA' = 2 × OA = {{2*d}} cm.",
        variablesSchema: { d: { type: "int", min: 2, max: 12 } },
        tags: ["symetrie", "centre"]
      }
    ];
  }

  if (normalized.includes("parallelogram")) {
    return [
      {
        title: "C?t?s oppos?s",
        subdomain: chapter.title,
        statementTemplate: "ABCD est un parall?logramme. Si AB = {{a}} cm, alors CD = ?",
        answerTemplate: "{{a}} cm",
        correctionTemplate: "Dans un parall?logramme, les c?t?s oppos?s sont de m?me longueur. Donc CD = AB = {{a}} cm.",
        variablesSchema: { a: { type: "int", min: 3, max: 15 } },
        tags: ["parallelogramme"]
      },
      {
        title: "P?rim?tre d'un parall?logramme",
        subdomain: chapter.title,
        statementTemplate: "Un parall?logramme a deux c?t?s cons?cutifs de {{a}} cm et {{b}} cm. Calculer son p?rim?tre.",
        answerTemplate: "{{2*(a+b)}} cm",
        correctionTemplate: "P = 2 × ({{a}} + {{b}}) = {{2*(a+b)}} cm.",
        variablesSchema: { a: { type: "int", min: 4, max: 16 }, b: { type: "int", min: 3, max: 14 } },
        tags: ["parallelogramme", "perimetre"]
      },
      {
        title: "Angles cons?cutifs",
        subdomain: chapter.title,
        statementTemplate: "Dans un parall?logramme, un angle mesure {{a}}?. Combien mesure un angle cons?cutif ?",
        answerTemplate: "{{180-a}}°",
        correctionTemplate: "Deux angles consécutifs d'un parallélogramme sont supplémentaires : $180°-{{a}}°={{180-a}}°$.",
        variablesSchema: { a: { type: "int", min: 45, max: 135 } },
        tags: ["parallelogramme", "angles"]
      }
    ];
  }

  if (normalized.includes("translation")) {
    return [
      {
        title: "Coordonn?es par translation",
        subdomain: chapter.title,
        statementTemplate: "La translation de vecteur $({{u}};{{v}})$ envoie A(${{x}};{{y}}$) sur A'. Donner les coordonn?es de A'.",
        answerTemplate: "A'({{x+u}};{{y+v}})",
        correctionTemplate: "On ajoute les coordonn?es du vecteur : $x'={{x}}+{{u}}={{x+u}}$ et $y'={{y}}+{{v}}={{y+v}}$.",
        variablesSchema: { x: { type: "int", min: -4, max: 8 }, y: { type: "int", min: -4, max: 8 }, u: { type: "int", min: -3, max: 5, exclude: [0] }, v: { type: "int", min: -3, max: 5, exclude: [0] } },
        tags: ["translation", "coordonnees"]
      },
      {
        title: "Longueur conserv?e",
        subdomain: chapter.title,
        statementTemplate: "Une translation envoie A sur A' et B sur B'. Si AB = {{d}} cm, alors A'B' = ?",
        answerTemplate: "{{d}} cm",
        correctionTemplate: "Une translation conserve les longueurs, donc A'B' = AB = {{d}} cm.",
        variablesSchema: { d: { type: "int", min: 3, max: 18 } },
        tags: ["translation", "longueur"]
      },
      {
        title: "Vecteur de translation",
        subdomain: chapter.title,
        statementTemplate: "A(${{x}};{{y}}$) est envoy? sur A'(${{x+u}};{{y+v}}$). Quel est le vecteur de translation ?",
        answerTemplate: "({{u}};{{v}})",
        correctionTemplate: "Le vecteur est donn? par les diff?rences de coordonn?es : $({{x+u}}-{{x}};{{y+v}}-{{y}})=({{u}};{{v}})$.",
        variablesSchema: { x: { type: "int", min: -4, max: 8 }, y: { type: "int", min: -4, max: 8 }, u: { type: "int", min: -3, max: 5, exclude: [0] }, v: { type: "int", min: -3, max: 5, exclude: [0] } },
        tags: ["translation", "vecteur"]
      }
    ];
  }

  if (normalized.includes("homothet")) {
    return [
      {
        title: "Longueur par homoth?tie",
        subdomain: chapter.title,
        statementTemplate: "Une homoth?tie de rapport {{k}} transforme une longueur de {{l}} cm. Quelle est la longueur image ?",
        answerTemplate: "{{k*l}} cm",
        correctionTemplate: "Une homothétie multiplie les longueurs par son rapport : {{k}} × {{l}} = {{k*l}} cm.",
        variablesSchema: { k: { type: "int", min: 2, max: 5 }, l: { type: "int", min: 2, max: 12 } },
        tags: ["homothetie", "longueur"]
      },
      {
        title: "Rapport d'homoth?tie",
        subdomain: chapter.title,
        statementTemplate: "Une longueur de {{l}} cm devient {{k*l}} cm par homoth?tie. Quel est le rapport ?",
        answerTemplate: "{{k}}",
        correctionTemplate: "Le rapport vaut longueur image ÷ longueur initiale = {{k*l}} ÷ {{l}} = {{k}}.",
        variablesSchema: { k: { type: "int", min: 2, max: 5 }, l: { type: "int", min: 2, max: 12 } },
        tags: ["homothetie", "rapport"]
      },
      {
        title: "Aire par homoth?tie",
        subdomain: chapter.title,
        statementTemplate: "Une homoth?tie de rapport {{k}} multiplie les aires par quel nombre ?",
        answerTemplate: "{{k*k}}",
        correctionTemplate: "Les aires sont multipliées par le carré du rapport : ${{k}}^2={{k*k}}$.",
        variablesSchema: { k: { type: "int", min: 2, max: 5 } },
        tags: ["homothetie", "aire"]
      }
    ];
  }

  if (normalized.includes("reperage")) {
    return [
      {
        title: "Lire une altitude",
        subdomain: chapter.title,
        statementTemplate: "Dans l'espace, le point A a pour coordonn?es $({{x}};{{y}};{{z}})$. Quelle est son altitude ?",
        answerTemplate: "{{z}}",
        correctionTemplate: "Dans $({{x}};{{y}};{{z}})$, la troisi?me coordonn?e donne l'altitude.",
        variablesSchema: { x: { type: "int", min: -4, max: 8 }, y: { type: "int", min: -4, max: 8 }, z: { type: "int", min: 1, max: 9 } },
        tags: ["reperage", "espace"]
      },
      {
        title: "D?placement dans l'espace",
        subdomain: chapter.title,
        statementTemplate: "A(${{x}};{{y}};{{z}}$) est d?plac? du vecteur $({{u}};{{v}};{{w}})$. Donner les coordonn?es de A'.",
        answerTemplate: "A'({{x+u}};{{y+v}};{{z+w}})",
        correctionTemplate: "On ajoute coordonn?e par coordonn?e : A'(${{x+u}};{{y+v}};{{z+w}}$).",
        variablesSchema: { x: { type: "int", min: -4, max: 8 }, y: { type: "int", min: -4, max: 8 }, z: { type: "int", min: 1, max: 9 }, u: { type: "int", min: -3, max: 5 }, v: { type: "int", min: -3, max: 5 }, w: { type: "int", min: -3, max: 5 } },
        tags: ["reperage", "espace"]
      },
      {
        title: "Abscisse en 3D",
        subdomain: chapter.title,
        statementTemplate: "Dans l'espace, le point B a pour coordonn?es $({{x}};{{y}};{{z}})$. Quelle est son abscisse ?",
        answerTemplate: "{{x}}",
        correctionTemplate: "Dans $({{x}};{{y}};{{z}})$, la premi?re coordonn?e est l'abscisse.",
        variablesSchema: { x: { type: "int", min: -4, max: 8 }, y: { type: "int", min: -4, max: 8 }, z: { type: "int", min: 1, max: 9 } },
        tags: ["reperage", "espace"]
      }
    ];
  }

  return [
    {
      title: "P?rim?tre d'un rectangle",
      subdomain: chapter.title,
      statementTemplate: "Un rectangle mesure {{l}} cm sur {{w}} cm. Calculer son p?rim?tre.",
      answerTemplate: "{{2*(l+w)}} cm",
      correctionTemplate: "P = 2 × ({{l}} + {{w}}) = {{2*(l+w)}} cm.",
      variablesSchema: { l: { type: "int", min: 4, max: 20 }, w: { type: "int", min: 2, max: 14 } },
      figureTemplate: { kind: "rectangle", widthLabel: "{{l}} cm", heightLabel: "{{w}} cm" },
      tags: ["geometrie", "perimetre"]
    },
    {
      title: "Aire d'un rectangle",
      subdomain: chapter.title,
      statementTemplate: "Un rectangle mesure {{l}} cm sur {{w}} cm. Calculer son aire.",
      answerTemplate: "{{l*w}} cm²",
      correctionTemplate: "$\\mathcal{A}=\\text{longueur}\\times\\text{largeur}={{l}}\\times{{w}}={{l*w}}$ cm².",
      variablesSchema: { l: { type: "int", min: 4, max: 18 }, w: { type: "int", min: 2, max: 12 } },
      figureTemplate: { kind: "rectangle", widthLabel: "{{l}} cm", heightLabel: "{{w}} cm" },
      tags: ["geometrie", "aire"]
    },
    {
      title: "Aire d'un triangle",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Un triangle a une base de ${{b}}$ cm et une hauteur de ${{h}}$ cm. Calculer son aire.",
      answerTemplate: "{{b*h/2}} cm?",
      correctionTemplate: "$\\mathcal{A}=\\dfrac{\\text{base}\\times\\text{hauteur}}{2}=\\dfrac{ {{b}}\\times{{h}} }{2}={{b*h/2}}$ cm?.",
      variablesSchema: { b: { type: "choice", values: [8, 10, 12, 14, 16, 18] }, h: { type: "choice", values: [5, 6, 7, 8, 9, 10, 12] } },
      figureTemplate: { kind: "triangle", labelA: "base {{b}} cm", labelB: "h = {{h}} cm", labelC: "\\mathcal{A} = ?" },
      tags: ["geometrie", "aire", "triangle"]
    },
    {
      title: "P?rim?tre d'un cercle",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Un cercle a pour rayon ${{r}}$ cm. Donner son p?rim?tre en fonction de $\\pi$.",
      answerTemplate: "{{2*r}}Ï€ cm",
      correctionTemplate: "$P = 2\\pi r = 2 \\times \\pi \\times {{r}} = {{2*r}}\\pi$ cm.",
      variablesSchema: { r: { type: "int", min: 3, max: 15 } },
      figureTemplate: { kind: "circle", radiusLabel: "{{r}} cm" },
      tags: ["geometrie", "cercle", "perimetre"]
    },
    {
      title: "Angle d'un triangle",
      subdomain: chapter.title,
      statementTemplate: "Dans un triangle, deux angles mesurent {{a}}° et {{b}}°. Calculer le troisième.",
      answerTemplate: "{{180-a-b}}°",
      correctionTemplate: "$180°-{{a}}°-{{b}}°={{180-a-b}}°$.",
      variablesSchema: { a: { type: "int", min: 35, max: 80 }, b: { type: "int", min: 35, max: 70 } },
      figureTemplate: { kind: "triangle", labelA: "{{a}}°", labelB: "{{b}}°", labelC: "?" },
      tags: ["angles"]
    },
    {
      title: "Angles et parallèles",
      subdomain: chapter.title,
      statementTemplate: "Deux droites sont parallèles. Un angle correspondant mesure {{a}}°. Quelle est la mesure de l'autre angle correspondant ?",
      answerTemplate: "{{a}}°",
      correctionTemplate: "Avec deux droites parallèles coupées par une sécante, deux angles correspondants ont la même mesure : {{a}}°.",
      variablesSchema: { a: { type: "int", min: 35, max: 140 } },
      figureTemplate: { kind: "parallel-lines", angleLabel: "{{a}}°", anglePair: "corresponding" },
      tags: ["angles", "paralleles"]
    }
  ];
}

function measurementTemplates(chapter: ChapterInfo): TemplateSeed[] {
  const solidFigure: FigureTemplate = { kind: "solid", solid: "pave", labels: ["{{a}} cm", "{{b}} cm", "{{c}} cm"] };
  return [
    {
      title: "Volume d'un pavé droit",
      subdomain: chapter.title,
      statementTemplate: "Calculer le volume d'un pavé droit de dimensions {{a}} cm, {{b}} cm et {{c}} cm.",
      answerTemplate: "{{a*b*c}} cm³",
      correctionTemplate: "$V=longueur\\times largeur\\times hauteur={{a}}\\times{{b}}\\times{{c}}={{a*b*c}}$ cm³.",
      variablesSchema: { a: { type: "int", min: 2, max: 10 }, b: { type: "int", min: 2, max: 10 }, c: { type: "int", min: 2, max: 10 } },
      figureTemplate: solidFigure,
      tags: ["volume"]
    },
    {
      title: "Conversion de longueur",
      subdomain: chapter.title,
      statementTemplate: "Convertir {{formatDecimalFrench(a)}} m en centim?tres.",
      answerTemplate: "{{formatDecimalFrench(a*100)}} cm",
      correctionTemplate: "$1$ m = $100$ cm, donc ${{formatDecimalFrench(a)}}\\times100={{formatDecimalFrench(a*100)}}$ cm.",
      variablesSchema: { a: { type: "decimal", min: 1.2, max: 12.8, decimals: 1 } },
      tags: ["conversion"]
    },
    {
      title: "Vitesse moyenne",
      subdomain: chapter.title,
      statementTemplate: "Parcourir {{d}} km en {{t}} h donne quelle vitesse moyenne ?",
      answerTemplate: "{{d/t}} km/h",
      correctionTemplate: "$v=d\\div t={{d}}\\div{{t}}={{d/t}}$ km/h.",
      variablesSchema: { d: { type: "choice", values: [60, 80, 90, 120, 150, 180] }, t: { type: "choice", values: [2, 3, 4, 5] } },
      tags: ["vitesse"]
    },
    {
      title: "Aire d'un disque",
      subdomain: chapter.title,
      statementTemplate: "Un disque a un rayon de {{r}} cm. Donner son aire en fonction de π.",
      answerTemplate: "{{r*r}}π cm²",
      correctionTemplate: "$\\mathcal{A}=πr^2=π\\times{{r}}^2={{r*r}}π$ cm².",
      variablesSchema: { r: { type: "int", min: 2, max: 12 } },
      figureTemplate: { kind: "circle", radiusLabel: "{{r}} cm" },
      tags: ["aire", "cercle"]
    }
  ];
}

function literalTemplates(chapter: ChapterInfo): TemplateSeed[] {
  const equations = chapter.domain === "equations";
  if (equations) {
    return [
      {
        title: "?quation ax + b = c",
        subdomain: chapter.title,
        statementTemplate: "R?soudre ${{a}}x+{{b}}={{a*x+b}}$.",
        answerTemplate: "$x={{x}}$",
        correctionTemplate: "$ {{a}}x={{a*x+b}}-{{b}}={{a*x}}$, donc $x={{x}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 1, max: 20 }, x: { type: "int", min: 2, max: 12 } },
        tags: ["equations"]
      },
      {
        title: "?quation produit nul",
        subdomain: chapter.title,
        statementTemplate: "R?soudre $(x-{{a}})(x+{{b}})=0$.",
        answerTemplate: "$x={{a}}$ ou $x=-{{b}}$",
        correctionTemplate: "Un produit est nul si l'un des facteurs est nul : $x-{{a}}=0$ ou $x+{{b}}=0$.",
        variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 9 } },
        tags: ["equations"]
      },
      {
        title: "?quation avec r?duction pr?alable",
        subdomain: chapter.title,
        statementTemplate: "R?duire le membre de gauche puis r?soudre l'?quation : ${{a}}x{{b < 0 ? '' : '+'}}{{b}}+{{c}}x={{(a+c)*x+b}}$.",
        answerTemplate: "$x={{x}}$",
        correctionTemplate: "On r?duit : ${{a}}x+{{c}}x={{a+c}}x$. On obtient ${{a+c}}x{{b < 0 ? '' : '+'}}{{b}}={{(a+c)*x+b}}$, donc ${{a+c}}x={{(a+c)*x}}$ et $x={{x}}$.",
        variablesSchema: { a: { type: "int", min: -8, max: 8, exclude: [0] }, c: { type: "int", min: 2, max: 9 }, b: { type: "int", min: -15, max: 15 }, x: { type: "int", min: -8, max: 12, exclude: [0] } },
        tags: ["equations", "relatifs", "monomes-4-6"]
      },
      {
        title: "?quation avec parenth?ses et relatifs",
        subdomain: chapter.title,
        statementTemplate: "Résoudre mentalement ${{a}}(x{{b < 0 ? '' : '+'}}{{b}})={{a*(x+b)}}$.",
        answerTemplate: "$x={{x}}$",
        correctionTemplate: "On divise par ${{a}}$ : $x{{b < 0 ? '' : '+'}}{{b}}={{x+b}}$. Donc $x={{x+b}}{{b < 0 ? '+' : '-'}}{{Math.abs(b)}}={{x}}$.",
        variablesSchema: { a: { type: "int", min: -9, max: 9, exclude: [-1, 0, 1] }, b: { type: "int", min: -8, max: 8, exclude: [0] }, x: { type: "int", min: -8, max: 12, exclude: [0] } },
        tags: ["equations", "relatifs", "parentheses"]
      }
    ];
  }

  return [
    {
      title: "R?duire 5 mon?mes",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Dans l'expression suivante, regrouper les termes de m?me nature puis r?duire : ${{a}}x{{b < 0 ? '' : '+'}}{{b}}y{{c < 0 ? '' : '+'}}{{c}}x{{d < 0 ? '' : '+'}}{{d}}{{e < 0 ? '' : '+'}}{{e}}y$.",
      answerTemplate: "${{a+c}}x{{b+e < 0 ? '' : '+'}}{{b+e}}y{{d < 0 ? '' : '+'}}{{d}}$",
      correctionTemplate: "Termes en $x$ : ${{a}}x{{c < 0 ? '' : '+'}}{{c}}x={{a+c}}x$. Termes en $y$ : ${{b}}y{{e < 0 ? '' : '+'}}{{e}}y={{b+e}}y$. Constante : ${{d}}$.",
      variablesSchema: { a: { type: "int", min: -9, max: 9, exclude: [0] }, b: { type: "int", min: -9, max: 9, exclude: [0] }, c: { type: "int", min: -8, max: 8, exclude: [0] }, d: { type: "int", min: -12, max: 12 }, e: { type: "int", min: -8, max: 8, exclude: [0] } },
      tags: ["litteral", "relatifs", "monomes-4-6"]
    },
    {
      title: "R?duire 6 mon?mes",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "R?duire cette somme de six mon?mes en regroupant les termes en $x^2$, les termes en $x$ et les constantes : ${{a}}x^2{{b < 0 ? '' : '+'}}{{b}}x{{c < 0 ? '' : '+'}}{{c}}x^2{{d < 0 ? '' : '+'}}{{d}}{{e < 0 ? '' : '+'}}{{e}}x{{f < 0 ? '' : '+'}}{{f}}$.",
      answerTemplate: "${{a+c}}x^2{{b+e < 0 ? '' : '+'}}{{b+e}}x{{d+f < 0 ? '' : '+'}}{{d+f}}$",
      correctionTemplate: "On additionne les coefficients des mon?mes semblables : $x^2$ donne ${{a+c}}x^2$, $x$ donne ${{b+e}}x$, et les constantes donnent ${{d+f}}$.",
      variablesSchema: { a: { type: "int", min: -7, max: 7, exclude: [0] }, b: { type: "int", min: -9, max: 9, exclude: [0] }, c: { type: "int", min: -7, max: 7, exclude: [0] }, d: { type: "int", min: -12, max: 12 }, e: { type: "int", min: -9, max: 9, exclude: [0] }, f: { type: "int", min: -12, max: 12 } },
      tags: ["litteral", "relatifs", "monomes-4-6"]
    },
    {
      title: "Substituer dans une expression r?duite",
      subdomain: chapter.title,
      statementTemplate: "Apr?s r?duction, calculer la valeur de ${{a}}x{{b < 0 ? '' : '+'}}{{b}}$ pour $x={{x}}$.",
      answerTemplate: "{{a*x+b}}",
      correctionTemplate: "On remplace $x$ par ${{x}}$ : ${{a}}\\times ({{x}}){{b < 0 ? '' : '+'}}{{b}}={{a*x+b}}$.",
      variablesSchema: { a: { type: "int", min: -9, max: 9, exclude: [0] }, b: { type: "int", min: -15, max: 15 }, x: { type: "int", min: -6, max: 8, exclude: [0] } },
      tags: ["litteral", "relatifs", "substitution"]
    },
    {
      title: "D?velopper",
      subdomain: chapter.title,
      statementTemplate: "D?velopper ${{k}}(x+{{a}})$.",
      answerTemplate: "${{k}}x+{{k*a}}$",
      correctionTemplate: "${{k}}(x+{{a}})={{k}}x+{{k*a}}$.",
      variablesSchema: { k: { type: "int", min: 2, max: 9 }, a: { type: "int", min: 2, max: 9 } },
      tags: ["litteral"]
    },
    {
      title: "Identit? remarquable",
      subdomain: chapter.title,
      statementTemplate: "D?velopper $(x+{{a}})^2$.",
      answerTemplate: "$x^2+{{2*a}}x+{{a*a}}$",
      correctionTemplate: "$(x+{{a}})^2=x^2+2\\times {{a}}x+{{a}}^2=x^2+{{2*a}}x+{{a*a}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 } },
      tags: ["litteral"]
    }
  ];
}

function powersTemplates(chapter: ChapterInfo): TemplateSeed[] {
  return [
    {
      title: "Puissance de 10",
      subdomain: chapter.title,
      statementTemplate: "Calculer $10^{{n}}$.",
      answerTemplate: "{{10**n}}",
      correctionTemplate: "$10^{{n}}$ est $1$ suivi de ${{n}}$ z?ros : ${{10**n}}$.",
      variablesSchema: { n: { type: "int", min: 2, max: 6 } },
      tags: ["puissances"]
    },
    {
      title: "Produit de puissances",
      subdomain: chapter.title,
      statementTemplate: "?crire sous la forme $10^n$ : $10^{{a}}\\times 10^{{b}}$.",
      answerTemplate: "$10^{{a+b}}$",
      correctionTemplate: "M?me base : on additionne les exposants, donc $10^{{a}}\\times 10^{{b}}=10^{{a+b}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 5 }, b: { type: "int", min: 1, max: 5 } },
      tags: ["puissances"]
    },
    {
      title: "Notation scientifique",
      subdomain: chapter.title,
      statementTemplate: "?crire ${{a*(10**n)}}$ sous la forme $a\\times 10^n$.",
      answerTemplate: "${{a}}\\times 10^{{n}}$",
      correctionTemplate: "${{a*(10**n)}}={{a}}\\times 10^{{n}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, n: { type: "int", min: 3, max: 6 } },
      tags: ["puissances"]
    },
    {
      title: "Carré",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{a}}^2$.",
      answerTemplate: "{{a*a}}",
      correctionTemplate: "${{a}}^2={{a}}\\times {{a}}={{a*a}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 20 } },
      tags: ["puissances"]
    }
  ];
}

function statsTemplates(chapter: ChapterInfo): TemplateSeed[] {
  return [
    {
      title: "Moyenne",
      subdomain: chapter.title,
      statementTemplate: "Calculer la moyenne de {{a}}, {{b}} et {{c}}. Donner le résultat au centième près si nécessaire.",
      answerTemplate: "{{formatDecimalFrench(roundTo((a+b+c)/3,2))}}",
      correctionTemplate: "Moyenne = ({{a}} + {{b}} + {{c}}) ÷ 3 = {{a+b+c}} ÷ 3 {{roundingRelation((a+b+c)/3,2)}} {{formatDecimalFrench(roundTo((a+b+c)/3,2))}}.",
      variablesSchema: { a: { type: "int", min: 4, max: 18 }, b: { type: "int", min: 4, max: 18 }, c: { type: "int", min: 4, max: 18 } },
      tags: ["statistiques"]
    },
    {
      title: "M?diane",
      subdomain: chapter.title,
      statementTemplate: "Donner la m?diane de la s?rie ordonn?e : {{a}}, {{b}}, {{c}}, {{d}}, {{e}}.",
      answerTemplate: "{{c}}",
      correctionTemplate: "Il y a 5 valeurs ordonn?es. La m?diane est la 3e valeur : {{c}}.",
      variablesSchema: { a: { type: "choice", values: [2] }, b: { type: "choice", values: [5] }, c: { type: "choice", values: [8, 9, 10, 11] }, d: { type: "choice", values: [14] }, e: { type: "choice", values: [18] } },
      tags: ["statistiques"]
    },
    {
      title: "?tendue",
      subdomain: chapter.title,
      statementTemplate: "Calculer l'?tendue de la s?rie : {{min}}, {{a}}, {{b}}, {{max}}.",
      answerTemplate: "{{max-min}}",
      correctionTemplate: "?tendue = valeur maximale - valeur minimale = {{max}} - {{min}} = {{max-min}}.",
      variablesSchema: { min: { type: "int", min: 1, max: 8 }, a: { type: "int", min: 8, max: 14 }, b: { type: "int", min: 12, max: 18 }, max: { type: "int", min: 20, max: 30 } },
      tags: ["statistiques"]
    },
    {
      title: "Fr?quence",
      subdomain: chapter.title,
      statementTemplate: "Dans un groupe de {{total}}, {{success}} r?ussissent. Donner la fr?quence.",
      answerTemplate: "{{formatFraction(success,total)}}",
      correctionTemplate: "Fr?quence = {{success}}/{{total}} = {{formatFraction(success,total)}}.",
      variablesSchema: { total: { type: "choice", values: [20, 24, 25, 30] }, success: { type: "int", min: 4, max: 18 } },
      tags: ["statistiques"]
    }
  ];
}

function probabilityTemplates(chapter: ChapterInfo): TemplateSeed[] {
  return [
    {
      title: "Probabilité simple",
      subdomain: chapter.title,
      statementTemplate: "Un sac contient {{r}} boules rouges et {{b}} bleues. Quelle est la probabilité de tirer une rouge ?",
      answerTemplate: "{{formatFraction(r,r+b)}}",
      correctionTemplate: "Il y a {{r+b}} boules dont {{r}} rouges : la probabilité vaut {{formatFraction(r,r+b)}}.",
      variablesSchema: { r: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 2, max: 8 } },
      tags: ["probabilites"]
    },
    {
      title: "Dé équilibré",
      subdomain: chapter.title,
      statementTemplate: "On lance un dé équilibré. Quelle est la probabilité d'obtenir un nombre pair ?",
      answerTemplate: "1/2",
      correctionTemplate: "Les issues paires sont 2, 4, 6 : 3 issues sur 6, soit 3/6 = 1/2.",
      variablesSchema: {},
      tags: ["probabilites"]
    },
    {
      title: "Probabilité contraire",
      subdomain: chapter.title,
      statementTemplate: "Un événement a une probabilité de {{a}}/{{den}}. Quelle est la probabilité contraire ?",
      answerTemplate: "{{formatFraction(den-a,den)}}",
      correctionTemplate: "La probabilité contraire vaut $1-{{a}}/{{den}}={{formatFraction(den-a,den)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 5 }, den: { type: "choice", values: [6, 8, 10, 12] } },
      tags: ["probabilites"]
    },
    {
      title: "Issues favorables",
      subdomain: chapter.title,
      statementTemplate: "Il y a {{success}} issues favorables sur {{total}} issues. Donne la probabilité.",
      answerTemplate: "{{formatFraction(success,total)}}",
      correctionTemplate: "Probabilité = issues favorables / issues possibles = {{success}}/{{total}} = {{formatFraction(success,total)}}.",
      variablesSchema: { success: { type: "int", min: 1, max: 6 }, total: { type: "choice", values: [8, 10, 12, 20] } },
      tags: ["probabilites"]
    }
  ];
}

function functionTemplates(chapter: ChapterInfo): TemplateSeed[] {
  return [
    {
      title: "Image par une fonction lin?aire",
      subdomain: chapter.title,
      statementTemplate: "Soit $f(x)={{a}}x$. Calculer $f({{x}})$.",
      answerTemplate: "{{a*x}}",
      correctionTemplate: "$f({{x}})={{a}}\\times {{x}}={{a*x}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, x: { type: "int", min: 2, max: 12 } },
      tags: ["fonctions"]
    },
    {
      title: "Image par une fonction affine",
      subdomain: chapter.title,
      statementTemplate: "Soit $f(x)={{a}}x+{{b}}$. Calculer $f({{x}})$.",
      answerTemplate: "{{a*x+b}}",
      correctionTemplate: "$f({{x}})={{a}}\\times {{x}}+{{b}}={{a*x+b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 1, max: 15 }, x: { type: "int", min: 2, max: 12 } },
      tags: ["fonctions"]
    },
    {
      title: "Ant?c?dent simple",
      subdomain: chapter.title,
      statementTemplate: "Pour $f(x)={{a}}x$, quel ant?c?dent a pour image ${{a*x}}$ ?",
      answerTemplate: "{{x}}",
      correctionTemplate: "On cherche $x$ tel que ${{a}}x={{a*x}}$. Donc $x={{a*x}}\\div {{a}}={{x}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, x: { type: "int", min: 2, max: 12 } },
      tags: ["fonctions"]
    },
    {
      title: "Coefficient directeur",
      subdomain: chapter.title,
      statementTemplate: "Une fonction lin?aire v?rifie f({{x}}) = {{a*x}}. Quel est son coefficient ?",
      answerTemplate: "{{a}}",
      correctionTemplate: "Pour une fonction linéaire $f(x)=ax$, $a=f({{x}})\\div{{x}}={{a*x}}\\div{{x}}={{a}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 8 }, x: { type: "int", min: 2, max: 10 } },
      tags: ["fonctions"]
    }
  ];
}

function trigonometryTemplates(chapter: ChapterInfo): TemplateSeed[] {
  return [
    {
      title: "Rapport cosinus",
      subdomain: chapter.title,
      statementTemplate: "Avec la figure, écris le rapport du cosinus de l'angle marqué.",
      answerTemplate: "$\\cos(\\alpha)=\\dfrac{\\text{adjacent}}{\\text{hypoténuse}}$",
      correctionTemplate: "Le cosinus utilise le côté adjacent et l'hypoténuse : $\\cos(\\alpha)=\\dfrac{\\text{adjacent}}{\\text{hypoténuse}}$.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "cosinus"]
    },
    {
      title: "Rapport sinus",
      subdomain: chapter.title,
      statementTemplate: "Avec la figure, écris le rapport du sinus de l'angle marqué.",
      answerTemplate: "$\\sin(\\alpha)=\\dfrac{\\text{opposé}}{\\text{hypoténuse}}$",
      correctionTemplate: "Le sinus utilise le côté opposé et l'hypoténuse : $\\sin(\\alpha)=\\dfrac{\\text{opposé}}{\\text{hypoténuse}}$.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "sinus"]
    },
    {
      title: "Rapport tangente",
      subdomain: chapter.title,
      statementTemplate: "Avec la figure, écris le rapport de la tangente de l'angle marqué.",
      answerTemplate: "$\\tan(\\alpha)=\\dfrac{\\text{opposé}}{\\text{adjacent}}$",
      correctionTemplate: "La tangente utilise le côté opposé et le côté adjacent : $\\tan(\\alpha)=\\dfrac{\\text{opposé}}{\\text{adjacent}}$.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "tangente"]
    },
    {
      title: "Choisir cosinus",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "La figure montre le côté adjacent et l'hypoténuse. Quel rapport faut-il écrire ?",
      answerTemplate: "cosinus",
      correctionTemplate: "Le rapport qui relie adjacent et hypoténuse est le cosinus.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "cosinus", "methode"]
    },
    {
      title: "Choisir sinus",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "La figure montre le côté opposé et l'hypoténuse. Quel rapport faut-il écrire ?",
      answerTemplate: "sinus",
      correctionTemplate: "Le rapport qui relie opposé et hypoténuse est le sinus.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "sinus", "methode"]
    },
    {
      title: "Choisir entre cos, sin et tan",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "La figure montre le côté opposé et le côté adjacent. Quel rapport faut-il écrire ?",
      answerTemplate: "Tangente",
      correctionTemplate: "La tangente utilise le rapport $\\dfrac{\\text{opposé}}{\\text{adjacent}}$.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "" },
      tags: ["trigonometrie", "rapport", "tangente", "formule"]
    },
    {
      title: "Compléter un rapport",
      subdomain: chapter.title,
      statementTemplate: "Écris le rapport : $\\sin(\\alpha)=\\dfrac{\\ldots}{\\ldots}$.",
      answerTemplate: "$\\sin(\\alpha)=\\dfrac{\\text{opposé}}{\\text{hypoténuse}}$",
      correctionTemplate: "Pour le sinus, on place le côté opposé au numérateur et l'hypoténuse au dénominateur.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "sinus"]
    }
  ];
}

function limitPythagoreSquareOperands(chapter: ChapterInfo, template: TemplateSeed): TemplateSeed {
  if (chapter.domain !== "pythagore") return template;

  const serialized = JSON.stringify(template);
  const coefficients = [...serialized.matchAll(/\{\{(\d+)\*k\}\}/g)].map((match) => Number(match[1]));
  const largestCoefficient = Math.max(...coefficients, 1);
  const variablesSchema = Object.fromEntries(
    Object.entries(template.variablesSchema).map(([name, definition]) => {
      if (definition.type === "int") {
        const maximum = name === "k" ? Math.floor(15 / largestCoefficient) : 15;
        return [name, { ...definition, max: Math.max(definition.min, Math.min(definition.max, maximum)) }];
      }
      if (definition.type === "decimal") {
        return [name, { ...definition, max: Math.min(definition.max, 15) }];
      }
      const limitedValues = definition.values.filter((value) => typeof value !== "number" || Math.abs(value) <= 15);
      return [name, { ...definition, values: limitedValues.length > 0 ? limitedValues : definition.values }];
    })
  );

  return { ...template, variablesSchema };
}

function scratchTemplates(chapter: ChapterInfo): TemplateSeed[] {
  const seed = (template: Omit<TemplateSeed, "subdomain">): TemplateSeed => ({ ...template, subdomain: chapter.title });
  const common = [
    seed({
      title: "Lire une boucle Scratch",
      statementTemplate: "Quelle valeur le programme affiche-t-il ?",
      answerTemplate: "{{start+repeat*step}}",
      correctionTemplate: "La variable augmente de {{step}} à chacun des {{repeat}} tours : ${{start}}+{{repeat}}\\times{{step}}={{start+repeat*step}}$.",
      variablesSchema: { start: { type: "int", min: 0, max: 12 }, repeat: { type: "int", min: 2, max: 8 }, step: { type: "int", min: 2, max: 9 } },
      figureTemplate: { kind: "scratch", blocks: ["quand drapeau vert cliqué", "mettre score à {{start}}", "répéter {{repeat}} fois", "ajouter {{step}} à score", "dire score"] },
      tags: ["scratch", "boucle", "variable"]
    }),
    seed({
      title: "Déplacement du lutin",
      statementTemplate: "De combien de pas le lutin avance-t-il au total ?",
      answerTemplate: "{{repeat*step}} pas",
      correctionTemplate: "Il effectue {{repeat}} déplacements de {{step}} pas, soit ${{repeat}}\\times{{step}}={{repeat*step}}$ pas.",
      variablesSchema: { repeat: { type: "int", min: 2, max: 10 }, step: { type: "int", min: 10, max: 50 } },
      figureTemplate: { kind: "scratch", blocks: ["répéter {{repeat}} fois", "avancer de {{step}} pas"] },
      tags: ["scratch", "mouvement", "boucle"]
    })
  ];

  if (chapter.level === "6e") return [...common,
    seed({ title: "Tracer un carré", statementTemplate: "Quel nombre remplace le point d'interrogation ?", answerTemplate: "$90^\\circ$", correctionTemplate: "Après chaque côté du carré, le lutin tourne de $90^\\circ$.", variablesSchema: { side: { type: "int", min: 20, max: 80 } }, figureTemplate: { kind: "scratch", blocks: ["quand drapeau vert cliqué", "répéter 4 fois", "avancer de {{side}} pas", "tourner de ? degrés"] }, tags: ["scratch", "géométrie", "carré"] }),
    seed({ title: "Compteur simple", statementTemplate: "Quelle valeur finale prend compteur ?", answerTemplate: "{{start+gain}}", correctionTemplate: "$ {{start}}+{{gain}}={{start+gain}}$.", variablesSchema: { start: { type: "int", min: 0, max: 20 }, gain: { type: "int", min: 2, max: 15 } }, figureTemplate: { kind: "scratch", blocks: ["mettre compteur à {{start}}", "ajouter {{gain}} à compteur", "dire compteur"] }, tags: ["scratch", "variable"] }),
    seed({ title: "Coordonnées du lutin", statementTemplate: "Quelles sont les coordonnées finales du lutin ?", answerTemplate: "({{abscissa+dx}} ; {{ordinate}})", correctionTemplate: "Seule l'abscisse change : ${{abscissa}}+{{dx}}={{abscissa+dx}}$.", variablesSchema: { abscissa: { type: "int", min: 0, max: 8 }, ordinate: { type: "int", min: 0, max: 8 }, dx: { type: "int", min: 2, max: 10 } }, figureTemplate: { kind: "scratch", blocks: ["aller à x: {{abscissa}} y: {{ordinate}}", "ajouter {{dx}} à x"] }, tags: ["scratch", "coordonnées"] }),
    seed({ title: "Périmètre programmé", statementTemplate: "Quelle longueur totale le lutin trace-t-il ?", answerTemplate: "{{4*side}} pas", correctionTemplate: "Le lutin trace quatre côtés de {{side}} pas : $4\\times{{side}}={{4*side}}$.", variablesSchema: { side: { type: "int", min: 15, max: 60 } }, figureTemplate: { kind: "scratch", blocks: ["répéter 4 fois", "avancer de {{side}} pas", "tourner de 90 degrés"] }, tags: ["scratch", "périmètre"] })
  ];

  if (chapter.level === "5e") return [...common,
    seed({ title: "Programme de calcul Scratch", statementTemplate: "Quelle valeur est affichée ?", answerTemplate: "{{2*number+add}}", correctionTemplate: "$2\\times{{number}}+{{add}}={{2*number+add}}$.", variablesSchema: { number: { type: "int", min: 2, max: 15 }, add: { type: "int", min: 1, max: 12 } }, figureTemplate: { kind: "scratch", blocks: ["mettre résultat à 2 × {{number}}", "ajouter {{add}} à résultat", "dire résultat"] }, tags: ["scratch", "programme de calcul"] }),
    seed({ title: "Tracer un triangle équilatéral", statementTemplate: "Quel angle de rotation complète le programme ?", answerTemplate: "$120^\\circ$", correctionTemplate: "L'angle de rotation extérieur d'un triangle équilatéral est $120^\\circ$.", variablesSchema: { side: { type: "int", min: 30, max: 90 } }, figureTemplate: { kind: "scratch", blocks: ["répéter 3 fois", "avancer de {{side}} pas", "tourner de ? degrés"] }, tags: ["scratch", "géométrie"] }),
    seed({ title: "Test sur un score", statementTemplate: "Le score vaut ${{score}}$. Quel message est affiché ?", answerTemplate: "{{score>=limit ? 'gagné' : 'encore'}}", correctionTemplate: "Le test ${{score}}\\ge {{limit}}$ est {{score>=limit ? 'vrai' : 'faux'}} : le programme affiche {{score>=limit ? 'gagné' : 'encore'}}.", variablesSchema: { score: { type: "int", min: 5, max: 25 }, limit: { type: "choice", values: [10, 15, 20] } }, figureTemplate: { kind: "scratch", blocks: ["mettre score à {{score}}", "si score >= {{limit}} alors", "dire gagné", "sinon", "dire encore"] }, tags: ["scratch", "condition"] }),
    seed({ title: "Deux coordonnées modifiées", statementTemplate: "Donne les coordonnées finales.", answerTemplate: "({{x+dx}} ; {{y+dy}})", correctionTemplate: "On ajoute séparément {{dx}} à l'abscisse et {{dy}} à l'ordonnée.", variablesSchema: { x: { type: "int", min: -20, max: 20 }, y: { type: "int", min: -20, max: 20 }, dx: { type: "int", min: -10, max: 10 }, dy: { type: "int", min: -10, max: 10 } }, figureTemplate: { kind: "scratch", blocks: ["aller à x: {{x}} y: {{y}}", "ajouter {{dx}} à x", "ajouter {{dy}} à y"] }, tags: ["scratch", "coordonnées"] })
  ];

  if (chapter.level === "4e") return [...common,
    seed({ title: "Condition sur un nombre relatif", statementTemplate: "Le nombre vaut ${{number}}$. Quel message est affiché ?", answerTemplate: "{{number>0 ? 'positif' : 'non positif'}}", correctionTemplate: "Le test ${{number}}>0$ est {{number>0 ? 'vrai' : 'faux'}} : le programme affiche {{number>0 ? 'positif' : 'non positif'}}.", variablesSchema: { number: { type: "int", min: -15, max: 15, exclude: [0] } }, figureTemplate: { kind: "scratch", blocks: ["mettre nombre à {{number}}", "si nombre > 0 alors", "dire positif", "sinon", "dire non positif"] }, tags: ["scratch", "condition", "relatifs"] }),
    seed({ title: "Boucles imbriquées", statementTemplate: "Combien de déplacements sont exécutés ?", answerTemplate: "{{outer*inner}}", correctionTemplate: "$ {{outer}}\\times{{inner}}={{outer*inner}}$ déplacements.", variablesSchema: { outer: { type: "int", min: 2, max: 6 }, inner: { type: "int", min: 2, max: 6 } }, figureTemplate: { kind: "scratch", blocks: ["répéter {{outer}} fois", "répéter {{inner}} fois", "avancer de 10 pas"] }, tags: ["scratch", "boucles imbriquées"] }),
    seed({ title: "Programme affine", statementTemplate: "Quelle valeur est affichée ?", answerTemplate: "{{a*x+b}}", correctionTemplate: "$ {{a}}\\times{{x}}+{{b}}={{a*x+b}}$.", variablesSchema: { x: { type: "int", min: -8, max: 12 }, a: { type: "int", min: 2, max: 7 }, b: { type: "int", min: -9, max: 9 } }, figureTemplate: { kind: "scratch", blocks: ["mettre résultat à {{a}} × {{x}}", "ajouter {{b}} à résultat", "dire résultat"] }, tags: ["scratch", "calcul littéral"] }),
    seed({ title: "Polygone régulier", statementTemplate: "Combien de côtés la figure tracée possède-t-elle ?", answerTemplate: "{{sides}}", correctionTemplate: "La boucle trace exactement un côté à chacun de ses {{sides}} tours.", variablesSchema: { sides: { type: "int", min: 3, max: 8 }, side: { type: "int", min: 20, max: 60 } }, figureTemplate: { kind: "scratch", blocks: ["répéter {{sides}} fois", "avancer de {{side}} pas", "tourner de {{360/sides}} degrés"] }, tags: ["scratch", "géométrie"] })
  ];

  return [...common,
    seed({ title: "Programme de calcul littéral", statementTemplate: "Quelle expression le programme calcule-t-il pour un nombre $x$ ?", answerTemplate: "$ {{a}}x+{{b}}$", correctionTemplate: "La multiplication donne ${{a}}x$, puis on ajoute {{b}}.", variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: -12, max: 12 } }, figureTemplate: { kind: "scratch", blocks: ["demander un nombre", "mettre résultat à {{a}} × réponse", "ajouter {{b}} à résultat", "dire résultat"] }, tags: ["scratch", "expression"] }),
    seed({ title: "Tester une inégalité", statementTemplate: "Quel message est affiché lorsque $n={{n}}$ ?", answerTemplate: "{{n>=limit ? 'validé' : 'refusé'}}", correctionTemplate: "$ {{n}} {{n>=limit ? '≥' : '<'}} {{limit}}$.", variablesSchema: { n: { type: "int", min: -10, max: 30 }, limit: { type: "int", min: 0, max: 20 } }, figureTemplate: { kind: "scratch", blocks: ["si n >= {{limit}} alors", "dire validé", "sinon", "dire refusé"] }, tags: ["scratch", "inégalité"] }),
    seed({ title: "Simulation répétée", statementTemplate: "Combien d'essais sont réalisés ?", answerTemplate: "{{repeat}}", correctionTemplate: "Le contenu de la boucle est exécuté {{repeat}} fois.", variablesSchema: { repeat: { type: "int", min: 20, max: 100 } }, figureTemplate: { kind: "scratch", blocks: ["mettre essais à 0", "répéter {{repeat}} fois", "ajouter 1 à essais", "dire essais"] }, tags: ["scratch", "simulation"] }),
    seed({ title: "Boucle et condition", statementTemplate: "Quelle est la valeur finale de score ?", answerTemplate: "{{start+repeat*gain}}", correctionTemplate: "La condition est vraie à chaque tour : ${{start}}+{{repeat}}\\times{{gain}}={{start+repeat*gain}}$.", variablesSchema: { start: { type: "int", min: 0, max: 10 }, repeat: { type: "int", min: 2, max: 6 }, gain: { type: "int", min: 2, max: 8 } }, figureTemplate: { kind: "scratch", blocks: ["mettre score à {{start}}", "répéter {{repeat}} fois", "si score >= 0 alors", "ajouter {{gain}} à score", "dire score"] }, tags: ["scratch", "condition", "boucle"] })
  ];
}

function mentalFlashTemplates(chapter: ChapterInfo): TemplateSeed[] {
  if (chapter.domain === "fractions") {
    return [
      {
        title: "Comparer deux fractions",
        subdomain: chapter.title,
        statementTemplate: "Comparer : $\\dfrac{ {{a}} }{ {{den}} }$ et $\\dfrac{ {{b}} }{ {{den}} }$.",
        answerTemplate: "{{a===b ? '=' : a>b ? '>' : '<'}}",
        correctionTemplate: "Les dénominateurs sont égaux. On compare les numérateurs : ${{a}} {{a===b ? '=' : a>b ? '>' : '<'}} {{b}}$.",
        variablesSchema: { a: { type: "int", min: 1, max: 9 }, b: { type: "int", min: 1, max: 9 }, den: { type: "int", min: 4, max: 12 } },
        tags: ["flash", "fractions", "comparaison"]
      },
      {
        title: "Fraction d?cimale",
        subdomain: chapter.title,
        statementTemplate: "?crire $\\dfrac{ {{a}} }{100}$ sous forme d?cimale.",
        answerTemplate: "{{formatDecimalFrench(a/100)}}",
        correctionTemplate: "$\\dfrac{ {{a}} }{100} = {{formatDecimalFrench(a/100)}}$.",
        variablesSchema: { a: { type: "int", min: 5, max: 95 } },
        tags: ["flash", "fractions", "decimaux"]
      }
    ];
  }

  if (chapter.domain === "decimaux") {
    return [
      {
        title: "Multiplier par 0,1",
        subdomain: chapter.title,
        statementTemplate: "Calculer ${{formatDecimalFrench(a)}} \\times 0{,}1$.",
        answerTemplate: "{{formatDecimalFrench(a*0.1)}}",
        correctionTemplate: "Multiplier par $0{,}1$ revient ? diviser par $10$ : ${{formatDecimalFrench(a)}} \\times 0{,}1 = {{formatDecimalFrench(a*0.1)}}$.",
        variablesSchema: { a: { type: "decimal", min: 2.5, max: 99.5, decimals: 1 } },
        tags: ["flash", "decimaux"]
      },
      {
        title: "Encadrement d?cimal",
        subdomain: chapter.title,
        statementTemplate: "Encadrer ${{formatDecimalFrench(a)}}$ entre deux entiers cons?cutifs.",
        answerTemplate: "{{Math.floor(a)}} < {{formatDecimalFrench(a)}} < {{Math.floor(a)+1}}",
        correctionTemplate: "$ {{Math.floor(a)}} < {{formatDecimalFrench(a)}} < {{Math.floor(a)+1}} $.",
        variablesSchema: { a: { type: "decimal", min: 3.2, max: 48.8, decimals: 1 } },
        tags: ["flash", "decimaux", "ordre"]
      }
    ];
  }

  if (chapter.domain === "proportionnalite") {
    return [
      {
        title: "Coefficient multiplicateur",
        subdomain: chapter.title,
        statementTemplate: "On passe de ${{a}}$ à ${{a*k}}$. Quel est le coefficient ?",
        answerTemplate: "{{k}}",
        correctionTemplate: "$ {{a*k}} \\div {{a}} = {{k}} $.",
        variablesSchema: { a: { type: "int", min: 2, max: 12 }, k: { type: "int", min: 2, max: 8 } },
        tags: ["flash", "proportionnalite"]
      },
      {
        title: "Pourcentage mental",
        subdomain: chapter.title,
        statementTemplate: "Calculer ${{pct}}\\,\\%$ de ${{base}}$.",
        answerTemplate: "{{base*pct/100}}",
        correctionTemplate: "$ {{pct}}\\,\\% = \\dfrac{ {{pct}} }{100}$, donc ${{base}} \\times \\dfrac{ {{pct}} }{100} = {{base*pct/100}}$.",
        variablesSchema: { pct: { type: "choice", values: [10, 20, 25, 50, 75] }, base: { type: "choice", values: [40, 60, 80, 100, 120, 200] } },
        tags: ["flash", "pourcentage"]
      }
    ];
  }

  if (chapter.domain === "calcul-litteral" || chapter.domain === "equations") {
    return [
      {
        title: "R?duire mentalement",
        subdomain: chapter.title,
        statementTemplate: "R?duire : ${{a}}x+{{b}}+{{c}}x$.",
        answerTemplate: "${{a+c}}x+{{b}}$",
        correctionTemplate: "On regroupe les termes en $x$ : ${{a}}x+{{c}}x={{a+c}}x$.",
        variablesSchema: { a: { type: "int", min: 1, max: 8 }, b: { type: "int", min: 1, max: 12 }, c: { type: "int", min: 1, max: 8 } },
        tags: ["flash", "litteral"]
      },
      {
        title: "?quation tr?s courte",
        subdomain: chapter.title,
        statementTemplate: "R?soudre : $x-{{a}}={{x-a}}$.",
        answerTemplate: "$x={{x}}$",
        correctionTemplate: "On ajoute ${{a}}$ aux deux membres : $x={{x-a}}+{{a}}={{x}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 20 }, x: { type: "int", min: 3, max: 30 } },
        tags: ["flash", "equations"]
      }
    ];
  }

  if (chapter.domain === "geometrie" || chapter.domain === "pythagore" || chapter.domain === "thales") {
    return [
      {
        title: "Somme des angles",
        subdomain: chapter.title,
        statementTemplate: "Dans un triangle, deux angles mesurent ${{a}}^\\circ$ et ${{b}}^\\circ$. Trouver le troisi?me.",
        answerTemplate: "{{180-a-b}}?",
        correctionTemplate: "$180^\\circ - {{a}}^\\circ - {{b}}^\\circ = {{180-a-b}}^\\circ$.",
        variablesSchema: { a: { type: "int", min: 35, max: 75 }, b: { type: "int", min: 35, max: 75 } },
        figureTemplate: { kind: "triangle", labelA: "{{a}}?", labelB: "{{b}}?", labelC: "?" },
        tags: ["flash", "angles"]
      },
      {
        title: "P?rim?tre mental",
        subdomain: chapter.title,
        statementTemplate: "Un carr? a pour c?t? ${{c}}$ cm. Calculer son p?rim?tre.",
        answerTemplate: "{{4*c}} cm",
        correctionTemplate: "$P = 4 \\times {{c}} = {{4*c}}$ cm.",
        variablesSchema: { c: { type: "int", min: 2, max: 18 } },
        figureTemplate: { kind: "rectangle", widthLabel: "{{c}} cm", heightLabel: "{{c}} cm" },
        tags: ["flash", "perimetre"]
      }
    ];
  }

  if (chapter.domain === "puissances") {
    return [
      {
        title: "Carr? mental",
        subdomain: chapter.title,
        statementTemplate: "Calculer ${{a}}^2$.",
        answerTemplate: "{{a*a}}",
        correctionTemplate: "$ {{a}}^2 = {{a}} \\times {{a}} = {{a*a}} $.",
        variablesSchema: { a: { type: "int", min: 2, max: 20 } },
        tags: ["flash", "puissances"]
      },
      {
        title: "Quotient de puissances de 10",
        subdomain: chapter.title,
        statementTemplate: "?crire sous la forme $10^n$ : $\\dfrac{10^{{a}}}{10^{{b}}}$.",
        answerTemplate: "10^{{a-b}}",
        correctionTemplate: "On soustrait les exposants : $10^{{a-b}}$.",
        variablesSchema: { a: { type: "int", min: 4, max: 8 }, b: { type: "int", min: 1, max: 3 } },
        tags: ["flash", "puissances"]
      }
    ];
  }

  if (chapter.domain === "statistiques" || chapter.domain === "probabilites") {
    return [
      {
        title: "Moyenne de deux valeurs",
        subdomain: chapter.title,
        statementTemplate: "Calculer la moyenne de ${{a}}$ et ${{b}}$.",
        answerTemplate: "{{formatDecimalFrench((a+b)/2)}}",
        correctionTemplate: "$\\dfrac{ {{a}}+{{b}} }{2} = {{formatDecimalFrench((a+b)/2)}}$.",
        variablesSchema: { a: { type: "int", min: 4, max: 24 }, b: { type: "int", min: 4, max: 24 } },
        tags: ["flash", "statistiques"]
      },
      {
        title: "Probabilité complémentaire",
        subdomain: chapter.title,
        statementTemplate: "Si $P(A)=\\dfrac{ {{a}} }{ {{den}} }$, calculer $P(\\overline A)$.",
        answerTemplate: "{{formatFraction(den-a,den)}}",
        correctionTemplate: "$P(\\overline A)=1-P(A)=\\dfrac{ {{den-a}} }{ {{den}} }={{formatFraction(den-a,den)}}$.",
        variablesSchema: { a: { type: "int", min: 1, max: 5 }, den: { type: "choice", values: [6, 8, 10, 12] } },
        tags: ["flash", "probabilites"]
      }
    ];
  }

  if (chapter.domain === "fonctions") {
    return [
      {
        title: "Image rapide",
        subdomain: chapter.title,
        statementTemplate: "Soit $f(x) = {{a}}x + {{b}}$. Calculer $f({{x}})$.",
        answerTemplate: "{{a*x+b}}",
        correctionTemplate: "$f({{x}}) = {{a}} \\times {{x}} + {{b}} = {{a*x+b}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 1, max: 12 }, x: { type: "int", min: 2, max: 10 } },
        tags: ["flash", "fonctions"]
      }
    ];
  }

  if (chapter.domain === "algorithmique") {
    return [
      {
        title: "Scratch addition r?p?t?e",
        subdomain: chapter.title,
        statementTemplate: "Quelle valeur finale affiche ce programme ?",
        answerTemplate: "{{start+repeat*step}}",
        correctionTemplate: "$ {{start}} + {{repeat}} \\times {{step}} = {{start+repeat*step}} $.",
        variablesSchema: { start: { type: "int", min: 1, max: 12 }, repeat: { type: "int", min: 2, max: 6 }, step: { type: "int", min: 2, max: 9 } },
        figureTemplate: { kind: "scratch", blocks: ["mettre n à {{start}}", "répéter {{repeat}} fois", "ajouter {{step}} à n", "dire n"] },
        tags: ["flash", "scratch"]
      }
    ];
  }

  return [
    {
      title: "Compl?ment mental",
      subdomain: chapter.title,
      statementTemplate: "Compl?ter : ${{a}} + \\square = {{target}}$.",
      answerTemplate: "{{target-a}}",
      correctionTemplate: "$ {{target}} - {{a}} = {{target-a}} $.",
      variablesSchema: { a: { type: "int", min: 12, max: 190 }, target: { type: "choice", values: [100, 150, 200, 250, 500] } },
      tags: ["flash", "calcul"]
    },
    {
      title: "Moiti?",
      subdomain: chapter.title,
      statementTemplate: "Donner la moiti? de ${{2*a}}$.",
      answerTemplate: "{{a}}",
      correctionTemplate: "$ {{2*a}} \\div 2 = {{a}} $.",
      variablesSchema: { a: { type: "int", min: 6, max: 90 } },
      tags: ["flash", "calcul"]
    }
  ];
}

function normalizedText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function templateSignal(template: TemplateSeed): string {
  return normalizedText([template.title, ...(template.tags ?? [])].join(" "));
}

function templateFullSignal(template: TemplateSeed): string {
  return normalizedText(
    [
      template.title,
      template.subdomain,
      template.statementTemplate,
      template.answerTemplate,
      template.correctionTemplate,
      ...(template.tags ?? [])
    ].join(" ")
  );
}

function templateHas(template: TemplateSeed, ...needles: string[]): boolean {
  const signal = templateSignal(template);
  const tokens = signal.split(/[^a-z0-9]+/).filter(Boolean);
  return needles.some((needle) => {
    const normalizedNeedle = normalizedText(needle);
    if (/^[a-z0-9]+$/.test(normalizedNeedle) && normalizedNeedle.length <= 4) {
      return tokens.includes(normalizedNeedle);
    }
    return signal.includes(normalizedNeedle);
  });
}

function templateFullHas(template: TemplateSeed, ...needles: string[]): boolean {
  const signal = templateFullSignal(template);
  const tokens = signal.split(/[^a-z0-9]+/).filter(Boolean);
  return needles.some((needle) => {
    const normalizedNeedle = normalizedText(needle);
    if (/^[a-z0-9]+$/.test(normalizedNeedle) && normalizedNeedle.length <= 4) {
      return tokens.includes(normalizedNeedle);
    }
    return signal.includes(normalizedNeedle);
  });
}

function keepChapterAlignedTemplate(template: TemplateSeed, chapter: ChapterInfo): boolean {
  const chapterTitle = normalizedText(chapter.title);

  if (chapter.level === "5e") {
    const allowedByRank: Partial<Record<number, string[]>> = {
      1: ["priorite", "parenthese", "calcul en deux etapes", "produit astucieux", "addition mentale", "multiplication mentale", "division exacte"],
      2: ["solide", "prisme", "cylindre", "patron", "perspective", "face", "arete", "sommet", "base"],
      3: ["proportion", "coefficient", "tableau", "prix", "echelle", "unite constante", "ratio"],
      4: ["multiple", "diviseur", "divisibilite", "division avec reste", "division euclidienne"],
      5: ["fraction", "numerateur", "denominateur"],
      6: ["angle d'un triangle", "somme des angles", "angle manquant", "mediatrice", "mediane", "droite remarquable"],
      7: ["comparer des relatifs", "comparaison", "oppose", "reperage", "droite graduee", "coordonnees relatives"],
      8: ["symetrie centrale", "milieu point-image", "distance centrale", "segment point-image", "image d'une droite", "conservation alignement", "longueur conservee", "centre"],
      9: ["reduire", "substit", "expression litterale", "valeur d'une expression"],
      10: ["angles paralleles", "angles et paralleles", "alterne", "correspondant", "droites paralleles"],
      11: ["addition de relatifs", "soustraction de relatifs", "somme de relatifs", "difference de relatifs"],
      12: ["parallelogramme", "cotes opposes", "angles consecutifs"],
      13: ["puissance", "base", "exposant", "carre", "cube", "ecriture", "signe"],
      14: ["developper", "distributivite", "factoriser facteur commun", "factoriser commun"],
      15: ["pourcentage", "graphique", "diagramme"],
      16: ["aire", "formule", "hauteur", "rayon", "unite"],
      17: ["equation", "solution", "resolution", "transposition", "modeliser"],
      18: ["moyenne", "frequence", "effectif"],
      19: ["volume pave", "volume d'un pave", "volume prisme", "volume cylindre", "conversion de volume"],
      20: ["probabilite", "de equilibre", "issue", "univers", "evenement", "tirage"],
      21: ["scratch", "programme", "boucle", "condition", "lutin", "compteur", "repeter"]
    };
    const allowed = allowedByRank[chapter.rank];
    if (allowed && !templateHas(template, ...allowed)) return false;
    if (chapter.rank === 5 && templateHas(template, "avec relatif")) return false;
    if (chapter.rank === 2 && templateHas(template, "volume")) return false;
    if (chapter.rank === 3 && templateHas(template, "produit en croix", "quatrieme proportionnelle", "pourcentage reversible")) return false;
    if (chapter.rank === 3 && templateHas(template, "pourcentage", "reduction")) return false;
    if (chapter.rank === 6 && templateHas(template, "symetrie axiale")) return false;
    if (chapter.rank === 6 && ["somme des angles", "angle manquant"].includes(normalizedText(template.title))) return false;
    if (chapter.rank === 8 && templateFullHas(template, "axe")) return false;
    if (chapter.rank === 9 && templateHas(template, "relatif")) return false;
    if (chapter.rank === 10 && ["angles paralleles", "angles correspondants"].includes(normalizedText(template.title))) return false;
    if (chapter.rank === 13 && templateHas(template, "notation scientifique", "puissance negative", "ordre de grandeur", "produit de puissances", "quotient de puissances", "puissance d'une puissance")) return false;
    if (chapter.rank === 14 && (templateHas(template, "identite remarquable", "double", "equation") || (template.tags ?? []).includes("double-distributivite"))) return false;
    if (chapter.rank === 17 && templateHas(template, "produit nul", "reduction", "parenthese", "relatif")) return false;
    if (chapter.rank === 17 && templateFullHas(template, "parenthese")) return false;
    if (chapter.rank === 19 && templateHas(template, "pyramide", "cone")) return false;
    if (chapter.rank === 20 && templateHas(template, "deux tirages")) return false;
  }

  if (chapter.level === "6e") {
    const allowed: Partial<Record<number, string[]>> = {
      1: ["addition", "complement", "double", "moitie", "numeration", "chiffre", "encadrement", "nombre manquant", "valeur", "decomposition", "compar", "ranger", "abscisse", "arrondi"],
      2: ["point", "droite", "segment", "demi-droite", "alignement", "appartenance", "notation", "distance", "milieu", "cercle", "rayon", "diametre"],
      3: ["multiplication", "division", "multiple", "table", "double", "moitie", "nombre manquant"],
      4: ["perpendiculaire", "parallele", "droites", "mediatrice", "equidistance", "milieu", "distance"],
      5: ["fraction", "partage", "numerateur", "denominateur", "comparaison", "encadrement", "droite graduee"],
      6: ["angle", "aigu", "obtus", "droit", "degre"],
      7: ["decimal", "virgule", "dixieme", "centieme", "decomposition", "fraction decimale", "droite graduee", "abscisse"],
      8: ["symetrie axiale", "point-image", "distance a l'axe", "axe de symetrie", "axes", "figure"],
      9: ["decimal", "addition", "soustraction", "multiplication", "division", "10", "100", "probleme"],
      10: ["fraction", "quotient", "egalite", "fraction egale", "simplifier"],
      11: ["triangle", "angle", "construction", "somme des angles", "angle manquant", "equilateral", "isocele", "rectangle"],
      12: ["proportion", "coefficient", "tableau", "prix", "echelle", "passage a l'unite"],
      13: ["fraction", "comparaison", "addition", "soustraction", "denominateur commun"],
      14: ["aire", "perimetre", "rectangle", "carre", "disque", "cercle", "rayon", "conversion"],
      15: ["fraction d'une quantite", "fraction d'un nombre", "pourcentage", "quantite", "partage"],
      16: ["solide", "pave", "cube", "prisme", "perspective", "patron", "reperage espace", "face", "arete", "sommet"],
      17: ["duree", "heure", "minute", "seconde", "horaire", "instant"],
      18: ["algebre", "expression litterale", "substitution", "programme de calcul", "nombre inconnu", "nombre manquant", "egalite"],
      19: ["probabilite", "de equilibre", "issue", "univers", "evenement", "tirage"],
      20: ["scratch", "boucle", "lutin", "programme", "compteur"]
    };
    const chapterAllowed = allowed[chapter.rank];
    if (chapterAllowed && !templateHas(template, ...chapterAllowed)) return false;
    if (chapter.rank === 2 && templateHas(template, "aire", "perimetre", "volume", "solide", "translation", "homothetie", "reperage")) return false;
    if (chapter.rank === 1 && normalizedText(template.title) === "encadrement entier") return false;
    if (
      chapter.rank === 6 &&
      ["somme des angles", "troisieme angle", "angle droit mesure"].includes(normalizedText(template.title))
    ) return false;
    if (chapter.rank === 6 && templateHas(template, "triangle", "parallelogramme", "inegalite", "somme des angles", "angle manquant")) return false;
    if (chapter.rank === 5 && templateHas(template, "fraction d'une quantite", "quantite", "egalite", "fraction decimale", "pourcentage", "addition de fractions", "soustraction de fractions")) return false;
    if (chapter.rank === 7 && templateHas(template, "multiplier par 0,1", "multiplier un decimal", "produit decimal")) return false;
    if (chapter.rank === 8 && templateFullHas(template, "symetrie centrale")) return false;
    if (chapter.rank === 10 && templateHas(template, "partage", "comparaison", "droite graduee", "fraction decimale", "addition de fractions", "soustraction de fractions", "fraction d'une quantite", "pourcentage")) return false;
    if (chapter.rank === 12 && templateHas(template, "produit en croix", "produit-croix", "pourcentage", "reduction")) return false;
    if (chapter.rank === 13 && templateHas(template, "partage", "droite graduee", "fraction decimale", "egalite", "produit de fractions", "quotient de fractions", "fraction d'une quantite", "pourcentage")) return false;
    if (chapter.rank === 15 && templateHas(template, "droite graduee", "fraction decimale", "egalite", "addition de fractions", "soustraction de fractions", "augmentation", "reduction", "retrouver le total", "reversible")) return false;
    if (chapter.rank === 16 && templateHas(template, "pyramide", "cone", "cylindre", "sphere", "volume")) return false;
    if (chapter.rank === 18 && templateHas(template, "identite remarquable", "monome", "relatif", "equation produit nul")) return false;
    if (chapter.rank === 19 && templateHas(template, "deux tirages", "sans remise", "frequence attendue", "produits en croix")) return false;
    if (
      chapter.rank === 20 &&
      templateHas(template, "condition", "test", "boucle imbriquee", "repeter jusqu", "expression de programme", "inegalite")
    ) return false;
  }

  if (chapter.level === "4e") {
    const allowed: Partial<Record<number, string[]>> = {
      1: ["produit en croix", "quatrieme proportionnelle", "egalite de rapports"],
      2: ["relatif", "signes", "produit", "quotient"],
      3: ["reduire", "substit", "expression litterale"],
      4: ["vitesse", "distance", "duree", "grandeur composee"],
      5: ["puissance", "notation scientifique", "ordre de grandeur"],
      6: ["pythagore", "egalite", "hypotenuse"],
      7: ["develop", "factor", "distributivite"],
      8: ["divisibilite", "multiple", "diviseur", "nombre premier", "decomposition"],
      9: ["reciproque", "contraposee", "triangle rectangle ou non", "pythagore"],
      10: ["fraction", "comparaison", "addition", "soustraction", "simplifier"],
      11: ["thales", "rapports"],
      12: ["moyenne", "mediane", "etendue", "frequence", "effectif"],
      13: ["fraction", "produit", "quotient", "multiplication", "division", "inverse"],
      14: ["pyramide", "cone", "volume", "patron"],
      15: ["equation", "solution", "transposition"],
      16: ["reciproque", "parallelisme", "thales"],
      17: ["probabilite", "issue", "evenement", "tirage"],
      18: ["translation", "vecteur", "coordonnees"],
      19: ["aire", "volume", "conversion"],
      20: ["scratch", "programme", "boucle", "condition", "compteur"]
    };
    const chapterAllowed = allowed[chapter.rank];
    if (chapterAllowed && !templateHas(template, ...chapterAllowed)) return false;
    if (chapter.rank === 2 && templateHas(template, "expression", "fraction et relatif", "puissance d'un relatif")) return false;
    if (chapter.rank === 7 && templateHas(template, "identite remarquable", "double")) return false;
    if (chapter.rank === 8 && templateHas(template, "fraction et relatif")) return false;
    if (chapter.rank === 14 && !templateHas(template, "pyramide", "cone")) return false;
    if (
      chapter.rank === 13 &&
      !templateHas(template, "produit de fractions", "quotient de fractions", "inverse", "multiplication de fractions", "division de fractions")
    ) return false;
    if (chapter.rank === 15 && templateHas(template, "produit nul")) return false;
    if (chapter.rank === 15 && normalizedText(template.title) === "equation parenthese") return false;
  }

  if (chapter.level === "3e" && chapter.rank !== 20) {
    const allowed: Partial<Record<number, string[]>> = {
      1: ["moyenne", "mediane", "etendue", "frequence", "effectif"],
      2: ["thales", "rapports"],
      3: ["calcul", "fraction", "puissance", "relatif", "priorite"],
      4: ["arithmetique", "divisibilite", "pgcd", "nombre premier", "decomposition"],
      5: ["reciproque", "parallelisme", "thales"],
      6: ["equation", "solution", "transposition"],
      7: ["double distributivite", "develop", "reduire", "monome"],
      8: ["fonction", "image", "antecedent"],
      9: ["identite remarquable", "carre", "difference de carres", "develop"],
      10: ["trigonometrie", "sinus", "cosinus", "tangente", "rapport"],
      11: ["fonction lineaire", "fonction affine", "coefficient directeur", "ordonnee"],
      12: ["sphere", "boule", "volume", "aire"],
      13: ["probabilite", "issue", "evenement", "tirage"],
      14: ["homothetie", "rapport", "agrandissement", "reduction"],
      15: ["reperage espace", "coordonnees", "pave"],
      16: ["scratch", "programme", "boucle", "condition", "compteur"]
    };
    const chapterAllowed = allowed[chapter.rank];
    if (chapterAllowed && !templateHas(template, ...chapterAllowed)) return false;
    if (chapter.rank === 12 && !templateHas(template, "sphere", "boule")) return false;
    if (chapter.rank === 15 && templateHas(template, "translation")) return false;
  }

  if (chapter.domain === "pythagore") {
    const tags = template.tags ?? [];
    const isClassificationChapter = chapter.level === "4e" && chapter.rank === 9;
    if (isClassificationChapter) {
      return tags.includes("classification-pythagore");
    }
    if (tags.includes("calcul-longueur")) {
      return true;
    }
    return (
      templateHas(template, "pythagore") &&
      tags.some((tag) => ["egalite", "redaction", "calcul-longueur"].includes(tag)) &&
      !templateHas(template, "methode", "racine", "reperage", "figure", "longueur", "vocabulaire", "carres", "controle", "hypotenuse", "theoreme")
    );
  }

  if (chapter.domain === "nombres-calculs") {
    if (chapterTitle.includes("priorite")) return templateHas(template, "priorite", "parenthese", "expression a etapes");
    if (chapterTitle.includes("arithmetique") || chapterTitle.includes("divisibilite")) {
      return templateHas(template, "multiple", "diviseur", "divisibilite", "premier", "pgcd", "decomposition multiplicative", "division avec reste");
    }
    if (chapterTitle.includes("comparaison de relatifs")) return templateHas(template, "comparaison", "ordre", "oppose", "droite graduee", "relatif");
    if (chapterTitle.includes("addition") && chapterTitle.includes("relatif")) return templateHas(template, "addition de relatifs", "soustraction de relatifs", "somme de relatifs", "oppose");
    if (chapterTitle.includes("operations sur les relatifs")) return templateHas(template, "relatif", "signes");
    if ((chapterTitle.includes("multiplication") && chapterTitle.includes("division euclidienne")) || chapterTitle.includes("multiplication et division entiere")) return templateHas(template, "multiplication", "division", "multiple", "diviseur", "divisibilite", "table", "double", "moitie", "nombre manquant", "reste");
    if (chapterTitle.includes("problemes") && chapterTitle.includes("addition")) return templateHas(template, "addition", "soustraction", "complement");
    if (chapterTitle.includes("nombres entiers")) return templateHas(template, "addition", "complement", "double", "moitie", "numeration", "chiffre", "encadrement", "valeur", "decomposition", "compar", "ranger", "abscisse", "arrondi");
  }

  if (chapter.domain === "proportionnalite") {
    if (chapterTitle.includes("pourcentage") && chapterTitle.includes("graphique")) {
      return templateHas(template, "pourcentage", "augmentation", "reduction", "graphique", "diagramme", "effectif");
    }
    if (chapterTitle.includes("pourcentage")) return templateHas(template, "pourcentage", "augmentation", "reduction");
    if (chapterTitle.includes("produit en croix")) return templateHas(template, "produit en croix", "quatrieme proportionnelle", "egalite de rapports");
    return templateHas(template, "proportion", "coefficient", "table", "echelle", "prix", "ratio");
  }

  if (chapter.domain === "grandeurs-mesures") {
    if (chapterTitle.includes("vitesse")) return templateHas(template, "vitesse", "distance", "duree");
    if (chapterTitle.includes("sphere") || chapterTitle.includes("boule")) {
      return templateHas(template, "sphere", "boule", "rayon", "diametre", "aire", "volume", "section");
    }
    if (chapterTitle.includes("aire") && chapterTitle.includes("volume")) {
      return templateHas(template, "aire", "volume", "conversion", "figure", "solide", "disque", "cylindre");
    }
    if (chapterTitle.includes("volume") || chapterTitle.includes("prisme") || chapterTitle.includes("pyramide") || chapterTitle.includes("cone") || chapterTitle.includes("sphere")) {
      return templateHas(template, "volume", "prisme", "pyramide", "cone", "sphere", "pave", "cylindre", "solide");
    }
    if (chapterTitle.includes("aire") || chapterTitle.includes("perimetre")) return templateHas(template, "aire", "perimetre", "longueur", "conversion");
  }

  if (chapter.domain === "calcul-litteral" || chapter.domain === "equations") {
    if (chapterTitle.includes("equation")) return templateHas(template, "equation", "solution", "transposition", "nombre manquant");
    if (chapterTitle.includes("develop") || chapterTitle.includes("factor")) return templateHas(template, "develop", "factor", "distributivite");
    if (chapterTitle.includes("identite remarquable")) return templateHas(template, "identite remarquable", "carre", "difference de carres");
    if (chapterTitle.includes("reduire") || chapterTitle.includes("substituer")) return templateHas(template, "reduire", "substitution", "expression litterale", "valeur d'une expression");
  }

  if (chapter.domain === "thales") {
    const tags = template.tags ?? [];
    const reciprocalChapter = chapter.id === "4e-chap-16" || chapter.id === "3e-chap-05";
    if (reciprocalChapter) {
      return tags.includes("thales-reciprocal");
    }
    if (tags.includes("thales-direct")) {
      return true;
    }
    const isPapillon = tags.includes("papillon");
    const permitsPapillon = chapter.id === "3e-chap-02";
    return (
      templateHas(template, "thales") &&
      tags.includes("rapports") &&
      !tags.includes("reciproque") &&
      !tags.includes("contraposee") &&
      (permitsPapillon || !isPapillon)
    );
  }

  if (chapter.domain === "fractions") {
    const isProductOrDivision =
      templateHas(template, "produit de fractions", "quotient de fractions") ||
      templateHas(template, "produit", "division");
    const isMultiplicationChapter =
      chapterTitle.includes("fractions x") ||
      chapterTitle.includes("fractions ?") ||
      chapterTitle.includes("fractions div") ||
      chapterTitle.includes("x et div") ||
      (chapterTitle.includes("multiplication") && chapterTitle.includes("division"));

    if (isProductOrDivision && !isMultiplicationChapter) {
      return false;
    }

    if (chapter.level === "6e" && templateHas(template, "pgcd", "irreductible", "quotient de fractions")) {
      return false;
    }
  }

  if (chapter.domain === "decimaux" && chapter.level === "6e" && chapterTitle.includes("nombres decimaux")) {
    if (templateHas(template, "multiplier par 0,1", "multiplier un decimal", "produit decimal")) {
      return false;
    }
  }

  if (chapter.domain === "geometrie") {
    if (
      chapter.level === "6e" &&
      templateFullHas(template, "angle correspondant", "angles correspondants", "alterne-interne", "alternes-internes")
    ) {
      return false;
    }

    if (chapterTitle.includes("perpendiculaires") && chapterTitle.includes("mediatrices")) {
      return (
        templateHas(template, "perpendiculaire", "parallele", "droite", "angle droit", "mediatrice", "equidistance", "milieu", "distance") &&
        !templateHas(template, "aire", "perimetre", "volume", "solide", "symetrie", "translation", "homothetie")
      );
    }

    if (chapterTitle.includes("representation spatiale") || chapterTitle === "espace") {
      return (
        templateHas(template, "espace", "solide", "pave", "cube", "face", "arete", "sommet") &&
        !templateHas(template, "perimetre", "aire", "translation", "homothetie", "parallelogramme", "symetrie")
      );
    }

    if (chapterTitle.includes("symetrie")) {
      return (
        templateHas(template, "symetrie", "axe", "mediatrice", "distance", "milieu") &&
        !templateHas(template, "perimetre", "aire", "translation", "homothetie", "reperage", "parallelogramme")
      );
    }

    if (chapterTitle.includes("translation")) {
      return (
        templateHas(template, "translation", "vecteur", "coordonnees") &&
        !templateHas(template, "perimetre", "aire", "homothetie", "reperage", "symetrie", "parallelogramme")
      );
    }

    if (chapterTitle.includes("homothetie")) {
      return templateHas(template, "homothetie") && !templateHas(template, "translation", "reperage", "symetrie");
    }

    if (chapterTitle.includes("reperage")) {
      return (
        templateHas(template, "reperage", "espace", "coordonnees", "abscisse", "altitude") &&
        !templateHas(template, "perimetre", "aire", "homothetie", "symetrie", "parallelogramme")
      );
    }

    if (chapterTitle.includes("inegalite triangulaire")) {
      return templateHas(template, "inegalite", "triangle") && !templateHas(template, "perimetre", "aire", "translation", "homothetie", "reperage");
    }

    if (chapterTitle.includes("mediatrice") || chapterTitle.includes("equidistance")) {
      return (
        templateHas(template, "mediatrice", "equidistance", "milieu", "distance", "triangle", "construction", "cercle", "inegalite triangulaire") &&
        !templateHas(template, "aire", "perimetre", "homothetie", "parallelogramme", "symetrie", "angle supplementaire")
      );
    }

    if (chapterTitle.includes("quadrilatere") || chapterTitle.includes("parallelogramme")) {
      return (
        templateHas(template, "quadrilatere", "parallelogramme", "rectangle", "losange", "carre", "diagonale", "cote oppose", "angle oppose") &&
        !templateHas(template, "triangle", "homothetie", "translation", "reperage", "symetrie")
      );
    }

    if (chapterTitle.includes("triangles et angles")) {
      return templateHas(template, "triangle", "angle") && !templateHas(template, "aire", "perimetre", "homothetie", "parallelogramme", "symetrie");
    }

    if (chapterTitle.includes("vocabulaire")) {
      return (
        templateHas(template, "vocabulaire", "segment", "droite", "point", "milieu", "notation", "intersection", "cercle", "rayon", "diametre", "angle droit") &&
        !templateHas(template, "aire", "perimetre", "volume", "solide", "somme des angles", "triangle constructible", "inegalite", "parallelogramme", "translation", "homothetie", "reperage")
      );
    }

    if (chapterTitle.includes("angles et paralleles")) {
      return (
        templateHas(template, "angle", "parallele", "secante") &&
        !templateHas(template, "aire", "perimetre", "volume", "solide", "symetrie", "parallelogramme", "translation", "homothetie", "reperage", "mediatrice")
      );
    }

    if (chapterTitle.includes("perpendiculaires") || chapterTitle.includes("paralleles")) {
      return (
        templateHas(template, "perpendiculaire", "parallele", "droite", "angle droit", "secante") &&
        !templateHas(template, "aire", "perimetre", "volume", "solide", "triangle constructible", "inegalite", "symetrie", "parallelogramme", "translation", "homothetie", "reperage")
      );
    }

    if (chapterTitle === "angles") {
      return (
        templateHas(template, "angle") &&
        !templateHas(template, "aire", "perimetre", "volume", "solide", "symetrie", "parallelogramme", "translation", "homothetie", "reperage", "perpendiculaires")
      );
    }
  }

  return true;
}

function keepGeometryTemplateForChapter(template: TemplateSeed, chapter: ChapterInfo): boolean {
  if (chapter.domain !== "geometrie") {
    return true;
  }

  const chapterTitle = normalizedText(chapter.title);
  const templateTitle = normalizedText(template.title);
  const templateTitleTokens = templateTitle.split(/[^a-z0-9]+/).filter(Boolean);

  if (templateTitle.includes("cercle")) {
    return /aire|perimetre|cercle|disque|longueur|symetrie|axe/.test(chapterTitle);
  }

  if (templateTitle.includes("aire d'un triangle")) {
    return /aire|triangle|geometrie|vocabulaire/.test(chapterTitle);
  }

  if (templateTitle.includes("rectangle")) {
    return /aire|perimetre|quadrilatere|rectangle|geometrie|vocabulaire|symetrie|axe/.test(chapterTitle);
  }

  if (
    templateTitleTokens.includes("angle") ||
    templateTitleTokens.includes("angles") ||
    templateTitle.includes("somme des angles")
  ) {
    return /angle|parallele|triangle|geometrie|vocabulaire|quadrilat|parall/.test(chapterTitle);
  }

  return true;
}

function keepTemplateForLevel(template: TemplateSeed, chapter: ChapterInfo): boolean {
  if (chapter.level !== "6e") {
    return true;
  }

  const tags = template.tags ?? [];
  const visibleSignal = normalizedText(`${template.title} ${template.statementTemplate} ${template.answerTemplate} ${template.correctionTemplate} ${tags.join(" ")}`);
  if (tags.some((tag) => normalizedText(tag).includes("relatif")) || visibleSignal.includes("relatif")) {
    return false;
  }

  return !Object.values(template.variablesSchema).some((definition) => {
    if (definition.type === "choice") return definition.values.some((value) => typeof value === "number" && value < 0);
    return definition.min < 0;
  });
}

function deepeningTemplates(chapter: ChapterInfo): TemplateSeed[] {
  const title = normalizedText(chapter.title);
  const common: TemplateSeed[] = [
    {
      title: "Automatisme du chapitre",
      subdomain: chapter.title,
      statementTemplate: "Question flash : quel est le r?sultat de ${{a}}+{{b}}-{{c}}$ ?",
      answerTemplate: "{{a+b-c}}",
      correctionTemplate: "$ {{a}}+{{b}}={{a+b}}$, puis ${{a+b}}-{{c}}={{a+b-c}}$.",
      variablesSchema: { a: { type: "int", min: 12, max: 80 }, b: { type: "int", min: 8, max: 60 }, c: { type: "int", min: 4, max: 40 } },
      tags: ["flash", "calcul"]
    }
  ];

  if (chapter.domain === "nombres-calculs") {
    return [
      {
        title: "Calcul en deux ?tapes",
        subdomain: chapter.title,
        statementTemplate: "Calculer ${{a}} \\times {{b}} + {{c}}$.",
        answerTemplate: "{{a*b+c}}",
        correctionTemplate: "On effectue d'abord la multiplication : ${{a}} \\times {{b}}={{a*b}}$, puis ${{a*b}}+{{c}}={{a*b+c}}$.",
        variablesSchema: { a: { type: "int", min: 3, max: 14 }, b: { type: "int", min: 3, max: 12 }, c: { type: "int", min: 5, max: 45 } },
        tags: ["calcul", "priorites"]
      },
      {
        title: "D?composition multiplicative",
        subdomain: chapter.title,
        statementTemplate: "?crire ${{a*b}}$ comme produit de deux entiers sup?rieurs ? 1.",
        answerTemplate: "${{a}} \\times {{b}}$",
        correctionTemplate: "$ {{a*b}} = {{a}} \\times {{b}} $.",
        variablesSchema: { a: { type: "int", min: 2, max: 12 }, b: { type: "int", min: 2, max: 12 } },
        tags: ["calcul", "arithmetique"]
      },
      {
        title: "Multiple ou non",
        subdomain: chapter.title,
        statementTemplate: "$ {{a*b}} $ est-il un multiple de ${{a}}$ ?",
        answerTemplate: "Oui",
        correctionTemplate: "Oui, car ${{a*b}}={{a}}\\times {{b}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 15 }, b: { type: "int", min: 2, max: 18 } },
        tags: ["arithmetique", "multiples"]
      },
      ...common
    ];
  }

  if (chapter.domain === "decimaux") {
    return [
      {
        title: "Comparer des d?cimaux",
        subdomain: chapter.title,
        statementTemplate: "Comparer : ${{formatDecimalFrench(a)}}$ et ${{formatDecimalFrench(a+0.1*b)}}$.",
        answerTemplate: "$ {{formatDecimalFrench(a)}} < {{formatDecimalFrench(a+0.1*b)}} $",
        correctionTemplate: "$ {{formatDecimalFrench(a+0.1*b)}}$ est plus grand car on ajoute ${{formatDecimalFrench(0.1*b)}}$ à ${{formatDecimalFrench(a)}}$.",
        variablesSchema: { a: { type: "decimal", min: 1.2, max: 18.4, decimals: 1 }, b: { type: "int", min: 1, max: 8 } },
        tags: ["decimaux", "ordre"]
      },
      {
        title: "D?composer un d?cimal",
        subdomain: chapter.title,
        statementTemplate: "Compl?ter : ${{formatDecimalFrench(u+d/10)}} = {{u}} + \\dfrac{\\square}{10}$.",
        answerTemplate: "{{d}}",
        correctionTemplate: "$ {{formatDecimalFrench(u+d/10)}} = {{u}} + \\dfrac{ {{d}} }{10}$.",
        variablesSchema: { u: { type: "int", min: 1, max: 18 }, d: { type: "int", min: 1, max: 9 } },
        tags: ["decimaux", "decomposition"]
      },
      {
        title: "Division par 10",
        subdomain: chapter.title,
        statementTemplate: "Calculer ${{formatDecimalFrench(a)}} \\div 10$.",
        answerTemplate: "{{formatDecimalFrench(a/10)}}",
        correctionTemplate: "Diviser par 10 d?cale la virgule d'un rang vers la gauche : ${{formatDecimalFrench(a/10)}}$.",
        variablesSchema: { a: { type: "decimal", min: 12, max: 125, decimals: 1 } },
        tags: ["decimaux", "division"]
      }
    ];
  }

  if (chapter.domain === "fractions") {
    return [
      {
        title: "Égalité de fractions",
        subdomain: chapter.title,
        statementTemplate: "Compl?ter : $\\dfrac{ {{a}} }{ {{b}} } = \\dfrac{ {{a*k}} }{ \\square }$.",
        answerTemplate: "{{b*k}}",
        correctionTemplate: "On multiplie le num?rateur par ${{k}}$, donc on multiplie aussi le d?nominateur par ${{k}}$ : ${{b}}\\times {{k}}={{b*k}}$.",
        variablesSchema: { a: { type: "int", min: 1, max: 8 }, b: { type: "int", min: 2, max: 12 }, k: { type: "int", min: 2, max: 8 } },
        tags: ["fractions", "egalite"]
      },
      {
        title: "Soustraction de fractions à dénominateurs différents",
        subdomain: chapter.title,
        statementTemplate: "Calculer $\\dfrac{ {{a}} }{ {{den}} } - \\dfrac{ {{b}} }{ {{den*k}} }$.",
        answerTemplate: "{{formatFraction(a*k-b,den*k)}}",
        correctionTemplate: "On prend le d?nominateur commun ${{den*k}}$ : $\\dfrac{ {{a}} }{ {{den}} }=\\dfrac{ {{a*k}} }{ {{den*k}} }$, donc $\\dfrac{ {{a*k}}-{{b}} }{ {{den*k}} }={{formatFraction(a*k-b,den*k)}}$.",
        variablesSchema: { a: { type: "int", min: 4, max: 9 }, b: { type: "int", min: 1, max: 7 }, den: { type: "choice", values: [3, 4, 5, 6, 8] }, k: { type: "choice", values: [2, 3, 4] } },
        tags: ["fractions", "calcul", "denominateurs-differents"]
      },
      {
        title: "Somme de fractions avec relatif",
        subdomain: chapter.title,
        statementTemplate: "Calculer $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ -{{b}} }{ {{den*k}} }$.",
        answerTemplate: "{{formatFraction(a*k-b,den*k)}}",
        correctionTemplate: "On ?crit $\\dfrac{ {{a}} }{ {{den}} }=\\dfrac{ {{a*k}} }{ {{den*k}} }$, puis $\\dfrac{ {{a*k}}-{{b}} }{ {{den*k}} }={{formatFraction(a*k-b,den*k)}}$.",
        variablesSchema: { a: { type: "int", min: 1, max: 8 }, b: { type: "int", min: 2, max: 10 }, den: { type: "choice", values: [3, 4, 5, 6] }, k: { type: "choice", values: [2, 3, 4] } },
        tags: ["fractions", "calcul", "relatifs", "denominateurs-multiples"]
      },
      {
        title: "Fraction irr?ductible",
        subdomain: chapter.title,
        statementTemplate: "Simplifier $\\dfrac{ {{a*k}} }{ {{b*k}} }$.",
        answerTemplate: "{{formatFraction(a*k,b*k)}}",
        correctionTemplate: "On divise le num?rateur et le d?nominateur par ${{k}}$ : $\\dfrac{ {{a*k}} }{ {{b*k}} }={{formatFraction(a*k,b*k)}}$.",
        variablesSchema: { a: { type: "choice", values: [2, 3, 5, 7] }, b: { type: "choice", values: [3, 4, 5, 8, 9] }, k: { type: "int", min: 2, max: 9 } },
        tags: ["fractions", "simplification"]
      }
    ];
  }

  if (chapter.domain === "proportionnalite") {
    return [
      {
        title: "Tableau proportionnel à compléter",
        subdomain: chapter.title,
        statementTemplate: "Compl?ter le tableau proportionnel : ${{a}} \\to {{a*k}}$ et ${{b}} \\to ?$.",
        answerTemplate: "{{b*k}}",
        correctionTemplate: "Le coefficient multiplicateur est ${{k}}$, donc ${{b}}\\times {{k}}={{b*k}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 3, max: 12 }, k: { type: "int", min: 2, max: 9 } },
        tags: ["proportionnalite", "tableau"]
      },
      {
        title: "Pourcentage r?versible",
        subdomain: chapter.title,
        statementTemplate: "Une r?duction de ${{pct}}\\%$ sur ${{base}}$ vaut combien ?",
        answerTemplate: "{{base*pct/100}} ?",
        correctionTemplate: "${{pct}}\\%$ de ${{base}}$ vaut ${{base}}\\times {{pct}}\\div 100={{base*pct/100}}$.",
        variablesSchema: { pct: { type: "choice", values: [10, 20, 25, 40, 50] }, base: { type: "choice", values: [40, 60, 80, 100, 120, 200] } },
        tags: ["pourcentage", "proportionnalite"]
      },
      {
        title: "Produit en croix guid?",
        subdomain: chapter.title,
        statementTemplate: "On sait que $\\dfrac{x}{ {{b}} }=\\dfrac{ {{a}} }{ {{d}} }$. ?crire le calcul de $x$.",
        answerTemplate: "$x=\\dfrac{ {{a}}\\times {{b}} }{ {{d}} }$",
        correctionTemplate: "Par produit en croix, $x=\\dfrac{ {{a}}\\times {{b}} }{ {{d}} }$.",
        variablesSchema: { a: { type: "choice", values: [2, 3, 4, 5] }, b: { type: "choice", values: [6, 8, 10, 12] }, d: { type: "choice", values: [3, 4, 5, 6] } },
        tags: ["proportionnalite", "produit-croix"]
      }
    ];
  }

  if (chapter.domain === "grandeurs-mesures") {
    return [
      {
        title: "Aire d'un rectangle",
        subdomain: chapter.title,
        statementTemplate: "Calculer l'aire d'un rectangle de longueur ${{l}}$ cm et largeur ${{w}}$ cm.",
        answerTemplate: "{{l*w}} cm²",
        correctionTemplate: "$\\mathcal{A}=L\\times l={{l}}\\times {{w}}={{l*w}}$ cm².",
        variablesSchema: { l: { type: "int", min: 4, max: 18 }, w: { type: "int", min: 3, max: 12 } },
        figureTemplate: { kind: "rectangle", widthLabel: "{{l}} cm", heightLabel: "{{w}} cm" },
        tags: ["aire", "mesures"]
      },
      {
        title: "Conversion d'aire",
        subdomain: chapter.title,
        statementTemplate: "Convertir ${{a}}$ m² en dm².",
        answerTemplate: "{{a*100}} dm²",
        correctionTemplate: "$1$ m² = $100$ dm², donc ${{a}}$ m² = ${{a*100}}$ dm².",
        variablesSchema: { a: { type: "int", min: 2, max: 15 } },
        tags: ["conversion", "aire"]
      },
      {
        title: "Volume express",
        subdomain: chapter.title,
        statementTemplate: "Un pavé droit mesure ${{a}}$ cm, ${{b}}$ cm et ${{c}}$ cm. Calculer son volume.",
        answerTemplate: "{{a*b*c}} cm³",
        correctionTemplate: "$V={{a}}\\times {{b}}\\times {{c}}={{a*b*c}}$ cm³.",
        variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 9 }, c: { type: "int", min: 2, max: 9 } },
        figureTemplate: { kind: "solid", solid: "pave", labels: ["{{a}} cm", "{{b}} cm", "{{c}} cm"] },
        tags: ["volume", "solide"]
      }
    ];
  }

  if (chapter.domain === "geometrie") {
    if (/symetrie/.test(title)) {
      return [
        {
          title: "Distance conserv?e",
          subdomain: chapter.title,
          statementTemplate: "Par sym?trie, le point A a pour image A'. Si $OA={{d}}$ cm, que vaut $OA'$ ?",
          answerTemplate: "{{d}} cm",
          correctionTemplate: "Une sym?trie conserve les longueurs : $OA'=OA={{d}}$ cm.",
          variablesSchema: { d: { type: "int", min: 2, max: 15 } },
          tags: ["geometrie", "symetrie"]
        },
        {
          title: "Milieu et sym?trie centrale",
          subdomain: chapter.title,
          statementTemplate: "A' est l'image de A par la sym?trie de centre O. Quel est le r?le de O pour $[AA']$ ?",
          answerTemplate: "O est le milieu de $[AA']$",
          correctionTemplate: "Dans une sym?trie centrale, le centre est le milieu du segment reliant un point et son image.",
          variablesSchema: {},
          tags: ["geometrie", "symetrie", "redaction"]
        },
        {
          title: "Axe de sym?trie",
          subdomain: chapter.title,
          statementTemplate: "Si une droite est m?diatrice de $[AA']$, que peut-on dire de A et A' ?",
          answerTemplate: "A et A' sont sym?triques par rapport ? cette droite",
          correctionTemplate: "L'axe de sym?trie est la m?diatrice du segment reliant un point et son image.",
          variablesSchema: {},
          tags: ["geometrie", "symetrie", "mediatrice"]
        }
      ];
    }

    if (/translation|homothetie|reperage/.test(title)) {
      return [
        {
          title: "Coordonn?es par translation",
          subdomain: chapter.title,
          statementTemplate: "Une translation ajoute $({{dx}};{{dy}})$ aux coordonn?es. Image de $A({{x}};{{y}})$ ?",
          answerTemplate: "$A'({{x+dx}};{{y+dy}})$",
          correctionTemplate: "On ajoute les coordonn?es du d?placement : $({{x}}+{{dx}};{{y}}+{{dy}})=({{x+dx}};{{y+dy}})$.",
          variablesSchema: { x: { type: "int", min: -5, max: 8 }, y: { type: "int", min: -5, max: 8 }, dx: { type: "int", min: -4, max: 5, exclude: [0] }, dy: { type: "int", min: -4, max: 5, exclude: [0] } },
          tags: ["geometrie", "translation", "coordonnees"]
        },
        {
          title: "Homoth?tie de longueur",
          subdomain: chapter.title,
          statementTemplate: "Par une homoth?tie de rapport ${{k}}$, une longueur de ${{l}}$ cm devient combien ?",
          answerTemplate: "{{k*l}} cm",
          correctionTemplate: "Les longueurs sont multipli?es par le rapport : ${{l}}\\times {{k}}={{l*k}}$ cm.",
          variablesSchema: { k: { type: "choice", values: [2, 3, 4] }, l: { type: "int", min: 2, max: 12 } },
          tags: ["geometrie", "homothetie"]
        },
        {
          title: "Rep?rage dans l'espace",
          subdomain: chapter.title,
          statementTemplate: "Dans le rep?re de l'espace, quel nombre repr?sente l'altitude du point $A({{x}};{{y}};{{z}})$ ?",
          answerTemplate: "{{z}}",
          correctionTemplate: "Dans $A(x;y;z)$, la troisi?me coordonn?e $z$ donne l'altitude.",
          variablesSchema: { x: { type: "int", min: -4, max: 8 }, y: { type: "int", min: -4, max: 8 }, z: { type: "int", min: 1, max: 12 } },
          tags: ["geometrie", "reperage", "espace"]
        }
      ];
    }

    if (/parall|quadrilat/.test(title)) {
      return [
        {
          title: "C?t?s oppos?s",
          subdomain: chapter.title,
          statementTemplate: "Dans un parall?logramme ABCD, si $AB={{a}}$ cm, que vaut $CD$ ?",
          answerTemplate: "{{a}} cm",
          correctionTemplate: "Dans un parall?logramme, les c?t?s oppos?s ont la m?me longueur : $CD=AB={{a}}$ cm.",
          variablesSchema: { a: { type: "int", min: 3, max: 18 } },
          tags: ["geometrie", "parallelogramme"]
        },
        {
          title: "Angles cons?cutifs",
          subdomain: chapter.title,
          statementTemplate: "Dans un parall?logramme, deux angles cons?cutifs sont suppl?mentaires. Si l'un mesure ${{a}}^\\circ$, l'autre mesure ?",
          answerTemplate: "{{180-a}}°",
          correctionTemplate: "$180^\\circ-{{a}}^\\circ={{180-a}}^\\circ$.",
          variablesSchema: { a: { type: "int", min: 45, max: 130 } },
          tags: ["geometrie", "parallelogramme", "angles"]
        },
        {
          title: "P?rim?tre de parall?logramme",
          subdomain: chapter.title,
          statementTemplate: "Un parall?logramme a deux c?t?s cons?cutifs de ${{a}}$ cm et ${{b}}$ cm. Calculer son p?rim?tre.",
          answerTemplate: "{{2*(a+b)}} cm",
          correctionTemplate: "$P=2\\times({{a}}+{{b}})=2\\times {{a+b}}={{2*(a+b)}}$ cm.",
          variablesSchema: { a: { type: "int", min: 3, max: 15 }, b: { type: "int", min: 3, max: 15 } },
          tags: ["geometrie", "parallelogramme", "perimetre"]
        }
      ];
    }

    if (/triangle|angle|parallele|mediatrice|inegalite/.test(title)) {
      return [
        {
          title: "Inégalité triangulaire",
          subdomain: chapter.title,
          statementTemplate: "Peut-on construire un triangle de c?t?s ${{a}}$ cm, ${{b}}$ cm et ${{a+b-1}}$ cm ?",
          answerTemplate: "Oui",
          correctionTemplate: "La plus grande longueur est ${{a+b-1}}$ et ${{a}}+{{b}}={{a+b}}>{{a+b-1}}$, donc le triangle est constructible.",
          variablesSchema: { a: { type: "int", min: 3, max: 10 }, b: { type: "int", min: 3, max: 10 } },
          tags: ["geometrie", "triangle", "inegalite"]
        },
        {
          title: "Angle manquant",
          subdomain: chapter.title,
          statementTemplate: "Dans un triangle, deux angles mesurent ${{a}}^\\circ$ et ${{b}}^\\circ$. Calculer le troisième.",
          answerTemplate: "{{180-a-b}}°",
          correctionTemplate: "$180^\\circ-{{a}}^\\circ-{{b}}^\\circ={{180-a-b}}^\\circ$.",
          variablesSchema: { a: { type: "int", min: 35, max: 80 }, b: { type: "int", min: 35, max: 70 } },
          figureTemplate: { kind: "triangle", labelA: "{{a}}°", labelB: "{{b}}°", labelC: "?" },
          tags: ["geometrie", "angles"]
        },
        {
          title: "Droites parallèles",
          subdomain: chapter.title,
          statementTemplate: "Deux droites parallèles sont coupées par une sécante. Un angle correspondant vaut ${{a}}^\\circ$. L'autre angle correspondant vaut ?",
          answerTemplate: "{{a}}°",
          correctionTemplate: "Des angles correspondants formés par deux parallèles et une sécante sont égaux.",
          variablesSchema: { a: { type: "int", min: 35, max: 145 } },
          figureTemplate: { kind: "parallel-lines", angleLabel: "{{a}}°", anglePair: "corresponding" },
          tags: ["geometrie", "angles", "paralleles"]
        }
      ];
    }

    return [
      {
        title: "Vocabulaire de figure",
        subdomain: chapter.title,
        statementTemplate: "Un segment $[AB]$ mesure ${{d}}$ cm. Quelle est la distance $AB$ ?",
        answerTemplate: "{{d}} cm",
        correctionTemplate: "La longueur du segment $[AB]$ se note $AB$ et vaut ${{d}}$ cm.",
        variablesSchema: { d: { type: "int", min: 2, max: 18 } },
        tags: ["geometrie", "vocabulaire"]
      },
      {
        title: "P?rim?tre d'un carr?",
        subdomain: chapter.title,
        statementTemplate: "Un carr? a pour c?t? ${{c}}$ cm. Calculer son p?rim?tre.",
        answerTemplate: "{{4*c}} cm",
        correctionTemplate: "$P=4\\times {{c}}={{4*c}}$ cm.",
        variablesSchema: { c: { type: "int", min: 2, max: 16 } },
        figureTemplate: { kind: "rectangle", widthLabel: "{{c}} cm", heightLabel: "{{c}} cm" },
        tags: ["geometrie", "perimetre"]
      },
      {
        title: "Solide mental",
        subdomain: chapter.title,
        statementTemplate: "Combien de sommets poss?de un pav? droit ?",
        answerTemplate: "8",
        correctionTemplate: "Un pav? droit poss?de 8 sommets.",
        variablesSchema: {},
        figureTemplate: { kind: "solid", solid: "pave", labels: ["8 sommets", "12 ar?tes", "6 faces"] },
        tags: ["geometrie", "espace"]
      },
      {
        title: "Milieu d'un segment",
        subdomain: chapter.title,
        statementTemplate: "M est le milieu de $[AB]$ et $AB={{2*d}}$ cm. Quelle est la longueur $AM$ ?",
        answerTemplate: "{{d}} cm",
        correctionTemplate: "Le milieu partage le segment en deux longueurs ?gales : $AM=AB\\div 2={{2*d}}\\div 2={{d}}$ cm.",
        variablesSchema: { d: { type: "int", min: 2, max: 12 } },
        tags: ["geometrie", "milieu"]
      },
      {
        title: "Nommer un polygone",
        subdomain: chapter.title,
        statementTemplate: "Un polygone poss?de {{n}} c?t?s. Comment l'appelle-t-on ?",
        answerTemplate: "{{n===3 ? 'triangle' : n===4 ? 'quadrilat?re' : n===5 ? 'pentagone' : 'hexagone'}}",
        correctionTemplate: "$ {{n}}$ c?t?s correspondent ? : {{n===3 ? 'triangle' : n===4 ? 'quadrilat?re' : n===5 ? 'pentagone' : 'hexagone'}}.",
        variablesSchema: { n: { type: "choice", values: [3, 4, 5, 6] } },
        tags: ["geometrie", "vocabulaire"]
      }
    ];
  }

  if (chapter.domain === "pythagore") {
    return [
      {
        title: "Choisir Pythagore",
        subdomain: chapter.title,
        statementTemplate: "Dans un triangle rectangle, on conna?t deux longueurs et on cherche la troisi?me. Quel th?or?me utiliser ?",
        answerTemplate: "Le th?or?me de Pythagore",
        correctionTemplate: "Dans un triangle rectangle, le th?or?me de Pythagore relie les carr?s des trois c?t?s.",
        variablesSchema: {},
        tags: ["pythagore", "methode", "theoreme"]
      },
      {
        title: "R?daction hypot?nuse",
        subdomain: chapter.title,
        statementTemplate: "ABC est rectangle en B. Quelle est l'hypot?nuse ?",
        answerTemplate: "$AC$",
        correctionTemplate: "L'hypot?nuse est le c?t? oppos? ? l'angle droit. Comme l'angle droit est en B, l'hypot?nuse est $AC$.",
        variablesSchema: {},
        figureTemplate: { kind: "right-triangle", legALabel: "AB", legBLabel: "BC", hypotenuseLabel: "AC" },
        tags: ["pythagore", "redaction", "theoreme"]
      },
      {
        title: "Carr? utile",
        subdomain: chapter.title,
        statementTemplate: "Calculer ${{a}}^2+{{b}}^2$.",
        answerTemplate: "{{a*a+b*b}}",
        correctionTemplate: "$ {{a}}^2={{a*a}}$ et ${{b}}^2={{b*b}}$, donc la somme vaut ${{a*a+b*b}}$.",
        variablesSchema: { a: { type: "int", min: 3, max: 15 }, b: { type: "int", min: 4, max: 16 } },
        tags: ["pythagore", "carres"]
      }
    ];
  }

  if (chapter.domain === "thales") {
    return [
      {
        title: "Choisir Thal?s",
        subdomain: chapter.title,
        statementTemplate: "Dans un triangle, deux droites parall?les d?coupent deux c?t?s. Quel th?or?me permet de calculer une longueur ?",
        answerTemplate: "Le th?or?me de Thal?s",
        correctionTemplate: "Le th?or?me de Thal?s donne des rapports ?gaux lorsque deux droites parall?les coupent deux s?cantes.",
        variablesSchema: {},
        tags: ["thales", "methode", "theoreme"]
      },
      {
        title: "Rapports de Thal?s",
        subdomain: chapter.title,
        statementTemplate: "Compl?ter : si $\\dfrac{AM}{AB}=\\dfrac{AN}{AC}$, alors les rapports sont ...",
        answerTemplate: "?gaux",
        correctionTemplate: "Dans une configuration de Thal?s, les rapports de longueurs correspondantes sont ?gaux.",
        variablesSchema: {},
        tags: ["thales", "rapport", "redaction"]
      },
      {
        title: "Contrapos?e de Thal?s",
        subdomain: chapter.title,
        statementTemplate: "Si deux rapports de longueurs correspondantes ne sont pas ?gaux, que peut-on conclure pour les droites ?",
        answerTemplate: "Elles ne sont pas parall?les",
        correctionTemplate: "Par contrapos?e du th?or?me de Thal?s, si les rapports ne sont pas ?gaux, alors les droites ne sont pas parall?les.",
        variablesSchema: {},
        tags: ["thales", "contraposee", "theoreme"]
      }
    ];
  }

  if (chapter.domain === "calcul-litteral") {
    return [
      {
        title: "R?duire avec constantes",
        subdomain: chapter.title,
        statementTemplate: "R?duire ${{a}}x+{{b}}-{{c}}x+{{d}}$.",
        answerTemplate: "${{a-c}}x+{{b+d}}$",
        correctionTemplate: "On regroupe les termes en $x$ et les constantes : $({{a}}-{{c}})x+({{b}}+{{d}})={{a-c}}x+{{b+d}}$.",
        variablesSchema: { a: { type: "int", min: 4, max: 12 }, c: { type: "int", min: 1, max: 3 }, b: { type: "int", min: 1, max: 10 }, d: { type: "int", min: 1, max: 10 } },
        tags: ["litteral", "reduire"]
      },
      {
        title: "Factoriser facteur commun",
        subdomain: chapter.title,
        statementTemplate: "Factoriser ${{k}}x + {{k*a}}$.",
        answerTemplate: "${{k}}(x+{{a}})$",
        correctionTemplate: "Le facteur commun est ${{k}}$ : ${{k}}x+{{k*a}}={{k}}(x+{{a}})$.",
        variablesSchema: { k: { type: "int", min: 2, max: 9 }, a: { type: "int", min: 2, max: 12 } },
        tags: ["litteral", "factoriser"]
      },
      {
        title: "Double distributivit?",
        subdomain: chapter.title,
        statementTemplate: "D?velopper $(x+{{a}})(x+{{b}})$.",
        answerTemplate: "$x^2+{{a+b}}x+{{a*b}}$",
        correctionTemplate: "$(x+{{a}})(x+{{b}})=x^2+{{b}}x+{{a}}x+{{a*b}}=x^2+{{a+b}}x+{{a*b}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 2, max: 8 } },
        tags: ["litteral", "developper"]
      }
    ];
  }

  if (chapter.domain === "equations") {
    return [
      {
        title: "?quation avec parenth?ses",
        subdomain: chapter.title,
        statementTemplate: "R?soudre ${{a}}(x+{{b}})={{a*(x+b)}}$.",
        answerTemplate: "$x={{x}}$",
        correctionTemplate: "On divise par ${{a}}$ : $x+{{b}}={{x+b}}$, puis $x={{x+b}}-{{b}}={{x}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 1, max: 9 }, x: { type: "int", min: 2, max: 15 } },
        tags: ["equations"]
      },
      {
        title: "Tester une solution",
        subdomain: chapter.title,
        statementTemplate: "$x={{x}}$ est-il solution de ${{a}}x+{{b}}={{a*x+b+delta}}$ ?",
        answerTemplate: "{{delta===0 ? 'Oui' : 'Non'}}",
        correctionTemplate: "En rempla?ant $x$ par ${{x}}$, on obtient ${{a}}\\times {{x}}+{{b}}={{a*x+b}}$. On compare avec ${{a*x+b+delta}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 1, max: 15 }, x: { type: "int", min: 2, max: 12 }, delta: { type: "choice", values: [0, 1, -2] } },
        tags: ["equations", "verification"]
      },
      {
        title: "?quation bilan",
        subdomain: chapter.title,
        statementTemplate: "R?soudre ${{a}}x-{{b}}={{a*x-b}}$.",
        answerTemplate: "$x={{x}}$",
        correctionTemplate: "$ {{a}}x={{a*x-b}}+{{b}}={{a*x}}$, donc $x={{a*x}}\\div {{a}}={{x}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 1, max: 20 }, x: { type: "int", min: 2, max: 14 } },
        tags: ["equations"]
      }
    ];
  }

  if (chapter.domain === "puissances") {
    return [
      {
        title: "Puissance d'une puissance",
        subdomain: chapter.title,
        statementTemplate: "?crire sous la forme $10^n$ : $(10^{{a}})^{{b}}$.",
        answerTemplate: "$10^{{a*b}}$",
        correctionTemplate: "$(10^{{a}})^{{b}}=10^{ {{a}}\\times {{b}} }=10^{{a*b}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 5 }, b: { type: "int", min: 2, max: 4 } },
        tags: ["puissances"]
      },
      {
        title: "Notation scientifique vers d?cimal",
        subdomain: chapter.title,
        statementTemplate: "?crire ${{a}}\\times 10^{{n}}$ sous forme d?cimale.",
        answerTemplate: "{{a*10**n}}",
        correctionTemplate: "On d?cale la virgule de ${{n}}$ rangs : ${{a}}\\times 10^{{n}}={{a*10**n}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 9 }, n: { type: "int", min: 2, max: 5 } },
        tags: ["puissances", "notation-scientifique"]
      },
      {
        title: "Signe d'une puissance",
        subdomain: chapter.title,
        statementTemplate: "Quel est le signe de $(-{{a}})^{{2*n}}$ ?",
        answerTemplate: "positif",
        correctionTemplate: "Une puissance paire d'un nombre n?gatif est positive.",
        variablesSchema: { a: { type: "int", min: 2, max: 9 }, n: { type: "int", min: 1, max: 4 } },
        tags: ["puissances", "signe"]
      }
    ];
  }

  if (chapter.domain === "statistiques") {
    return [
      {
        title: "Effectif total",
        subdomain: chapter.title,
        statementTemplate: "Un tableau contient les effectifs ${{a}}$, ${{b}}$ et ${{c}}$. Donner l'effectif total.",
        answerTemplate: "{{a+b+c}}",
        correctionTemplate: "On additionne les effectifs : ${{a}}+{{b}}+{{c}}={{a+b+c}}$.",
        variablesSchema: { a: { type: "int", min: 4, max: 18 }, b: { type: "int", min: 4, max: 18 }, c: { type: "int", min: 4, max: 18 } },
        tags: ["statistiques", "effectif"]
      },
      {
        title: "Moyenne pondérée courte",
        subdomain: chapter.title,
        statementTemplate: "Deux notes : ${{a}}$ coefficient 1 et ${{b}}$ coefficient 2. Calculer la moyenne au centième près si nécessaire.",
        answerTemplate: "{{formatDecimalFrench(roundTo((a+2*b)/3,2))}}",
        correctionTemplate: "$\\dfrac{ {{a}}+2\\times {{b}} }{3}=\\dfrac{ {{a+2*b}} }{3}{{roundingRelation((a+2*b)/3,2)}}{{formatDecimalFrench(roundTo((a+2*b)/3,2))}}$.",
        variablesSchema: { a: { type: "int", min: 5, max: 18 }, b: { type: "int", min: 5, max: 18 } },
        tags: ["statistiques", "moyenne"]
      },
      {
        title: "Lecture de m?diane",
        subdomain: chapter.title,
        statementTemplate: "Série : ${{e}}; {{b}}; {{a}}; {{d}}; {{c}}$. Quelle est la médiane ?",
        answerTemplate: "{{c}}",
        correctionTemplate: "On ordonne : ${{a}}; {{b}}; {{c}}; {{d}}; {{e}}$. Avec 5 valeurs, la médiane est la 3e valeur : ${{c}}$.",
        variablesSchema: { a: { type: "choice", values: [2, 3] }, b: { type: "choice", values: [5, 6] }, c: { type: "choice", values: [8, 9, 10] }, d: { type: "choice", values: [12, 13] }, e: { type: "choice", values: [16, 18] } },
        tags: ["statistiques", "mediane"]
      }
    ];
  }

  if (chapter.domain === "probabilites") {
    return [
      {
        title: "Univers et événement",
        subdomain: chapter.title,
        statementTemplate: "On lance un dé équilibré. Quelle est la probabilité d'obtenir un nombre supérieur à 4 ?",
        answerTemplate: "$\\dfrac{1}{3}$",
        correctionTemplate: "Les issues favorables sont 5 et 6 : $\\dfrac{2}{6}=\\dfrac{1}{3}$.",
        variablesSchema: {},
        tags: ["probabilites", "equiprobabilite"]
      },
      {
        title: "Probabilité décimale",
        subdomain: chapter.title,
        statementTemplate: "Écrire $\\dfrac{ {{a}} }{10}$ sous forme décimale.",
        answerTemplate: "{{formatDecimalFrench(a/10)}}",
        correctionTemplate: "$\\dfrac{ {{a}} }{10}={{formatDecimalFrench(a/10)}}$.",
        variablesSchema: { a: { type: "int", min: 1, max: 9 } },
        tags: ["probabilites", "fraction"]
      },
      {
        title: "?v?nement contraire",
        subdomain: chapter.title,
        statementTemplate: "Si $P(A)=\\dfrac{ {{a}} }{ {{den}} }$, calculer $P(\\overline A)$.",
        answerTemplate: "{{formatFraction(den-a,den)}}",
        correctionTemplate: "$P(\\overline A)=1-P(A)=\\dfrac{ {{den-a}} }{ {{den}} }={{formatFraction(den-a,den)}}$.",
        variablesSchema: { a: { type: "int", min: 1, max: 5 }, den: { type: "choice", values: [6, 8, 10, 12] } },
        tags: ["probabilites", "contraire"]
      }
    ];
  }

  if (chapter.domain === "fonctions") {
    return [
      {
        title: "Lire une image",
        subdomain: chapter.title,
        statementTemplate: "Pour $f(x)={{a}}x+{{b}}$, calculer $f({{x}})$.",
        answerTemplate: "{{a*x+b}}",
        correctionTemplate: "$f({{x}})={{a}}\\times {{x}}+{{b}}={{a*x+b}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 1, max: 12 }, x: { type: "int", min: 2, max: 10 } },
        tags: ["fonctions", "image"]
      },
      {
        title: "Ant?c?dent affine",
        subdomain: chapter.title,
        statementTemplate: "Pour $f(x)={{a}}x+{{b}}$, quel ant?c?dent a pour image ${{a*x+b}}$ ?",
        answerTemplate: "{{x}}",
        correctionTemplate: "On r?sout ${{a}}x+{{b}}={{a*x+b}}$, donc ${{a}}x={{a*x}}$ et $x={{x}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 7 }, b: { type: "int", min: 1, max: 10 }, x: { type: "int", min: 2, max: 12 } },
        tags: ["fonctions", "antecedent"]
      },
      {
        title: "Fonction lin?aire et proportionnalit?",
        subdomain: chapter.title,
        statementTemplate: "Une fonction lin?aire v?rifie $f({{x}})={{a*x}}$. Donner son expression.",
        answerTemplate: "$f(x)={{a}}x$",
        correctionTemplate: "Le coefficient est ${{a*x}}\\div {{x}}={{a}}$, donc $f(x)={{a}}x$.",
        variablesSchema: { a: { type: "int", min: 2, max: 9 }, x: { type: "int", min: 2, max: 10 } },
        tags: ["fonctions", "lineaire"]
      }
    ];
  }

  if (chapter.domain === "trigonometrie") {
    return [
      {
        title: "SOH CAH TOA",
        subdomain: chapter.title,
        statementTemplate: "Quel rapport utilise le cosinus dans un triangle rectangle ?",
        answerTemplate: "adjacent / hypot?nuse",
        correctionTemplate: "$\\cos(\\alpha)=\\dfrac{c?t?\\ adjacent}{hypot?nuse}$.",
        variablesSchema: {},
        figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
        tags: ["trigonometrie", "rapport", "formule"]
      },
      {
        title: "Rapport tangente",
        subdomain: chapter.title,
        statementTemplate: "Avec la figure, écris le rapport de la tangente de l'angle marqué.",
        answerTemplate: "$\\tan(\\widehat A)=\\dfrac{\\text{opposé}}{\\text{adjacent}}$",
        correctionTemplate: "La tangente utilise le côté opposé et le côté adjacent.",
        variablesSchema: {},
        figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "" },
        tags: ["trigonometrie", "rapport", "tangente"]
      },
      {
        title: "Identifier le bon rapport",
        subdomain: chapter.title,
        statementTemplate: "On conna?t le c?t? adjacent et l'hypot?nuse. Quel rapport trigonom?trique utiliser ?",
        answerTemplate: "cosinus",
        correctionTemplate: "Le cosinus relie le c?t? adjacent ? l'hypot?nuse.",
        variablesSchema: {},
        figureTemplate: { kind: "right-triangle", legALabel: "", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
        tags: ["trigonometrie", "rapport", "methode"]
      }
    ];
  }

  if (chapter.domain === "algorithmique") {
    return [
      {
        title: "Scratch boucle compteur",
        subdomain: chapter.title,
        statementTemplate: "Ce programme ajoute ${{step}}$ pendant ${{repeat}}$ r?p?titions en partant de ${{start}}$. Valeur finale ?",
        answerTemplate: "{{start+step*repeat}}",
        correctionTemplate: "$ {{start}}+{{repeat}}\\times {{step}}={{start+step*repeat}}$.",
        variablesSchema: { start: { type: "int", min: 0, max: 12 }, step: { type: "int", min: 2, max: 9 }, repeat: { type: "int", min: 2, max: 8 } },
        figureTemplate: { kind: "scratch", blocks: ["mettre n à {{start}}", "répéter {{repeat}} fois", "ajouter {{step}} à n", "dire n"] },
        tags: ["scratch", "algorithmique"]
      },
      {
        title: "Programme de calcul",
        subdomain: chapter.title,
        statementTemplate: "Programme : choisir ${{x}}$, multiplier par ${{a}}$, ajouter ${{b}}$. R?sultat ?",
        answerTemplate: "{{a*x+b}}",
        correctionTemplate: "$ {{x}}\\times {{a}}+{{b}}={{a*x+b}}$.",
        variablesSchema: { x: { type: "int", min: 2, max: 12 }, a: { type: "int", min: 2, max: 7 }, b: { type: "int", min: 1, max: 15 } },
        figureTemplate: { kind: "scratch", blocks: ["demander un nombre", "mettre résultat à réponse × {{a}}", "ajouter {{b}} à résultat", "dire résultat"] },
        tags: ["scratch", "programme"]
      },
      {
        title: "Condition simple",
        subdomain: chapter.title,
        statementTemplate: "Si $n={{n}}$, la condition $n>{{limit}}$ est-elle vraie ?",
        answerTemplate: "{{n>limit ? 'Oui' : 'Non'}}",
        correctionTemplate: "On compare ${{n}}$ et ${{limit}}$ : la condition est {{n>limit ? 'vraie' : 'fausse'}}.",
        variablesSchema: { n: { type: "int", min: 1, max: 30 }, limit: { type: "choice", values: [10, 15, 20] } },
        figureTemplate: { kind: "scratch", blocks: ["si n > {{limit}} alors", "dire vrai", "sinon", "dire faux"] },
        tags: ["scratch", "condition"]
      },
      {
        title: "Boucle de d?placement",
        subdomain: chapter.title,
        statementTemplate: "Un lutin avance de ${{step}}$ pas, répété ${{repeat}}$ fois. Distance totale ?",
        answerTemplate: "{{step*repeat}} pas",
        correctionTemplate: "La boucle r?p?te le m?me d?placement : ${{repeat}}\\times {{step}}={{step*repeat}}$ pas.",
        variablesSchema: { step: { type: "choice", values: [5, 10, 15, 20] }, repeat: { type: "int", min: 3, max: 12 } },
        figureTemplate: { kind: "scratch", blocks: ["r?p?ter {{repeat}} fois", "avancer de {{step}} pas"] },
        tags: ["scratch", "boucle", "deplacement"]
      }
    ];
  }

  return common;
}

function reinforcementTemplates(chapter: ChapterInfo): TemplateSeed[] {
  const title = chapter.title.toLowerCase();

  const arithmetic: TemplateSeed[] = [
    {
      title: "Complement rapide",
      subdomain: chapter.title,
      statementTemplate: "Completer : ${{a}}+\\Box={{target}}$.",
      answerTemplate: "{{target-a}}",
      correctionTemplate: "$ {{target}}-{{a}}={{target-a}} $, donc $\\Box={{target-a}}$.",
      variablesSchema: { a: { type: "int", min: 10, max: 99 }, target: { type: "choice", values: [100, 500, 1000] } },
      tags: ["calcul", "mental"]
    },
    {
      title: "Division avec reste",
      subdomain: chapter.title,
      statementTemplate: "Effectuer la division euclidienne de ${{b*q+r}}$ par ${{b}}$.",
      answerTemplate: "quotient {{q}}, reste {{r}}",
      correctionTemplate: "$ {{b*q+r}}={{b}}\\times {{q}}+{{r}}$ avec ${{r}}<{{b}}$.",
      variablesSchema: { b: { type: "int", min: 4, max: 13 }, q: { type: "int", min: 5, max: 24 }, r: { type: "int", min: 0, max: 3 } },
      tags: ["division", "euclidienne"]
    },
    {
      title: "Multiple ou non",
      subdomain: chapter.title,
      statementTemplate: "$ {{a*b+c}} $ est-il un multiple de ${{a}}$ ?",
      answerTemplate: "{{c===0 ? 'Oui' : 'Non'}}",
      correctionTemplate: "$ {{a*b+c}}={{a}}\\times {{b}}{{c===0 ? '' : '+'+c}}$. Le reste vaut ${{c}}$.",
      variablesSchema: { a: { type: "int", min: 3, max: 12 }, b: { type: "int", min: 4, max: 18 }, c: { type: "choice", values: [0, 1, 2] } },
      tags: ["multiples", "divisibilite"]
    },
    {
      title: "Critere de divisibilite par 3",
      subdomain: chapter.title,
      statementTemplate: "$ {{100*a+10*b+c}} $ est-il divisible par $3$ ?",
      answerTemplate: "{{(a+b+c)%3===0 ? 'Oui' : 'Non'}}",
      correctionTemplate: "Somme des chiffres : ${{a}}+{{b}}+{{c}}={{a+b+c}}$. Elle {{(a+b+c)%3===0 ? 'est' : 'n est pas'}} multiple de $3$.",
      variablesSchema: { a: { type: "int", min: 1, max: 9 }, b: { type: "int", min: 0, max: 9 }, c: { type: "int", min: 0, max: 9 } },
      tags: ["divisibilite", "arithmetique"]
    },
    {
      title: "Produit astucieux",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{a}}\\times {{b+c}}$ mentalement.",
      answerTemplate: "{{a*(b+c)}}",
      correctionTemplate: "$ {{a}}\\times {{b+c}}={{a}}\\times {{b}}+{{a}}\\times {{c}}={{a*b}}+{{a*c}}={{a*(b+c)}}$.",
      variablesSchema: { a: { type: "int", min: 6, max: 18 }, b: { type: "choice", values: [10, 20, 50, 100] }, c: { type: "int", min: 1, max: 9 } },
      tags: ["distributivite", "mental"]
    },
    {
      title: "Priorite courte",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{a}}+{{b}}\\times {{c}}-{{d}}$.",
      answerTemplate: "{{a+b*c-d}}",
      correctionTemplate: "On commence par ${{b}}\\times {{c}}={{b*c}}$, puis ${{a}}+{{b*c}}-{{d}}={{a+b*c-d}}$.",
      variablesSchema: { a: { type: "int", min: 4, max: 30 }, b: { type: "int", min: 2, max: 12 }, c: { type: "int", min: 2, max: 12 }, d: { type: "int", min: 1, max: 20 } },
      tags: ["priorites", "calcul"]
    },
    {
      title: "Carre connu",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{n}}^2$.",
      answerTemplate: "{{n*n}}",
      correctionTemplate: "$ {{n}}^2={{n}}\\times {{n}}={{n*n}}$.",
      variablesSchema: { n: { type: "int", min: 8, max: 25 } },
      tags: ["carres", "mental"]
    },
    {
      title: "PGCD lisible",
      subdomain: chapter.title,
      statementTemplate: "Determiner le PGCD de ${{a*k}}$ et ${{b*k}}$.",
      answerTemplate: "{{k}}",
      correctionTemplate: "$ {{a*k}}={{k}}\\times {{a}}$ et ${{b*k}}={{k}}\\times {{b}}$. Comme ${{a}}$ et ${{b}}$ sont premiers entre eux, le PGCD est ${{k}}$.",
      variablesSchema: { a: { type: "choice", values: [2, 3, 4, 5] }, b: { type: "choice", values: [7, 11] }, k: { type: "int", min: 3, max: 15 } },
      tags: ["arithmetique", "pgcd"]
    },
    {
      title: "Relatifs enchaînés",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{a}}-{{b}}+{{c}}$.",
      answerTemplate: "{{a-b+c}}",
      correctionTemplate: "$ {{a}}-{{b}}={{a-b}}$, puis ${{a-b}}+{{c}}={{a-b+c}}$.",
      variablesSchema: { a: { type: "int", min: -15, max: 18 }, b: { type: "int", min: 2, max: 24 }, c: { type: "int", min: -10, max: 16 } },
      tags: ["relatifs", "calcul"]
    },
    {
      title: "Produit de relatifs",
      subdomain: chapter.title,
      statementTemplate: "Calculer $(-{{a}})\\times {{b}}$.",
      answerTemplate: "{{-a*b}}",
      correctionTemplate: "Un produit negatif par positif est negatif : $(-{{a}})\\times {{b}}=-{{a*b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 15 }, b: { type: "int", min: 2, max: 12 } },
      tags: ["relatifs", "signes"]
    },
    {
      title: "Encadrement entier",
      subdomain: chapter.title,
      statementTemplate: "Encadrer ${{a*b+r}}/{{a}}$ entre deux entiers consecutifs.",
      answerTemplate: "{{b}} et {{b+1}}",
      correctionTemplate: "$ {{a*b}}<{{a*b+r}}<{{a*(b+1)}}$, donc ${{b}}<{{a*b+r}}/{{a}}<{{b+1}}$.",
      variablesSchema: { a: { type: "int", min: 4, max: 12 }, b: { type: "int", min: 2, max: 18 }, r: { type: "int", min: 1, max: 3 } },
      tags: ["division", "ordre"]
    },
    {
      title: "Nombre manquant",
      subdomain: chapter.title,
      statementTemplate: "Trouver $x$ : ${{a}}\\times x={{a*b}}$.",
      answerTemplate: "{{b}}",
      correctionTemplate: "$x={{a*b}}\\div {{a}}={{b}}$.",
      variablesSchema: { a: { type: "int", min: 3, max: 14 }, b: { type: "int", min: 4, max: 18 } },
      tags: ["equation", "calcul"]
    }
  ];

  const decimals: TemplateSeed[] = [
    {
      title: "Rang decimal",
      subdomain: chapter.title,
      statementTemplate: "Dans ${{formatDecimalFrench(a)}}$, quel chiffre est au rang des dixiemes ?",
      answerTemplate: "{{Math.floor(a*10)%10}}",
      correctionTemplate: "Le chiffre juste apres la virgule est ${{Math.floor(a*10)%10}}$.",
      variablesSchema: { a: { type: "decimal", min: 2.1, max: 98.9, decimals: 2 } },
      tags: ["decimaux", "numeration"]
    },
    {
      title: "Comparer des decimaux",
      subdomain: chapter.title,
      statementTemplate: "Comparer : ${{formatDecimalFrench(a)}}$ ... ${{formatDecimalFrench(b)}}$.",
      answerTemplate: "{{a<b ? '<' : a>b ? '>' : '='}}",
      correctionTemplate: "On compare les parties entieres puis les dixiemes : ${{formatDecimalFrench(a)}} {{a<b ? '<' : a>b ? '>' : '='}} {{formatDecimalFrench(b)}}$.",
      variablesSchema: { a: { type: "decimal", min: 1.1, max: 45.9, decimals: 1 }, b: { type: "decimal", min: 1.1, max: 45.9, decimals: 1 } },
      tags: ["decimaux", "ordre"]
    },
    {
      title: "Dixieme vers fraction",
      subdomain: chapter.title,
      statementTemplate: "Ecrire ${{formatDecimalFrench(a/10)}}$ sous forme de fraction decimale.",
      answerTemplate: "{{a}}/10",
      correctionTemplate: "$ {{formatDecimalFrench(a/10)}}=\\dfrac{ {{a}} }{10}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 99 } },
      tags: ["decimaux", "fractions"]
    },
    {
      title: "Multiplier par 0,1",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{formatDecimalFrench(a)}}\\times 0,1$.",
      answerTemplate: "{{formatDecimalFrench(a*0.1)}}",
      correctionTemplate: "Multiplier par $0,1$ revient a diviser par $10$ : ${{formatDecimalFrench(a*0.1)}}$.",
      variablesSchema: { a: { type: "decimal", min: 12, max: 980, decimals: 1 } },
      tags: ["decimaux", "calcul"]
    },
    {
      title: "Quotient par 100",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{formatDecimalFrench(a)}}\\div 100$.",
      answerTemplate: "{{formatDecimalFrench(a/100)}}",
      correctionTemplate: "Diviser par $100$ decale la virgule de deux rangs : ${{formatDecimalFrench(a/100)}}$.",
      variablesSchema: { a: { type: "decimal", min: 30, max: 950, decimals: 1 } },
      tags: ["decimaux", "calcul"]
    },
    {
      title: "Addition posee mentalement",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{formatDecimalFrench(a)}}+{{formatDecimalFrench(b)}}$.",
      answerTemplate: "{{formatDecimalFrench(a+b)}}",
      correctionTemplate: "On additionne les parties decimales de meme rang : ${{formatDecimalFrench(a)}}+{{formatDecimalFrench(b)}}={{formatDecimalFrench(a+b)}}$.",
      variablesSchema: { a: { type: "decimal", min: 4.2, max: 60.8, decimals: 1 }, b: { type: "decimal", min: 1.3, max: 24.7, decimals: 1 } },
      tags: ["decimaux", "addition"]
    },
    {
      title: "Soustraction decimale",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{formatDecimalFrench(a+b)}}-{{formatDecimalFrench(b)}}$.",
      answerTemplate: "{{formatDecimalFrench(a)}}",
      correctionTemplate: "$ {{formatDecimalFrench(a+b)}}-{{formatDecimalFrench(b)}}={{formatDecimalFrench(a)}}$.",
      variablesSchema: { a: { type: "decimal", min: 5.2, max: 52.8, decimals: 1 }, b: { type: "decimal", min: 1.1, max: 18.9, decimals: 1 } },
      tags: ["decimaux", "soustraction"]
    },
    {
      title: "Arrondi a l unite",
      subdomain: chapter.title,
      statementTemplate: "Arrondir ${{formatDecimalFrench(a)}}$ a l'unite.",
      answerTemplate: "{{Math.round(a)}}",
      correctionTemplate: "Le chiffre des dixiemes decide : ${{formatDecimalFrench(a)}}$ s'arrondit a ${{Math.round(a)}}$.",
      variablesSchema: { a: { type: "decimal", min: 2.1, max: 99.9, decimals: 1 } },
      tags: ["decimaux", "arrondi"]
    },
    {
      title: "Produit decimal entier",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{formatDecimalFrench(a/10)}}\\times {{b}}$.",
      answerTemplate: "{{formatDecimalFrench((a/10)*b)}}",
      correctionTemplate: "$ {{formatDecimalFrench(a/10)}}\\times {{b}}={{formatDecimalFrench((a/10)*b)}}$.",
      variablesSchema: { a: { type: "int", min: 12, max: 95 }, b: { type: "int", min: 2, max: 9 } },
      tags: ["decimaux", "multiplication"]
    },
    {
      title: "Ordre de grandeur",
      subdomain: chapter.title,
      statementTemplate: "Donner un ordre de grandeur de ${{formatDecimalFrench(a)}}+{{formatDecimalFrench(b)}}$.",
      answerTemplate: "{{Math.round(a)+Math.round(b)}}",
      correctionTemplate: "$ {{formatDecimalFrench(a)}}\\approx {{Math.round(a)}}$ et ${{formatDecimalFrench(b)}}\\approx {{Math.round(b)}}$, donc l'ordre de grandeur est ${{Math.round(a)+Math.round(b)}}$.",
      variablesSchema: { a: { type: "decimal", min: 4.2, max: 80.8, decimals: 1 }, b: { type: "decimal", min: 2.1, max: 45.9, decimals: 1 } },
      tags: ["decimaux", "estimation"]
    },
    {
      title: "Decomposition decimale",
      subdomain: chapter.title,
      statementTemplate: "Completer : ${{formatDecimalFrench(u+d/10)}}={{u}}+\\Box$.",
      answerTemplate: "{{formatDecimalFrench(d/10)}}",
      correctionTemplate: "$ {{formatDecimalFrench(u+d/10)}}={{u}}+{{formatDecimalFrench(d/10)}}$.",
      variablesSchema: { u: { type: "int", min: 2, max: 80 }, d: { type: "int", min: 1, max: 9 } },
      tags: ["decimaux", "decomposition"]
    },
    {
      title: "Ecriture au centieme",
      subdomain: chapter.title,
      statementTemplate: "Ecrire ${{formatDecimalFrench(a/100)}}$ en centiemes.",
      answerTemplate: "{{a}} centiemes",
      correctionTemplate: "$ {{formatDecimalFrench(a/100)}}=\\dfrac{ {{a}} }{100}$, donc ${{a}}$ centiemes.",
      variablesSchema: { a: { type: "int", min: 11, max: 99 } },
      tags: ["decimaux", "fractions-decimales"]
    }
  ];

  const fractions: TemplateSeed[] = [
    {
      title: "Fraction d'une quantite",
      subdomain: chapter.title,
      statementTemplate: "Calculer $\\dfrac{ {{num}} }{ {{den}} }$ de ${{den*c}}$.",
      answerTemplate: "{{num*c}}",
      correctionTemplate: "$\\dfrac{1}{ {{den}} }$ de ${{den*c}}$ vaut ${{c}}$, donc $\\dfrac{ {{num}} }{ {{den}} }$ vaut ${{num}}\\times {{c}}={{num*c}}$.",
      variablesSchema: { num: { type: "int", min: 2, max: 7 }, den: { type: "choice", values: [3, 4, 5, 6, 8, 10] }, c: { type: "int", min: 3, max: 18 } },
      tags: ["fractions", "partage"]
    },
    {
      title: "Fraction equivalente",
      subdomain: chapter.title,
      statementTemplate: "Completer : $\\dfrac{ {{a}} }{ {{b}} }=\\dfrac{ {{a*k}} }{ \\Box }$.",
      answerTemplate: "{{b*k}}",
      correctionTemplate: "Le numerateur est multiplie par ${{k}}$, donc le denominateur aussi : ${{b}}\\times {{k}}={{b*k}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 9 }, b: { type: "int", min: 2, max: 12 }, k: { type: "int", min: 2, max: 8 } },
      tags: ["fractions", "egalite"]
    },
    {
      title: "Simplification directe",
      subdomain: chapter.title,
      statementTemplate: "Simplifier $\\dfrac{ {{a*k}} }{ {{b*k}} }$.",
      answerTemplate: "{{formatFraction(a*k,b*k)}}",
      correctionTemplate: "On divise par ${{k}}$ : $\\dfrac{ {{a*k}} }{ {{b*k}} }=\\dfrac{ {{a}} }{ {{b}} }={{formatFraction(a*k,b*k)}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 3, max: 13 }, k: { type: "int", min: 2, max: 9 } },
      tags: ["fractions", "simplification"]
    },
    {
      title: "Somme meme denominateur",
      subdomain: chapter.title,
      statementTemplate: "Calculer $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ {{b}} }{ {{den}} }$.",
      answerTemplate: "{{formatFraction(a+b,den)}}",
      correctionTemplate: "Meme denominateur : $\\dfrac{ {{a}}+{{b}} }{ {{den}} }=\\dfrac{ {{a+b}} }{ {{den}} }={{formatFraction(a+b,den)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 8 }, b: { type: "int", min: 1, max: 8 }, den: { type: "int", min: 4, max: 14 } },
      tags: ["fractions", "addition"]
    },
    {
      title: "Difference meme denominateur",
      subdomain: chapter.title,
      statementTemplate: "Calculer $\\dfrac{ {{a+b}} }{ {{den}} }-\\dfrac{ {{b}} }{ {{den}} }$.",
      answerTemplate: "{{formatFraction(a,den)}}",
      correctionTemplate: "$\\dfrac{ {{a+b}}-{{b}} }{ {{den}} }=\\dfrac{ {{a}} }{ {{den}} }={{formatFraction(a,den)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 8 }, b: { type: "int", min: 1, max: 8 }, den: { type: "int", min: 5, max: 15 } },
      tags: ["fractions", "soustraction"]
    },
    {
      title: "Produit de fractions",
      subdomain: chapter.title,
      statementTemplate: "Calculer $\\dfrac{ {{a}} }{ {{b}} }\\times \\dfrac{ {{c}} }{ {{d}} }$.",
      answerTemplate: "{{formatFraction(a*c,b*d)}}",
      correctionTemplate: "On multiplie numerateurs et denominateurs : $\\dfrac{ {{a*c}} }{ {{b*d}} }={{formatFraction(a*c,b*d)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 8 }, b: { type: "int", min: 2, max: 10 }, c: { type: "int", min: 1, max: 8 }, d: { type: "int", min: 2, max: 10 } },
      tags: ["fractions", "produit"]
    },
    {
      title: "Quotient de fractions",
      subdomain: chapter.title,
      statementTemplate: "Calculer $\\dfrac{ {{a}} }{ {{b}} }\\div \\dfrac{ {{c}} }{ {{d}} }$.",
      answerTemplate: "{{formatFraction(a*d,b*c)}}",
      correctionTemplate: "Diviser par une fraction, c'est multiplier par son inverse : $\\dfrac{ {{a}} }{ {{b}} }\\times \\dfrac{ {{d}} }{ {{c}} }={{formatFraction(a*d,b*c)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 8 }, b: { type: "int", min: 2, max: 10 }, c: { type: "int", min: 1, max: 8 }, d: { type: "int", min: 2, max: 10 } },
      tags: ["fractions", "division"]
    },
    {
      title: "Comparer au meme denominateur",
      subdomain: chapter.title,
      statementTemplate: "Comparer : $\\dfrac{ {{a}} }{ {{den}} }$ ... $\\dfrac{ {{b}} }{ {{den}} }$.",
      answerTemplate: "{{a<b ? '<' : a>b ? '>' : '='}}",
      correctionTemplate: "A denominateur egal, on compare les numerateurs : ${{a}} {{a<b ? '<' : a>b ? '>' : '='}} {{b}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 12 }, b: { type: "int", min: 1, max: 12 }, den: { type: "int", min: 5, max: 16 } },
      tags: ["fractions", "comparaison"]
    },
    {
      title: "Fraction et decimal",
      subdomain: chapter.title,
      statementTemplate: "Ecrire $\\dfrac{ {{a}} }{10}$ sous forme decimale.",
      answerTemplate: "{{formatDecimalFrench(a/10)}}",
      correctionTemplate: "$\\dfrac{ {{a}} }{10}={{formatDecimalFrench(a/10)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 99 } },
      tags: ["fractions", "decimaux"]
    },
    {
      title: "Prendre le complement a 1",
      subdomain: chapter.title,
      statementTemplate: "Calculer $1-\\dfrac{ {{a}} }{ {{den}} }$.",
      answerTemplate: "{{formatFraction(den-a,den)}}",
      correctionTemplate: "$1=\\dfrac{ {{den}} }{ {{den}} }$, donc $1-\\dfrac{ {{a}} }{ {{den}} }=\\dfrac{ {{den-a}} }{ {{den}} }={{formatFraction(den-a,den)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 8 }, den: { type: "int", min: 9, max: 16 } },
      tags: ["fractions", "complement"]
    },
    {
      title: "Fraction irreductible",
      subdomain: chapter.title,
      statementTemplate: "$\\dfrac{ {{a}} }{ {{b}} }$ est-elle deja irreductible ?",
      answerTemplate: "{{gcd(a,b)===1 ? 'Oui' : 'Non'}}",
      correctionTemplate: "On calcule le PGCD : $PGCD({{a}},{{b}})={{gcd(a,b)}}$. La fraction {{gcd(a,b)===1 ? 'est' : 'n est pas'}} irreductible.",
      variablesSchema: { a: { type: "int", min: 2, max: 18 }, b: { type: "int", min: 3, max: 24 } },
      tags: ["fractions", "pgcd"]
    },
    {
      title: "Nombre fractionnaire",
      subdomain: chapter.title,
      statementTemplate: "Ecrire ${{q}}+\\dfrac{ {{r}} }{ {{den}} }$ sous forme d'une seule fraction.",
      answerTemplate: "{{formatFraction(q*den+r,den)}}",
      correctionTemplate: "$ {{q}}=\\dfrac{ {{q*den}} }{ {{den}} }$, donc ${{q}}+\\dfrac{ {{r}} }{ {{den}} }={{formatFraction(q*den+r,den)}}$.",
      variablesSchema: { q: { type: "int", min: 1, max: 8 }, r: { type: "int", min: 1, max: 8 }, den: { type: "int", min: 3, max: 12 } },
      tags: ["fractions", "ecriture"]
    }
  ];

  const proportionality: TemplateSeed[] = [
    {
      title: "Coefficient de proportionnalite",
      subdomain: chapter.title,
      statementTemplate: "On passe de ${{a}}$ a ${{a*k}}$. Quel est le coefficient ?",
      answerTemplate: "{{k}}",
      correctionTemplate: "$ {{a}}\\times {{k}}={{a*k}}$, donc le coefficient est ${{k}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 18 }, k: { type: "int", min: 2, max: 12 } },
      tags: ["proportionnalite", "coefficient"]
    },
    {
      title: "Prix dans un tableau proportionnel",
      subdomain: chapter.title,
      statementTemplate: "$ {{a}}$ objets coutent ${{a*p}}$ euros. Combien coutent ${{b}}$ objets ?",
      answerTemplate: "{{b*p}} euros",
      correctionTemplate: "Prix unitaire : ${{a*p}}\\div {{a}}={{p}}$. Donc ${{b}}\\times {{p}}={{b*p}}$ euros.",
      variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 3, max: 15 }, p: { type: "int", min: 2, max: 12 } },
      tags: ["proportionnalite", "prix"]
    },
    {
      title: "Produit en croix",
      subdomain: chapter.title,
      statementTemplate: "Completer : $\\dfrac{ {{a}} }{ {{b}} }=\\dfrac{ x }{ {{b*k}} }$.",
      answerTemplate: "{{a*k}}",
      correctionTemplate: "$x={{a}}\\times {{k}}={{a*k}}$ car le denominateur est multiplie par ${{k}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 15 }, b: { type: "int", min: 3, max: 18 }, k: { type: "int", min: 2, max: 8 } },
      tags: ["produit-en-croix", "proportionnalite"]
    },
    {
      title: "Pourcentage d'une quantite",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{p}}\\%$ de ${{q}}$.",
      answerTemplate: "{{p*q/100}}",
      correctionTemplate: "$ {{p}}\\% = \\dfrac{ {{p}} }{100}$, donc $\\dfrac{ {{p}} }{100}\\times {{q}}={{p*q/100}}$.",
      variablesSchema: { p: { type: "choice", values: [5, 10, 20, 25, 50, 75] }, q: { type: "choice", values: [80, 120, 160, 200, 240, 360] } },
      tags: ["pourcentage"]
    },
    {
      title: "Retrouver le total",
      subdomain: chapter.title,
      statementTemplate: "$ {{p}}\\%$ d'un total vaut ${{p*q/100}}$. Quel est le total ?",
      answerTemplate: "{{q}}",
      correctionTemplate: "Si ${{p}}\\%$ vaut ${{p*q/100}}$, alors le total vaut ${{p*q/100}}\\times 100\\div {{p}}={{q}}$.",
      variablesSchema: { p: { type: "choice", values: [10, 20, 25, 50] }, q: { type: "choice", values: [80, 120, 160, 200, 300] } },
      tags: ["pourcentage", "inverse"]
    },
    {
      title: "Echelle",
      subdomain: chapter.title,
      statementTemplate: "A l'echelle $1:{{scale}}$, ${{map}}$ cm sur le plan representent combien de cm reels ?",
      answerTemplate: "{{map*scale}} cm",
      correctionTemplate: "$ {{map}}\\times {{scale}}={{map*scale}}$ cm reels.",
      variablesSchema: { scale: { type: "choice", values: [50, 100, 200, 500] }, map: { type: "int", min: 2, max: 12 } },
      tags: ["echelle", "proportionnalite"]
    },
    {
      title: "Vitesse moyenne",
      subdomain: chapter.title,
      statementTemplate: "On parcourt ${{d}}$ km en ${{t}}$ h. Quelle est la vitesse moyenne ?",
      answerTemplate: "{{d/t}} km/h",
      correctionTemplate: "$v=d\\div t={{d}}\\div {{t}}={{d/t}}$ km/h.",
      variablesSchema: { d: { type: "choice", values: [12, 18, 24, 30, 42, 60] }, t: { type: "choice", values: [1, 2, 3] } },
      tags: ["vitesse", "grandeurs-composees"]
    },
    {
      title: "Tableau proportionnel",
      subdomain: chapter.title,
      statementTemplate: "Dans un tableau proportionnel, ${{a}}$ correspond à ${{b}}$. À quoi correspond ${{a*k}}$ ?",
      answerTemplate: "{{b*k}}",
      correctionTemplate: "La premiere ligne est multipliee par ${{k}}$, donc la deuxieme aussi : ${{b}}\\times {{k}}={{b*k}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 15 }, b: { type: "int", min: 3, max: 20 }, k: { type: "int", min: 2, max: 8 } },
      tags: ["tableau", "proportionnalite"]
    },
    {
      title: "Augmentation en pourcentage",
      subdomain: chapter.title,
      statementTemplate: "Augmenter ${{q}}$ de ${{p}}\\%$.",
      answerTemplate: "{{q + p*q/100}}",
      correctionTemplate: "Hausse : ${{p}}\\%$ de ${{q}}$ vaut ${{p*q/100}}$. Nouveau montant : ${{q}}+{{p*q/100}}={{q+p*q/100}}$.",
      variablesSchema: { p: { type: "choice", values: [5, 10, 20, 25] }, q: { type: "choice", values: [80, 120, 160, 200, 240] } },
      tags: ["pourcentage", "evolution"]
    },
    {
      title: "Reduction en pourcentage",
      subdomain: chapter.title,
      statementTemplate: "Reduire ${{q}}$ de ${{p}}\\%$.",
      answerTemplate: "{{q - p*q/100}}",
      correctionTemplate: "Reduction : ${{p*q/100}}$. Nouveau montant : ${{q}}-{{p*q/100}}={{q-p*q/100}}$.",
      variablesSchema: { p: { type: "choice", values: [5, 10, 20, 25, 50] }, q: { type: "choice", values: [80, 120, 160, 200, 300] } },
      tags: ["pourcentage", "evolution"]
    },
    {
      title: "Unite constante",
      subdomain: chapter.title,
      statementTemplate: "$ {{a}}$ kg coutent ${{a*p}}$ euros. Quel est le prix de $1$ kg ?",
      answerTemplate: "{{p}} euros",
      correctionTemplate: "$ {{a*p}}\\div {{a}}={{p}}$ euros par kg.",
      variablesSchema: { a: { type: "int", min: 2, max: 12 }, p: { type: "int", min: 2, max: 15 } },
      tags: ["prix-unitaire", "proportionnalite"]
    },
    {
      title: "Reconnaissance proportionnelle",
      subdomain: chapter.title,
      statementTemplate: "Les couples $({{a}};{{a*k}})$ et $({{b}};{{b*k+c}})$ sont-ils proportionnels avec le meme coefficient ?",
      answerTemplate: "{{c===0 ? 'Oui' : 'Non'}}",
      correctionTemplate: "Premier coefficient : ${{k}}$. Deuxieme image attendue : ${{b}}\\times {{k}}={{b*k}}$, or on a ${{b*k+c}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 12 }, b: { type: "int", min: 3, max: 14 }, k: { type: "int", min: 2, max: 8 }, c: { type: "choice", values: [0, 1, 2] } },
      tags: ["proportionnalite", "reconnaissance"]
    }
  ];

  const measurements: TemplateSeed[] = [
    {
      title: "Perimetre rectangle",
      subdomain: chapter.title,
      statementTemplate: "Calculer le perimetre du rectangle.",
      answerTemplate: "{{2*(l+w)}} cm",
      correctionTemplate: "$P=2\\times ({{l}}+{{w}})=2\\times {{l+w}}={{2*(l+w)}}$ cm.",
      variablesSchema: { l: { type: "int", min: 5, max: 24 }, w: { type: "int", min: 3, max: 16 } },
      figureTemplate: { kind: "rectangle", widthLabel: "{{l}} cm", heightLabel: "{{w}} cm" },
      tags: ["perimetre", "figure"]
    },
    {
      title: "Aire rectangle",
      subdomain: chapter.title,
      statementTemplate: "Calculer l'aire du rectangle.",
      answerTemplate: "{{l*w}} cm2",
      correctionTemplate: "$\\mathcal{A}=L\\times l={{l}}\\times {{w}}={{l*w}}$ cm2.",
      variablesSchema: { l: { type: "int", min: 5, max: 24 }, w: { type: "int", min: 3, max: 16 } },
      figureTemplate: { kind: "rectangle", widthLabel: "{{l}} cm", heightLabel: "{{w}} cm" },
      tags: ["aire", "figure"]
    },
    {
      title: "Aire triangle",
      subdomain: chapter.title,
      statementTemplate: "Un triangle a pour base ${{b}}$ cm et hauteur ${{h}}$ cm. Calculer son aire.",
      answerTemplate: "{{b*h/2}} cm2",
      correctionTemplate: "$\\mathcal{A}=\\dfrac{\\text{base}\\times\\text{hauteur}}{2}=\\dfrac{ {{b}}\\times {{h}} }{2}={{b*h/2}}$ cm2.",
      variablesSchema: { b: { type: "choice", values: [6, 8, 10, 12, 14, 16] }, h: { type: "choice", values: [4, 6, 8, 10, 12] } },
      figureTemplate: { kind: "triangle", labelA: "base = {{b}} cm", labelB: "hauteur = {{h}} cm", labelC: "" },
      tags: ["aire", "triangle"]
    },
    {
      title: "Conversion longueur",
      subdomain: chapter.title,
      statementTemplate: "Convertir ${{m}}$ m en cm.",
      answerTemplate: "{{m*100}} cm",
      correctionTemplate: "$1$ m = $100$ cm, donc ${{m}}$ m = ${{m*100}}$ cm.",
      variablesSchema: { m: { type: "decimal", min: 0.4, max: 18.5, decimals: 1 } },
      tags: ["conversion", "longueur"]
    },
    {
      title: "Conversion aire",
      subdomain: chapter.title,
      statementTemplate: "Convertir ${{m}}$ m2 en cm2.",
      answerTemplate: "{{m*10000}} cm2",
      correctionTemplate: "$1$ m2 = $10 000$ cm2, donc ${{m}}$ m2 = ${{m*10000}}$ cm2.",
      variablesSchema: { m: { type: "choice", values: [1, 2, 3, 4, 5, 10] } },
      tags: ["conversion", "aire"]
    },
    {
      title: "Volume pave droit",
      subdomain: chapter.title,
      statementTemplate: "Calculer le volume du pave droit.",
      answerTemplate: "{{l*w*h}} cm3",
      correctionTemplate: "$V=L\\times l\\times h={{l}}\\times {{w}}\\times {{h}}={{l*w*h}}$ cm3.",
      variablesSchema: { l: { type: "int", min: 3, max: 12 }, w: { type: "int", min: 2, max: 10 }, h: { type: "int", min: 2, max: 9 } },
      figureTemplate: { kind: "solid", solid: "pave", labels: ["{{l}} cm", "{{w}} cm", "{{h}} cm"] },
      tags: ["volume", "solide"]
    },
    {
      title: "Volume prisme",
      subdomain: chapter.title,
      statementTemplate: "Un prisme a une aire de base ${{base}}$ cm2 et une hauteur ${{h}}$ cm. Volume ?",
      answerTemplate: "{{base*h}} cm3",
      correctionTemplate: "$V=\\mathcal{A}_{\\text{base}}\\times h={{base}}\\times {{h}}={{base*h}}$ cm3.",
      variablesSchema: { base: { type: "int", min: 8, max: 60 }, h: { type: "int", min: 3, max: 15 } },
      figureTemplate: { kind: "solid", solid: "prisme", labels: ["\\mathcal{A} de base = {{base}} cm²", "h = {{h}} cm"] },
      tags: ["volume", "prisme"]
    },
    {
      title: "Volume pyramide",
      subdomain: chapter.title,
      statementTemplate: "Une pyramide a une aire de base ${{base}}$ cm2 et une hauteur ${{h}}$ cm. Volume ?",
      answerTemplate: "{{base*h/3}} cm3",
      correctionTemplate: "$V=\\dfrac{\\mathcal{A}_{\\text{base}}\\times h}{3}=\\dfrac{ {{base}}\\times {{h}} }{3}={{base*h/3}}$ cm3.",
      variablesSchema: { base: { type: "choice", values: [12, 18, 24, 30, 36, 45] }, h: { type: "choice", values: [3, 6, 9, 12] } },
      figureTemplate: { kind: "solid", solid: "pyramide", labels: ["\\mathcal{A} de base = {{base}} cm²", "h = {{h}} cm"] },
      tags: ["volume", "pyramide"]
    },
    {
      title: "Volume cone",
      subdomain: chapter.title,
      statementTemplate: "Un cone a une aire de base ${{base}}$ cm2 et une hauteur ${{h}}$ cm. Volume ?",
      answerTemplate: "{{base*h/3}} cm3",
      correctionTemplate: "$V=\\dfrac{\\mathcal{A}_{\\text{base}}\\times h}{3}=\\dfrac{ {{base}}\\times {{h}} }{3}={{base*h/3}}$ cm3.",
      variablesSchema: { base: { type: "choice", values: [12, 18, 24, 30, 36, 45] }, h: { type: "choice", values: [3, 6, 9, 12] } },
      figureTemplate: { kind: "solid", solid: "cone", labels: ["\\mathcal{A} de base = {{base}} cm²", "h = {{h}} cm"] },
      tags: ["volume", "cone"]
    },
    {
      title: "Vitesse en km/h",
      subdomain: chapter.title,
      statementTemplate: "On parcourt ${{d}}$ km en ${{minutes}}$ min. Vitesse moyenne en km/h ?",
      answerTemplate: "{{roundTo(d*60/minutes,1)}} km/h",
      correctionTemplate: "$v={{d}}\\times60\\div{{minutes}}={{roundTo(d*60/minutes,1)}}$ km/h.",
      variablesSchema: { d: { type: "choice", values: [5, 8, 10, 12, 15, 20] }, minutes: { type: "choice", values: [15, 20, 30, 40] } },
      tags: ["vitesse", "grandeurs-composees"]
    },
    {
      title: "Masse volumique",
      subdomain: chapter.title,
      statementTemplate: "Un objet de volume ${{v}}$ cm3 a une masse de ${{v*rho}}$ g. Masse volumique ?",
      answerTemplate: "{{rho}} g/cm3",
      correctionTemplate: "$\\rho=m\\div V={{v*rho}}\\div {{v}}={{rho}}$ g/cm3.",
      variablesSchema: { v: { type: "int", min: 4, max: 30 }, rho: { type: "choice", values: [2, 3, 5, 8, 10] } },
      tags: ["grandeurs-composees", "quotient"]
    },
    {
      title: "Cercle perimetre",
      subdomain: chapter.title,
      statementTemplate: "Un cercle a pour rayon ${{r}}$ cm. Donner son perimetre en fonction de $\\pi$.",
      answerTemplate: "{{2*r}}π cm",
      correctionTemplate: "$P=2\\pi r=2\\pi\\times {{r}}={{2*r}}\\pi$ cm.",
      variablesSchema: { r: { type: "int", min: 2, max: 12 } },
      figureTemplate: { kind: "circle", radiusLabel: "{{r}} cm" },
      tags: ["cercle", "perimetre"]
    }
  ];

  const geometry: TemplateSeed[] = [
    {
      title: "Somme des angles",
      subdomain: chapter.title,
      statementTemplate: "Dans un triangle, deux angles mesurent ${{a}}^\\circ$ et ${{b}}^\\circ$. Calculer le troisieme.",
      answerTemplate: "{{180-a-b}} degres",
      correctionTemplate: "La somme vaut $180^\\circ$ : $180-{{a}}-{{b}}={{180-a-b}}^\\circ$.",
      variablesSchema: { a: { type: "int", min: 35, max: 80 }, b: { type: "int", min: 35, max: 80 } },
      figureTemplate: { kind: "triangle", labelA: "{{a}} deg", labelB: "{{b}} deg", labelC: "?" },
      tags: ["angles", "triangle", "figure"]
    },
    {
      title: "Angles paralleles",
      subdomain: chapter.title,
      statementTemplate: "Deux droites parallèles sont coupées par une sécante. Un angle vaut ${{a}}^\\circ$. L'angle correspondant vaut ?",
      answerTemplate: "{{a}}°",
      correctionTemplate: "Des angles correspondants formés par deux parallèles ont la même mesure : ${{a}}^\\circ$.",
      variablesSchema: { a: { type: "int", min: 35, max: 145 } },
      figureTemplate: { kind: "parallel-lines", angleLabel: "{{a}}°", anglePair: "corresponding" },
      tags: ["angles", "paralleles", "figure"]
    },
    {
      title: "Angle supplementaire",
      subdomain: chapter.title,
      statementTemplate: "Deux angles adjacents forment un angle plat. L'un vaut ${{a}}^\\circ$. L'autre vaut ?",
      answerTemplate: "{{180-a}} degres",
      correctionTemplate: "Un angle plat mesure $180^\\circ$, donc $180-{{a}}={{180-a}}^\\circ$.",
      variablesSchema: { a: { type: "int", min: 35, max: 145 } },
      tags: ["angles", "supplementaires"]
    },
    {
      title: "Triangle constructible",
      subdomain: chapter.title,
      statementTemplate: "Peut-on construire un triangle de côtés {{a}} cm, {{b}} cm et {{c}} cm ?",
      answerTemplate: "{{a+b>c && a+c>b && b+c>a ? 'Oui' : 'Non'}}",
      correctionTemplate: "On verifie l'inegalite triangulaire : le plus grand cote doit etre inferieur a la somme des deux autres.",
      variablesSchema: { a: { type: "int", min: 3, max: 12 }, b: { type: "int", min: 3, max: 12 }, c: { type: "int", min: 4, max: 18 } },
      tags: ["inegalite-triangulaire", "construction"]
    },
    {
      title: "Perpendiculaires",
      subdomain: chapter.title,
      statementTemplate: "Si $(d)\\perp (e)$ et $(e)\\parallel (f)$, que peut-on dire de $(d)$ et $(f)$ ?",
      answerTemplate: "Elles sont perpendiculaires",
      correctionTemplate: "Une droite perpendiculaire a l'une de deux droites paralleles est perpendiculaire a l'autre.",
      variablesSchema: {},
      tags: ["perpendiculaires", "paralleles"]
    },
    {
      title: "Parallelogramme cote oppose",
      subdomain: chapter.title,
      statementTemplate: "Dans un parallelogramme $ABCD$, $AB={{a}}$ cm. Quelle est la longueur $CD$ ?",
      answerTemplate: "{{a}} cm",
      correctionTemplate: "Dans un parallelogramme, les cotes opposes sont de meme longueur, donc $CD=AB={{a}}$ cm.",
      variablesSchema: { a: { type: "int", min: 3, max: 18 } },
      tags: ["parallelogramme", "propriete"]
    },
    {
      title: "Parallelogramme angle oppose",
      subdomain: chapter.title,
      statementTemplate: "Dans un parallelogramme, un angle mesure ${{a}}^\\circ$. L'angle oppose mesure ?",
      answerTemplate: "{{a}} degres",
      correctionTemplate: "Dans un parallelogramme, les angles opposes sont egaux : ${{a}}^\\circ$.",
      variablesSchema: { a: { type: "int", min: 45, max: 135 } },
      tags: ["parallelogramme", "angles"]
    },
    {
      title: "Symetrie axiale",
      subdomain: chapter.title,
      statementTemplate: "Le point $A'$ est le symetrique de $A$ par rapport a une droite. Si $AA'={{2*d}}$ cm, quelle est la distance de $A$ a l'axe ?",
      answerTemplate: "{{d}} cm",
      correctionTemplate: "L'axe de symetrie est la mediatrice de $[AA']$, donc la distance vaut la moitie : ${{2*d}}\\div 2={{d}}$ cm.",
      variablesSchema: { d: { type: "int", min: 2, max: 12 } },
      tags: ["symetrie", "mediatrice"]
    },
    {
      title: "Mediatrice",
      subdomain: chapter.title,
      statementTemplate: "Un point $M$ est sur la mediatrice de $[AB]$. Si $MA={{a}}$ cm, que vaut $MB$ ?",
      answerTemplate: "{{a}} cm",
      correctionTemplate: "Tout point de la mediatrice de $[AB]$ est equidistant de $A$ et de $B$, donc $MB=MA={{a}}$ cm.",
      variablesSchema: { a: { type: "int", min: 3, max: 20 } },
      tags: ["mediatrice", "equidistance"]
    },
    {
      title: "Translation coordonnees",
      subdomain: chapter.title,
      statementTemplate: "Le point $A({{x}};{{y}})$ est translate par le vecteur $({{u}};{{v}})$. Coordonnees de l'image ?",
      answerTemplate: "({{x+u}};{{y+v}})",
      correctionTemplate: "On ajoute les coordonnees du vecteur : $({{x}}+{{u}};{{y}}+{{v}})=({{x+u}};{{y+v}})$.",
      variablesSchema: { x: { type: "int", min: -6, max: 8 }, y: { type: "int", min: -6, max: 8 }, u: { type: "int", min: -5, max: 5 }, v: { type: "int", min: -5, max: 5 } },
      tags: ["translation", "vecteur"]
    },
    {
      title: "Homothetie longueur",
      subdomain: chapter.title,
      statementTemplate: "Une homothetie de rapport ${{k}}$ transforme une longueur de ${{a}}$ cm. Image de la longueur ?",
      answerTemplate: "{{a*k}} cm",
      correctionTemplate: "Les longueurs sont multipliees par le rapport : ${{a}}\\times {{k}}={{a*k}}$ cm.",
      variablesSchema: { a: { type: "int", min: 2, max: 18 }, k: { type: "choice", values: [2, 3, 4, 0.5] } },
      tags: ["homothetie", "longueur"]
    },
    {
      title: "Reperage espace",
      subdomain: chapter.title,
      statementTemplate: "Dans l'espace, le point $A({{x}};{{y}};{{z}})$ monte de ${{h}}$ unités. Quelle est sa nouvelle coordonnée $z$ ?",
      answerTemplate: "{{z+h}}",
      correctionTemplate: "Monter agit sur la troisieme coordonnee : $z={{z}}+{{h}}={{z+h}}$.",
      variablesSchema: { x: { type: "int", min: -4, max: 4 }, y: { type: "int", min: -4, max: 4 }, z: { type: "int", min: -4, max: 4 }, h: { type: "int", min: 1, max: 8 } },
      tags: ["reperage", "espace"]
    }
  ];

  const pythagorean: TemplateSeed[] = [
    {
      title: "Egalite rectangle en A",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Le triangle $ABC$ est rectangle en $A$. Ecris l'egalite de Pythagore.",
      answerTemplate: "$BC^2=AB^2+AC^2$",
      correctionTemplate: "Le cote oppose a l'angle droit est $BC$, donc $BC^2=AB^2+AC^2$.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "AB", legBLabel: "AC", hypotenuseLabel: "BC" },
      tags: ["pythagore", "egalite", "redaction"]
    },
    {
      title: "Egalite rectangle en B",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Le triangle $ABC$ est rectangle en $B$. Ecris l'egalite de Pythagore.",
      answerTemplate: "$AC^2=AB^2+BC^2$",
      correctionTemplate: "Le cote oppose a l'angle droit est $AC$, donc $AC^2=AB^2+BC^2$.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "AB", legBLabel: "BC", hypotenuseLabel: "AC" },
      tags: ["pythagore", "egalite", "redaction"]
    },
    {
      title: "Egalite rectangle en C",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Le triangle $ABC$ est rectangle en $C$. Ecris l'egalite de Pythagore.",
      answerTemplate: "$AB^2=AC^2+BC^2$",
      correctionTemplate: "Le cote oppose a l'angle droit est $AB$, donc $AB^2=AC^2+BC^2$.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "AC", legBLabel: "BC", hypotenuseLabel: "AB" },
      tags: ["pythagore", "egalite", "redaction"]
    },
    {
      title: "Egalite rectangle en D",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Le triangle $DEF$ est rectangle en $D$. Ecris l'egalite de Pythagore.",
      answerTemplate: "$EF^2=DE^2+DF^2$",
      correctionTemplate: "Le cote oppose a l'angle droit est $EF$, donc $EF^2=DE^2+DF^2$.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "DE", legBLabel: "DF", hypotenuseLabel: "EF" },
      tags: ["pythagore", "egalite", "redaction"]
    },
    {
      title: "Completer une egalite",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Le triangle $RST$ est rectangle en $R$. Complete : $\\square^2=RS^2+RT^2$.",
      answerTemplate: "$ST$",
      correctionTemplate: "L'hypotenuse est $ST$, donc $ST^2=RS^2+RT^2$.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "RS", legBLabel: "RT", hypotenuseLabel: "ST" },
      tags: ["pythagore", "egalite", "redaction"]
    },
    {
      title: "Triplet 3-4-5 egalite",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Un triangle a pour cotes $3$, $4$ et $5$. Verifie l'egalite de Pythagore.",
      answerTemplate: "$3^2+4^2=5^2$",
      correctionTemplate: "$3^2+4^2=9+16=25$ et $5^2=25$.",
      variablesSchema: {},
      figureTemplate: { kind: "triangle", labelA: "3", labelB: "4", labelC: "5" },
      tags: ["pythagore", "triplet", "reciproque"]
    },
    {
      title: "Triplet 6-8-10 egalite",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Un triangle a pour cotes $6$, $8$ et $10$. Verifie l'egalite de Pythagore.",
      answerTemplate: "$6^2+8^2=10^2$",
      correctionTemplate: "$6^2+8^2=36+64=100$ et $10^2=100$.",
      variablesSchema: {},
      figureTemplate: { kind: "triangle", labelA: "6", labelB: "8", labelC: "10" },
      tags: ["pythagore", "triplet", "reciproque"]
    },
    {
      title: "Triplet 5-12-13 egalite",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Un triangle a pour cotes $5$, $12$ et $13$. Verifie l'egalite de Pythagore.",
      answerTemplate: "$5^2+12^2=13^2$",
      correctionTemplate: "$5^2+12^2=25+144=169$ et $13^2=169$.",
      variablesSchema: {},
      figureTemplate: { kind: "triangle", labelA: "5", labelB: "12", labelC: "13" },
      tags: ["pythagore", "triplet", "reciproque"]
    },
    {
      title: "Triplet 9-12-15 egalite",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Un triangle a pour cotes $9$, $12$ et $15$. Verifie l'egalite de Pythagore.",
      answerTemplate: "$9^2+12^2=15^2$",
      correctionTemplate: "$9^2+12^2=81+144=225$ et $15^2=225$.",
      variablesSchema: {},
      figureTemplate: { kind: "triangle", labelA: "9", labelB: "12", labelC: "15" },
      tags: ["pythagore", "triplet", "reciproque"]
    },
    {
      title: "Triplet multiple simple",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Un triangle a pour cotes ${{3*k}}$, ${{4*k}}$ et ${{5*k}}$. Verifie l'egalite de Pythagore.",
      answerTemplate: "$({{3*k}})^2+({{4*k}})^2=({{5*k}})^2$",
      correctionTemplate: "$({{3*k}})^2+({{4*k}})^2={{9*k*k}}+{{16*k*k}}={{25*k*k}}$ et $({{5*k}})^2={{25*k*k}}$.",
      variablesSchema: { k: { type: "int", min: 2, max: 5 } },
      figureTemplate: { kind: "triangle", labelA: "{{3*k}}", labelB: "{{4*k}}", labelC: "{{5*k}}" },
      tags: ["pythagore", "triplet", "reciproque"]
    },
    {
      title: "Non triplet 3-4-6",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Un triangle a pour cotes $3$, $4$ et $6$. Verifie si l'egalite de Pythagore est vraie.",
      answerTemplate: "Non",
      correctionTemplate: "$3^2+4^2=25$ mais $6^2=36$.",
      variablesSchema: {},
      figureTemplate: { kind: "triangle", labelA: "3", labelB: "4", labelC: "6" },
      tags: ["pythagore", "triplet", "contraposee"]
    },
    {
      title: "Non triplet 5-12-14",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Un triangle a pour cotes $5$, $12$ et $14$. Verifie si l'egalite de Pythagore est vraie.",
      answerTemplate: "Non",
      correctionTemplate: "$5^2+12^2=169$ mais $14^2=196$.",
      variablesSchema: {},
      figureTemplate: { kind: "triangle", labelA: "5", labelB: "12", labelC: "14" },
      tags: ["pythagore", "triplet", "contraposee"]
    }
  ];

  const thales: TemplateSeed[] = [
    {
      title: "Triangle rapports directs",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Dans le triangle $ABC$, $M\\in[AB]$, $N\\in[AC]$ et $(MN)\\parallel(BC)$. Ecris les trois rapports de Thales.",
      answerTemplate: "$\\dfrac{AM}{AB}=\\dfrac{AN}{AC}=\\dfrac{MN}{BC}$",
      correctionTemplate: "On associe chaque longueur du petit triangle a la longueur correspondante du grand triangle.",
      variablesSchema: {},
      figureTemplate: { kind: "thales", smallLeftLabel: "AM", bigLeftLabel: "AB", smallRightLabel: "AN", bigRightLabel: "AC", parallelLabel: "(MN) \\parallel (BC)" },
      tags: ["thales", "rapports", "redaction"]
    },
    {
      title: "Triangle rapports inverses",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Dans la meme configuration, ecris les rapports grand triangle sur petit triangle.",
      answerTemplate: "$\\dfrac{AB}{AM}=\\dfrac{AC}{AN}=\\dfrac{BC}{MN}$",
      correctionTemplate: "Tous les rapports sont inverses, mais l'ordre reste coherent.",
      variablesSchema: {},
      figureTemplate: { kind: "thales", smallLeftLabel: "AM", bigLeftLabel: "AB", smallRightLabel: "AN", bigRightLabel: "AC", parallelLabel: "(MN) \\parallel (BC)" },
      tags: ["thales", "rapports", "redaction"]
    },
    {
      title: "Triangle rapports petit sur grand",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Dans cette configuration, ecris les trois rapports petit triangle sur grand triangle.",
      answerTemplate: "$\\dfrac{AM}{AB}=\\dfrac{AN}{AC}=\\dfrac{MN}{BC}$",
      correctionTemplate: "Les longueurs $AM$, $AN$ et $MN$ sont celles du petit triangle.",
      variablesSchema: {},
      figureTemplate: { kind: "thales", smallLeftLabel: "AM", bigLeftLabel: "AB", smallRightLabel: "AN", bigRightLabel: "AC", parallelLabel: "(MN) \\parallel (BC)" },
      tags: ["thales", "rapports", "redaction"]
    },
    {
      title: "Triangle rapports dans le bon ordre",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Avec $(MN)\\parallel(BC)$, ecris les trois rapports de Thales dans le bon ordre.",
      answerTemplate: "$\\dfrac{AM}{AB}=\\dfrac{AN}{AC}=\\dfrac{MN}{BC}$",
      correctionTemplate: "Chaque numerateur correspond a la longueur associee au denominateur.",
      variablesSchema: {},
      figureTemplate: { kind: "thales", smallLeftLabel: "AM", bigLeftLabel: "AB", smallRightLabel: "AN", bigRightLabel: "AC", parallelLabel: "(MN) \\parallel (BC)" },
      tags: ["thales", "rapports", "redaction"]
    },
    {
      title: "Triangle rapports avec paralleles",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Dans le triangle $ABC$, ecris les trois rapports quand $(MN)\\parallel(BC)$.",
      answerTemplate: "$\\dfrac{AM}{AB}=\\dfrac{AN}{AC}=\\dfrac{MN}{BC}$",
      correctionTemplate: "Le troisieme rapport compare les cotes paralleles $MN$ et $BC$.",
      variablesSchema: {},
      figureTemplate: { kind: "thales", smallLeftLabel: "AM", bigLeftLabel: "AB", smallRightLabel: "AN", bigRightLabel: "AC", parallelLabel: "(MN) \\parallel (BC)" },
      tags: ["thales", "rapports", "redaction"]
    },
    {
      title: "Papillon rapports directs",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Dans le cas papillon, $(AB)\\parallel(CD)$ et les secantes se coupent en $O$. Ecris les trois rapports de Thales.",
      answerTemplate: "$\\dfrac{OA}{OC}=\\dfrac{OB}{OD}=\\dfrac{AB}{CD}$",
      correctionTemplate: "On compare le triangle $OAB$ avec le triangle $OCD$.",
      variablesSchema: {},
      figureTemplate: { kind: "thales", smallLeftLabel: "OA", bigLeftLabel: "OC", smallRightLabel: "OB", bigRightLabel: "OD", parallelLabel: "(AB) \\parallel (CD)" },
      tags: ["thales", "rapports", "papillon", "redaction"]
    },
    {
      title: "Papillon rapports inverses",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Dans le cas papillon, ecris les rapports en commencant par le triangle $OCD$.",
      answerTemplate: "$\\dfrac{OC}{OA}=\\dfrac{OD}{OB}=\\dfrac{CD}{AB}$",
      correctionTemplate: "On inverse chaque rapport par rapport a l'ecriture directe.",
      variablesSchema: {},
      figureTemplate: { kind: "thales", smallLeftLabel: "OA", bigLeftLabel: "OC", smallRightLabel: "OB", bigRightLabel: "OD", parallelLabel: "(AB) \\parallel (CD)" },
      tags: ["thales", "rapports", "papillon", "redaction"]
    },
    {
      title: "Papillon rapports OAB sur OCD",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Dans le cas papillon, ecris les trois rapports en commencant par le triangle $OAB$.",
      answerTemplate: "$\\dfrac{OA}{OC}=\\dfrac{OB}{OD}=\\dfrac{AB}{CD}$",
      correctionTemplate: "On compare le triangle $OAB$ au triangle $OCD$.",
      variablesSchema: {},
      figureTemplate: { kind: "thales", smallLeftLabel: "OA", bigLeftLabel: "OC", smallRightLabel: "OB", bigRightLabel: "OD", parallelLabel: "(AB) \\parallel (CD)" },
      tags: ["thales", "rapports", "papillon", "redaction"]
    },
    {
      title: "Papillon rapports avec secantes",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Dans le papillon, ecris les trois rapports avec les deux secantes et les paralleles.",
      answerTemplate: "$\\dfrac{OA}{OC}=\\dfrac{OB}{OD}=\\dfrac{AB}{CD}$",
      correctionTemplate: "Les rapports utilisent les deux secantes $AC$, $BD$ et les paralleles $(AB)$, $(CD)$.",
      variablesSchema: {},
      figureTemplate: { kind: "thales", smallLeftLabel: "OA", bigLeftLabel: "OC", smallRightLabel: "OB", bigRightLabel: "OD", parallelLabel: "(AB) \\parallel (CD)" },
      tags: ["thales", "rapports", "papillon", "redaction"]
    },
    {
      title: "Papillon rapports OCD sur OAB",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Dans le cas papillon, ecris les trois rapports en commencant par le triangle $OCD$.",
      answerTemplate: "$\\dfrac{OC}{OA}=\\dfrac{OD}{OB}=\\dfrac{CD}{AB}$",
      correctionTemplate: "On inverse les trois rapports de l'ecriture directe.",
      variablesSchema: {},
      figureTemplate: { kind: "thales", smallLeftLabel: "OA", bigLeftLabel: "OC", smallRightLabel: "OB", bigRightLabel: "OD", parallelLabel: "(AB) \\parallel (CD)" },
      tags: ["thales", "rapports", "papillon", "redaction"]
    },
    {
      title: "Rapports pour reciproque triangle",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Pour prouver que $(MN)$ et $(BC)$ sont paralleles, ecris les trois rapports a comparer.",
      answerTemplate: "$\\dfrac{AM}{AB}=\\dfrac{AN}{AC}=\\dfrac{MN}{BC}$",
      correctionTemplate: "On ecrit les trois rapports dans le meme ordre.",
      variablesSchema: {},
      figureTemplate: { kind: "thales", smallLeftLabel: "AM", bigLeftLabel: "AB", smallRightLabel: "AN", bigRightLabel: "AC", parallelLabel: "(MN) ∥ (BC)" },
      tags: ["thales", "rapports", "reciproque", "redaction"]
    },
    {
      title: "Rapports pour contraposee triangle",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Pour verifier si $(MN)$ et $(BC)$ sont paralleles, ecris les trois rapports de Thales.",
      answerTemplate: "$\\dfrac{AM}{AB}=\\dfrac{AN}{AC}=\\dfrac{MN}{BC}$",
      correctionTemplate: "Si les rapports ne sont pas egaux, les droites ne sont pas paralleles.",
      variablesSchema: {},
      figureTemplate: { kind: "thales", smallLeftLabel: "AM", bigLeftLabel: "AB", smallRightLabel: "AN", bigRightLabel: "AC", parallelLabel: "(MN) ∥ (BC)" },
      tags: ["thales", "rapports", "contraposee", "redaction"]
    }
  ];

  const literal: TemplateSeed[] = [
    {
      title: "R?duire 4 mon?mes avec relatifs",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "R?duire l'expression en regroupant les quatre mon?mes semblables : ${{a}}x{{b < 0 ? '' : '+'}}{{b}}x{{c < 0 ? '' : '+'}}{{c}}x{{d < 0 ? '' : '+'}}{{d}}x$.",
      answerTemplate: "${{a+b+c+d}}x$",
      correctionTemplate: "Les quatre mon?mes sont semblables. On additionne les coefficients : ${{a}}+{{b}}+{{c}}+{{d}}={{a+b+c+d}}$, donc l'expression vaut ${{a+b+c+d}}x$.",
      variablesSchema: { a: { type: "int", min: -9, max: 9, exclude: [0] }, b: { type: "int", min: -9, max: 9, exclude: [0] }, c: { type: "int", min: -9, max: 9, exclude: [0] }, d: { type: "int", min: -9, max: 9, exclude: [0] } },
      tags: ["calcul-litteral", "reduire", "relatifs", "monomes-4-6"]
    },
    {
      title: "R?duire 6 mon?mes avec constantes",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "R?duire cette expression de six mon?mes : ${{a}}x{{b < 0 ? '' : '+'}}{{b}}{{c < 0 ? '' : '+'}}{{c}}x{{d < 0 ? '' : '+'}}{{d}}y{{e < 0 ? '' : '+'}}{{e}}x{{f < 0 ? '' : '+'}}{{f}}y$.",
      answerTemplate: "${{a+c+e}}x{{d+f < 0 ? '' : '+'}}{{d+f}}y{{b < 0 ? '' : '+'}}{{b}}$",
      correctionTemplate: "On regroupe : termes en $x$, ${{a}}x{{c < 0 ? '' : '+'}}{{c}}x{{e < 0 ? '' : '+'}}{{e}}x={{a+c+e}}x$ ; termes en $y$, ${{d}}y{{f < 0 ? '' : '+'}}{{f}}y={{d+f}}y$ ; constante ${{b}}$.",
      variablesSchema: { a: { type: "int", min: -8, max: 8, exclude: [0] }, b: { type: "int", min: -12, max: 12 }, c: { type: "int", min: -8, max: 8, exclude: [0] }, d: { type: "int", min: -8, max: 8, exclude: [0] }, e: { type: "int", min: -8, max: 8, exclude: [0] }, f: { type: "int", min: -8, max: 8, exclude: [0] } },
      tags: ["calcul-litteral", "reduire", "relatifs", "monomes-4-6"]
    },
    {
      title: "Substitution",
      subdomain: chapter.title,
      statementTemplate: "Calculer la valeur de l'expression ${{a}}x{{b < 0 ? '' : '+'}}{{b}}$ lorsque $x={{x}}$.",
      answerTemplate: "{{a*x+b}}",
      correctionTemplate: "$ {{a}}\\times ({{x}}){{b < 0 ? '' : '+'}}{{b}}={{a*x+b}}$.",
      variablesSchema: { a: { type: "int", min: -9, max: 9, exclude: [0] }, b: { type: "int", min: -15, max: 15 }, x: { type: "int", min: -5, max: 8, exclude: [0] } },
      tags: ["calcul-litteral", "substituer", "relatifs"]
    },
    {
      title: "Developper simple",
      subdomain: chapter.title,
      statementTemplate: "D?velopper l'expression suivante en distribuant le facteur relatif : ${{a}}(x{{b < 0 ? '' : '+'}}{{b}})$.",
      answerTemplate: "${{a}}x{{a*b < 0 ? '' : '+'}}{{a*b}}$",
      correctionTemplate: "$ {{a}}(x{{b < 0 ? '' : '+'}}{{b}})={{a}}x{{a*b < 0 ? '' : '+'}}{{a*b}}$.",
      variablesSchema: { a: { type: "int", min: -9, max: 9, exclude: [-1, 0, 1] }, b: { type: "int", min: -12, max: 12, exclude: [0] } },
      tags: ["calcul-litteral", "developper", "relatifs"]
    },
    {
      title: "Developper avec signe moins",
      subdomain: chapter.title,
      statementTemplate: "Developper ${{a}}(x-{{b}})$.",
      answerTemplate: "{{a}}x-{{a*b}}",
      correctionTemplate: "$ {{a}}(x-{{b}})={{a}}x-{{a}}\\times {{b}}={{a}}x-{{a*b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 12 }, b: { type: "int", min: 2, max: 12 } },
      tags: ["calcul-litteral", "developper"]
    },
    {
      title: "Factoriser commun",
      subdomain: chapter.title,
      statementTemplate: "Factoriser ${{a}}x+{{a*b}}$.",
      answerTemplate: "{{a}}(x+{{b}})",
      correctionTemplate: "Le facteur commun est ${{a}}$ : ${{a}}x+{{a*b}}={{a}}(x+{{b}})$.",
      variablesSchema: { a: { type: "int", min: 2, max: 12 }, b: { type: "int", min: 2, max: 12 } },
      tags: ["calcul-litteral", "factoriser"]
    },
    {
      title: "Double distributivite",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Developper $(x+{{a}})(x+{{b}})$.",
      answerTemplate: "x^2+{{a+b}}x+{{a*b}}",
      correctionTemplate: "$(x+{{a}})(x+{{b}})=x^2+{{b}}x+{{a}}x+{{a*b}}=x^2+{{a+b}}x+{{a*b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 9 } },
      tags: ["calcul-litteral", "double-distributivite"]
    },
    {
      title: "Identite remarquable carre",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Developper $(x+{{a}})^2$.",
      answerTemplate: "x^2+{{2*a}}x+{{a*a}}",
      correctionTemplate: "$(x+{{a}})^2=x^2+2\\times {{a}}x+{{a}}^2=x^2+{{2*a}}x+{{a*a}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 12 } },
      tags: ["identites-remarquables", "developper"]
    },
    {
      title: "Equation ax+b",
      subdomain: chapter.title,
      statementTemplate: "Resoudre ${{a}}x+{{b}}={{a*x+b}}$.",
      answerTemplate: "x={{x}}",
      correctionTemplate: "$ {{a}}x={{a*x+b}}-{{b}}={{a*x}}$, donc $x={{x}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 1, max: 20 }, x: { type: "int", min: -5, max: 10 } },
      tags: ["equations", "resoudre"]
    },
    {
      title: "Equation parenthese",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Resoudre ${{a}}(x+{{b}})={{a*(x+b)}}$.",
      answerTemplate: "x={{x}}",
      correctionTemplate: "On divise par ${{a}}$ : $x+{{b}}={{x+b}}$, donc $x={{x+b}}-{{b}}={{x}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 1, max: 12 }, x: { type: "int", min: -4, max: 12 } },
      tags: ["equations", "parentheses"]
    },
    {
      title: "Verifier une solution",
      subdomain: chapter.title,
      statementTemplate: "$x={{x}}$ est-il solution de ${{a}}x+{{b}}={{a*x+b+c}}$ ?",
      answerTemplate: "{{c===0 ? 'Oui' : 'Non'}}",
      correctionTemplate: "Membre gauche : ${{a}}\\times {{x}}+{{b}}={{a*x+b}}$. Membre droit : ${{a*x+b+c}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 1, max: 15 }, x: { type: "int", min: -4, max: 10 }, c: { type: "choice", values: [0, 1, -1] } },
      tags: ["equations", "verification"]
    },
    {
      title: "Transposition",
      subdomain: chapter.title,
      statementTemplate: "Resoudre $x-{{a}}={{b}}$.",
      answerTemplate: "x={{a+b}}",
      correctionTemplate: "On ajoute ${{a}}$ aux deux membres : $x={{b}}+{{a}}={{a+b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 20 }, b: { type: "int", min: -8, max: 20 } },
      tags: ["equations", "transposition"]
    }
  ];

  const powers: TemplateSeed[] = [
    {
      title: "Produit de puissances",
      subdomain: chapter.title,
      statementTemplate: "Simplifier $10^{{a}}\\times 10^{{b}}$.",
      answerTemplate: "10^{{a+b}}",
      correctionTemplate: "Meme base, on additionne les exposants : $10^{{a}}\\times 10^{{b}}=10^{{a+b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 7 }, b: { type: "int", min: 2, max: 7 } },
      tags: ["puissances", "regles"]
    },
    {
      title: "Quotient de puissances",
      subdomain: chapter.title,
      statementTemplate: "Simplifier $10^{{a+b}}\\div 10^{{b}}$.",
      answerTemplate: "10^{{a}}",
      correctionTemplate: "Meme base, on soustrait les exposants : $10^{{a+b-b}}=10^{{a}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 1, max: 5 } },
      tags: ["puissances", "regles"]
    },
    {
      title: "Puissance d'une puissance",
      subdomain: chapter.title,
      statementTemplate: "Simplifier $(10^{{a}})^{{b}}$.",
      answerTemplate: "10^{{a*b}}",
      correctionTemplate: "$(10^{{a}})^{{b}}=10^{{a}}\\times ... \\times 10^{{a}}=10^{{a*b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 5 }, b: { type: "int", min: 2, max: 5 } },
      tags: ["puissances", "regles"]
    },
    {
      title: "Notation scientifique",
      subdomain: chapter.title,
      statementTemplate: "Ecrire ${{a*1000}}$ en notation scientifique.",
      answerTemplate: "${{a}}\\times 10^3$",
      correctionTemplate: "$ {{a*1000}}={{a}}\\times 10^3$ avec $1\\le {{a}}<10$.",
      variablesSchema: { a: { type: "decimal", min: 1.2, max: 9.8, decimals: 1 } },
      tags: ["notation-scientifique"]
    },
    {
      title: "Ecriture decimale",
      subdomain: chapter.title,
      statementTemplate: "Ecrire ${{a}}\\times 10^{{n}}$ sous forme decimale.",
      answerTemplate: "{{a*Math.pow(10,n)}}",
      correctionTemplate: "Multiplier par $10^{{n}}$ decale la virgule de ${{n}}$ rangs : ${{a*Math.pow(10,n)}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, n: { type: "int", min: 2, max: 5 } },
      tags: ["puissances", "ecriture"]
    },
    {
      title: "Puissance negative",
      subdomain: chapter.title,
      statementTemplate: "Ecrire $10^{-{{n}}}$ sous forme fractionnaire.",
      answerTemplate: "1/{{Math.pow(10,n)}}",
      correctionTemplate: "$10^{-{{n}}}=\\dfrac{1}{10^{{n}}}=\\dfrac{1}{ {{Math.pow(10,n)}} }$.",
      variablesSchema: { n: { type: "int", min: 1, max: 5 } },
      tags: ["puissances", "exposant-negatif"]
    },
    {
      title: "Ordre de grandeur scientifique",
      subdomain: chapter.title,
      statementTemplate: "Quel est l'ordre de grandeur de ${{a}}\\times 10^{{n}}$ ?",
      answerTemplate: "10^{{a<5 ? n : n+1}}",
      correctionTemplate: "Si le coefficient est inferieur a $5$, on garde $10^{{n}}$ ; sinon on prend $10^{{n+1}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 9 }, n: { type: "int", min: 2, max: 8 } },
      tags: ["puissances", "ordre-de-grandeur"]
    },
    {
      title: "Carre de puissance de 10",
      subdomain: chapter.title,
      statementTemplate: "Calculer $(10^{{n}})^2$.",
      answerTemplate: "10^{{2*n}}",
      correctionTemplate: "$(10^{{n}})^2=10^{{2*n}}$.",
      variablesSchema: { n: { type: "int", min: 2, max: 7 } },
      tags: ["puissances", "carre"]
    },
    {
      title: "Signe d'une puissance",
      subdomain: chapter.title,
      statementTemplate: "Le nombre $(-{{a}})^{{n}}$ est-il positif ou negatif ?",
      answerTemplate: "{{n%2===0 ? 'positif' : 'negatif'}}",
      correctionTemplate: "Une puissance paire d'un negatif est positive ; une puissance impaire est negative. Ici ${{n}}$ est {{n%2===0 ? 'pair' : 'impair'}}.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, n: { type: "int", min: 2, max: 7 } },
      tags: ["puissances", "signe"]
    },
    {
      title: "Calculer une puissance",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{a}}^{{n}}$.",
      answerTemplate: "{{Math.pow(a,n)}}",
      correctionTemplate: "$ {{a}}^{{n}}={{Math.pow(a,n)}}$.",
      variablesSchema: { a: { type: "choice", values: [2, 3, 4, 5] }, n: { type: "int", min: 2, max: 5 } },
      tags: ["puissances", "calcul"]
    },
    {
      title: "Prefixe scientifique",
      subdomain: chapter.title,
      statementTemplate: "Convertir ${{a}}$ km en m avec une puissance de 10.",
      answerTemplate: "${{a}}\\times 10^3$ m",
      correctionTemplate: "$1$ km = $10^3$ m, donc ${{a}}$ km = ${{a}}\\times 10^3$ m.",
      variablesSchema: { a: { type: "int", min: 2, max: 25 } },
      tags: ["puissances", "conversion"]
    },
    {
      title: "Comparer puissances de 10",
      subdomain: chapter.title,
      statementTemplate: "Comparer $10^{{a}}$ et $10^{{b}}$.",
      answerTemplate: "{{a<b ? '<' : a>b ? '>' : '='}}",
      correctionTemplate: "{{a===b ? 'Les exposants sont égaux : les deux puissances sont égales.' : 'Avec la même base 10 supérieure à 1, le plus grand exposant donne le plus grand nombre.'}}",
      variablesSchema: { a: { type: "int", min: 1, max: 9 }, b: { type: "int", min: 1, max: 9 } },
      tags: ["puissances", "comparaison"]
    }
  ];

  const statistics: TemplateSeed[] = [
    {
      title: "Moyenne de trois valeurs",
      subdomain: chapter.title,
      statementTemplate: "Calculer la moyenne de ${{a}}$, ${{b}}$ et ${{c}}$ au centième près si nécessaire.",
      answerTemplate: "{{formatDecimalFrench(roundTo((a+b+c)/3,2))}}",
      correctionTemplate: "$\\overline x=\\dfrac{ {{a}}+{{b}}+{{c}} }{3}=\\dfrac{ {{a+b+c}} }{3}{{roundingRelation((a+b+c)/3,2)}}{{formatDecimalFrench(roundTo((a+b+c)/3,2))}}$.",
      variablesSchema: { a: { type: "int", min: 4, max: 20 }, b: { type: "int", min: 4, max: 20 }, c: { type: "int", min: 4, max: 20 } },
      tags: ["statistiques", "moyenne"]
    },
    {
      title: "Moyenne ponderee",
      subdomain: chapter.title,
      statementTemplate: "$ {{n1}}$ notes valent ${{v1}}$ et ${{n2}}$ notes valent ${{v2}}$. Calcule la moyenne au centième près si nécessaire.",
      answerTemplate: "{{formatDecimalFrench(roundTo((n1*v1+n2*v2)/(n1+n2),2))}}",
      correctionTemplate: "$\\overline x=\\dfrac{ {{n1}}\\times {{v1}}+{{n2}}\\times {{v2}} }{ {{n1+n2}} }{{roundingRelation((n1*v1+n2*v2)/(n1+n2),2)}}{{formatDecimalFrench(roundTo((n1*v1+n2*v2)/(n1+n2),2))}}$.",
      variablesSchema: { n1: { type: "int", min: 2, max: 8 }, n2: { type: "int", min: 2, max: 8 }, v1: { type: "int", min: 4, max: 12 }, v2: { type: "int", min: 12, max: 20 } },
      tags: ["statistiques", "moyenne-ponderee"]
    },
    {
      title: "Mediane impaire",
      subdomain: chapter.title,
      statementTemplate: "Donner la mediane de la serie : ${{a+3*d}}$ ; ${{a}}$ ; ${{a+4*d}}$ ; ${{a+2*d}}$ ; ${{a+d}}$.",
      answerTemplate: "{{a+2*d}}",
      correctionTemplate: "On ordonne : ${{a}}$ ; ${{a+d}}$ ; ${{a+2*d}}$ ; ${{a+3*d}}$ ; ${{a+4*d}}$. La mediane est la 3e valeur : ${{a+2*d}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 12 }, d: { type: "int", min: 1, max: 6 } },
      tags: ["statistiques", "mediane"]
    },
    {
      title: "Etendue",
      subdomain: chapter.title,
      statementTemplate: "Calculer l'etendue de la serie ordonnee : ${{a}}$ ; ${{a+d}}$ ; ${{a+2*d}}$ ; ${{a+5*d}}$.",
      answerTemplate: "{{5*d}}",
      correctionTemplate: "Etendue = maximum - minimum = ${{a+5*d}}-{{a}}={{5*d}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 20 }, d: { type: "int", min: 2, max: 8 } },
      tags: ["statistiques", "etendue"]
    },
    {
      title: "Frequence",
      subdomain: chapter.title,
      statementTemplate: "Dans un effectif total de ${{total}}$, ${{success}}$ reussissent. Donne la fréquence en pourcentage au dixième près si nécessaire.",
      answerTemplate: "{{formatDecimalFrench(roundTo(success*100/total,1))}} %",
      correctionTemplate: "$f=\\dfrac{ {{success}} }{ {{total}} }\\times 100{{roundingRelation(success*100/total,1)}}{{formatDecimalFrench(roundTo(success*100/total,1))}}\\%$.",
      variablesSchema: { total: { type: "choice", values: [20, 24, 25, 30, 40] }, success: { type: "int", min: 5, max: 20 } },
      tags: ["statistiques", "frequence"]
    },
    {
      title: "Effectif total",
      subdomain: chapter.title,
      statementTemplate: "Les effectifs sont ${{a}}$, ${{b}}$, ${{c}}$ et ${{d}}$. Quel est l'effectif total ?",
      answerTemplate: "{{a+b+c+d}}",
      correctionTemplate: "$N={{a}}+{{b}}+{{c}}+{{d}}={{a+b+c+d}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 15 }, b: { type: "int", min: 2, max: 15 }, c: { type: "int", min: 2, max: 15 }, d: { type: "int", min: 2, max: 15 } },
      tags: ["statistiques", "effectif"]
    },
    {
      title: "Angle diagramme circulaire",
      subdomain: chapter.title,
      statementTemplate: "Une categorie represente ${{p}}\\%$ d'un diagramme circulaire. Angle du secteur ?",
      answerTemplate: "{{p*3.6}} degres",
      correctionTemplate: "$ {{p}}\\%$ de $360^\\circ$ vaut ${{p}}\\times 3,6={{p*3.6}}^\\circ$.",
      variablesSchema: { p: { type: "choice", values: [10, 20, 25, 30, 40, 50] } },
      tags: ["statistiques", "diagramme"]
    },
    {
      title: "Lire une frequence",
      subdomain: chapter.title,
      statementTemplate: "Une frequence vaut $\\dfrac{ {{success}} }{ {{total}} }$. Donner l'ecriture decimale.",
      answerTemplate: "{{formatDecimalFrench(success/total)}}",
      correctionTemplate: "$\\dfrac{ {{success}} }{ {{total}} }={{formatDecimalFrench(success/total)}}$.",
      variablesSchema: { total: { type: "choice", values: [10, 20, 25, 50, 100] }, success: { type: "int", min: 1, max: 20 } },
      tags: ["statistiques", "frequence"]
    },
    {
      title: "Moyenne cible",
      subdomain: chapter.title,
      statementTemplate: "Deux notes sont ${{a}}$ et ${{b}}$. Quelle troisieme note faut-il pour une moyenne de ${{m}}$ ?",
      answerTemplate: "{{3*m-a-b}}",
      correctionTemplate: "Total attendu : $3\\times {{m}}={{3*m}}$. Note manquante : ${{3*m}}-{{a}}-{{b}}={{3*m-a-b}}$.",
      variablesSchema: { a: { type: "int", min: 8, max: 12 }, b: { type: "int", min: 8, max: 12 }, m: { type: "int", min: 8, max: 12 } },
      tags: ["statistiques", "moyenne"]
    },
    {
      title: "Rang median",
      subdomain: chapter.title,
      statementTemplate: "Une serie ordonnee contient ${{2*n+1}}$ valeurs. Quel est le rang de la mediane ?",
      answerTemplate: "{{n+1}}",
      correctionTemplate: "Pour ${{2*n+1}}$ valeurs, le rang median est $\\dfrac{ {{2*n+1}}+1}{2}={{n+1}}$.",
      variablesSchema: { n: { type: "int", min: 3, max: 15 } },
      tags: ["statistiques", "mediane"]
    },
    {
      title: "Pourcentage effectif",
      subdomain: chapter.title,
      statementTemplate: "$ {{p}}\\%$ d'un effectif total de ${{total}}$ represente combien d'individus ?",
      answerTemplate: "{{p*total/100}}",
      correctionTemplate: "$\\dfrac{ {{p}} }{100}\\times {{total}}={{p*total/100}}$.",
      variablesSchema: { p: { type: "choice", values: [5, 10, 20, 25, 50] }, total: { type: "choice", values: [40, 80, 100, 120, 200] } },
      tags: ["statistiques", "pourcentage"]
    },
    {
      title: "Comparer deux moyennes",
      subdomain: chapter.title,
      statementTemplate: "Comparer les moyennes ${{formatDecimalFrench(a)}}$ et ${{formatDecimalFrench(b)}}$.",
      answerTemplate: "{{a<b ? '<' : a>b ? '>' : '='}}",
      correctionTemplate: "On compare les nombres decimaux : ${{formatDecimalFrench(a)}} {{a<b ? '<' : a>b ? '>' : '='}} {{formatDecimalFrench(b)}}$.",
      variablesSchema: { a: { type: "decimal", min: 8, max: 17.9, decimals: 1 }, b: { type: "decimal", min: 8, max: 17.9, decimals: 1 } },
      tags: ["statistiques", "comparaison"]
    }
  ];

  const probabilities: TemplateSeed[] = [
    {
      title: "Probabilité de base",
      subdomain: chapter.title,
      statementTemplate: "Dans un sac, il y a ${{r}}$ boules rouges et ${{b}}$ bleues. Quelle est la probabilité de tirer une rouge ?",
      answerTemplate: "{{formatFraction(r,r+b)}}",
      correctionTemplate: "$P=\\dfrac{issues favorables}{issues possibles}=\\dfrac{ {{r}} }{ {{r+b}} }={{formatFraction(r,r+b)}}$.",
      variablesSchema: { r: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 9 } },
      tags: ["probabilites", "fraction"]
    },
    {
      title: "Evenement contraire",
      subdomain: chapter.title,
      statementTemplate: "Si $P(A)=\\dfrac{ {{a}} }{ {{den}} }$, calculer $P(\\overline A)$.",
      answerTemplate: "{{formatFraction(den-a,den)}}",
      correctionTemplate: "$P(\\overline A)=1-P(A)=\\dfrac{ {{den-a}} }{ {{den}} }={{formatFraction(den-a,den)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 8 }, den: { type: "int", min: 9, max: 16 } },
      tags: ["probabilites", "contraire"]
    },
    {
      title: "Dé équilibré",
      subdomain: chapter.title,
      statementTemplate: "On lance un dé équilibré à $6$ faces. Quelle est la probabilité d'obtenir un nombre pair ?",
      answerTemplate: "1/2",
      correctionTemplate: "Issues favorables : $2,4,6$, donc $3$ issues sur $6$ : $\\dfrac36=\\dfrac12$.",
      variablesSchema: {},
      tags: ["probabilites", "equiprobabilite"]
    },
    {
      title: "Issue impossible",
      subdomain: chapter.title,
      statementTemplate: "Sur un dé à $6$ faces, quelle est la probabilité d'obtenir $7$ ?",
      answerTemplate: "0",
      correctionTemplate: "L'issue $7$ n'existe pas sur ce dé : probabilité $0$.",
      variablesSchema: {},
      tags: ["probabilites", "impossible"]
    },
    {
      title: "Issue certaine",
      subdomain: chapter.title,
      statementTemplate: "Sur un dé à $6$ faces, quelle est la probabilité d'obtenir un nombre inférieur à $7$ ?",
      answerTemplate: "1",
      correctionTemplate: "Toutes les issues de $1$ à $6$ conviennent : l'événement est certain, de probabilité $1$.",
      variablesSchema: {},
      tags: ["probabilites", "certain"]
    },
    {
      title: "Tirage d'une lettre",
      subdomain: chapter.title,
      statementTemplate: "On choisit au hasard une lettre dans le mot MATHS. Probabilite d'obtenir une voyelle ?",
      answerTemplate: "1/5",
      correctionTemplate: "Une seule voyelle, $A$, sur $5$ lettres : $\\dfrac15$.",
      variablesSchema: {},
      tags: ["probabilites", "equiprobabilite"]
    },
    {
      title: "Probabilite decimale",
      subdomain: chapter.title,
      statementTemplate: "Ecrire $\\dfrac{ {{a}} }{ {{den}} }$ sous forme decimale.",
      answerTemplate: "{{formatDecimalFrench(a/den)}}",
      correctionTemplate: "$\\dfrac{ {{a}} }{ {{den}} }={{formatDecimalFrench(a/den)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 9 }, den: { type: "choice", values: [10, 20, 25, 50, 100] } },
      tags: ["probabilites", "decimaux"]
    },
    {
      title: "Comparer deux probabilites",
      subdomain: chapter.title,
      statementTemplate: "Comparer $\\dfrac{ {{a}} }{ {{den}} }$ et $\\dfrac{ {{b}} }{ {{den}} }$.",
      answerTemplate: "{{a<b ? '<' : a>b ? '>' : '='}}",
      correctionTemplate: "A denominateur egal, on compare les numerateurs : ${{a}} {{a<b ? '<' : a>b ? '>' : '='}} {{b}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 9 }, b: { type: "int", min: 1, max: 9 }, den: { type: "int", min: 10, max: 20 } },
      tags: ["probabilites", "comparaison"]
    },
    {
      title: "Nombre d'issues",
      subdomain: chapter.title,
      statementTemplate: "On lance une pièce puis un dé à $6$ faces. Combien d'issues sont possibles ?",
      answerTemplate: "12",
      correctionTemplate: "$2$ issues pour la pièce et $6$ pour le dé, donc $2\\times 6=12$ issues.",
      variablesSchema: {},
      tags: ["probabilites", "denombrement"]
    },
    {
      title: "Tirage couleur contraire",
      subdomain: chapter.title,
      statementTemplate: "Dans un sac, il y a ${{r}}$ boules rouges et ${{b}}$ bleues. Quelle est la probabilité de ne pas tirer rouge ?",
      answerTemplate: "{{formatFraction(b,r+b)}}",
      correctionTemplate: "Ne pas tirer rouge signifie tirer bleu : $\\dfrac{ {{b}} }{ {{r+b}} }={{formatFraction(b,r+b)}}$.",
      variablesSchema: { r: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 9 } },
      tags: ["probabilites", "contraire"]
    },
    {
      title: "Probabilite et pourcentage",
      subdomain: chapter.title,
      statementTemplate: "Ecrire ${{p}}\\%$ sous forme de probabilite fractionnaire.",
      answerTemplate: "{{formatFraction(p,100)}}",
      correctionTemplate: "$ {{p}}\\%=\\dfrac{ {{p}} }{100}={{formatFraction(p,100)}}$.",
      variablesSchema: { p: { type: "choice", values: [5, 10, 20, 25, 50, 75] } },
      tags: ["probabilites", "pourcentage"]
    },
    {
      title: "Non equiprobabilite",
      subdomain: chapter.title,
      statementTemplate: "Dans une urne avec ${{r}}$ rouges et ${{b}}$ bleues, les couleurs sont-elles equiprobables ?",
      answerTemplate: "{{r===b ? 'Oui' : 'Non'}}",
      correctionTemplate: "Les couleurs sont equiprobables seulement si les effectifs sont egaux. Ici : rouges ${{r}}$, bleues ${{b}}$.",
      variablesSchema: { r: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 2, max: 8 } },
      tags: ["probabilites", "equiprobabilite"]
    }
  ];

  const functions: TemplateSeed[] = [
    {
      title: "Image par une fonction",
      subdomain: chapter.title,
      statementTemplate: "Soit $f(x)={{a}}x{{b < 0 ? '' : '+'}}{{b}}$. Calculer $f({{x}})$.",
      answerTemplate: "{{a*x+b}}",
      correctionTemplate: "$f({{x}})={{a}}\\times {{x}}{{b < 0 ? '' : '+'}}{{b}}={{a*x+b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: -10, max: 15 }, x: { type: "int", min: -5, max: 8 } },
      tags: ["fonctions", "image"]
    },
    {
      title: "Antecedent simple",
      subdomain: chapter.title,
      statementTemplate: "Soit $f(x)={{a}}x$. Quel ant?c?dent a pour image ${{a*x}}$ ?",
      answerTemplate: "{{x}}",
      correctionTemplate: "On r?sout ${{a}}x={{a*x}}$, donc $x={{x}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, x: { type: "int", min: -6, max: 10 } },
      tags: ["fonctions", "antecedent"]
    },
    {
      title: "Coefficient lineaire",
      subdomain: chapter.title,
      statementTemplate: "Une fonction lineaire verifie $f({{x}})={{a*x}}$. Quel est son coefficient ?",
      answerTemplate: "{{a}}",
      correctionTemplate: "Pour une fonction lin?aire $f(x)=ax$, le coefficient vaut $f({{x}})\\div {{x}}={{a*x}}\\div {{x}}={{a}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, x: { type: "int", min: 2, max: 12 } },
      tags: ["fonctions", "lineaire"]
    },
    {
      title: "Fonction affine ordonnee origine",
      subdomain: chapter.title,
      statementTemplate: "Pour $f(x)={{a}}x{{b < 0 ? '' : '+'}}{{b}}$, quelle est l'ordonn?e ? l'origine ?",
      answerTemplate: "{{b}}",
      correctionTemplate: "Dans $f(x)=ax+b$, l'ordonn?e ? l'origine est $b$, ici ${{b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: -10, max: 15 } },
      tags: ["fonctions", "affine"]
    },
    {
      title: "Lire tableau",
      subdomain: chapter.title,
      statementTemplate: "Dans un tableau, $x={{x}}$ donne $f(x)={{y}}$. Quelle est l'image de ${{x}}$ ?",
      answerTemplate: "{{y}}",
      correctionTemplate: "L'image de ${{x}}$ est la valeur associee dans la ligne de $f(x)$ : ${{y}}$.",
      variablesSchema: { x: { type: "int", min: -5, max: 8 }, y: { type: "int", min: -12, max: 30 } },
      tags: ["fonctions", "tableau"]
    },
    {
      title: "Point sur courbe",
      subdomain: chapter.title,
      statementTemplate: "Le point $({{x}};{{a*x+b+delta}})$ appartient-il ? la courbe de $f(x)={{a}}x{{b < 0 ? '' : '+'}}{{b}}$ ?",
      answerTemplate: "{{delta===0 ? 'Oui' : 'Non'}}",
      correctionTemplate: "$f({{x}})={{a}}\\times {{x}}{{b < 0 ? '' : '+'}}{{b}}={{a*x+b}}$. On compare avec l'ordonn?e ${{a*x+b+delta}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: -10, max: 12 }, x: { type: "int", min: -5, max: 8 }, delta: { type: "choice", values: [0, 2, -3] } },
      tags: ["fonctions", "courbe"]
    },
    {
      title: "Variation lineaire",
      subdomain: chapter.title,
      statementTemplate: "La fonction $f(x)={{a}}x$ est-elle croissante ?",
      answerTemplate: "{{a>0 ? 'Oui' : 'Non'}}",
      correctionTemplate: "Une fonction lineaire $f(x)=ax$ est croissante si $a>0$. Ici $a={{a}}$.",
      variablesSchema: { a: { type: "int", min: -6, max: 8, exclude: [0] } },
      tags: ["fonctions", "variation"]
    },
    {
      title: "Programme vers fonction",
      subdomain: chapter.title,
      statementTemplate: "Programme : multiplier par ${{a}}$, puis ajouter ${{b}}$. Quelle fonction obtient-on ?",
      answerTemplate: "$f(x)={{a}}x+{{b}}$",
      correctionTemplate: "? partir de $x$, on obtient ${{a}}x$, puis ${{a}}x+{{b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 1, max: 15 } },
      tags: ["fonctions", "programme"]
    },
    {
      title: "Equation f(x)=k",
      subdomain: chapter.title,
      statementTemplate: "Soit $f(x)={{a}}x{{b < 0 ? '' : '+'}}{{b}}$. R?soudre $f(x)={{a*x+b}}$.",
      answerTemplate: "$x={{x}}$",
      correctionTemplate: "$ {{a}}x{{b < 0 ? '' : '+'}}{{b}}={{a*x+b}}$, donc ${{a}}x={{a*x}}$ et $x={{x}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: -8, max: 12 }, x: { type: "int", min: -5, max: 9 } },
      tags: ["fonctions", "antecedent", "equations"]
    },
    {
      title: "Taux d'accroissement simple",
      subdomain: chapter.title,
      statementTemplate: "Pour une fonction affine, deux points ont pour coordonnees $({{x1}};{{a*x1+b}})$ et $({{x2}};{{a*x2+b}})$. Coefficient directeur ?",
      answerTemplate: "{{a}}",
      correctionTemplate: "$a=\\dfrac{ {{a*x2+b}}-{{a*x1+b}} }{ {{x2}}-{{x1}} }={{a}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 6 }, b: { type: "int", min: -6, max: 10 }, x1: { type: "int", min: 0, max: 4 }, x2: { type: "int", min: 5, max: 10 } },
      tags: ["fonctions", "coefficient-directeur"]
    },
    {
      title: "Image de zero",
      subdomain: chapter.title,
      statementTemplate: "Soit $f(x)={{a}}x+{{b}}$. Calculer $f(0)$.",
      answerTemplate: "{{b}}",
      correctionTemplate: "$f(0)={{a}}\\times 0+{{b}}={{b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: -10, max: 15 } },
      tags: ["fonctions", "image"]
    },
    {
      title: "Lineaire ou affine",
      subdomain: chapter.title,
      statementTemplate: "$f(x)={{a}}x+{{b}}$ est-elle lineaire ?",
      answerTemplate: "{{b===0 ? 'Oui' : 'Non'}}",
      correctionTemplate: "Une fonction lineaire s'ecrit $f(x)=ax$ avec $b=0$. Ici $b={{b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "choice", values: [0, 1, 3, -2] } },
      tags: ["fonctions", "lineaire", "affine"]
    }
  ];

  const trigonometry: TemplateSeed[] = [
    {
      title: "Cosinus rapport",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Avec la figure, écris le rapport du cosinus de l'angle $\\alpha$.",
      answerTemplate: "$\\cos(\\alpha)=\\dfrac{\\text{adjacent}}{\\text{hypoténuse}}$",
      correctionTemplate: "Le cosinus compare le côté adjacent à l'hypoténuse.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "cosinus", "rapport"]
    },
    {
      title: "Sinus rapport",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Avec la figure, écris le rapport du sinus de l'angle $\\alpha$.",
      answerTemplate: "$\\sin(\\alpha)=\\dfrac{\\text{opposé}}{\\text{hypoténuse}}$",
      correctionTemplate: "Le sinus compare le côté opposé à l'hypoténuse.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "sinus", "rapport"]
    },
    {
      title: "Tangente rapport",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Avec la figure, écris le rapport de la tangente de l'angle $\\alpha$.",
      answerTemplate: "$\\tan(\\alpha)=\\dfrac{\\text{opposé}}{\\text{adjacent}}$",
      correctionTemplate: "La tangente compare le côté opposé au côté adjacent.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "tangente", "rapport"]
    },
    {
      title: "Choisir cosinus",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "On connaît l'adjacent et l'hypoténuse. Quelle relation trigonométrique choisir ?",
      answerTemplate: "cosinus",
      correctionTemplate: "Le cosinus relie adjacent et hypoténuse : $\\cos(\\alpha)=\\dfrac{\\text{adjacent}}{\\text{hypoténuse}}$.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "methode"]
    },
    {
      title: "Choisir sinus",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "On connaît l'opposé et l'hypoténuse. Quelle relation choisir ?",
      answerTemplate: "sinus",
      correctionTemplate: "Le sinus relie opposé et hypoténuse : $\\sin(\\alpha)=\\dfrac{\\text{opposé}}{\\text{hypoténuse}}$.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "methode"]
    },
    {
      title: "Choisir tangente",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "On connaît l'opposé et l'adjacent. Quelle relation choisir ?",
      answerTemplate: "tangente",
      correctionTemplate: "La tangente relie opposé et adjacent : $\\tan(\\alpha)=\\dfrac{\\text{opposé}}{\\text{adjacent}}$.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "" },
      tags: ["trigonometrie", "rapport", "methode"]
    },
    {
      title: "Compléter cosinus",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Écris le rapport : $\\cos(\\alpha)=\\dfrac{\\ldots}{\\ldots}$.",
      answerTemplate: "$\\cos(\\alpha)=\\dfrac{\\text{adjacent}}{\\text{hypoténuse}}$",
      correctionTemplate: "Pour le cosinus, on place l'adjacent au numérateur et l'hypoténuse au dénominateur.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "cosinus"]
    },
    {
      title: "Compléter sinus",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Écris le rapport : $\\sin(\\alpha)=\\dfrac{\\ldots}{\\ldots}$.",
      answerTemplate: "$\\sin(\\alpha)=\\dfrac{\\text{opposé}}{\\text{hypoténuse}}$",
      correctionTemplate: "Pour le sinus, on place l'opposé au numérateur et l'hypoténuse au dénominateur.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "sinus"]
    },
    {
      title: "Compléter tangente",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Écris le rapport : $\\tan(\\alpha)=\\dfrac{\\ldots}{\\ldots}$.",
      answerTemplate: "$\\tan(\\alpha)=\\dfrac{\\text{opposé}}{\\text{adjacent}}$",
      correctionTemplate: "Pour la tangente, on place l'opposé au numérateur et l'adjacent au dénominateur.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "tangente"]
    },
    {
      title: "SOH CAH TOA",
      subdomain: chapter.title,
      difficulty: 3,
      statementTemplate: "Dans $\\cos(\\alpha)=\\dfrac{\\ldots}{\\ldots}$, quels côtés placer ?",
      answerTemplate: "adjacent / hypotenuse",
      correctionTemplate: "$CAH$ : cosinus = adjacent / hypotenuse.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "vocabulaire"]
    },
    {
      title: "Identifier sur la figure",
      subdomain: chapter.title,
      difficulty: 4,
      statementTemplate: "Sur la figure, quels trois noms de côtés faut-il repérer avant d'écrire un rapport ?",
      answerTemplate: "opposé, adjacent, hypoténuse",
      correctionTemplate: "On repère le côté opposé, le côté adjacent et l'hypoténuse.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "rapport", "methode"]
    },
    {
      title: "Triangle rectangle obligatoire",
      subdomain: chapter.title,
      difficulty: 3,
      statementTemplate: "La trigonométrie sinus/cosinus/tangente de collège s'applique dans quel type de triangle ?",
      answerTemplate: "triangle rectangle",
      correctionTemplate: "Au collège, ces rapports sont définis dans un triangle rectangle.",
      variablesSchema: {},
      figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
      tags: ["trigonometrie", "vocabulaire"]
    }
  ];

  const algorithmic: TemplateSeed[] = [
    {
      title: "Scratch repetition",
      subdomain: chapter.title,
      statementTemplate: "Le programme part de ${{start}}$ et ajoute ${{step}}$ pendant ${{repeat}}$ repetitions. Valeur finale ?",
      answerTemplate: "{{start+step*repeat}}",
      correctionTemplate: "$ {{start}}+{{repeat}}\\times {{step}}={{start+step*repeat}}$.",
      variablesSchema: { start: { type: "int", min: 0, max: 20 }, step: { type: "int", min: 2, max: 9 }, repeat: { type: "int", min: 2, max: 12 } },
      figureTemplate: { kind: "scratch", blocks: ["mettre n a {{start}}", "repeter {{repeat}} fois", "ajouter {{step}} a n", "dire n"] },
      tags: ["scratch", "boucle", "algorithmique"]
    },
    {
      title: "Scratch condition",
      subdomain: chapter.title,
      statementTemplate: "Si $n={{n}}$, le test $n>{{limit}}$ est-il vrai ?",
      answerTemplate: "{{n>limit ? 'Oui' : 'Non'}}",
      correctionTemplate: "On compare ${{n}}$ et ${{limit}}$ : le test est {{n>limit ? 'vrai' : 'faux'}}.",
      variablesSchema: { n: { type: "int", min: 1, max: 40 }, limit: { type: "choice", values: [10, 15, 20, 25] } },
      figureTemplate: { kind: "scratch", blocks: ["si n > {{limit}} alors", "dire oui", "sinon", "dire non"] },
      tags: ["scratch", "condition"]
    },
    {
      title: "Programme de calcul",
      subdomain: chapter.title,
      statementTemplate: "Choisir ${{x}}$, multiplier par ${{a}}$, puis ajouter ${{b}}$. Resultat ?",
      answerTemplate: "{{a*x+b}}",
      correctionTemplate: "$ {{x}}\\times {{a}}+{{b}}={{a*x+b}}$.",
      variablesSchema: { x: { type: "int", min: -5, max: 12 }, a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 1, max: 20 } },
      figureTemplate: { kind: "scratch", blocks: ["demander la valeur de x", "mettre résultat à réponse × {{a}}", "ajouter {{b}} à résultat", "dire résultat"] },
      tags: ["scratch", "programme"]
    },
    {
      title: "Coordonnees Scratch",
      subdomain: chapter.title,
      statementTemplate: "Un lutin est en $({{x}};{{y}})$ puis change x de ${{dx}}$ et y de ${{dy}}$. Nouvelle position ?",
      answerTemplate: "({{x+dx}};{{y+dy}})",
      correctionTemplate: "Nouvelle abscisse : ${{x}}+{{dx}}={{x+dx}}$. Nouvelle ordonnee : ${{y}}+{{dy}}={{y+dy}}$.",
      variablesSchema: { x: { type: "int", min: -100, max: 100 }, y: { type: "int", min: -80, max: 80 }, dx: { type: "int", min: -30, max: 30 }, dy: { type: "int", min: -30, max: 30 } },
      figureTemplate: { kind: "scratch", blocks: ["aller a x: {{x}} y: {{y}}", "ajouter {{dx}} a x", "ajouter {{dy}} a y"] },
      tags: ["scratch", "coordonnees"]
    },
    {
      title: "Boucle imbriquee produit",
      subdomain: chapter.title,
      statementTemplate: "Une boucle de ${{a}}$ repetitions contient une boucle de ${{b}}$ repetitions. Combien d'actions au total ?",
      answerTemplate: "{{a*b}}",
      correctionTemplate: "$ {{a}}\\times {{b}}={{a*b}}$ actions.",
      variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 2, max: 8 } },
      figureTemplate: { kind: "scratch", blocks: ["répéter {{a}} fois", "répéter {{b}} fois", "avancer de 10 pas"] },
      tags: ["scratch", "boucle"]
    },
    {
      title: "Variable initialisee",
      subdomain: chapter.title,
      statementTemplate: "On met $score$ a ${{s}}$, puis on ajoute ${{a}}$, puis on retire ${{b}}$. Score final ?",
      answerTemplate: "{{s+a-b}}",
      correctionTemplate: "$ {{s}}+{{a}}-{{b}}={{s+a-b}}$.",
      variablesSchema: { s: { type: "int", min: 10, max: 20 }, a: { type: "int", min: 5, max: 15 }, b: { type: "int", min: 1, max: 10 } },
      figureTemplate: { kind: "scratch", blocks: ["mettre score a {{s}}", "ajouter {{a}} a score", "mettre score à score - {{b}}", "dire score"] },
      tags: ["scratch", "variable"]
    },
    {
      title: "Repeter jusqu'a",
      subdomain: chapter.title,
      statementTemplate: "On part de $0$ et on ajoute ${{step}}$ jusqu'a atteindre au moins ${{target}}$. Combien d'ajouts ?",
      answerTemplate: "{{Math.ceil(target/step)}}",
      correctionTemplate: "Il faut le plus petit entier $n$ tel que ${{step}}n\\ge {{target}}$, soit $n={{Math.ceil(target/step)}}$.",
      variablesSchema: { step: { type: "int", min: 2, max: 9 }, target: { type: "int", min: 12, max: 70 } },
      figureTemplate: { kind: "scratch", blocks: ["mettre n à 0", "répéter jusqu'à n >= {{target}}", "ajouter {{step}} à n", "dire n"] },
      tags: ["scratch", "boucle", "inegalite"]
    },
    {
      title: "Message conditionnel",
      subdomain: chapter.title,
      statementTemplate: "Si $score={{score}}$, le programme affiche reussi si $score\\ge {{limit}}$. Affiche-t-il reussi ?",
      answerTemplate: "{{score>=limit ? 'Oui' : 'Non'}}",
      correctionTemplate: "$ {{score}} {{score>=limit ? '≥' : '<'}} {{limit}}$, donc la reponse est {{score>=limit ? 'oui' : 'non'}}.",
      variablesSchema: { score: { type: "int", min: 0, max: 20 }, limit: { type: "choice", values: [8, 10, 12, 15] } },
      figureTemplate: { kind: "scratch", blocks: ["si score >= {{limit}} alors", "dire réussi", "sinon", "dire non réussi"] },
      tags: ["scratch", "condition"]
    },
    {
      title: "Expression de programme",
      subdomain: chapter.title,
      statementTemplate: "Un programme multiplie un nombre par ${{a}}$, puis retire ${{b}}$. Quelle expression est associée ?",
      answerTemplate: "$ {{a}}\\times \\text{nombre}-{{b}}$",
      correctionTemplate: "Multiplier par ${{a}}$ donne ${{a}}\\times \\text{nombre}$, puis retirer ${{b}}$ donne ${{a}}\\times \\text{nombre}-{{b}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 1, max: 15 } },
      figureTemplate: { kind: "scratch", blocks: ["demander un nombre", "mettre résultat à réponse × {{a}}", "ajouter -{{b}} à résultat", "dire résultat"] },
      tags: ["algorithmique", "expression"]
    },
    {
      title: "Compteur pair",
      subdomain: chapter.title,
      statementTemplate: "Le compteur commence a ${{start}}$ et augmente de $2$ pendant ${{repeat}}$ tours. Valeur finale ?",
      answerTemplate: "{{start+2*repeat}}",
      correctionTemplate: "$ {{start}}+2\\times {{repeat}}={{start+2*repeat}}$.",
      variablesSchema: { start: { type: "int", min: 0, max: 20 }, repeat: { type: "int", min: 2, max: 15 } },
      figureTemplate: { kind: "scratch", blocks: ["mettre compteur à {{start}}", "répéter {{repeat}} fois", "ajouter 2 à compteur", "dire compteur"] },
      tags: ["scratch", "boucle"]
    },
    {
      title: "Trace d'un carre",
      subdomain: chapter.title,
      statementTemplate: "Pour tracer un carre, on repete $4$ fois avancer ${{c}}$ et tourner de quel angle ?",
      answerTemplate: "90 degres",
      correctionTemplate: "Un carre a quatre angles droits : on tourne de $90^\\circ$ a chaque sommet.",
      variablesSchema: { c: { type: "int", min: 20, max: 120 } },
      figureTemplate: { kind: "scratch", blocks: ["repeter 4 fois", "avancer de {{c}}", "tourner de ? degres"] },
      tags: ["scratch", "geometrie"]
    },
    {
      title: "Trace d'un triangle equilateral",
      subdomain: chapter.title,
      statementTemplate: "Pour tracer un triangle equilateral avec Scratch, on repete $3$ fois et on tourne de quel angle exterieur ?",
      answerTemplate: "120 degres",
      correctionTemplate: "L'angle exterieur d'un triangle equilateral vaut $120^\\circ$.",
      variablesSchema: {},
      figureTemplate: { kind: "scratch", blocks: ["repeter 3 fois", "avancer", "tourner de ? degres"] },
      tags: ["scratch", "geometrie"]
    }
  ];

  if (chapter.domain === "decimaux") return decimals;
  if (chapter.domain === "fractions") return fractions;
  if (chapter.domain === "proportionnalite") return proportionality;
  if (chapter.domain === "grandeurs-mesures") return measurements;
  if (chapter.domain === "geometrie") return geometry;
  if (chapter.domain === "pythagore") return pythagorean;
  if (chapter.domain === "thales") return thales;
  if (chapter.domain === "calcul-litteral" || chapter.domain === "equations") return literal;
  if (chapter.domain === "puissances") return powers;
  if (chapter.domain === "statistiques") return statistics;
  if (chapter.domain === "probabilites") return probabilities;
  if (chapter.domain === "fonctions") return functions;
  if (chapter.domain === "trigonometrie") return trigonometry;
  if (chapter.domain === "algorithmique") return algorithmic;

  if (title.includes("prior")) {
    return arithmetic.map((template) => ({
      ...template,
      tags: [...(template.tags ?? []), "priorites"]
    }));
  }

  if (title.includes("arith") || title.includes("divisibil")) {
    return arithmetic.map((template) => ({
      ...template,
      tags: [...(template.tags ?? []), "arithmetique"]
    }));
  }

  return arithmetic;
}

function sixthGradeSafeReinforcementTemplates(chapter: ChapterInfo): TemplateSeed[] {
  if (chapter.level !== "6e") {
    return [];
  }

  const title = normalizedText(chapter.title);

  if (chapter.domain === "nombres-calculs") {
    return [
      {
        title: "Compl?ment ? une cible",
        subdomain: chapter.title,
        statementTemplate: "Compl?ter : ${{a}}+\\Box={{target}}$.",
        answerTemplate: "{{target-a}}",
        correctionTemplate: "$ {{target}}-{{a}}={{target-a}}$, donc $\\Box={{target-a}}$.",
        variablesSchema: { a: { type: "int", min: 12, max: 88 }, target: { type: "choice", values: [100, 150, 200] } },
        tags: ["calcul", "mental", "6e-safe"]
      },
      {
        title: "Double rapide",
        subdomain: chapter.title,
        statementTemplate: "Donner le double de ${{a}}$.",
        answerTemplate: "{{2*a}}",
        correctionTemplate: "Le double de ${{a}}$ vaut $2\\times {{a}}={{2*a}}$.",
        variablesSchema: { a: { type: "int", min: 6, max: 75 } },
        tags: ["calcul", "mental", "6e-safe"]
      },
      {
        title: "Table exacte",
        subdomain: chapter.title,
        statementTemplate: "Calculer ${{a}}\\times {{b}}$.",
        answerTemplate: "{{a*b}}",
        correctionTemplate: "$ {{a}}\\times {{b}}={{a*b}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 10 }, b: { type: "int", min: 2, max: 10 } },
        tags: ["calcul", "tables", "6e-safe"]
      }
    ];
  }

  if (chapter.domain === "fractions") {
    return [
      {
        title: "Lire une fraction",
        subdomain: chapter.title,
        statementTemplate: "Dans $\\dfrac{ {{num}} }{ {{den}} }$, quel est le dénominateur ?",
        answerTemplate: "{{den}}",
        correctionTemplate: "Le dénominateur est le nombre placé sous la barre de fraction : ${{den}}$.",
        variablesSchema: { num: { type: "int", min: 1, max: 8 }, den: { type: "choice", values: [3, 4, 5, 6, 8, 10] } },
        tags: ["fractions", "vocabulaire", "6e-safe"]
      },
      {
        title: "Fraction d'un partage",
        subdomain: chapter.title,
        statementTemplate: "$ {{num}}$ parts colorées sur ${{den}}$ parts égales : écrire la fraction.",
        answerTemplate: "$\\dfrac{ {{num}} }{ {{den}} }$",
        correctionTemplate: "On écrit $\\dfrac{nombre\\ de\\ parts\\ colorées}{nombre\\ total\\ de\\ parts}=\\dfrac{ {{num}} }{ {{den}} }$.",
        variablesSchema: { num: { type: "int", min: 1, max: 4 }, den: { type: "choice", values: [5, 6, 8, 10] } },
        tags: ["fractions", "partage", "6e-safe"]
      }
    ];
  }

  if (chapter.domain === "decimaux") {
    return [
      {
        title: "Rang du dixi?me",
        subdomain: chapter.title,
        statementTemplate: "Dans ${{formatDecimalFrench(u+d/10)}}$, quel est le chiffre des dixi?mes ?",
        answerTemplate: "{{d}}",
        correctionTemplate: "Le chiffre des dixi?mes est le premier chiffre apr?s la virgule : ${{d}}$.",
        variablesSchema: { u: { type: "int", min: 2, max: 80 }, d: { type: "int", min: 1, max: 9 } },
        tags: ["decimaux", "numeration", "6e-safe"]
      },
      {
        title: "Fraction d?cimale",
        subdomain: chapter.title,
        statementTemplate: "?crire ${{formatDecimalFrench(a/10)}}$ sous forme de fraction d?cimale.",
        answerTemplate: "$\\dfrac{ {{a}} }{10}$",
        correctionTemplate: "$ {{formatDecimalFrench(a/10)}}=\\dfrac{ {{a}} }{10}$.",
        variablesSchema: { a: { type: "int", min: 1, max: 99 } },
        tags: ["decimaux", "fractions-decimales", "6e-safe"]
      }
    ];
  }

  if (chapter.domain === "proportionnalite") {
    return [
      {
        title: "Table proportionnelle",
        subdomain: chapter.title,
        statementTemplate: "Si ${{a}}$ objets co?tent ${{a*k}}$ euros, combien co?tent ${{b}}$ objets au m?me prix ?",
        answerTemplate: "{{b*k}} euros",
        correctionTemplate: "Un objet co?te ${{k}}$ euros, donc ${{b}}$ objets co?tent ${{b}}\\times {{k}}={{b*k}}$ euros.",
        variablesSchema: { a: { type: "int", min: 2, max: 6 }, b: { type: "int", min: 3, max: 9 }, k: { type: "int", min: 2, max: 8 } },
        tags: ["proportionnalite", "prix", "6e-safe"]
      },
      {
        title: "Pourcentage simple",
        subdomain: chapter.title,
        statementTemplate: "Calculer $50\\%$ de ${{2*a}}$.",
        answerTemplate: "{{a}}",
        correctionTemplate: "$50\\%$ signifie la moiti? : la moiti? de ${{2*a}}$ est ${{a}}$.",
        variablesSchema: { a: { type: "int", min: 6, max: 60 } },
        tags: ["proportionnalite", "pourcentage", "6e-safe"]
      }
    ];
  }

  if (chapter.domain === "grandeurs-mesures") {
    return [
      {
        title: "P?rim?tre de rectangle",
        subdomain: chapter.title,
        statementTemplate: "Un rectangle mesure ${{l}}$ cm sur ${{w}}$ cm. Calculer son p?rim?tre.",
        answerTemplate: "{{2*(l+w)}} cm",
        correctionTemplate: "$P=2\\times({{l}}+{{w}})=2\\times {{l+w}}={{2*(l+w)}}$ cm.",
        variablesSchema: { l: { type: "int", min: 4, max: 16 }, w: { type: "int", min: 2, max: 12 } },
        figureTemplate: { kind: "rectangle", widthLabel: "{{l}} cm", heightLabel: "{{w}} cm" },
        tags: ["grandeurs", "perimetre", "6e-safe"]
      },
      {
        title: "Conversion de longueur",
        subdomain: chapter.title,
        statementTemplate: "Convertir ${{m}}$ m en cm.",
        answerTemplate: "{{m*100}} cm",
        correctionTemplate: "$1$ m $=100$ cm, donc ${{m}}$ m $={{m*100}}$ cm.",
        variablesSchema: { m: { type: "int", min: 2, max: 12 } },
        tags: ["grandeurs", "conversion", "6e-safe"]
      }
    ];
  }

  if (chapter.domain === "geometrie") {
    const geometrySafe: TemplateSeed[] = [
      {
        title: "Notation de segment",
        subdomain: chapter.title,
        statementTemplate: "La longueur du segment $[AB]$ se note comment ?",
        answerTemplate: "$AB$",
        correctionTemplate: "$[AB]$ d?signe le segment ; $AB$ d?signe sa longueur.",
        variablesSchema: {},
        tags: ["geometrie", "vocabulaire", "6e-safe"]
      },
      {
        title: "Angle droit",
        subdomain: chapter.title,
        statementTemplate: "Quelle est la mesure d'un angle droit ?",
        answerTemplate: "$90^\\circ$",
        correctionTemplate: "Un angle droit mesure $90^\\circ$.",
        variablesSchema: {},
        tags: ["geometrie", "angles", "vocabulaire", "6e-safe"]
      },
      {
        title: "Milieu d'un segment",
        subdomain: chapter.title,
        statementTemplate: "M est le milieu de $[AB]$ et $AB={{2*d}}$ cm. Calculer $AM$.",
        answerTemplate: "{{d}} cm",
        correctionTemplate: "Le milieu partage le segment en deux parties ?gales : $AM={{2*d}}\\div 2={{d}}$ cm.",
        variablesSchema: { d: { type: "int", min: 2, max: 12 } },
        tags: ["geometrie", "milieu", "6e-safe"]
      }
    ];

    if (title.includes("perpendiculaires") || title.includes("paralleles")) {
      return [
        {
          title: "Definition paralleles",
          subdomain: chapter.title,
          statementTemplate: "Deux droites d'un meme plan qui ne se coupent pas sont appelees comment ?",
          answerTemplate: "Paralleles",
          correctionTemplate: "Deux droites paralleles ont la meme direction et ne se coupent pas.",
          variablesSchema: {},
          tags: ["geometrie", "parallele", "droite", "6e-safe"]
        },
        {
          title: "Definition perpendiculaires",
          subdomain: chapter.title,
          statementTemplate: "Deux droites qui se coupent en formant un angle droit sont appelees comment ?",
          answerTemplate: "Perpendiculaires",
          correctionTemplate: "Deux droites perpendiculaires forment un angle droit, donc un angle de $90^\\circ$.",
          variablesSchema: {},
          tags: ["geometrie", "perpendiculaire", "droite", "angle droit", "6e-safe"]
        },
        {
          title: "Notation parallele",
          subdomain: chapter.title,
          statementTemplate: "Completer la notation : $(d)$ est parallele a $(e)$ s'ecrit $(d) ... (e)$.",
          answerTemplate: "$\\parallel$",
          correctionTemplate: "Le symbole du parallelisme est $\\parallel$ : $(d)\\parallel(e)$.",
          variablesSchema: {},
          tags: ["geometrie", "parallele", "notation", "6e-safe"]
        },
        {
          title: "Notation perpendiculaire",
          subdomain: chapter.title,
          statementTemplate: "Completer la notation : $(d)$ est perpendiculaire a $(e)$ s'ecrit $(d) ... (e)$.",
          answerTemplate: "$\\perp$",
          correctionTemplate: "Le symbole de perpendicularite est $\\perp$ : $(d)\\perp(e)$.",
          variablesSchema: {},
          tags: ["geometrie", "perpendiculaire", "notation", "6e-safe"]
        },
        {
          title: "Deux perpendiculaires meme droite",
          subdomain: chapter.title,
          statementTemplate: "Si deux droites sont perpendiculaires a une meme droite, que peut-on dire d'elles ?",
          answerTemplate: "Elles sont paralleles",
          correctionTemplate: "Deux droites perpendiculaires a une meme droite sont paralleles.",
          variablesSchema: {},
          tags: ["geometrie", "perpendiculaire", "parallele", "6e-safe"]
        },
        ...geometrySafe
      ];
    }

    if (title.includes("angles")) {
      return [
        {
          title: "Angle aigu",
          subdomain: chapter.title,
          statementTemplate: "Un angle de ${{a}}^\\circ$ est-il aigu ?",
          answerTemplate: "{{a<90 ? 'Oui' : 'Non'}}",
          correctionTemplate: "Un angle aigu mesure moins de $90^\\circ$.",
          variablesSchema: { a: { type: "int", min: 25, max: 120 } },
          tags: ["geometrie", "angle", "6e-safe"]
        },
        {
          title: "Angle obtus",
          subdomain: chapter.title,
          statementTemplate: "Un angle de ${{a}}^\\circ$ est-il obtus ?",
          answerTemplate: "{{a>90 && a<180 ? 'Oui' : 'Non'}}",
          correctionTemplate: "Un angle obtus mesure entre $90^\\circ$ et $180^\\circ$.",
          variablesSchema: { a: { type: "int", min: 60, max: 160 } },
          tags: ["geometrie", "angle", "6e-safe"]
        },
        {
          title: "Angle droit mesure",
          subdomain: chapter.title,
          statementTemplate: "Un angle droit mesure combien de degres ?",
          answerTemplate: "$90^\\circ$",
          correctionTemplate: "Par definition, un angle droit mesure $90^\\circ$.",
          variablesSchema: {},
          tags: ["geometrie", "angle droit", "vocabulaire", "6e-safe"]
        },
        ...geometrySafe
      ];
    }

    return geometrySafe;
  }

  return [];
}

function geometryChapterReinforcementTemplates(chapter: ChapterInfo): TemplateSeed[] {
  if (chapter.domain !== "geometrie") {
    return [];
  }

  const title = normalizedText(chapter.title);
  const t = (
    templateTitle: string,
    statementTemplate: string,
    answerTemplate: string,
    correctionTemplate: string,
    tags: string[],
    variablesSchema: VariableSchema = {},
    figureTemplate?: FigureTemplate
  ): TemplateSeed => ({
    title: templateTitle,
    subdomain: chapter.title,
    statementTemplate,
    answerTemplate,
    correctionTemplate,
    variablesSchema,
    tags: ["geometrie-ciblee", ...tags],
    figureTemplate
  });

  if (title.includes("vocabulaire")) {
    return [
      t("Notation de segment", "Le segment d'extremites A et B se note comment ?", "$[AB]$", "Les crochets designent le segment : $[AB]$.", ["vocabulaire", "segment", "notation"]),
      t("Longueur d'un segment", "La longueur du segment $[AB]$ se note comment ?", "$AB$", "Sans crochets, $AB$ designe la longueur du segment.", ["vocabulaire", "segment", "notation"]),
      t("Droite passant par deux points", "La droite passant par A et B se note comment ?", "$(AB)$", "Les parentheses designent la droite : $(AB)$.", ["vocabulaire", "droite", "notation"]),
      t("Demi-droite", "La demi-droite d'origine A passant par B se note comment ?", "$[AB)$", "$[AB)$ commence en A et passe par B.", ["vocabulaire", "droite", "notation"]),
      t("Point sur une droite", "Si le point M est sur la droite $(d)$, quelle notation peut-on ecrire ?", "$M\\in(d)$", "Le symbole $\\in$ signifie appartient a.", ["vocabulaire", "point", "droite"]),
      t("Point hors d'une droite", "Si le point M n'est pas sur $(d)$, quelle notation peut-on ecrire ?", "$M\\notin(d)$", "Le symbole $\\notin$ signifie n'appartient pas a.", ["vocabulaire", "point", "droite"]),
      t("Intersection de droites", "Deux droites $(d)$ et $(e)$ se coupent en A. Quel mot de geometrie decrit A ?", "Point d'intersection", "A est le point commun aux deux droites.", ["vocabulaire", "intersection", "droite"]),
      t("Milieu definition", "M est le milieu de $[AB]$. Que peut-on dire des longueurs $AM$ et $MB$ ?", "$AM=MB$", "Le milieu partage le segment en deux longueurs egales.", ["vocabulaire", "milieu", "segment"]),
      t("Rayon d'un cercle", "Dans un cercle de centre O, comment appelle-t-on le segment $[OA]$ avec A sur le cercle ?", "Un rayon", "Un rayon relie le centre du cercle a un point du cercle.", ["vocabulaire", "cercle", "rayon"]),
      t("Diametre d'un cercle", "Dans un cercle, un segment qui passe par le centre et relie deux points du cercle est un ...", "diametre", "Un diametre passe par le centre et ses extremites sont sur le cercle.", ["vocabulaire", "cercle", "diametre"]),
      t("Angle droit vocabulaire", "Un angle droit mesure combien de degres ?", "$90^\\circ$", "Par definition, un angle droit mesure $90^\\circ$.", ["vocabulaire", "angle droit"]),
      t("Polygone vocabulaire", "Un polygone a ${{n}}$ cotes. Combien a-t-il de sommets ?", "{{n}}", "Dans un polygone, il y a autant de sommets que de cotes.", ["vocabulaire", "point"], { n: { type: "choice", values: [3, 4, 5, 6, 8] } })
    ];
  }

  if (title.includes("perpendiculaires") || title.includes("paralleles")) {
    return [
      t("Droites perpendiculaires", "Deux droites se coupent en formant un angle droit. Comment les appelle-t-on ?", "Perpendiculaires", "Deux droites perpendiculaires forment un angle droit.", ["perpendiculaire", "droite", "angle droit"]),
      t("Notation perpendiculaire", "Completer : si $(d)$ est perpendiculaire a $(e)$, on ecrit $(d) ... (e)$.", "$\\perp$", "Le symbole de perpendicularite est $\\perp$.", ["perpendiculaire", "droite", "notation"]),
      t("Notation parallele", "Completer : si $(d)$ est parallele a $(e)$, on ecrit $(d) ... (e)$.", "$\\parallel$", "Le symbole de parallelisme est $\\parallel$.", ["parallele", "droite", "notation"]),
      t("Deux perpendiculaires", "Si $(d)\\perp(f)$ et $(e)\\perp(f)$, que peut-on dire de $(d)$ et $(e)$ ?", "Elles sont paralleles", "Deux droites perpendiculaires a une meme droite sont paralleles.", ["perpendiculaire", "parallele", "droite"]),
      t("Parallele et perpendiculaire", "Si $(d)\\parallel(e)$ et $(f)\\perp(d)$, que peut-on dire de $(f)$ et $(e)$ ?", "Elles sont perpendiculaires", "Une droite perpendiculaire a l'une de deux paralleles est perpendiculaire a l'autre.", ["perpendiculaire", "parallele", "droite"]),
      t("Angle forme par perpendiculaires", "Deux droites perpendiculaires forment un angle de quelle mesure ?", "$90^\\circ$", "La perpendicularite correspond a un angle droit.", ["perpendiculaire", "angle droit"]),
      t("Droites paralleles definition", "Deux droites d'un meme plan qui ne se coupent pas sont ...", "paralleles", "Des droites paralleles gardent la meme direction et ne se coupent pas.", ["parallele", "droite"]),
      t("Secante", "Une droite qui coupe deux droites paralleles est appelee une ...", "secante", "La secante rencontre les deux droites.", ["parallele", "secante", "droite"]),
      t("Angle correspondant", "Deux droites paralleles sont coupees par une secante. Deux angles correspondants sont-ils egaux ?", "Oui", "Avec des droites paralleles, les angles correspondants ont la meme mesure.", ["parallele", "secante", "angle"]),
      t("Construction parallele", "Pour tracer une parallele, doit-on conserver la direction ou la longueur ?", "La direction", "Une parallele a la meme direction que la droite de depart.", ["parallele", "droite"]),
      t("Construction perpendiculaire", "Pour tracer une perpendiculaire, quel angle doit-on construire ?", "Un angle droit", "Une perpendiculaire forme un angle de $90^\\circ$.", ["perpendiculaire", "angle droit"]),
      t("Droites confondues", "Deux droites qui ont deux points communs distincts sont-elles secantes ou confondues ?", "Confondues", "Deux points distincts determinent une seule droite.", ["droite", "point"]),
      t("Parallele unique", "Par un point exterieur a une droite, combien de paralleles a cette droite peut-on tracer ?", "Une seule", "Par un point donne, il existe une unique parallele a une droite donnee.", ["parallele", "droite", "point"]),
      t("Perpendiculaire unique", "Par un point donne, combien de perpendiculaires a une droite peut-on tracer ?", "Une seule", "Par un point donne, il existe une unique perpendiculaire a une droite donnee.", ["perpendiculaire", "droite", "point"])
    ];
  }

  if (title === "angles" || title.includes("angles et paralleles")) {
    return [
      t("Mesure d'un angle droit", "Quelle est la mesure d'un angle droit ?", "$90^\\circ$", "Un angle droit mesure $90^\\circ$.", ["angle", "vocabulaire"]),
      t("Angle plat", "Quelle est la mesure d'un angle plat ?", "$180^\\circ$", "Un angle plat mesure $180^\\circ$.", ["angle", "vocabulaire"]),
      t("Angle aigu", "Un angle de ${{a}}^\\circ$ est-il aigu ?", "{{a<90 ? 'Oui' : 'Non'}}", "Un angle aigu mesure moins de $90^\\circ$.", ["angle"], { a: { type: "int", min: 25, max: 120 } }),
      t("Angle obtus", "Un angle de ${{a}}^\\circ$ est-il obtus ?", "{{a>90 && a<180 ? 'Oui' : 'Non'}}", "Un angle obtus mesure entre $90^\\circ$ et $180^\\circ$.", ["angle"], { a: { type: "int", min: 60, max: 160 } }),
      t("Angles supplementaires", "Deux angles supplementaires ont une somme de combien ?", "$180^\\circ$", "Deux angles supplementaires ont pour somme $180^\\circ$.", ["angle", "vocabulaire"]),
      t("Complement a 90", "Un angle mesure ${{a}}^\\circ$. Quel angle faut-il ajouter pour obtenir $90^\\circ$ ?", "${{90-a}}^\\circ$", "$90^\\circ-{{a}}^\\circ={{90-a}}^\\circ$.", ["angle"], { a: { type: "int", min: 20, max: 70 } }),
      t("Supplement a 180", "Un angle mesure ${{a}}^\\circ$. Quel angle faut-il ajouter pour obtenir $180^\\circ$ ?", "${{180-a}}^\\circ$", "$180^\\circ-{{a}}^\\circ={{180-a}}^\\circ$.", ["angle"], { a: { type: "int", min: 35, max: 145 } }),
      t("Angles opposes par le sommet", "Deux angles opposes par le sommet ont-ils la meme mesure ?", "Oui", "Des angles opposes par le sommet sont egaux.", ["angle", "vocabulaire"]),
      t("Angles correspondants", "Avec deux droites paralleles et une secante, les angles correspondants sont-ils egaux ?", "Oui", "Le parallelisme conserve les angles correspondants.", ["angle", "parallele", "secante"]),
      t("Angles alternes-internes", "Avec deux droites paralleles et une secante, deux angles alternes-internes sont-ils egaux ?", "Oui", "Les angles alternes-internes formes par deux paralleles sont egaux.", ["angle", "parallele", "secante"]),
      t("Somme dans un triangle", "Dans un triangle, la somme des trois angles vaut combien ?", "$180^\\circ$", "La somme des angles d'un triangle vaut $180^\\circ$.", ["angle", "triangle"], {}, { kind: "triangle", labelA: "?", labelB: "", labelC: "" }),
      t("Troisieme angle", "Dans un triangle, deux angles mesurent ${{a}}^\\circ$ et ${{b}}^\\circ$. Calculer le troisieme.", "{{180-a-b}}^\\circ", "$180^\\circ-{{a}}^\\circ-{{b}}^\\circ={{180-a-b}}^\\circ$.", ["angle", "triangle"], { a: { type: "int", min: 35, max: 75 }, b: { type: "int", min: 35, max: 75 } }, { kind: "triangle", labelA: "{{a}}^\\circ", labelB: "{{b}}^\\circ", labelC: "?" }),
      t("Angles alternes question", "Deux droites paralleles sont coupees par une secante. Un angle alterne-interne vaut ${{a}}^\\circ$. Que vaut son alterne-interne ?", "{{a}}^\\circ", "Les angles alternes-internes sont egaux quand les droites sont paralleles.", ["angle", "parallele", "secante"], { a: { type: "int", min: 35, max: 145 } }, { kind: "parallel-lines", angleLabel: "{{a}}^\\circ", anglePair: "alternate-interior" }),
      t("Angles correspondants question", "Deux droites paralleles sont coupees par une secante. Un angle correspondant vaut ${{a}}^\\circ$. Que vaut l'autre ?", "{{a}}^\\circ", "Les angles correspondants sont egaux quand les droites sont paralleles.", ["angle", "parallele", "secante"], { a: { type: "int", min: 35, max: 145 } }, { kind: "parallel-lines", angleLabel: "{{a}}^\\circ", anglePair: "corresponding" })
    ];
  }

  if (title.includes("inegalite triangulaire")) {
    return [
      t("Inegalite triangulaire directe", "Peut-on construire un triangle de cotes ${{a}}$, ${{b}}$ et ${{a+b-1}}$ cm ?", "Oui", "Le plus grand cote est inferieur a la somme des deux autres.", ["inegalite", "triangle"], { a: { type: "int", min: 3, max: 10 }, b: { type: "int", min: 3, max: 10 } }),
      t("Inegalite triangulaire impossible", "Peut-on construire un triangle de cotes ${{a}}$, ${{b}}$ et ${{a+b}}$ cm ?", "Non", "Pour construire un triangle, le plus grand cote doit etre strictement inferieur a la somme des deux autres.", ["inegalite", "triangle"], { a: { type: "int", min: 3, max: 10 }, b: { type: "int", min: 3, max: 10 } }),
      t("Plus grand cote", "Pour tester ${{a}}$, ${{b}}$ et ${{c}}$, quel cote faut-il comparer a la somme des deux autres ?", "Le plus grand", "On compare le plus grand cote a la somme des deux autres.", ["inegalite", "triangle"], { a: { type: "int", min: 4, max: 8 }, b: { type: "int", min: 5, max: 12 }, c: { type: "int", min: 9, max: 16 } }),
      t("Longueur maximale", "Un triangle a deux cotes de ${{a}}$ cm et ${{b}}$ cm. La troisieme longueur doit etre strictement inferieure a combien ?", "{{a+b}} cm", "Elle doit etre strictement inferieure a la somme ${{a}}+{{b}}={{a+b}}$.", ["inegalite", "triangle"], { a: { type: "int", min: 3, max: 12 }, b: { type: "int", min: 3, max: 12 } }),
      t("Longueur minimale", "Un triangle a deux cotes de ${{a+b}}$ cm et ${{b}}$ cm. La troisieme longueur doit etre strictement superieure a combien ?", "{{a}} cm", "Elle doit etre strictement superieure a la difference ${{a+b}}-{{b}}={{a}}$.", ["inegalite", "triangle"], { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 3, max: 12 } }),
      t("Cas limite", "Les longueurs ${{a}}$, ${{b}}$ et ${{a+b}}$ cm forment-elles un triangle ?", "Non", "Il faut une inegalite stricte, pas une egalite.", ["inegalite", "triangle"], { a: { type: "int", min: 3, max: 9 }, b: { type: "int", min: 4, max: 12 } }),
      t("Triangle constructible", "$5$, $7$ et $9$ cm permettent-ils de construire un triangle ?", "Oui", "$9<5+7$, donc le triangle est constructible.", ["inegalite", "triangle"]),
      t("Triangle non constructible", "$4$, $6$ et $10$ cm permettent-ils de construire un triangle ?", "Non", "$10=4+6$, donc les points seraient alignes.", ["inegalite", "triangle"]),
      t("Somme a verifier", "Pour ${{a}}$, ${{b}}$, ${{c}}$, calculer la somme des deux plus petits si ${{c}}$ est le plus grand.", "{{a+b}}", "On additionne les deux plus petits cotes : ${{a}}+{{b}}={{a+b}}$.", ["inegalite", "triangle"], { a: { type: "int", min: 3, max: 8 }, b: { type: "int", min: 4, max: 9 }, c: { type: "int", min: 10, max: 15 } }),
      t("Comparer au plus grand", "Si les deux plus petits cotes totalisent ${{s}}$ cm et le plus grand vaut ${{g}}$ cm, le triangle existe-t-il ?", "{{s>g ? 'Oui' : 'Non'}}", "Le triangle existe seulement si la somme des deux plus petits est strictement plus grande que le plus grand.", ["inegalite", "triangle"], { s: { type: "choice", values: [9, 12, 15] }, g: { type: "choice", values: [10, 12, 14] } }),
      t("Redaction courte", "Completer : dans un triangle, chaque cote est ... a la somme des deux autres.", "inferieur", "C'est l'inegalite triangulaire.", ["inegalite", "triangle"]),
      t("Construction possible", "Avec $AB={{a}}$ cm, $AC={{b}}$ cm et $BC={{a+b-2}}$ cm, la construction est-elle possible ?", "Oui", "$BC<AB+AC$, donc la condition principale est respectee.", ["inegalite", "triangle"], { a: { type: "int", min: 4, max: 10 }, b: { type: "int", min: 4, max: 10 } }),
      t("Condition stricte", "Dans l'inegalite triangulaire, l'inegalite doit-elle etre stricte ?", "Oui", "Le plus grand cote doit etre strictement inferieur a la somme des deux autres.", ["inegalite", "triangle"]),
      t("Comparer 8 5 3", "Les longueurs $8$, $5$ et $3$ cm forment-elles un triangle ?", "Non", "$8=5+3$, donc ce n'est pas un triangle.", ["inegalite", "triangle"]),
      t("Comparer 8 5 4", "Les longueurs $8$, $5$ et $4$ cm forment-elles un triangle ?", "Oui", "$8<5+4$, donc le triangle est constructible.", ["inegalite", "triangle"]),
      t("Difference minimale", "Deux cotes mesurent ${{a+b}}$ cm et ${{a}}$ cm. La troisieme longueur doit etre superieure a combien ?", "{{b}} cm", "Elle doit etre superieure a la difference ${{a+b}}-{{a}}={{b}}$.", ["inegalite", "triangle"], { a: { type: "int", min: 3, max: 10 }, b: { type: "int", min: 2, max: 8 } }),
      t("Intervalle de longueur", "Deux cotes mesurent ${{a}}$ cm et ${{b}}$ cm. La troisieme longueur est inferieure a ${{a+b}}$ cm et superieure a quoi ?", "{{Math.abs(a-b)}} cm", "Elle est superieure a la difference des deux longueurs.", ["inegalite", "triangle"], { a: { type: "int", min: 6, max: 12 }, b: { type: "int", min: 2, max: 5 } })
    ];
  }

  if (title.includes("representation spatiale")) {
    return [
      t("Faces du cube", "Combien de faces possede un cube ?", "6", "Un cube possede 6 faces carrees.", ["espace", "solide", "cube", "face"], {}, { kind: "solid", solid: "pave", labels: ["6 faces"] }),
      t("Aretes du cube", "Combien d'aretes possede un cube ?", "12", "Un cube possede 12 aretes.", ["espace", "solide", "cube", "arete"], {}, { kind: "solid", solid: "pave", labels: ["12 aretes"] }),
      t("Sommets du cube", "Combien de sommets possede un cube ?", "8", "Un cube possede 8 sommets.", ["espace", "solide", "cube", "sommet"], {}, { kind: "solid", solid: "pave", labels: ["8 sommets"] }),
      t("Faces du pave", "Combien de faces possede un pave droit ?", "6", "Un pave droit possede 6 faces rectangulaires.", ["espace", "solide", "pave", "face"], {}, { kind: "solid", solid: "pave", labels: ["6 faces"] }),
      t("Aretes du pave", "Combien d'aretes possede un pave droit ?", "12", "Un pave droit possede 12 aretes.", ["espace", "solide", "pave", "arete"], {}, { kind: "solid", solid: "pave", labels: ["12 aretes"] }),
      t("Sommets du pave", "Combien de sommets possede un pave droit ?", "8", "Un pave droit possede 8 sommets.", ["espace", "solide", "pave", "sommet"], {}, { kind: "solid", solid: "pave", labels: ["8 sommets"] }),
      t("Patron de cube", "Un patron de cube doit contenir combien de carres ?", "6", "Chaque face du cube correspond a un carre du patron.", ["espace", "solide", "cube", "face"]),
      t("Face opposee", "Dans un pave droit, la face du haut et la face du bas sont-elles paralleles ?", "Oui", "Deux faces opposees d'un pave droit sont paralleles.", ["espace", "solide", "pave", "face"]),
      t("Aretes paralleles", "Dans un cube, des aretes de meme direction sont-elles paralleles ?", "Oui", "Les aretes de meme direction sont paralleles.", ["espace", "solide", "cube", "arete"]),
      t("Solide ou figure plane", "Un cube est-il un solide ou une figure plane ?", "Un solide", "Un cube est un objet de l'espace.", ["espace", "solide", "cube"]),
      t("Dimension du solide", "Un pave droit se decrit avec combien de dimensions ?", "3", "Il faut longueur, largeur et hauteur.", ["espace", "solide", "pave"]),
      t("Nom du solide", "Un solide dont toutes les faces sont des carres est un ...", "cube", "Le cube a 6 faces carrees.", ["espace", "solide", "cube"]),
      t("Face visible", "Sur le dessin d'un pave droit, une face est-elle une surface plane ?", "Oui", "Chaque face d'un pave droit est plane.", ["espace", "solide", "pave", "face"]),
      t("Sommet commun", "Dans un cube, combien d'aretes se rencontrent en un sommet ?", "3", "Trois aretes se rejoignent a chaque sommet du cube.", ["espace", "solide", "cube", "sommet", "arete"])
    ];
  }

  if (title.includes("symetrie")) {
    return [
      t("Axe et distances", "A' est le symetrique de A par rapport a un axe. Les distances a l'axe sont-elles egales ?", "Oui", "Un point et son image sont a la meme distance de l'axe.", ["symetrie", "axe", "distance"]),
      t("Axe mediatrice", "Dans une symetrie axiale, l'axe est quelle droite pour $[AA']$ ?", "La mediatrice", "L'axe est perpendiculaire a $[AA']$ et passe par son milieu.", ["symetrie", "axe", "mediatrice"]),
      t(
        "Milieu point-image",
        title.includes("centrale")
          ? "M est le centre de la symétrie qui transforme A en A'. Si $MA={{d}}$ cm, que vaut $MA'$ ?"
          : "M appartient à l'axe de symétrie et A' est l'image de A. Si $MA={{d}}$ cm, que vaut $MA'$ ?",
        "{{d}} cm",
        title.includes("centrale")
          ? "Le centre M est le milieu de $[AA']$, donc $MA=MA'$."
          : "Tout point de l'axe de symétrie est équidistant de A et de A'.",
        ["symetrie", "distance", "centre"],
        { d: { type: "int", min: 2, max: 15 } }
      ),
      t("Point sur l'axe", "Un point situe sur l'axe de symetrie change-t-il d'image ?", "Non", "Un point de l'axe est invariant.", ["symetrie", "axe"]),
      t("Longueur conservee", "Par symetrie, $AB={{d}}$ cm. Que vaut $A'B'$ ?", "{{d}} cm", "La symetrie conserve les longueurs.", ["symetrie", "distance"], { d: { type: "int", min: 2, max: 18 } }),
      t("Angle conserve", "Par symetrie, un angle de ${{a}}^\\circ$ a une image de quelle mesure ?", "{{a}}^\\circ", "La symetrie conserve les mesures d'angles.", ["symetrie", "distance"], { a: { type: "int", min: 30, max: 140 } }),
      t("Symetrie centrale centre", "Dans une symetrie centrale de centre O, quel est le role de O pour $[AA']$ ?", "Milieu", "Le centre de symetrie est le milieu du segment point-image.", ["symetrie", "milieu"]),
      t("Distance centrale", "O est centre de symetrie, $OA={{d}}$ cm. Que vaut $OA'$ ?", "{{d}} cm", "Le centre est equidistant du point et de son image.", ["symetrie", "distance"], { d: { type: "int", min: 2, max: 15 } }),
      t("Segment point-image", "O est le milieu de $[AA']$ et $OA={{d}}$ cm. Que vaut $AA'$ ?", "{{2*d}} cm", "$AA'=2\\times OA={{2*d}}$ cm.", ["symetrie", "milieu"], { d: { type: "int", min: 2, max: 12 } }),
      t("Image d'une droite", "La symetrie transforme une droite en quel type d'objet ?", "Une droite", "L'image d'une droite par symetrie est une droite.", ["symetrie", "axe"]),
      t("Conservation alignement", "La symetrie conserve-t-elle l'alignement des points ?", "Oui", "L'image de points alignes reste alignee.", ["symetrie", "distance"]),
      t("Axe vertical", "Si l'axe de symetrie est vertical, le point image est de l'autre cote a la meme ...", "distance", "Les distances a l'axe sont egales.", ["symetrie", "axe", "distance"])
    ];
  }

  if (title.includes("translation")) {
    return [
      t("Vecteur de translation", "Une translation envoie A sur A'. Quel objet decrit le deplacement ?", "Le vecteur $\\overrightarrow{AA'}$", "Le vecteur donne la direction, le sens et la longueur du deplacement.", ["translation", "vecteur"]),
      t("Coordonnees translation", "A(${{x}};{{y}}$) est translate par $({{u}};{{v}})$. Donner l'abscisse de A'.", "{{x+u}}", "On ajoute la premiere coordonnee du vecteur : ${{x}}+{{u}}={{x+u}}$.", ["translation", "coordonnees", "vecteur"], { x: { type: "int", min: -6, max: 8 }, y: { type: "int", min: -6, max: 8 }, u: { type: "int", min: -5, max: 5, exclude: [0] }, v: { type: "int", min: -5, max: 5 } }),
      t("Ordonnee translation", "A(${{x}};{{y}}$) est translate par $({{u}};{{v}})$. Donner l'ordonnee de A'.", "{{y+v}}", "On ajoute la deuxieme coordonnee du vecteur : ${{y}}+{{v}}={{y+v}}$.", ["translation", "coordonnees", "vecteur"], { x: { type: "int", min: -6, max: 8 }, y: { type: "int", min: -6, max: 8 }, u: { type: "int", min: -5, max: 5 }, v: { type: "int", min: -5, max: 5, exclude: [0] } }),
      t("Longueur conservee translation", "Une translation conserve-t-elle les longueurs ?", "Oui", "Une translation est un deplacement sans deformation.", ["translation", "vecteur"]),
      t("Angles conserves translation", "Une translation conserve-t-elle les angles ?", "Oui", "L'image a la meme forme et les memes mesures.", ["translation", "vecteur"]),
      t("Image d'un segment", "L'image d'un segment par translation est un segment de meme ...", "longueur", "La translation conserve les longueurs.", ["translation", "vecteur"]),
      t("Direction conservee", "Une droite et son image par translation sont-elles paralleles ?", "Oui", "La translation conserve la direction.", ["translation", "vecteur"]),
      t("Vecteur horizontal", "Le vecteur $( {{u}} ; 0 )$ deplace seulement selon quelle direction ?", "horizontale", "La deuxieme coordonnee est nulle : seule l'abscisse change.", ["translation", "vecteur", "coordonnees"], { u: { type: "int", min: 2, max: 8 } }),
      t("Vecteur vertical", "Le vecteur $(0 ; {{v}})$ deplace seulement selon quelle direction ?", "verticale", "La premiere coordonnee est nulle : seule l'ordonnee change.", ["translation", "vecteur", "coordonnees"], { v: { type: "int", min: 2, max: 8 } }),
      t("Vecteur nul", "Une translation de vecteur nul deplace-t-elle les points ?", "Non", "Le vecteur nul ne change aucune coordonnee.", ["translation", "vecteur"]),
      t("Coordonnees completes", "A(${{x}};{{y}}$) est translate par $({{u}};{{v}})$. Donner A'.", "$A'({{x+u}};{{y+v}})$", "On ajoute les coordonnees du vecteur a celles du point.", ["translation", "coordonnees", "vecteur"], { x: { type: "int", min: -5, max: 8 }, y: { type: "int", min: -5, max: 8 }, u: { type: "int", min: -4, max: 5 }, v: { type: "int", min: -4, max: 5 } }),
      t("Vecteur a partir de points", "A(${{x}};{{y}}$) va sur A'(${{x+u}};{{y+v}}$). Quel est le vecteur ?", "$({{u}};{{v}})$", "On soustrait les coordonnees : $({{x+u}}-{{x}};{{y+v}}-{{y}})$.", ["translation", "coordonnees", "vecteur"], { x: { type: "int", min: -4, max: 6 }, y: { type: "int", min: -4, max: 6 }, u: { type: "int", min: -3, max: 5, exclude: [0] }, v: { type: "int", min: -3, max: 5, exclude: [0] } }),
      t("Translation et paralleles", "Dans une translation, le segment $[AA']$ et le segment $[BB']$ ont-ils la meme direction ?", "Oui", "Ils representent le meme vecteur de translation.", ["translation", "vecteur"]),
      t("Image d'un point", "Une translation transforme un point A en quel type d'objet ?", "Un point A'", "Une translation associe a chaque point un point image.", ["translation", "vecteur"])
    ];
  }

  if (title.includes("homothetie")) {
    return [
      t("Rapport d'homothetie", "Une homothetie de rapport ${{k}}$ multiplie une longueur par combien ?", "{{k}}", "Les longueurs sont multipliees par le rapport.", ["homothetie", "rapport"], { k: { type: "choice", values: [0.5, 2, 3, 4] } }),
      t("Longueur image", "Par homothetie de rapport ${{k}}$, une longueur de ${{l}}$ cm devient combien ?", "{{k*l}} cm", "Longueur image = ${{k}}\\times {{l}}={{k*l}}$ cm.", ["homothetie", "longueur"], { k: { type: "choice", values: [2, 3, 4] }, l: { type: "int", min: 2, max: 12 } }),
      t("Longueur initiale", "Par homothetie de rapport ${{k}}$, l'image mesure ${{k*l}}$ cm. Quelle etait la longueur initiale ?", "{{l}} cm", "On divise par le rapport : ${{k*l}}\\div {{k}}={{l}}$ cm.", ["homothetie", "longueur"], { k: { type: "choice", values: [2, 3, 4] }, l: { type: "int", min: 2, max: 12 } }),
      t("Agrandissement", "Une homothetie de rapport ${{k}}$ avec ${{k}}>1$ est-elle un agrandissement ?", "Oui", "Un rapport superieur a 1 agrandit les longueurs.", ["homothetie", "rapport"], { k: { type: "choice", values: [2, 3, 4] } }),
      t("Reduction", "Une homothetie de rapport $0,5$ est-elle une reduction ?", "Oui", "Un rapport compris entre 0 et 1 reduit les longueurs.", ["homothetie", "rapport"]),
      t("Alignement centre", "Dans une homothetie de centre O, les points O, A et A' sont-ils alignes ?", "Oui", "Le centre, le point et son image sont alignes.", ["homothetie", "rapport"]),
      t("Aire image", "Une homothetie de rapport ${{k}}$ multiplie les aires par combien ?", "{{k*k}}", "Les aires sont multipliees par le carre du rapport.", ["homothetie", "rapport"], { k: { type: "choice", values: [2, 3, 4] } }),
      t("Perimetre image", "Une homothetie de rapport ${{k}}$ multiplie les perimetres par combien ?", "{{k}}", "Les perimetres sont des longueurs, donc ils sont multiplies par le rapport.", ["homothetie", "rapport"], { k: { type: "choice", values: [2, 3, 4] } }),
      t("Coefficient a trouver", "Une longueur passe de ${{l}}$ cm a ${{k*l}}$ cm. Quel est le rapport d'homothetie ?", "{{k}}", "Rapport = longueur image / longueur initiale.", ["homothetie", "rapport"], { k: { type: "choice", values: [2, 3, 4] }, l: { type: "int", min: 2, max: 12 } }),
      t("Image du centre", "Le centre d'une homothetie a-t-il une image differente de lui-meme ?", "Non", "Le centre est invariant par l'homothetie.", ["homothetie", "rapport"]),
      t("Forme conservee", "Une homothetie conserve-t-elle la forme des figures ?", "Oui", "Elle agrandit ou reduit sans changer la forme.", ["homothetie", "rapport"]),
      t("Longueurs proportionnelles", "Dans une homothetie, les longueurs initiales et images sont-elles proportionnelles ?", "Oui", "Le coefficient de proportionnalite est le rapport d'homothetie.", ["homothetie", "rapport"]),
      t("Rapport demi", "Une homothetie de rapport $0,5$ transforme ${{2*l}}$ cm en combien ?", "{{l}} cm", "Multiplier par $0,5$ revient a prendre la moitie.", ["homothetie", "rapport", "longueur"], { l: { type: "int", min: 2, max: 12 } })
    ];
  }

  if (title.includes("reperage")) {
    return [
      t("Abscisse dans l'espace", "Dans $A({{x}};{{y}};{{z}})$, quelle est l'abscisse ?", "{{x}}", "L'abscisse est la premiere coordonnee.", ["reperage", "espace", "abscisse", "coordonnees"], { x: { type: "int", min: -5, max: 8 }, y: { type: "int", min: -5, max: 8 }, z: { type: "int", min: -5, max: 8 } }),
      t("Ordonnee dans l'espace", "Dans $A({{x}};{{y}};{{z}})$, quelle est l'ordonnee ?", "{{y}}", "L'ordonnee est la deuxieme coordonnee.", ["reperage", "espace", "coordonnees"], { x: { type: "int", min: -5, max: 8 }, y: { type: "int", min: -5, max: 8 }, z: { type: "int", min: -5, max: 8 } }),
      t("Altitude dans l'espace", "Dans $A({{x}};{{y}};{{z}})$, quelle est l'altitude ?", "{{z}}", "L'altitude est la troisieme coordonnee.", ["reperage", "espace", "altitude", "coordonnees"], { x: { type: "int", min: -5, max: 8 }, y: { type: "int", min: -5, max: 8 }, z: { type: "int", min: -5, max: 8 } }),
      t("Point sur l'axe des abscisses", "Dans l'espace, un point sur l'axe des abscisses a quelles coordonnees nulles ?", "$y$ et $z$", "Sur l'axe des abscisses, seules les abscisses peuvent varier.", ["reperage", "espace", "abscisse", "coordonnees"]),
      t("Monter dans l'espace", "A(${{x}};{{y}};{{z}}$) monte de ${{h}}$. Quelle est la nouvelle altitude ?", "{{z+h}}", "Monter ajoute ${{h}}$ a la troisieme coordonnee.", ["reperage", "espace", "altitude", "coordonnees"], { x: { type: "int", min: -4, max: 6 }, y: { type: "int", min: -4, max: 6 }, z: { type: "int", min: 0, max: 8 }, h: { type: "int", min: 1, max: 6 } }),
      t("Deplacement selon x", "A(${{x}};{{y}};{{z}}$) avance de ${{u}}$ selon l'axe des abscisses. Nouvelle abscisse ?", "{{x+u}}", "On ajoute ${{u}}$ a l'abscisse.", ["reperage", "espace", "abscisse", "coordonnees"], { x: { type: "int", min: -4, max: 6 }, y: { type: "int", min: -4, max: 6 }, z: { type: "int", min: 0, max: 8 }, u: { type: "int", min: 1, max: 6 } }),
      t("Coordonnees completes espace", "A(${{x}};{{y}};{{z}}$) est déplacé du vecteur $({{u}};{{v}};{{w}})$. Donner A'.", "$A'({{x+u}};{{y+v}};{{z+w}})$", "On ajoute coordonnee par coordonnee.", ["reperage", "espace", "coordonnees"], { x: { type: "int", min: -3, max: 5 }, y: { type: "int", min: -3, max: 5 }, z: { type: "int", min: -3, max: 5 }, u: { type: "int", min: -2, max: 4 }, v: { type: "int", min: -2, max: 4 }, w: { type: "int", min: -2, max: 4 } }),
      t("Lecture d'un point", "Le point $B(2;-1;5)$ a pour altitude quel nombre ?", "5", "L'altitude est la troisieme coordonnee.", ["reperage", "espace", "altitude", "coordonnees"]),
      t("Plan horizontal", "Dans un repere de l'espace, le plan horizontal se lit avec quelles coordonnees ?", "$x$ et $y$", "Le plan horizontal utilise l'abscisse et l'ordonnee.", ["reperage", "espace", "coordonnees"]),
      t("Axe vertical", "Dans l'espace, quel axe porte l'altitude ?", "L'axe z", "La coordonnee $z$ donne l'altitude.", ["reperage", "espace", "altitude"]),
      t("Meme altitude", "Deux points ont la meme troisieme coordonnee. Ont-ils la meme altitude ?", "Oui", "L'altitude est donnee par la troisieme coordonnee.", ["reperage", "espace", "altitude"]),
      t("Difference d'altitude", "A a pour altitude ${{z1}}$ et B pour altitude ${{z2}}$. Difference d'altitude ?", "{{Math.abs(z2-z1)}}", "On calcule l'ecart entre les deux coordonnees $z$.", ["reperage", "espace", "altitude"], { z1: { type: "int", min: 0, max: 8 }, z2: { type: "int", min: 9, max: 16 } })
    ];
  }

  return [];
}

function relativeAdvancedTemplates(chapter: ChapterInfo): TemplateSeed[] {
  if (chapter.level !== "4e" && chapter.level !== "3e") {
    return [];
  }

  const eligibleDomains = new Set<ChapterInfo["domain"]>([
    "nombres-calculs",
    "fractions",
    "calcul-litteral",
    "equations",
    "fonctions",
    "puissances"
  ]);
  if (!eligibleDomains.has(chapter.domain)) {
    return [];
  }

  return [
    {
      title: "Somme de relatifs à trois termes",
      subdomain: chapter.title,
      statementTemplate: "Calculer $({{-a}})+{{b}}-({{c}})$.",
      answerTemplate: "{{-a+b-c}}",
      correctionTemplate: "$({{-a}})+{{b}}-({{c}})={{-a+b-c}}$.",
      variablesSchema: { a: { type: "int", min: 3, max: 18 }, b: { type: "int", min: -12, max: 20 }, c: { type: "int", min: -10, max: 16 } },
      tags: ["relatifs", "calcul", "signes"]
    },
    {
      title: "Produit de relatifs enchaîné",
      subdomain: chapter.title,
      statementTemplate: "Calculer $({{-a}})\\times {{b}}\\times ({{-c}})$.",
      answerTemplate: "{{a*b*c}}",
      correctionTemplate: "Il y a deux facteurs n?gatifs, donc le produit est positif : ${{a}}\\times {{b}}\\times {{c}}={{a*b*c}}$.",
      variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 8 }, c: { type: "int", min: 2, max: 9 } },
      tags: ["relatifs", "produit", "signes"]
    },
    {
      title: "Expression litt?rale avec relatif",
      subdomain: chapter.title,
      statementTemplate: "Calculer ${{a}}x{{b < 0 ? '' : '+'}}{{b}}$ pour $x={{x}}$.",
      answerTemplate: "{{a*x+b}}",
      correctionTemplate: "$ {{a}}\\times ({{x}}){{b < 0 ? '' : '+'}}{{b}}={{a*x}}{{b < 0 ? '' : '+'}}{{b}}={{a*x+b}}$.",
      variablesSchema: { a: { type: "int", min: -7, max: 7, exclude: [0] }, b: { type: "int", min: -12, max: 12 }, x: { type: "int", min: -8, max: 8, exclude: [0] } },
      tags: ["relatifs", "litteral", "substitution"]
    },
    {
      title: "Fraction et relatif",
      subdomain: chapter.title,
      statementTemplate: "Calculer $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ -{{b}} }{ {{den*k}} }$.",
      answerTemplate: "{{formatFraction(a*k-b,den*k)}}",
      correctionTemplate: "$\\dfrac{ {{a}} }{ {{den}} }=\\dfrac{ {{a*k}} }{ {{den*k}} }$, donc $\\dfrac{ {{a*k}}-{{b}} }{ {{den*k}} }={{formatFraction(a*k-b,den*k)}}$.",
      variablesSchema: { a: { type: "int", min: 1, max: 8 }, b: { type: "int", min: 2, max: 10 }, den: { type: "choice", values: [3, 4, 5, 6, 8] }, k: { type: "choice", values: [2, 3, 4] } },
      tags: ["relatifs", "fractions", "denominateurs-multiples"]
    },
    {
      title: "Puissance d'un relatif",
      subdomain: chapter.title,
      statementTemplate: "D?terminer le signe de $({{-a}})^{{n}}$ puis calculer sa valeur.",
      answerTemplate: "{{Math.pow(-a,n)}}",
      correctionTemplate: "$({{-a}})^{{n}}={{Math.pow(-a,n)}}$ car l'exposant ${{n}}$ est {{n%2===0 ? 'pair' : 'impair'}}.",
      variablesSchema: { a: { type: "int", min: 2, max: 6 }, n: { type: "int", min: 2, max: 5 } },
      tags: ["relatifs", "puissances", "signes"]
    }
  ];
}

function fifthGradeProgressionExtras(chapter: ChapterInfo): TemplateSeed[] {
  const seed = (template: Omit<TemplateSeed, "subdomain">): TemplateSeed => ({ ...template, subdomain: chapter.title });
  if (chapter.level === "6e" && chapter.rank === 7) return [
    seed({ title: "Équidistance de deux points", statementTemplate: "Comment appelle-t-on l'ensemble des points situés à la même distance de A et de B ?", answerTemplate: "La médiatrice de [AB]", correctionTemplate: "La médiatrice d'un segment est l'ensemble des points équidistants de ses extrémités.", variablesSchema: { n: { type: "int", min: 1, max: 2 } }, tags: ["equidistance", "mediatrice"] }),
    seed({ title: "Triangle isocèle et distances", statementTemplate: "Dans le triangle ABC isocèle en A, quelles longueurs sont égales ?", answerTemplate: "AB = AC", correctionTemplate: "Le sommet principal est A : les côtés [AB] et [AC] ont la même longueur.", variablesSchema: { n: { type: "int", min: 1, max: 2 } }, tags: ["triangle", "equidistance"] })
  ];
  if (chapter.level === "6e" && chapter.rank === 13.5) return [
    seed({ title: "Axes de symétrie du carré", statementTemplate: "Combien un carré possède-t-il d'axes de symétrie ?", answerTemplate: "4", correctionTemplate: "Les deux diagonales et les deux médiatrices des côtés sont ses axes de symétrie.", variablesSchema: { n: { type: "int", min: 1, max: 2 } }, tags: ["axes", "axe de symetrie", "carre"] }),
    seed({ title: "Axes de symétrie du rectangle", statementTemplate: "Combien un rectangle non carré possède-t-il d'axes de symétrie ?", answerTemplate: "2", correctionTemplate: "Ses axes passent par les milieux de deux côtés opposés.", variablesSchema: { n: { type: "int", min: 1, max: 2 } }, tags: ["axes", "axe de symetrie", "rectangle"] })
  ];
  if ((chapter.level === "4e" && chapter.rank === 3) || (chapter.level === "3e" && chapter.rank === 7)) return [
    seed({ title: "Réduire quatre monômes relatifs", statementTemplate: "Réduire ${{a}}x{{b<0?'':'+'}}{{b}}x{{c<0?'':'+'}}{{c}}x{{d<0?'':'+'}}{{d}}x$.", answerTemplate: "${{a+b+c+d}}x$", correctionTemplate: "On additionne les quatre coefficients relatifs.", variablesSchema: { a: { type: "int", min: -8, max: 8, exclude: [0] }, b: { type: "int", min: -8, max: 8, exclude: [0] }, c: { type: "int", min: -8, max: 8, exclude: [0] }, d: { type: "int", min: -8, max: 8, exclude: [0] } }, tags: ["reduire", "monomes-4-6", "relatifs"] }),
    seed({ title: "Réduire six monômes relatifs", statementTemplate: "Réduire ${{a}}x+{{b}}y{{c<0?'':'+'}}{{c}}x{{d<0?'':'+'}}{{d}}y{{e<0?'':'+'}}{{e}}x{{f<0?'':'+'}}{{f}}y$.", answerTemplate: "${{a+c+e}}x{{b+d+f<0?'':'+'}}{{b+d+f}}y$", correctionTemplate: "On regroupe séparément les termes en $x$ et les termes en $y$.", variablesSchema: { a: { type: "int", min: -6, max: 6, exclude: [0] }, b: { type: "int", min: -6, max: 6, exclude: [0] }, c: { type: "int", min: -6, max: 6, exclude: [0] }, d: { type: "int", min: -6, max: 6, exclude: [0] }, e: { type: "int", min: -6, max: 6, exclude: [0] }, f: { type: "int", min: -6, max: 6, exclude: [0] } }, tags: ["reduire", "monomes-4-6", "relatifs"] })
  ];
  if (chapter.level !== "5e") return [];
  if (chapter.rank === 1) return [seed({ title: "Priorité avec décimaux", statementTemplate: "Calculer ${{formatDecimalFrench(a)}}+{{b}}\\times{{formatDecimalFrench(c)}}$.", answerTemplate: "{{formatDecimalFrench(a+b*c)}}", correctionTemplate: "On effectue d'abord la multiplication, puis l'addition.", variablesSchema: { a: { type: "decimal", min: 1.5, max: 9.5, decimals: 1 }, b: { type: "int", min: 2, max: 6 }, c: { type: "decimal", min: 0.5, max: 4.5, decimals: 1 } }, tags: ["priorite", "decimaux"] })];
  if (chapter.rank === 2) return [
    seed({ title: "Reconnaître un solide", statementTemplate: "Un solide possède deux bases polygonales parallèles et des faces latérales rectangulaires. Quel est ce solide ?", answerTemplate: "Un prisme droit", correctionTemplate: "C'est la définition d'un prisme droit.", variablesSchema: { n: { type: "int", min: 3, max: 6 } }, tags: ["solide", "prisme", "reconnaissance"] }),
    seed({ title: "Faces d'un prisme", statementTemplate: "Un prisme à base triangulaire possède combien de faces ?", answerTemplate: "5", correctionTemplate: "Il possède deux bases triangulaires et trois faces latérales.", variablesSchema: { n: { type: "int", min: 1, max: 2 } }, tags: ["solide", "prisme", "faces"] }),
    seed({ title: "Patron d'un cylindre", statementTemplate: "Quelles figures composent le patron d'un cylindre ?", answerTemplate: "Deux disques et un rectangle", correctionTemplate: "Les disques forment les bases et le rectangle forme la surface latérale.", variablesSchema: { n: { type: "int", min: 1, max: 2 } }, tags: ["solide", "cylindre", "patron"] })
    ,seed({ title: "Arêtes et sommets d'un pavé", statementTemplate: "Combien un pavé droit possède-t-il d'arêtes et de sommets ?", answerTemplate: "12 arêtes et 8 sommets", correctionTemplate: "Un pavé droit possède 12 arêtes et 8 sommets.", variablesSchema: { n: { type: "int", min: 1, max: 2 } }, tags: ["solide", "arete", "sommet", "pave"] })
    ,seed({ title: "Perspective cavalière", statementTemplate: "Dans une perspective cavalière, comment représente-t-on généralement les arêtes cachées ?", answerTemplate: "En pointillés", correctionTemplate: "Les arêtes non visibles sont tracées en pointillés.", variablesSchema: { n: { type: "int", min: 1, max: 2 } }, tags: ["solide", "perspective", "arete"] })
  ];
  if (chapter.rank === 3) return [seed({ title: "Coefficient décimal", statementTemplate: "On passe de {{a}} à {{formatDecimalFrench(a*k)}}. Donner le coefficient de proportionnalité.", answerTemplate: "{{formatDecimalFrench(k)}}", correctionTemplate: "Le coefficient est ${{formatDecimalFrench(a*k)}}\\div{{a}}={{formatDecimalFrench(k)}}$.", variablesSchema: { a: { type: "int", min: 4, max: 20 }, k: { type: "choice", values: [0.5, 1.5, 2.5] } }, tags: ["coefficient", "proportionnalite", "decimaux"] })];
  if (chapter.rank === 4) return [seed({ title: "Critère de divisibilité par 9", statementTemplate: "Le nombre {{n}} est-il divisible par 9 ?", answerTemplate: "{{n%9===0 ? 'Oui' : 'Non'}}", correctionTemplate: "On additionne ses chiffres et on teste si cette somme est un multiple de 9.", variablesSchema: { n: { type: "choice", values: [117, 126, 234, 351, 425, 612] } }, tags: ["divisibilite", "critere", "9"] })];
  if (chapter.rank === 6) return [seed({ title: "Identifier une médiane", statementTemplate: "Dans un triangle, une droite passe par un sommet et par le milieu du côté opposé. Comment s'appelle-t-elle ?", answerTemplate: "Une médiane", correctionTemplate: "Une médiane joint un sommet au milieu du côté opposé.", variablesSchema: { n: { type: "int", min: 1, max: 2 } }, tags: ["mediane", "droite remarquable", "triangle"] })];
  if (chapter.rank === 7) return [
    seed({ title: "Comparer des relatifs décimaux", statementTemplate: "Comparer ${{formatDecimalFrench(a)}}$ et ${{formatDecimalFrench(b)}}$.", answerTemplate: "{{a>b ? '>' : '<'}}", correctionTemplate: "Sur la droite graduée, le plus grand nombre est situé le plus à droite.", variablesSchema: { a: { type: "choice", values: [-7.5, -3.2, -1.8, 2.4] }, b: { type: "choice", values: [-6.9, -2.7, 0.5, 3.1] } }, tags: ["comparer des relatifs", "decimaux", "droite graduee"] }),
    seed({ title: "Repérage sur une droite graduée", statementTemplate: "Sur une droite graduée, quel nombre est situé à {{d}} unités à gauche de {{a}} ?", answerTemplate: "{{a-d}}", correctionTemplate: "Se déplacer vers la gauche revient à soustraire {{d}}.", variablesSchema: { a: { type: "int", min: -4, max: 8 }, d: { type: "int", min: 2, max: 7 } }, tags: ["reperage", "droite graduee", "relatifs"] }),
    seed({ title: "Coordonnées relatives", statementTemplate: "Le point A a pour abscisse {{x}} et ordonnée {{y}}. Écrire ses coordonnées.", answerTemplate: "A({{x}} ; {{y}})", correctionTemplate: "On écrit d'abord l'abscisse, puis l'ordonnée.", variablesSchema: { x: { type: "int", min: -8, max: 8 }, y: { type: "int", min: -8, max: 8 } }, tags: ["coordonnees relatives", "reperage"] })
  ];
  if (chapter.rank === 9) return [seed({ title: "Substitution avec un relatif décimal", statementTemplate: "Calculer ${{a}}x+{{b}}$ pour $x={{formatDecimalFrench(x)}}$.", answerTemplate: "{{formatDecimalFrench(a*x+b)}}", correctionTemplate: "On remplace $x$ par {{formatDecimalFrench(x)}} puis on effectue le calcul.", variablesSchema: { a: { type: "int", min: 2, max: 6 }, b: { type: "int", min: -8, max: 8 }, x: { type: "choice", values: [-2.5, -1.5, 0.5, 1.5, 2.5] } }, tags: ["substitution", "expression litterale", "relatifs", "decimaux"] })];
  if (chapter.rank === 10) return [seed({ title: "Angles correspondants", statementTemplate: "Deux droites parallèles sont coupées par une sécante. Un angle mesure {{a}}°. Quelle est la mesure de son angle correspondant ?", answerTemplate: "{{a}}°", correctionTemplate: "Des angles correspondants formés par deux parallèles ont la même mesure.", variablesSchema: { a: { type: "int", min: 25, max: 155 } }, tags: ["angles correspondants", "droites paralleles"] })];
  if (chapter.rank === 11) return [
    seed({ title: "Addition de relatifs décimaux", statementTemplate: "Calculer ${{formatDecimalFrench(a)}}+({{formatDecimalFrench(b)}})$.", answerTemplate: "{{formatDecimalFrench(a+b)}}", correctionTemplate: "On additionne les deux nombres relatifs en tenant compte de leurs signes.", variablesSchema: { a: { type: "choice", values: [-8.5, -4.2, 3.6, 7.5] }, b: { type: "choice", values: [-3.5, -1.8, 2.4, 5.5] } }, tags: ["addition de relatifs", "decimaux"] }),
    seed({ title: "Soustraction de relatifs décimaux", statementTemplate: "Calculer ${{formatDecimalFrench(a)}}-({{formatDecimalFrench(b)}})$.", answerTemplate: "{{formatDecimalFrench(a-b)}}", correctionTemplate: "Soustraire un nombre revient à ajouter son opposé.", variablesSchema: { a: { type: "choice", values: [-6.5, -2.4, 4.8, 9.5] }, b: { type: "choice", values: [-4.5, -1.2, 2.5, 6.5] } }, tags: ["soustraction de relatifs", "decimaux"] })
  ];
  if (chapter.rank === 12) return [
    seed({ title: "Construire un parallélogramme", statementTemplate: "Pour construire ABCD parallélogramme à partir de A, B et C, quelle propriété des diagonales peut-on utiliser ?", answerTemplate: "Les diagonales ont le même milieu", correctionTemplate: "Dans un parallélogramme, les diagonales se coupent en leur milieu.", variablesSchema: { n: { type: "int", min: 1, max: 2 } }, tags: ["parallelogramme", "construction", "diagonales"] }),
    seed({ title: "Parallélogramme particulier", statementTemplate: "Un parallélogramme possède quatre angles droits. Quel est ce quadrilatère ?", answerTemplate: "Un rectangle", correctionTemplate: "Un parallélogramme ayant quatre angles droits est un rectangle.", variablesSchema: { n: { type: "int", min: 1, max: 2 } }, tags: ["parallelogramme", "particulier", "rectangle"] })
  ];
  if (chapter.rank === 15) return [
    seed({ title: "Pourcentage d'une quantité décimale", statementTemplate: "Calculer {{p}} % de {{formatDecimalFrench(n)}} €. Donner le résultat au centime près.", answerTemplate: "{{formatDecimalFrench(roundTo(n*p/100,2))}} €", correctionTemplate: "$ {{formatDecimalFrench(n)}}\\times\\dfrac{ {{p}} }{100}{{roundingRelation(n*p/100,2)}}{{formatDecimalFrench(roundTo(n*p/100,2))}}$ €.", variablesSchema: { p: { type: "choice", values: [10, 20, 25, 50] }, n: { type: "choice", values: [12.5, 24.5, 37.5, 82.5] } }, tags: ["pourcentage", "decimaux", "arrondi"] }),
    seed({ title: "Lire un graphique", statementTemplate: "Un diagramme indique {{a}} élèves en septembre et {{b}} en octobre. De combien l'effectif a-t-il augmenté ?", answerTemplate: "{{b-a}} élèves", correctionTemplate: "On calcule la différence : ${{b}}-{{a}}={{b-a}}$.", variablesSchema: { a: { type: "int", min: 12, max: 24 }, b: { type: "int", min: 25, max: 40 } }, tags: ["graphique", "lecture", "interpretation"] }),
    seed({ title: "Interpréter un diagramme", statementTemplate: "Dans un diagramme de {{total}} personnes, {{part}} choisissent le sport. Quel pourcentage cela représente-t-il ?", answerTemplate: "{{100*part/total}} %", correctionTemplate: "On calcule $100\\times{{part}}\\div{{total}}$.", variablesSchema: { total: { type: "choice", values: [20, 40, 50, 100] }, part: { type: "choice", values: [5, 10, 20] } }, tags: ["diagramme", "pourcentage", "interpretation"] })
  ];
  if (chapter.rank === 16) return [seed({ title: "Aire d'un triangle avec décimaux", statementTemplate: "Un triangle a pour base {{formatDecimalFrench(b)}} cm et hauteur {{formatDecimalFrench(h)}} cm. Calculer son aire.", answerTemplate: "{{formatDecimalFrench(b*h/2)}} cm²", correctionTemplate: "$\\mathcal{A}=\\dfrac{ {{formatDecimalFrench(b)}}\\times{{formatDecimalFrench(h)}} }{2}={{formatDecimalFrench(b*h/2)}}$ cm².", variablesSchema: { b: { type: "choice", values: [4.5, 6.5, 8.5] }, h: { type: "choice", values: [2, 4, 6] } }, figureTemplate: { kind: "triangle", labelA: "base = {{formatDecimalFrench(b)}} cm", labelB: "hauteur = {{formatDecimalFrench(h)}} cm", labelC: "" }, tags: ["aire triangle", "decimaux"] })];
  if (chapter.rank === 17) return [seed({ title: "Équation à solution décimale", statementTemplate: "Résoudre ${{a}}x={{formatDecimalFrench(c)}}$.", answerTemplate: "$x={{formatDecimalFrench(c/a)}}$", correctionTemplate: "On divise les deux membres par {{a}} : $x={{formatDecimalFrench(c)}}\\div{{a}}={{formatDecimalFrench(c/a)}}$.", variablesSchema: { a: { type: "choice", values: [2, 4, 5] }, c: { type: "choice", values: [5, 7, 9, 15] } }, tags: ["equation ax+b", "solution", "decimaux"] })];
  if (chapter.rank === 18) return [seed({ title: "Moyenne de valeurs décimales", statementTemplate: "Calculer la moyenne de {{formatDecimalFrench(a)}}, {{formatDecimalFrench(b)}} et {{formatDecimalFrench(c)}} au centième près si nécessaire.", answerTemplate: "{{formatDecimalFrench(roundTo((a+b+c)/3,2))}}", correctionTemplate: "$\\overline x=\\dfrac{ {{formatDecimalFrench(a)}}+{{formatDecimalFrench(b)}}+{{formatDecimalFrench(c)}} }{3}{{roundingRelation((a+b+c)/3,2)}}{{formatDecimalFrench(roundTo((a+b+c)/3,2))}}$.", variablesSchema: { a: { type: "choice", values: [8.5, 10.5, 12.5] }, b: { type: "choice", values: [9.5, 11.5, 13.5] }, c: { type: "choice", values: [10, 12, 14] } }, tags: ["moyenne", "decimaux", "arrondi"] })];
  if (chapter.rank === 19) return [
    seed({ title: "Volume d'un pavé à dimensions décimales", statementTemplate: "Calculer le volume d'un pavé de dimensions {{formatDecimalFrench(l)}} cm, {{w}} cm et {{h}} cm.", answerTemplate: "{{formatDecimalFrench(l*w*h)}} cm³", correctionTemplate: "$V={{formatDecimalFrench(l)}}\\times{{w}}\\times{{h}}={{formatDecimalFrench(l*w*h)}}$ cm³.", variablesSchema: { l: { type: "choice", values: [2.5, 3.5, 4.5] }, w: { type: "int", min: 2, max: 6 }, h: { type: "int", min: 2, max: 5 } }, figureTemplate: { kind: "solid", solid: "pave", labels: ["{{formatDecimalFrench(l)}} cm", "{{w}} cm", "{{h}} cm"] }, tags: ["volume pave", "decimaux"] }),
    seed({ title: "Volume d'un cylindre", statementTemplate: "Calculer le volume d'un cylindre de rayon {{r}} cm et de hauteur {{h}} cm en prenant $\\pi\\approx3{,}14$.", answerTemplate: "{{formatDecimalFrench(3.14*r*r*h)}} cm³", correctionTemplate: "$V\\approx3{,}14\\times{{r}}^2\\times{{h}}={{formatDecimalFrench(3.14*r*r*h)}}$ cm³.", variablesSchema: { r: { type: "int", min: 2, max: 5 }, h: { type: "int", min: 3, max: 8 } }, figureTemplate: { kind: "solid", solid: "cylindre", labels: ["{{r}} cm", "{{h}} cm"] }, tags: ["volume cylindre", "decimaux"] }),
    seed({ title: "Conversion de volume", statementTemplate: "Convertir {{v}} L en cm³.", answerTemplate: "{{v*1000}} cm³", correctionTemplate: "$1$ L = $1000$ cm³, donc ${{v}}\\times1000={{v*1000}}$ cm³.", variablesSchema: { v: { type: "int", min: 2, max: 12 } }, tags: ["conversion de volume", "volume"] })
  ];
  return [];
}

function levelChallengeTemplates(chapter: ChapterInfo): TemplateSeed[] {
  const seed = (template: Omit<TemplateSeed, "subdomain">): TemplateSeed => ({
    ...template,
    subdomain: chapter.title
  });

  if (chapter.id === "4e-chap-12" || chapter.id === "3e-chap-01") {
    return [
      seed({
        title: "Lecture d'un diagramme en bâtons : effectif maximal",
        statementTemplate: "Le graphique présente les inscriptions aux activités du collège. Quelle activité possède l'effectif le plus élevé ?",
        answerTemplate: "Le basket, avec 18 élèves",
        correctionTemplate: "Le bâton le plus haut est celui du basket : son effectif est de 18 élèves.",
        variablesSchema: {},
        figureTemplate: { kind: "chart", chartType: "bar", title: "Inscriptions aux activités", labels: ["Football", "Basket", "Théâtre", "Musique"], values: ["12", "18", "9", "15"], unit: "élèves" },
        tags: ["statistiques", "effectif", "graphique", "diagramme en batons", "lecture"]
      }),
      seed({
        title: "Lecture d'un diagramme en bâtons : comparer deux effectifs",
        statementTemplate: "Lors d'une enquête sur les moyens de transport, combien d'élèves de plus viennent à pied plutôt qu'à vélo ?",
        answerTemplate: "8 élèves",
        correctionTemplate: "Le graphique indique 22 élèves à pied et 14 à vélo ; $22-14=8$ élèves.",
        variablesSchema: {},
        figureTemplate: { kind: "chart", chartType: "bar", title: "Trajet vers le collège", labels: ["À pied", "Vélo", "Bus", "Voiture"], values: ["22", "14", "26", "8"], unit: "élèves" },
        tags: ["statistiques", "effectif", "graphique", "diagramme en batons", "comparaison"]
      }),
      seed({
        title: "Lecture d'un diagramme circulaire : fréquence",
        statementTemplate: "Le diagramme représente le loisir préféré de 100 adolescents. Quelle fréquence correspond aux jeux vidéo ?",
        answerTemplate: "25 %",
        correctionTemplate: "La légende associe la part « Jeux vidéo » à 25 % de l'effectif.",
        variablesSchema: {},
        figureTemplate: { kind: "chart", chartType: "pie", title: "Loisir préféré", labels: ["Sport", "Jeux vidéo", "Lecture", "Musique"], values: ["40", "25", "20", "15"], unit: "%" },
        tags: ["statistiques", "frequence", "graphique", "diagramme circulaire", "lecture"]
      }),
      seed({
        title: "Lecture d'un diagramme circulaire : regrouper des catégories",
        statementTemplate: "Dans le budget mensuel représenté, quelle part totale est consacrée au logement et à l'alimentation ?",
        answerTemplate: "60 %",
        correctionTemplate: "Le logement représente 35 % et l'alimentation 25 %, donc $35\%+25\%=60\%$.",
        variablesSchema: {},
        figureTemplate: { kind: "chart", chartType: "pie", title: "Budget mensuel", labels: ["Logement", "Alimentation", "Transport", "Loisirs"], values: ["35", "25", "15", "25"], unit: "%" },
        tags: ["statistiques", "frequence", "graphique", "diagramme circulaire", "addition"]
      }),
      seed({
        title: "Lecture d'une courbe : valeur maximale",
        statementTemplate: "La courbe donne la température relevée à midi pendant cinq jours. Quel jour la température est-elle maximale ?",
        answerTemplate: "Mercredi, avec 19 °C",
        correctionTemplate: "Le point le plus haut de la courbe correspond à mercredi et à 19 °C.",
        variablesSchema: {},
        figureTemplate: { kind: "chart", chartType: "line", title: "Température à midi", labels: ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven."], values: ["12", "15", "19", "17", "14"], unit: "°C" },
        tags: ["statistiques", "effectif", "graphique", "courbe", "lecture", "maximum"]
      }),
      seed({
        title: "Lecture d'une courbe : évolution",
        statementTemplate: "La courbe montre la fréquentation d'une médiathèque. De combien le nombre de visiteurs augmente-t-il entre janvier et avril ?",
        answerTemplate: "90 visiteurs",
        correctionTemplate: "On passe de 120 visiteurs en janvier à 210 en avril : $210-120=90$ visiteurs.",
        variablesSchema: {},
        figureTemplate: { kind: "chart", chartType: "line", title: "Visiteurs de la médiathèque", labels: ["Jan.", "Fév.", "Mars", "Avr."], values: ["120", "150", "135", "210"], unit: "visiteurs" },
        tags: ["statistiques", "effectif", "graphique", "courbe", "evolution", "difference"]
      })
    ];
  }

  if (chapter.id === "4e-chap-10") {
    return [
      seed({ title: "Addition de deux fractions signées", statementTemplate: "Calcule $\dfrac{-{{a}}}{ {{den}} }+\dfrac{ {{b}} }{ {{den*k}} }$.", answerTemplate: "{{formatFraction(-a*k+b,den*k)}}", correctionTemplate: "On écrit $\dfrac{-{{a}}}{ {{den}} }=\dfrac{ {{-a*k}} }{ {{den*k}} }$, puis on additionne les numérateurs : ${{formatFraction(-a*k+b,den*k)}}$.", variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 1, max: 9 }, den: { type: "choice", values: [3, 4, 5, 6, 8] }, k: { type: "choice", values: [2, 3, 4] } }, tags: ["fractions", "addition", "relatifs", "calcul"] }),
      seed({ title: "Soustraction de fractions négatives", statementTemplate: "Calcule $\dfrac{-{{a}}}{ {{den}} }-\dfrac{ {{b}} }{ {{den*k}} }$.", answerTemplate: "{{formatFraction(-a*k-b,den*k)}}", correctionTemplate: "Au dénominateur commun {{den*k}}, le numérateur vaut ${{-a*k}}-{{b}}={{-a*k-b}}$.", variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 1, max: 9 }, den: { type: "choice", values: [3, 4, 5, 6] }, k: { type: "choice", values: [2, 3, 4] } }, tags: ["fractions", "soustraction", "relatifs", "calcul"] }),
      seed({ title: "Comparer deux fractions négatives", statementTemplate: "Compare $\dfrac{-{{a}}}{ {{den}} }$ et $\dfrac{-{{b}}}{ {{den}} }$.", answerTemplate: "{{-a===-b ? '=' : -a>-b ? '>' : '<'}}", correctionTemplate: "Les dénominateurs sont positifs et identiques : on compare les numérateurs ${{-a}}$ et ${{-b}}$.", variablesSchema: { a: { type: "int", min: 2, max: 12 }, b: { type: "int", min: 2, max: 12 }, den: { type: "choice", values: [5, 7, 9, 11] } }, tags: ["fractions", "comparaison", "relatifs"] }),
      seed({ title: "Simplifier une fraction négative", statementTemplate: "Simplifie $\dfrac{ {{-a*k}} }{ {{b*k}} }$.", answerTemplate: "{{formatFraction(-a*k,b*k)}}", correctionTemplate: "On divise le numérateur et le dénominateur par {{k}} : ${{formatFraction(-a*k,b*k)}}$.", variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 11 }, k: { type: "int", min: 2, max: 8 } }, tags: ["fractions", "simplifier", "relatifs"] })
    ];
  }

  if (chapter.id === "4e-chap-13") {
    return [
      seed({ title: "Produit d'une fraction négative", statementTemplate: "Calcule $\dfrac{-{{a}}}{ {{b}} }\times\dfrac{ {{c}} }{ {{d}} }$.", answerTemplate: "{{formatFraction(-a*c,b*d)}}", correctionTemplate: "Un facteur est négatif, donc le produit est négatif : ${{formatFraction(-a*c,b*d)}}$.", variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 10 }, c: { type: "int", min: 2, max: 9 }, d: { type: "int", min: 2, max: 10 } }, tags: ["fractions", "produit de fractions", "multiplication de fractions", "relatifs"] }),
      seed({ title: "Produit de deux fractions négatives", statementTemplate: "Calcule $\dfrac{-{{a}}}{ {{b}} }\times\dfrac{-{{c}}}{ {{d}} }$.", answerTemplate: "{{formatFraction(a*c,b*d)}}", correctionTemplate: "Le produit de deux nombres négatifs est positif : ${{formatFraction(a*c,b*d)}}$.", variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 10 }, c: { type: "int", min: 2, max: 9 }, d: { type: "int", min: 2, max: 10 } }, tags: ["fractions", "produit de fractions", "multiplication de fractions", "relatifs"] }),
      seed({ title: "Quotient avec une fraction négative", statementTemplate: "Calcule $\dfrac{-{{a}}}{ {{b}} }\div\dfrac{ {{c}} }{ {{d}} }$.", answerTemplate: "{{formatFraction(-a*d,b*c)}}", correctionTemplate: "On multiplie par l'inverse : $\dfrac{-{{a}}}{ {{b}} }\times\dfrac{ {{d}} }{ {{c}} }={{formatFraction(-a*d,b*c)}}$.", variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 10 }, c: { type: "int", min: 2, max: 9 }, d: { type: "int", min: 2, max: 10 } }, tags: ["fractions", "quotient de fractions", "division de fractions", "inverse", "relatifs"] }),
      seed({ title: "Quotient de deux fractions négatives", statementTemplate: "Calcule $\dfrac{-{{a}}}{ {{b}} }\div\dfrac{-{{c}}}{ {{d}} }$.", answerTemplate: "{{formatFraction(a*d,b*c)}}", correctionTemplate: "Le quotient de deux nombres négatifs est positif, puis on multiplie par l'inverse : ${{formatFraction(a*d,b*c)}}$.", variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 10 }, c: { type: "int", min: 2, max: 9 }, d: { type: "int", min: 2, max: 10 } }, tags: ["fractions", "quotient de fractions", "division de fractions", "inverse", "relatifs"] })
    ];
  }

  if (chapter.id === "3e-chap-03") {
    return [
      seed({ title: "Somme de fractions négatives", statementTemplate: "Calcule $\dfrac{-{{a}}}{ {{den}} }+\dfrac{-{{b}}}{ {{den}} }$.", answerTemplate: "{{formatFraction(-a-b,den)}}", correctionTemplate: "Les dénominateurs sont identiques : on additionne les numérateurs relatifs, soit ${{-a}}+({{-b}})={{-a-b}}$.", variablesSchema: { a: { type: "int", min: 2, max: 12 }, b: { type: "int", min: 2, max: 12 }, den: { type: "choice", values: [5, 7, 8, 9, 11] } }, tags: ["calcul", "fractions", "relatifs", "addition"] }),
      seed({ title: "Différence de fractions signées", statementTemplate: "Calcule $\dfrac{-{{a}}}{ {{den}} }-\dfrac{-{{b}}}{ {{den}} }$.", answerTemplate: "{{formatFraction(-a+b,den)}}", correctionTemplate: "Soustraire une fraction négative revient à ajouter son opposée : $\dfrac{ {{-a+b}} }{ {{den}} }={{formatFraction(-a+b,den)}}$.", variablesSchema: { a: { type: "int", min: 2, max: 12 }, b: { type: "int", min: 2, max: 12 }, den: { type: "choice", values: [5, 7, 8, 9, 11] } }, tags: ["calcul", "fractions", "relatifs", "soustraction"] }),
      seed({ title: "Produit de trois fractions signées", statementTemplate: "Calcule $\dfrac{-{{a}}}{ {{b}} }\times\dfrac{ {{c}} }{ {{d}} }\times\dfrac{-{{e}}}{ {{f}} }$.", answerTemplate: "{{formatFraction(a*c*e,b*d*f)}}", correctionTemplate: "Il y a deux facteurs négatifs : le produit est positif, puis on simplifie ${{formatFraction(a*c*e,b*d*f)}}$.", variablesSchema: { a: { type: "int", min: 2, max: 7 }, b: { type: "int", min: 2, max: 8 }, c: { type: "int", min: 2, max: 7 }, d: { type: "int", min: 2, max: 8 }, e: { type: "int", min: 2, max: 7 }, f: { type: "int", min: 2, max: 8 } }, tags: ["calcul", "fractions", "relatifs", "produit"] }),
      seed({ title: "Quotient complexe de fractions signées", statementTemplate: "Calcule $\dfrac{-{{a}}}{ {{b}} }\div\dfrac{ {{c}} }{ {{d}} }$.", answerTemplate: "{{formatFraction(-a*d,b*c)}}", correctionTemplate: "On multiplie par l'inverse de la seconde fraction : $\dfrac{-{{a}}}{ {{b}} }\times\dfrac{ {{d}} }{ {{c}} }={{formatFraction(-a*d,b*c)}}$.", variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 10 }, c: { type: "int", min: 2, max: 9 }, d: { type: "int", min: 2, max: 10 } }, tags: ["calcul", "fractions", "relatifs", "quotient"] }),
      seed({ title: "Priorités avec fractions négatives", statementTemplate: "Calcule $\dfrac{-{{a}}}{ {{den}} }+\dfrac{ {{b}} }{ {{den}} }\times({{-c}})$.", answerTemplate: "{{formatFraction(-a-b*c,den)}}", correctionTemplate: "On effectue d'abord le produit : $\dfrac{ {{b}} }{ {{den}} }\times({{-c}})=\dfrac{ {{-b*c}} }{ {{den}} }$, puis on additionne.", variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 8 }, c: { type: "int", min: 2, max: 7 }, den: { type: "choice", values: [4, 5, 6, 8, 10] } }, tags: ["calcul", "fractions", "relatifs", "priorite"] })
    ];
  }

  if (chapter.id === "5e-chap-01") {
    return [
      seed({
        title: "Priorités avec parenthèses imbriquées",
        statementTemplate: "Calcule ${{result+(b+c)*d}}-({{b}}+{{c}})\\times{{d}}$.",
        answerTemplate: "{{result}}",
        correctionTemplate: "On calcule d'abord la parenthèse, puis le produit, avant d'effectuer la soustraction.",
        variablesSchema: { result: { type: "int", min: 5, max: 35 }, b: { type: "int", min: 2, max: 9 }, c: { type: "int", min: 2, max: 9 }, d: { type: "int", min: 2, max: 6 } },
        tags: ["priorite", "parentheses", "calcul en plusieurs etapes"]
      }),
      seed({
        title: "Produit et quotient dans une même expression",
        statementTemplate: "Calcule ${{q*c}}\\times{{b}}\\div{{c}}+{{d}}$.",
        answerTemplate: "{{q*b+d}}",
        correctionTemplate: "Multiplication et division ont la même priorité : de gauche à droite, on obtient {{q*b}}, puis {{q*b+d}}.",
        variablesSchema: { q: { type: "int", min: 3, max: 12 }, b: { type: "int", min: 2, max: 8 }, c: { type: "int", min: 2, max: 7 }, d: { type: "int", min: 3, max: 20 } },
        tags: ["priorite", "multiplication", "division", "calcul en plusieurs etapes"]
      }),
      seed({
        title: "Placer des parenthèses pour atteindre une cible",
        statementTemplate: "Place des parenthèses dans ${{a}}+{{b}}\\times{{c}}$ pour obtenir {{(a+b)*c}}.",
        answerTemplate: "$({{a}}+{{b}})\\times{{c}}$",
        correctionTemplate: "Les parenthèses imposent de calculer la somme avant la multiplication.",
        variablesSchema: { a: { type: "int", min: 2, max: 12 }, b: { type: "int", min: 2, max: 12 }, c: { type: "int", min: 2, max: 8 } },
        tags: ["priorite", "parentheses", "expression"]
      })
    ];
  }

  if (chapter.id === "5e-chap-16") {
    return [
      seed({
        title: "Base d'un triangle à partir de son aire",
        statementTemplate: "Un triangle a une aire de {{b*h/2}} cm² et une hauteur de {{h}} cm. Détermine la longueur de sa base.",
        answerTemplate: "{{b}} cm",
        correctionTemplate: "Avec $\\mathcal{A}=\\dfrac{b\\times h}{2}$, la base vaut $2\\mathcal{A}\\div h={{b}}$ cm.",
        variablesSchema: { b: { type: "int", min: 4, max: 16 }, h: { type: "choice", values: [2, 4, 6, 8] } },
        tags: ["aire", "triangle", "hauteur", "formule inverse"]
      }),
      seed({
        title: "Aire d'une figure évidée",
        statementTemplate: "On retire un carré de côté {{c}} cm d'un rectangle de {{l}} cm sur {{w}} cm. Calcule l'aire restante.",
        answerTemplate: "{{l*w-c*c}} cm²",
        correctionTemplate: "Aire restante = aire du rectangle - aire du carré = ${{l*w}}-{{c*c}}={{l*w-c*c}}$ cm².",
        variablesSchema: { l: { type: "int", min: 12, max: 24 }, w: { type: "int", min: 8, max: 16 }, c: { type: "int", min: 2, max: 6 } },
        tags: ["aire", "figure composee", "rectangle", "carre"]
      })
    ];
  }

  if (chapter.id === "5e-chap-18") {
    return [
      seed({
        title: "Moyenne après ajout d'une valeur",
        statementTemplate: "Une série de {{n}} valeurs a pour moyenne {{m}}. On ajoute la valeur {{v}}. Calcule la nouvelle moyenne au centième près si nécessaire.",
        answerTemplate: "{{formatDecimalFrench(roundTo((n*m+v)/(n+1),2))}}",
        correctionTemplate: "L'ancien total vaut ${{n}}\\times{{m}}={{n*m}}$. Le nouveau total vaut ${{n*m}}+{{v}}={{n*m+v}}$, donc $\\dfrac{ {{n*m+v}} }{ {{n+1}} }{{roundingRelation((n*m+v)/(n+1),2)}}{{formatDecimalFrench(roundTo((n*m+v)/(n+1),2))}}$.",
        variablesSchema: { n: { type: "int", min: 4, max: 9 }, m: { type: "int", min: 8, max: 16 }, v: { type: "int", min: 4, max: 20 } },
        tags: ["statistiques", "moyenne", "total"]
      }),
      seed({
        title: "Effectif manquant dans un tableau",
        statementTemplate: "L'effectif total est {{a+b+c+d}}. Trois catégories ont pour effectifs {{a}}, {{b}} et {{c}}. Détermine le quatrième effectif.",
        answerTemplate: "{{d}}",
        correctionTemplate: "L'effectif manquant vaut ${{a+b+c+d}}-{{a}}-{{b}}-{{c}}={{d}}$.",
        variablesSchema: { a: { type: "int", min: 8, max: 18 }, b: { type: "int", min: 7, max: 16 }, c: { type: "int", min: 6, max: 15 }, d: { type: "int", min: 5, max: 14 } },
        tags: ["statistiques", "effectif", "tableau"]
      }),
      seed({
        title: "Comparer deux séries par leur moyenne",
        statementTemplate: "La série A est ${{a}}; {{a+d}}; {{a+2*d}}$ et la série B est ${{b}}; {{b+e}}; {{b+2*e}}$. Calcule les deux moyennes et indique la plus grande.",
        answerTemplate: "Série B : {{b+e}} contre {{a+d}}",
        correctionTemplate: "La moyenne de A vaut {{a+d}} et celle de B vaut {{b+e}} : la série B a la moyenne la plus grande.",
        variablesSchema: { a: { type: "int", min: 6, max: 9 }, d: { type: "int", min: 1, max: 2 }, b: { type: "int", min: 12, max: 14 }, e: { type: "int", min: 1, max: 2 } },
        tags: ["statistiques", "moyenne", "comparaison de séries"]
      })
    ];
  }

  if (chapter.id === "4e-chap-15") {
    return [
      seed({
        title: "Équation avec inconnue dans les deux membres",
        statementTemplate: "Résous ${{a}}x{{b<0?'':'+'}}{{b}}={{c}}x{{(a-c)*x+b<0?'':'+'}}{{(a-c)*x+b}}$.",
        answerTemplate: "$x={{x}}$",
        correctionTemplate: "On regroupe les termes en $x$ : ${{a-c}}x={{(a-c)*x}}$, donc $x={{x}}$.",
        variablesSchema: { a: { type: "int", min: 6, max: 10 }, c: { type: "int", min: 2, max: 5 }, b: { type: "int", min: -8, max: 8 }, x: { type: "int", min: -6, max: 9, exclude: [0] } },
        tags: ["equation", "inconnue dans les deux membres", "resolution"]
      }),
      seed({
        title: "Équation avec quotient",
        statementTemplate: "Résous $\\dfrac{x-{{b}}}{ {{a}} }={{q}}$.",
        answerTemplate: "$x={{a*q+b}}$",
        correctionTemplate: "$x-{{b}}={{a*q}}$, donc $x={{a*q+b}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 2, max: 12 }, q: { type: "int", min: -6, max: 10, exclude: [0] } },
        tags: ["equation", "quotient", "resolution"]
      }),
      seed({
        title: "Mettre en équation un périmètre",
        statementTemplate: "Un rectangle a pour longueur $(x+{{d}})$ cm et largeur {{w}} cm. Son périmètre vaut {{2*(x+d+w)}} cm. Détermine x.",
        answerTemplate: "$x={{x}}$",
        correctionTemplate: "$2(x+{{d}}+{{w}})={{2*(x+d+w)}}$, donc $x={{x}}$.",
        variablesSchema: { x: { type: "int", min: 3, max: 15 }, d: { type: "int", min: 2, max: 8 }, w: { type: "int", min: 3, max: 12 } },
        tags: ["equation", "modeliser", "perimetre"]
      })
    ];
  }

  if (chapter.id === "4e-chap-12") {
    return [
      seed({
        title: "Moyenne après retrait d'une valeur",
        statementTemplate: "Une série de {{n}} valeurs a pour moyenne {{m}}. On retire la valeur {{v}}. Calcule la nouvelle moyenne au centième près si nécessaire.",
        answerTemplate: "{{formatDecimalFrench(roundTo((n*m-v)/(n-1),2))}}",
        correctionTemplate: "Le total initial vaut {{n*m}}. Après retrait : $\\dfrac{ {{n*m}}-{{v}} }{ {{n-1}} }{{roundingRelation((n*m-v)/(n-1),2)}}{{formatDecimalFrench(roundTo((n*m-v)/(n-1),2))}}$.",
        variablesSchema: { n: { type: "int", min: 6, max: 12 }, m: { type: "int", min: 8, max: 18 }, v: { type: "int", min: 4, max: 20 } },
        tags: ["statistiques", "moyenne", "total"]
      }),
      seed({
        title: "Médiane d'une série d'effectif pair",
        statementTemplate: "Calcule la médiane de la série ${{a+5*d}}; {{a}}; {{a+7*d}}; {{a+2*d}}; {{a+4*d}}; {{a+d}}$.",
        answerTemplate: "{{formatDecimalFrench(a+3*d)}}",
        correctionTemplate: "On ordonne : ${{a}}; {{a+d}}; {{a+2*d}}; {{a+4*d}}; {{a+5*d}}; {{a+7*d}}$. La médiane est la moyenne des 3e et 4e valeurs : $({{a+2*d}}+{{a+4*d}})\\div2={{a+3*d}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 12 }, d: { type: "int", min: 1, max: 5 } },
        tags: ["statistiques", "mediane", "effectif pair"]
      })
    ];
  }

  if (chapter.id === "3e-chap-01") {
    return [
      seed({
        title: "Fusion de deux groupes et moyenne globale",
        statementTemplate: "Un groupe de {{n1}} élèves a une moyenne de {{m1}} et un groupe de {{n2}} élèves une moyenne de {{m2}}. Calcule la moyenne de l'ensemble au centième près si nécessaire.",
        answerTemplate: "{{formatDecimalFrench(roundTo((n1*m1+n2*m2)/(n1+n2),2))}}",
        correctionTemplate: "On pondère par les effectifs : $\\dfrac{ {{n1}}\\times{{m1}}+{{n2}}\\times{{m2}} }{ {{n1+n2}} }{{roundingRelation((n1*m1+n2*m2)/(n1+n2),2)}}{{formatDecimalFrench(roundTo((n1*m1+n2*m2)/(n1+n2),2))}}$.",
        variablesSchema: { n1: { type: "int", min: 12, max: 28 }, n2: { type: "int", min: 12, max: 28 }, m1: { type: "int", min: 8, max: 14 }, m2: { type: "int", min: 12, max: 19 } },
        tags: ["statistiques", "moyenne ponderee", "effectif"]
      }),
      seed({
        title: "Comparer moyenne et dispersion de deux séries",
        statementTemplate: "La série A est ${{m-d}}; {{m}}; {{m+d}}$ et la série B est ${{m-e}}; {{m}}; {{m+e}}$. Elles ont la même moyenne. Laquelle a la plus grande étendue ?",
        answerTemplate: "{{d>e?'La série A':'La série B'}}",
        correctionTemplate: "Les étendues valent {{2*d}} pour A et {{2*e}} pour B ; la plus grande est celle de {{d>e?'A':'B'}}.",
        variablesSchema: { m: { type: "int", min: 10, max: 20 }, d: { type: "int", min: 5, max: 8 }, e: { type: "int", min: 1, max: 4 } },
        tags: ["statistiques", "moyenne", "etendue", "comparaison"]
      })
    ];
  }

  if (chapter.id === "3e-chap-06") {
    return [
      seed({
        title: "Équation avec inconnue dans les deux membres",
        statementTemplate: "Résous ${{a}}x{{b<0?'':'+'}}{{b}}={{c}}x{{(a-c)*x+b<0?'':'+'}}{{(a-c)*x+b}}$.",
        answerTemplate: "$x={{x}}$",
        correctionTemplate: "Après regroupement, ${{a-c}}x={{(a-c)*x}}$, donc $x={{x}}$.",
        variablesSchema: { a: { type: "int", min: 7, max: 12 }, c: { type: "int", min: 2, max: 6 }, b: { type: "int", min: -10, max: 10 }, x: { type: "int", min: -8, max: 10, exclude: [0] } },
        tags: ["equation", "inconnue dans les deux membres", "resolution"]
      }),
      seed({
        title: "Équation avec coefficient fractionnaire",
        statementTemplate: "Résous $\\dfrac{x}{ {{a}} }{{b<0?'':'+'}}{{b}}={{q+b}}$.",
        answerTemplate: "$x={{a*q}}$",
        correctionTemplate: "On retire {{b}}, puis on multiplie par {{a}} : $x={{q}}\\times{{a}}={{a*q}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: -8, max: 9 }, q: { type: "int", min: -7, max: 10, exclude: [0] } },
        tags: ["equation", "fraction", "resolution"]
      })
    ];
  }

  if (chapter.id === "3e-chap-07") {
    return [
      seed({
        title: "Double distributivité avec coefficients relatifs",
        statementTemplate: "Développe et réduis $({{a}}x-{{b}})({{c}}x+{{d}})$.",
        answerTemplate: "$ {{a*c}}x^2{{a*d-b*c<0?'':'+'}}{{a*d-b*c}}x-{{b*d}}$",
        correctionTemplate: "$({{a}}x)({{c}}x)+({{a}}x){{d}}-{{b}}({{c}}x)-{{b}}\\times{{d}}={{a*c}}x^2{{a*d-b*c<0?'':'+'}}{{a*d-b*c}}x-{{b*d}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 6 }, b: { type: "int", min: 2, max: 9 }, c: { type: "int", min: 2, max: 5 }, d: { type: "int", min: 2, max: 8 } },
        tags: ["double distributivite", "developper", "reduire", "relatifs"]
      }),
      seed({
        title: "Différence de deux produits développés",
        statementTemplate: "Développe et réduis $({{a}}x+{{b}})(x+{{c}})-({{a}}x+{{b}})(x+{{d}})$.",
        answerTemplate: "$ {{a*(c-d)}}x{{b*(c-d)<0?'':'+'}}{{b*(c-d)}}$",
        correctionTemplate: "Les termes en $x^2$ s'annulent. Il reste ${{a*(c-d)}}x{{b*(c-d)<0?'':'+'}}{{b*(c-d)}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 6 }, b: { type: "int", min: 2, max: 9 }, c: { type: "int", min: 2, max: 5 }, d: { type: "int", min: 6, max: 10 } },
        tags: ["double distributivite", "developper", "reduire", "difference", "relatifs"]
      }),
      seed({
        title: "Coefficient après double distributivité",
        statementTemplate: "Après développement de $({{a}}x+{{b}})({{c}}x+{{d}})$, quel est le coefficient du terme en $x$ ?",
        answerTemplate: "{{a*d+b*c}}",
        correctionTemplate: "Les termes en $x$ sont ${{a*d}}x$ et ${{b*c}}x$ ; leur somme est ${{a*d+b*c}}x$.",
        variablesSchema: { a: { type: "int", min: 2, max: 7 }, b: { type: "int", min: 2, max: 9 }, c: { type: "int", min: 2, max: 6 }, d: { type: "int", min: 2, max: 8 } },
        tags: ["double distributivite", "coefficient", "developper"]
      }),
      seed({
        title: "Somme de deux produits de binômes",
        statementTemplate: "Développe et réduis $(x+{{a}})(x+{{b}})+(x+{{c}})(x+{{d}})$.",
        answerTemplate: "$2x^2+{{a+b+c+d}}x+{{a*b+c*d}}$",
        correctionTemplate: "Chaque produit donne un terme $x^2$ ; après regroupement, on obtient $2x^2+{{a+b+c+d}}x+{{a*b+c*d}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 2, max: 9 }, c: { type: "int", min: 2, max: 7 }, d: { type: "int", min: 2, max: 9 } },
        tags: ["double distributivite", "developper", "reduire", "somme"]
      }),
      seed({
        title: "Différence de binômes avec annulation des carrés",
        statementTemplate: "Développe et réduis $(x+{{a}})(x+{{b}})-(x-{{c}})(x-{{d}})$.",
        answerTemplate: "$ {{a+b+c+d}}x{{a*b-c*d<0?'':'+'}}{{a*b-c*d}}$",
        correctionTemplate: "Les deux termes $x^2$ s'annulent ; il reste ${{a+b+c+d}}x{{a*b-c*d<0?'':'+'}}{{a*b-c*d}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 2, max: 9 }, c: { type: "int", min: 2, max: 7 }, d: { type: "int", min: 2, max: 9 } },
        tags: ["double distributivite", "developper", "reduire", "difference", "relatifs"]
      }),
      seed({
        title: "Aire littérale par double distributivité",
        statementTemplate: "Un rectangle a pour dimensions $({{a}}x+{{b}})$ cm et $({{c}}x+{{d}})$ cm. Développe et réduis l'expression de son aire.",
        answerTemplate: "$ {{a*c}}x^2+{{a*d+b*c}}x+{{b*d}}$ cm²",
        correctionTemplate: "L'aire est le produit des dimensions : $({{a}}x+{{b}})({{c}}x+{{d}})={{a*c}}x^2+{{a*d+b*c}}x+{{b*d}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 6 }, b: { type: "int", min: 2, max: 8 }, c: { type: "int", min: 2, max: 5 }, d: { type: "int", min: 2, max: 8 } },
        tags: ["double distributivite", "developper", "aire litterale"]
      })
    ];
  }

  if (chapter.id === "3e-chap-09") {
    return [
      seed({
        title: "Carré d'un binôme avec coefficient",
        statementTemplate: "Développe et réduis $({{a}}x+{{b}})^2$.",
        answerTemplate: "$ {{a*a}}x^2+{{2*a*b}}x+{{b*b}}$",
        correctionTemplate: "Avec $(u+v)^2=u^2+2uv+v^2$, on obtient ${{a*a}}x^2+{{2*a*b}}x+{{b*b}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 6 }, b: { type: "int", min: 2, max: 9 } },
        tags: ["identite remarquable", "carre d'une somme", "developper"]
      })
    ];
  }

  if (chapter.id === "3e-chap-13") {
    return [
      seed({
        title: "Deux tirages avec remise",
        statementTemplate: "Une urne contient {{r}} boules rouges et {{b}} bleues. On effectue deux tirages avec remise. Calcule la probabilité d'obtenir deux rouges.",
        answerTemplate: "{{formatFraction(r*r,(r+b)*(r+b))}}",
        correctionTemplate: "$P(RR)=\\dfrac{ {{r}} }{ {{r+b}} }\\times\\dfrac{ {{r}} }{ {{r+b}} }={{formatFraction(r*r,(r+b)*(r+b))}}$.",
        variablesSchema: { r: { type: "int", min: 2, max: 7 }, b: { type: "int", min: 3, max: 9 } },
        tags: ["probabilite", "deux tirages", "avec remise"]
      }),
      seed({
        title: "Deux tirages sans remise",
        statementTemplate: "Une urne contient {{r}} boules rouges et {{b}} bleues. On tire successivement sans remise une rouge puis une bleue. Calcule cette probabilité.",
        answerTemplate: "{{formatFraction(r*b,(r+b)*(r+b-1))}}",
        correctionTemplate: "$P(R puis B)=\\dfrac{ {{r}} }{ {{r+b}} }\\times\\dfrac{ {{b}} }{ {{r+b-1}} }={{formatFraction(r*b,(r+b)*(r+b-1))}}$.",
        variablesSchema: { r: { type: "int", min: 2, max: 7 }, b: { type: "int", min: 3, max: 9 } },
        tags: ["probabilite", "deux tirages", "sans remise"]
      }),
      seed({
        title: "Au moins un succès en deux essais",
        statementTemplate: "À chaque essai indépendant, la probabilité de succès est $\\dfrac{ {{a}} }{ {{den}} }$. Calcule la probabilité d'obtenir au moins un succès en deux essais.",
        answerTemplate: "{{formatFraction(den*den-(den-a)*(den-a),den*den)}}",
        correctionTemplate: "On passe par l'événement contraire : $1-\\left(\\dfrac{ {{den-a}} }{ {{den}} }\\right)^2={{formatFraction(den*den-(den-a)*(den-a),den*den)}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 5 }, den: { type: "choice", values: [6, 8, 10, 12] } },
        tags: ["probabilite", "evenement contraire", "deux essais"]
      }),
      seed({
        title: "Exactement une rouge avec remise",
        statementTemplate: "Une urne contient {{r}} boules rouges et {{b}} bleues. On effectue deux tirages avec remise. Calcule la probabilité d'obtenir exactement une boule rouge.",
        answerTemplate: "{{formatFraction(2*r*b,(r+b)*(r+b))}}",
        correctionTemplate: "Les chemins rouge-bleue et bleue-rouge conviennent : $2\\times\\dfrac{ {{r}} }{ {{r+b}} }\\times\\dfrac{ {{b}} }{ {{r+b}} }={{formatFraction(2*r*b,(r+b)*(r+b))}}$.",
        variablesSchema: { r: { type: "int", min: 2, max: 7 }, b: { type: "int", min: 3, max: 9 } },
        tags: ["probabilite", "deux tirages", "exactement un succes"]
      }),
      seed({
        title: "Deux boules de même couleur avec remise",
        statementTemplate: "Une urne contient {{r}} boules rouges et {{b}} bleues. On effectue deux tirages avec remise. Calcule la probabilité d'obtenir deux boules de même couleur.",
        answerTemplate: "{{formatFraction(r*r+b*b,(r+b)*(r+b))}}",
        correctionTemplate: "On additionne les chemins rouge-rouge et bleue-bleue : $\\dfrac{ {{r*r}}+{{b*b}} }{ {{(r+b)*(r+b)}} }={{formatFraction(r*r+b*b,(r+b)*(r+b))}}$.",
        variablesSchema: { r: { type: "int", min: 2, max: 7 }, b: { type: "int", min: 3, max: 9 } },
        tags: ["probabilite", "deux tirages", "meme couleur"]
      }),
      seed({
        title: "Deux rouges sans remise",
        statementTemplate: "Une urne contient {{r}} boules rouges et {{b}} bleues. On tire deux boules successivement sans remise. Calcule la probabilité d'obtenir deux rouges.",
        answerTemplate: "{{formatFraction(r*(r-1),(r+b)*(r+b-1))}}",
        correctionTemplate: "$P(RR)=\\dfrac{ {{r}} }{ {{r+b}} }\\times\\dfrac{ {{r-1}} }{ {{r+b-1}} }={{formatFraction(r*(r-1),(r+b)*(r+b-1))}}$.",
        variablesSchema: { r: { type: "int", min: 3, max: 8 }, b: { type: "int", min: 3, max: 9 } },
        tags: ["probabilite", "deux tirages", "sans remise"]
      }),
      seed({
        title: "Au moins une rouge sans remise",
        statementTemplate: "Une urne contient {{r}} boules rouges et {{b}} bleues. On tire deux boules sans remise. Calcule la probabilité d'obtenir au moins une rouge.",
        answerTemplate: "{{formatFraction((r+b)*(r+b-1)-b*(b-1),(r+b)*(r+b-1))}}",
        correctionTemplate: "On utilise l'événement contraire « deux bleues » : $1-\\dfrac{ {{b}} }{ {{r+b}} }\\times\\dfrac{ {{b-1}} }{ {{r+b-1}} }={{formatFraction((r+b)*(r+b-1)-b*(b-1),(r+b)*(r+b-1))}}$.",
        variablesSchema: { r: { type: "int", min: 3, max: 8 }, b: { type: "int", min: 3, max: 9 } },
        tags: ["probabilite", "evenement contraire", "sans remise"]
      }),
      seed({
        title: "Nombre moyen de succès attendu",
        statementTemplate: "Un événement de probabilité $\\dfrac{ {{a}} }{ {{den}} }$ est répété {{den*k}} fois dans les mêmes conditions. Quel nombre de succès peut-on attendre en moyenne ?",
        answerTemplate: "{{a*k}} succès",
        correctionTemplate: "$ {{den*k}}\\times\\dfrac{ {{a}} }{ {{den}} }={{a*k}}$.",
        variablesSchema: { a: { type: "int", min: 2, max: 6 }, den: { type: "choice", values: [8, 10, 12] }, k: { type: "int", min: 3, max: 8 } },
        tags: ["probabilite", "frequence attendue", "simulation"]
      }),
      seed({
        title: "Comparer deux jeux de hasard",
        statementTemplate: "Le jeu A donne une probabilité de gain $\\dfrac{ {{a}} }{ {{denA}} }$ et le jeu B une probabilité $\\dfrac{ {{b}} }{ {{denB}} }$. Compare les deux probabilités par produits en croix.",
        answerTemplate: "{{a*denB===b*denA?'Les deux jeux sont équivalents':a*denB>b*denA?'Le jeu A est plus avantageux':'Le jeu B est plus avantageux'}}",
        correctionTemplate: "On compare {{a*denB}} et {{b*denA}} : {{a*denB===b*denA?'les probabilités sont égales':a*denB>b*denA?'la probabilité du jeu A est supérieure':'la probabilité du jeu B est supérieure'}}.",
        variablesSchema: { a: { type: "int", min: 2, max: 8 }, denA: { type: "int", min: 9, max: 16 }, b: { type: "int", min: 2, max: 8 }, denB: { type: "int", min: 9, max: 16 } },
        tags: ["probabilite", "comparaison", "produits en croix"]
      })
    ];
  }

  if (chapter.id === "3e-chap-15") {
    return [
      seed({
        title: "Milieu de deux points dans l'espace",
        statementTemplate: "Dans l'espace, $A({{x}};{{y}};{{z}})$ et $B({{x+2*u}};{{y+2*v}};{{z+2*w}})$. Détermine les coordonnées du milieu M de [AB].",
        answerTemplate: "$M({{x+u}};{{y+v}};{{z+w}})$",
        correctionTemplate: "On fait la moyenne de chaque paire de coordonnées : $M({{x+u}};{{y+v}};{{z+w}})$.",
        variablesSchema: { x: { type: "int", min: -6, max: 6 }, y: { type: "int", min: -6, max: 6 }, z: { type: "int", min: -4, max: 8 }, u: { type: "int", min: 1, max: 5 }, v: { type: "int", min: -4, max: 4, exclude: [0] }, w: { type: "int", min: 1, max: 5 } },
        tags: ["reperage espace", "coordonnees", "milieu"]
      }),
      seed({
        title: "Vecteur entre deux points de l'espace",
        statementTemplate: "Dans l'espace, $A({{x}};{{y}};{{z}})$ et $B({{x+u}};{{y+v}};{{z+w}})$. Détermine les coordonnées de $\\overrightarrow{AB}$.",
        answerTemplate: "$({{u}};{{v}};{{w}})$",
        correctionTemplate: "On soustrait les coordonnées de A à celles de B, coordonnée par coordonnée.",
        variablesSchema: { x: { type: "int", min: -5, max: 6 }, y: { type: "int", min: -5, max: 6 }, z: { type: "int", min: -4, max: 8 }, u: { type: "int", min: -5, max: 5, exclude: [0] }, v: { type: "int", min: -5, max: 5, exclude: [0] }, w: { type: "int", min: -5, max: 5, exclude: [0] } },
        tags: ["reperage espace", "coordonnees", "vecteur"]
      }),
      seed({
        title: "Extrémité d'un vecteur dans l'espace",
        statementTemplate: "Dans l'espace, $A({{x}};{{y}};{{z}})$ et $\\overrightarrow{AB}=({{u}};{{v}};{{w}})$. Détermine les coordonnées de B.",
        answerTemplate: "$B({{x+u}};{{y+v}};{{z+w}})$",
        correctionTemplate: "On ajoute les coordonnées du vecteur à celles de A : $B({{x+u}};{{y+v}};{{z+w}})$.",
        variablesSchema: { x: { type: "int", min: -5, max: 6 }, y: { type: "int", min: -5, max: 6 }, z: { type: "int", min: -4, max: 8 }, u: { type: "int", min: -5, max: 5, exclude: [0] }, v: { type: "int", min: -5, max: 5, exclude: [0] }, w: { type: "int", min: -5, max: 5, exclude: [0] } },
        tags: ["reperage espace", "coordonnees", "vecteur"]
      }),
      seed({
        title: "Extrémité à partir du milieu",
        statementTemplate: "Dans l'espace, $A({{x}};{{y}};{{z}})$ et le milieu de [AB] est $M({{mx}};{{my}};{{mz}})$. Détermine les coordonnées de B.",
        answerTemplate: "$B({{2*mx-x}};{{2*my-y}};{{2*mz-z}})$",
        correctionTemplate: "Comme $M=(A+B)/2$, on calcule $B=2M-A$ coordonnée par coordonnée.",
        variablesSchema: { x: { type: "int", min: -5, max: 6 }, y: { type: "int", min: -5, max: 6 }, z: { type: "int", min: -4, max: 8 }, mx: { type: "int", min: -3, max: 7 }, my: { type: "int", min: -3, max: 7 }, mz: { type: "int", min: -2, max: 8 } },
        tags: ["reperage espace", "coordonnees", "milieu"]
      }),
      seed({
        title: "Deux déplacements successifs dans l'espace",
        statementTemplate: "Le point $A({{x}};{{y}};{{z}})$ subit successivement les vecteurs $({{u}};{{v}};{{w}})$ puis $({{p}};{{q}};{{r}})$. Détermine ses coordonnées finales.",
        answerTemplate: "$({{x+u+p}};{{y+v+q}};{{z+w+r}})$",
        correctionTemplate: "On additionne les deux déplacements à chaque coordonnée.",
        variablesSchema: { x: { type: "int", min: -5, max: 6 }, y: { type: "int", min: -5, max: 6 }, z: { type: "int", min: -4, max: 8 }, u: { type: "int", min: -4, max: 5 }, v: { type: "int", min: -4, max: 5 }, w: { type: "int", min: -4, max: 5 }, p: { type: "int", min: -4, max: 5 }, q: { type: "int", min: -4, max: 5 }, r: { type: "int", min: -4, max: 5 } },
        tags: ["reperage espace", "coordonnees", "vecteurs"]
      }),
      seed({
        title: "Coordonnées d'un quatrième point dans l'espace",
        statementTemplate: "Dans l'espace, $A({{x}};{{y}};{{z}})$, $B({{bx}};{{by}};{{bz}})$ et $C({{cx}};{{cy}};{{cz}})$ sont trois sommets consécutifs de ABCD. Détermine D.",
        answerTemplate: "$D({{x+cx-bx}};{{y+cy-by}};{{z+cz-bz}})$",
        correctionTemplate: "Dans un parallélogramme, $\\overrightarrow{AD}=\\overrightarrow{BC}$, donc $D=A+C-B$.",
        variablesSchema: { x: { type: "int", min: -4, max: 6 }, y: { type: "int", min: -4, max: 6 }, z: { type: "int", min: -3, max: 7 }, bx: { type: "int", min: -4, max: 6 }, by: { type: "int", min: -4, max: 6 }, bz: { type: "int", min: -3, max: 7 }, cx: { type: "int", min: -4, max: 6 }, cy: { type: "int", min: -4, max: 6 }, cz: { type: "int", min: -3, max: 7 } },
        tags: ["reperage espace", "coordonnees", "quatrieme point"]
      }),
      seed({
        title: "Distance dans un plan horizontal",
        statementTemplate: "Dans l'espace, $A({{x}};{{y}};{{z}})$ et $B({{x+3*k}};{{y+4*k}};{{z}})$. Calcule la distance AB.",
        answerTemplate: "{{5*k}} unités",
        correctionTemplate: "Les écarts horizontaux valent {{3*k}} et {{4*k}} ; par Pythagore, $AB=\\sqrt{ {{9*k*k}}+{{16*k*k}} }={{5*k}}$.",
        variablesSchema: { x: { type: "int", min: -5, max: 5 }, y: { type: "int", min: -5, max: 5 }, z: { type: "int", min: -3, max: 8 }, k: { type: "int", min: 1, max: 4 } },
        tags: ["reperage espace", "coordonnees", "distance", "pythagore"]
      }),
      seed({
        title: "Déplacement commun de deux points dans l'espace",
        statementTemplate: "$A({{x}};{{y}};{{z}})$ et $B({{bx}};{{by}};{{bz}})$ sont déplacés par le vecteur $({{u}};{{v}};{{w}})$. Donne les coordonnées de A' et B'.",
        answerTemplate: "$A'({{x+u}};{{y+v}};{{z+w}})$ et $B'({{bx+u}};{{by+v}};{{bz+w}})$",
        correctionTemplate: "On ajoute le même vecteur aux coordonnées de chacun des deux points.",
        variablesSchema: { x: { type: "int", min: -5, max: 5 }, y: { type: "int", min: -5, max: 5 }, z: { type: "int", min: -3, max: 7 }, bx: { type: "int", min: -5, max: 5 }, by: { type: "int", min: -5, max: 5 }, bz: { type: "int", min: -3, max: 7 }, u: { type: "int", min: -4, max: 4, exclude: [0] }, v: { type: "int", min: -4, max: 4, exclude: [0] }, w: { type: "int", min: -4, max: 4, exclude: [0] } },
        tags: ["reperage espace", "coordonnees", "vecteur", "deplacement"]
      })
    ];
  }

  return [];
}

function templatesForChapter(chapter: ChapterInfo): TemplateSeed[] {
  if (chapter.id === "3e-chap-20") return [];

  const base =
    chapter.domain === "decimaux"
      ? decimalTemplates(chapter)
      : chapter.domain === "fractions"
        ? fractionTemplates(chapter)
        : chapter.domain === "proportionnalite"
          ? proportionTemplates(chapter)
          : chapter.domain === "geometrie" || chapter.domain === "pythagore" || chapter.domain === "thales"
            ? geometryTemplates(chapter)
            : chapter.domain === "grandeurs-mesures"
              ? measurementTemplates(chapter)
              : chapter.domain === "calcul-litteral" || chapter.domain === "equations"
                ? literalTemplates(chapter)
                : chapter.domain === "puissances"
                  ? powersTemplates(chapter)
                  : chapter.domain === "statistiques"
                    ? statsTemplates(chapter)
                    : chapter.domain === "probabilites"
                      ? probabilityTemplates(chapter)
                      : chapter.domain === "fonctions"
                        ? functionTemplates(chapter)
                        : chapter.domain === "trigonometrie"
                          ? trigonometryTemplates(chapter)
                          : chapter.domain === "algorithmique"
                            ? scratchTemplates(chapter)
                            : numberTemplates(chapter);

  const keep = (template: TemplateSeed) =>
    keepGeometryTemplateForChapter(template, chapter) &&
    keepTemplateForLevel(template, chapter) &&
    keepChapterAlignedTemplate(template, chapter);

  const tunedBase = base.filter(keep);
  const tunedFlash = mentalFlashTemplates(chapter).filter(keep);
  const tunedDeepening = deepeningTemplates(chapter).filter(keep);
  const tunedReinforcement = reinforcementTemplates(chapter).filter(keep);
  const tunedGeometryChapter = geometryChapterReinforcementTemplates(chapter).filter(keep);
  const tunedSixthGrade = sixthGradeSafeReinforcementTemplates(chapter).filter(keep);
  const tunedRelatives = relativeAdvancedTemplates(chapter).filter(keep);
  const tunedFifthGradeExtras = fifthGradeProgressionExtras(chapter).filter(keep);
  const tunedLevelChallenges = levelChallengeTemplates(chapter).filter(keep);
  return [
    ...tunedBase,
    ...tunedFlash,
    ...tunedDeepening,
    ...tunedReinforcement,
    ...tunedGeometryChapter,
    ...tunedSixthGrade,
    ...tunedRelatives,
    ...tunedFifthGradeExtras,
    ...tunedLevelChallenges
  ].map((template) => limitPythagoreSquareOperands(chapter, template));
}

const removedChapterQuestionIds = new Set([
  "site-6e-chap-01-03",
  "site-6e-chap-01-08",
  "site-6e-chap-01-09",
  "site-6e-chap-01-10",
  "site-6e-chap-01-12",
  "site-6e-chap-01-13",
  "site-6e-chap-01-14",
  "site-6e-chap-01-15",
  "site-6e-chap-01-16",
  "site-6e-chap-01-17",
  "site-6e-chap-01-18",
  "site-6e-chap-02-14",
  "site-6e-chap-02-16",
  "site-6e-chap-02-17",
  "site-6e-chap-02-18",
  "site-6e-chap-02-12",
  "site-6e-chap-03-07",
  "site-6e-chap-03-08",
  "site-6e-chap-03-10",
  "site-6e-chap-03-15",
  "site-6e-chap-03-16",
  "site-6e-chap-03-17",
  "site-6e-chap-03-18",
  "site-6e-chap-04-15",
  "site-6e-chap-04-16",
  "site-6e-chap-04-17",
  "site-6e-chap-04-18",
  "site-6e-chap-04-19",
  "site-6e-chap-05-10",
  "site-6e-chap-05-11",
  "site-6e-chap-05-13",
  "site-6e-chap-05-15",
  "site-6e-chap-05-16",
  "site-6e-chap-05-17",
  "site-6e-chap-06-03",
  "site-6e-chap-06-04",
  "site-6e-chap-06-07",
  "site-6e-chap-06-15",
  "site-6e-chap-06-16",
  "site-6e-chap-07-01",
  "site-6e-chap-07-04",
  "site-6e-chap-07-08",
  "site-6e-chap-07-10",
  "site-6e-chap-07-11",
  "site-6e-chap-07-12",
  "site-6e-chap-07-13",
  "site-6e-chap-07-15",
  "site-6e-chap-07-16",
  "site-6e-chap-07-17",
  "site-6e-chap-07-18",
  "site-6e-chap-07-19",
  "site-6e-chap-07-20",
  "site-5e-chap-09-04",
  "site-5e-chap-09-05",
  "site-5e-chap-09-07",
  "site-5e-chap-09-09",
  "site-5e-chap-09-10",
  "site-5e-chap-09-14",
  "site-5e-chap-09-15",
  "site-5e-chap-09-16",
  "site-5e-chap-09-17",
  "site-5e-chap-09-18",
  "site-5e-chap-09-19",
  "site-5e-chap-09-20",
  "site-5e-chap-09-21",
  "site-5e-chap-09-22",
  "site-5e-chap-12-04",
  "site-5e-chap-12-05",
  "site-5e-chap-12-07",
  "site-5e-chap-13-02",
  "site-5e-chap-13-07",
  "site-5e-chap-14-01",
  "site-5e-chap-14-02",
  "site-5e-chap-14-03",
  "site-5e-chap-14-04",
  "site-5e-chap-15-03",
  "site-5e-chap-15-04",
  "site-5e-chap-15-05",
  "site-5e-chap-15-07",
  "site-5e-chap-16-04",
  "site-5e-chap-20-05",
  "site-5e-chap-20-09",
  "site-5e-chap-20-11",
  "site-5e-chap-20-14",
  "site-4e-chap-05-10",
  "site-4e-chap-05-11",
  "site-4e-chap-05-12",
  "site-4e-chap-05-14",
  "site-4e-chap-05-17",
  "site-4e-chap-05-18",
  "site-4e-chap-06-03",
  "site-4e-chap-06-04",
  "site-4e-chap-06-05",
  "site-4e-chap-06-06",
  "site-4e-chap-17-05",
  "site-4e-chap-17-09",
  "site-4e-chap-17-11",
  "site-4e-chap-17-15",
  "site-3e-chap-13-05",
  "site-3e-chap-13-09",
  "site-3e-chap-13-11",
  "site-3e-chap-13-15",
  "site-3e-chap-14-04",
  "site-3e-chap-14-05",
  "site-3e-chap-14-07",
  "site-3e-chap-14-18"
]);

const retainedCuratedAutomatismes = Object.values(siteProgressionChapters)
  .flatMap((chapters) =>
    chapters.flatMap((chapterItem) =>
      templatesForChapter(chapterItem).map((template, index) => makeAutomatisme(chapterItem, template, index + 1))
    )
  )
  .filter((automatisme) => !removedChapterQuestionIds.has(automatisme.id));

const completionAutomatismes = Object.values(siteProgressionChapters)
  .flatMap((chapters) =>
    chapters.flatMap((chapterItem) =>
      chapterCompletionTemplates(chapterItem)
        .filter((template) =>
          keepGeometryTemplateForChapter(template, chapterItem) &&
          keepTemplateForLevel(template, chapterItem) &&
          keepChapterAlignedTemplate(template, chapterItem)
        )
        .map((template, index) => ({
          ...makeAutomatisme(chapterItem, limitPythagoreSquareOperands(chapterItem, template), index + 1),
          id: `site-${chapterItem.id}-completion-${(index + 1).toString().padStart(2, "0")}`
        }))
    )
  );

const curatedAutomatismes = [...retainedCuratedAutomatismes, ...completionAutomatismes];

export const largeAutomatismes: Automatisme[] = curatedAutomatismes;

