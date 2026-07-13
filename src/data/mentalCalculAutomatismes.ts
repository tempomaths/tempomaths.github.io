import type { Automatisme, FigureTemplate, Level, MathDomain, ProgressionStep, VariableSchema } from "../types";
import { getChapter } from "./siteProgression";

export const PURE_MENTAL_TAG = "calcul-mental";

type MentalSeed = {
  title: string;
  level: Level;
  chapterRank: number;
  progressionStep: ProgressionStep;
  domain: MathDomain;
  difficulty: Automatisme["difficulty"];
  statementTemplate: string;
  answerTemplate: string;
  correctionTemplate: string;
  variablesSchema: VariableSchema;
  tags?: string[];
  duration?: number;
  figureTemplate?: FigureTemplate;
};

const sourceNote =
  "Banque de maths mentales college inspiree du format MathsMentales : questions courtes et reponses courtes.";

function mental(seed: MentalSeed, index: number): Automatisme {
  const chapter = getChapter(seed.level, seed.chapterRank);
  return {
    id: `mental-${seed.level}-${index.toString().padStart(2, "0")}`,
    title: seed.title,
    levels: [seed.level],
    progressionStep: seed.progressionStep,
    chapterId: chapter.id,
    chapterRank: chapter.rank,
    chapterTitle: chapter.title,
    domain: seed.domain,
    subdomain: "Calcul mental pur",
    difficulty: seed.difficulty,
    statementTemplate: seed.statementTemplate,
    answerTemplate: seed.answerTemplate,
    correctionTemplate: seed.correctionTemplate,
    variablesSchema: seed.variablesSchema,
    defaultDurationSeconds: seed.duration ?? 20,
    tags: [...(seed.figureTemplate ? [] : [PURE_MENTAL_TAG]), "mental", "maths-mentales", ...(seed.tags ?? [])],
    figureTemplate: seed.figureTemplate,
    sourceNote,
    status: "official"
  };
}

const seeds: MentalSeed[] = [
  {
    level: "6e",
    chapterRank: 1,
    progressionStep: "start",
    domain: "nombres-calculs",
    difficulty: 1,
    title: "Complement a 100",
    statementTemplate: "Complete : ${{a}}+\\square=100$.",
    answerTemplate: "{{100-a}}",
    correctionTemplate: "$100-{{a}}={{100-a}}$.",
    variablesSchema: { a: { type: "int", min: 12, max: 88 } },
    tags: ["complement", "addition"]
  },
  {
    level: "6e",
    chapterRank: 1,
    progressionStep: "start",
    domain: "nombres-calculs",
    difficulty: 1,
    title: "Chiffre des dizaines",
    statementTemplate: "Dans ${{100*a+10*b+c}}$, quel est le chiffre des dizaines ?",
    answerTemplate: "{{b}}",
    correctionTemplate: "Dans ${{100*a+10*b+c}}$, le chiffre des dizaines est ${{b}}$.",
    variablesSchema: {
      a: { type: "int", min: 1, max: 9 },
      b: { type: "int", min: 1, max: 9 },
      c: { type: "int", min: 0, max: 9 }
    },
    tags: ["numeration"]
  },
  {
    level: "6e",
    chapterRank: 3,
    progressionStep: "trimester1",
    domain: "nombres-calculs",
    difficulty: 1,
    title: "Table de multiplication",
    statementTemplate: "Calcule : ${{a}}\\times {{b}}$.",
    answerTemplate: "{{a*b}}",
    correctionTemplate: "$ {{a}}\\times {{b}}={{a*b}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 10 }, b: { type: "int", min: 2, max: 10 } },
    tags: ["tables", "multiplication"]
  },
  {
    level: "6e",
    chapterRank: 3,
    progressionStep: "trimester1",
    domain: "nombres-calculs",
    difficulty: 1,
    title: "Division exacte",
    statementTemplate: "Calcule : ${{a*b}}\\div {{b}}$.",
    answerTemplate: "{{a}}",
    correctionTemplate: "$ {{a*b}}\\div {{b}}={{a}}$.",
    variablesSchema: { a: { type: "int", min: 3, max: 18 }, b: { type: "int", min: 2, max: 10 } },
    tags: ["division"]
  },
  {
    level: "6e",
    chapterRank: 3,
    progressionStep: "trimester1",
    domain: "nombres-calculs",
    difficulty: 1,
    title: "Double",
    statementTemplate: "Donne le double de ${{a}}$.",
    answerTemplate: "{{2*a}}",
    correctionTemplate: "$2\\times {{a}}={{2*a}}$.",
    variablesSchema: { a: { type: "int", min: 12, max: 85 } },
    tags: ["double"]
  },
  {
    level: "6e",
    chapterRank: 3,
    progressionStep: "trimester1",
    domain: "nombres-calculs",
    difficulty: 1,
    title: "Moitie",
    statementTemplate: "Donne la moitie de ${{2*a}}$.",
    answerTemplate: "{{a}}",
    correctionTemplate: "$ {{2*a}}\\div 2={{a}}$.",
    variablesSchema: { a: { type: "int", min: 8, max: 80 } },
    tags: ["moitie"]
  },
  {
    level: "6e",
    chapterRank: 15,
    progressionStep: "end",
    domain: "fractions",
    difficulty: 2,
    title: "Fraction de quantite",
    statementTemplate: "Calcule $\\dfrac{1}{ {{d}} }$ de ${{d*n}}$.",
    answerTemplate: "{{n}}",
    correctionTemplate: "$ {{d*n}}\\div {{d}}={{n}}$.",
    variablesSchema: { d: { type: "choice", values: [2, 3, 4, 5, 10] }, n: { type: "int", min: 4, max: 24 } },
    tags: ["fractions"]
  },
  {
    level: "6e",
    chapterRank: 9,
    progressionStep: "trimester2",
    domain: "decimaux",
    difficulty: 2,
    title: "Decimal fois 10",
    statementTemplate: "Calcule : ${{formatDecimalFrench(a/10)}}\\times 10$.",
    answerTemplate: "{{a}}",
    correctionTemplate: "$ {{formatDecimalFrench(a/10)}}\\times 10={{a}}$.",
    variablesSchema: { a: { type: "int", min: 12, max: 99 } },
    tags: ["decimaux"]
  },
  {
    level: "6e",
    chapterRank: 9,
    progressionStep: "trimester2",
    domain: "decimaux",
    difficulty: 2,
    title: "Diviser par 10",
    statementTemplate: "Calcule : ${{a}}\\div 10$.",
    answerTemplate: "{{formatDecimalFrench(a/10)}}",
    correctionTemplate: "$ {{a}}\\div 10={{formatDecimalFrench(a/10)}}$.",
    variablesSchema: { a: { type: "int", min: 12, max: 180 } },
    tags: ["decimaux", "division"]
  },
  {
    level: "6e",
    chapterRank: 15,
    progressionStep: "end",
    domain: "proportionnalite",
    difficulty: 2,
    title: "Pourcentage moitie",
    statementTemplate: "Calcule $50\\%$ de ${{2*n}}$.",
    answerTemplate: "{{n}}",
    correctionTemplate: "$50\\%$ est la moitie. ${{2*n}}\\div 2={{n}}$.",
    variablesSchema: { n: { type: "int", min: 12, max: 95 } },
    tags: ["pourcentage"]
  },
  {
    level: "6e",
    chapterRank: 12,
    progressionStep: "trimester2",
    domain: "proportionnalite",
    difficulty: 2,
    title: "Prix proportionnel",
    statementTemplate: "$1$ cahier coute ${{p}}$ euros. Combien coutent ${{n}}$ cahiers ?",
    answerTemplate: "{{p*n}} euros",
    correctionTemplate: "$ {{p}}\\times {{n}}={{p*n}}$ euros.",
    variablesSchema: { p: { type: "int", min: 2, max: 8 }, n: { type: "int", min: 3, max: 9 } },
    tags: ["proportionnalite"]
  },
  {
    level: "6e",
    chapterRank: 14,
    progressionStep: "trimester2",
    domain: "grandeurs-mesures",
    difficulty: 2,
    title: "Perimetre d'un carre",
    statementTemplate: "Un carre a un cote de ${{c}}$ cm. Quel est son perimetre ?",
    answerTemplate: "{{4*c}} cm",
    correctionTemplate: "$4\\times {{c}}={{4*c}}$ cm.",
    variablesSchema: { c: { type: "int", min: 3, max: 18 } },
    tags: ["perimetre"]
  },
  {
    level: "6e",
    chapterRank: 14,
    progressionStep: "trimester2",
    domain: "grandeurs-mesures",
    difficulty: 2,
    title: "Aire d'un rectangle",
    statementTemplate: "Aire d'un rectangle : ${{l}}$ cm par ${{w}}$ cm.",
    answerTemplate: "{{l*w}} cm2",
    correctionTemplate: "$ {{l}}\\times {{w}}={{l*w}}$ cm2.",
    variablesSchema: { l: { type: "int", min: 4, max: 15 }, w: { type: "int", min: 3, max: 12 } },
    tags: ["aire"]
  },
  {
    level: "5e",
    chapterRank: 1,
    progressionStep: "start",
    domain: "nombres-calculs",
    difficulty: 2,
    title: "Priorite multiplication",
    statementTemplate: "Calcule : ${{a}}+{{b}}\\times {{c}}$.",
    answerTemplate: "{{a+b*c}}",
    correctionTemplate: "$ {{b}}\\times {{c}}={{b*c}}$. Puis ${{a}}+{{b*c}}={{a+b*c}}$.",
    variablesSchema: { a: { type: "int", min: 4, max: 30 }, b: { type: "int", min: 2, max: 9 }, c: { type: "int", min: 2, max: 9 } },
    tags: ["priorites"]
  },
  {
    level: "5e",
    chapterRank: 1,
    progressionStep: "start",
    domain: "nombres-calculs",
    difficulty: 2,
    title: "Parentheses",
    statementTemplate: "Calcule : $({{a}}+{{b}})\\times {{c}}$.",
    answerTemplate: "{{(a+b)*c}}",
    correctionTemplate: "$ {{a}}+{{b}}={{a+b}}$. Puis ${{a+b}}\\times {{c}}={{(a+b)*c}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 15 }, b: { type: "int", min: 2, max: 15 }, c: { type: "int", min: 2, max: 8 } },
    tags: ["priorites"]
  },
  {
    level: "5e",
    chapterRank: 4,
    progressionStep: "trimester1",
    domain: "nombres-calculs",
    difficulty: 2,
    title: "Multiple",
    statementTemplate: "$ {{a*b}}$ est-il un multiple de ${{a}}$ ?",
    answerTemplate: "Oui",
    correctionTemplate: "Oui, car ${{a*b}}={{a}}\\times {{b}}$.",
    variablesSchema: { a: { type: "int", min: 3, max: 12 }, b: { type: "int", min: 4, max: 15 } },
    tags: ["multiples"]
  },
  {
    level: "5e",
    chapterRank: 7,
    progressionStep: "trimester2",
    domain: "nombres-calculs",
    difficulty: 2,
    title: "Ordonner trois relatifs",
    statementTemplate: "Range dans l'ordre croissant : $-{{a}}$ ; ${{p}}$ ; $-{{a+k}}$.",
    answerTemplate: "$-{{a+k}}<-{{a}}<{{p}}$",
    correctionTemplate: "Parmi les négatifs, $-{{a+k}}$ est le plus éloigné de zéro ; le nombre {{p}} est positif.",
    variablesSchema: { a: { type: "int", min: 2, max: 20 }, k: { type: "int", min: 1, max: 8 }, p: { type: "int", min: 1, max: 15 } },
    tags: ["relatifs", "ordre"]
  },
  {
    level: "5e",
    chapterRank: 7,
    progressionStep: "trimester2",
    domain: "nombres-calculs",
    difficulty: 2,
    title: "Comparer des relatifs",
    statementTemplate: "Complete : $-{{a}}\\; ... \\;-{{a+k}}$.",
    answerTemplate: ">",
    correctionTemplate: "$-{{a}}$ est plus proche de $0$, donc $-{{a}}>-{{a+k}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 12 }, k: { type: "int", min: 1, max: 8 } },
    tags: ["relatifs", "comparaison"]
  },
  {
    level: "5e",
    chapterRank: 5,
    progressionStep: "trimester2",
    domain: "fractions",
    difficulty: 2,
    title: "Addition à dénominateurs multiples",
    statementTemplate: "Calcule : $\\dfrac{ {{a}} }{ {{d}} }+\\dfrac{ {{b}} }{ {{d*k}} }$.",
    answerTemplate: "{{formatFraction(a*k+b,d*k)}}",
    correctionTemplate: "$\\dfrac{ {{a}} }{ {{d}} }=\\dfrac{ {{a*k}} }{ {{d*k}} }$, donc la somme vaut {{formatFraction(a*k+b,d*k)}}.",
    variablesSchema: { a: { type: "int", min: 1, max: 7 }, b: { type: "int", min: 1, max: 8 }, d: { type: "int", min: 3, max: 10 }, k: { type: "int", min: 2, max: 4 } },
    tags: ["fractions", "denominateurs-multiples"]
  },
  {
    level: "5e",
    chapterRank: 5,
    progressionStep: "trimester2",
    domain: "fractions",
    difficulty: 2,
    title: "Soustraction à dénominateurs multiples",
    statementTemplate: "Calcule : $\\dfrac{ {{a}} }{ {{d}} }-\\dfrac{ {{b}} }{ {{d*k}} }$.",
    answerTemplate: "{{formatFraction(a*k-b,d*k)}}",
    correctionTemplate: "$\\dfrac{ {{a}} }{ {{d}} }=\\dfrac{ {{a*k}} }{ {{d*k}} }$, donc la différence vaut {{formatFraction(a*k-b,d*k)}}.",
    variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 1, max: 3 }, d: { type: "int", min: 3, max: 10 }, k: { type: "int", min: 2, max: 4 } },
    tags: ["fractions", "denominateurs-multiples"]
  },
  {
    level: "5e",
    chapterRank: 15,
    progressionStep: "end",
    domain: "proportionnalite",
    difficulty: 2,
    title: "Pourcentage simple",
    statementTemplate: "Calcule ${{p}}\\%$ de ${{n}}$.",
    answerTemplate: "{{n*p/100}}",
    correctionTemplate: "$ {{n}}\\times {{p}}\\div 100={{n*p/100}}$.",
    variablesSchema: { p: { type: "choice", values: [10, 20, 25, 50] }, n: { type: "choice", values: [40, 60, 80, 100, 120, 200] } },
    tags: ["pourcentage"]
  },
  {
    level: "5e",
    chapterRank: 18,
    progressionStep: "end",
    domain: "statistiques",
    difficulty: 2,
    title: "Moyenne de deux valeurs",
    statementTemplate: "Moyenne de ${{a}}$ et ${{b}}$ ?",
    answerTemplate: "{{(a+b)/2}}",
    correctionTemplate: "$({{a}}+{{b}})\\div 2={{(a+b)/2}}$.",
    variablesSchema: { a: { type: "choice", values: [6, 8, 10, 12, 14] }, b: { type: "choice", values: [16, 18, 20, 22, 24] } },
    tags: ["statistiques"]
  },
  {
    level: "5e",
    chapterRank: 19,
    progressionStep: "end",
    domain: "grandeurs-mesures",
    difficulty: 2,
    title: "Volume pave droit",
    statementTemplate: "Volume d'un pave : ${{a}}\\times {{b}}\\times {{c}}$.",
    answerTemplate: "{{a*b*c}}",
    correctionTemplate: "$ {{a}}\\times {{b}}\\times {{c}}={{a*b*c}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 6 }, b: { type: "int", min: 2, max: 6 }, c: { type: "int", min: 2, max: 6 } },
    tags: ["volume"]
  },
  {
    level: "4e",
    chapterRank: 1,
    progressionStep: "start",
    domain: "proportionnalite",
    difficulty: 3,
    title: "Quatrieme proportionnelle",
    statementTemplate: "Complete : $\\dfrac{ {{a}} }{ {{b}} }=\\dfrac{x}{ {{b*k}} }$.",
    answerTemplate: "{{a*k}}",
    correctionTemplate: "Le denominateur est multiplie par ${{k}}$, donc $x={{a*k}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 3, max: 12 }, k: { type: "int", min: 2, max: 5 } },
    tags: ["proportionnalite"]
  },
  {
    level: "4e",
    chapterRank: 2,
    progressionStep: "start",
    domain: "nombres-calculs",
    difficulty: 3,
    title: "Produit de relatifs",
    statementTemplate: "Calcule : $(-{{a}})\\times {{b}}$.",
    answerTemplate: "{{-a*b}}",
    correctionTemplate: "$(-{{a}})\\times {{b}}=-{{a*b}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 12 }, b: { type: "int", min: 2, max: 12 } },
    tags: ["relatifs"]
  },
  {
    level: "4e",
    chapterRank: 2,
    progressionStep: "start",
    domain: "nombres-calculs",
    difficulty: 3,
    title: "Produit et quotient de relatifs",
    statementTemplate: "Calcule : $(-{{a}})\\times{{c*q}}\\div{{c}}$.",
    answerTemplate: "{{-a*q}}",
    correctionTemplate: "$(-{{a}})\\times{{q}}={{-a*q}}$ après simplification par {{c}}.",
    variablesSchema: { a: { type: "int", min: 2, max: 12 }, c: { type: "int", min: 2, max: 8 }, q: { type: "int", min: 2, max: 9 } },
    tags: ["relatifs", "produit", "quotient"]
  },
  {
    level: "4e",
    chapterRank: 3,
    progressionStep: "trimester1",
    domain: "calcul-litteral",
    difficulty: 3,
    title: "Reduire",
    statementTemplate: "Reduis : ${{a}}x+{{b}}x$.",
    answerTemplate: "${{a+b}}x$",
    correctionTemplate: "$ {{a}}x+{{b}}x={{a+b}}x$.",
    variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 9 } },
    tags: ["litteral"]
  },
  {
    level: "4e",
    chapterRank: 3,
    progressionStep: "trimester1",
    domain: "calcul-litteral",
    difficulty: 3,
    title: "Substituer",
    statementTemplate: "Pour $x={{x}}$, calcule ${{a}}x+{{b}}$.",
    answerTemplate: "{{a*x+b}}",
    correctionTemplate: "$ {{a}}\\times {{x}}+{{b}}={{a*x+b}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: -5, max: 12 }, x: { type: "int", min: -3, max: 8 } },
    tags: ["litteral"]
  },
  {
    level: "4e",
    chapterRank: 5,
    progressionStep: "trimester1",
    domain: "puissances",
    difficulty: 3,
    title: "Carre",
    statementTemplate: "Calcule : ${{a}}^2$.",
    answerTemplate: "{{a*a}}",
    correctionTemplate: "$ {{a}}^2={{a*a}}$.",
    variablesSchema: { a: { type: "int", min: 8, max: 20 } },
    tags: ["puissances"]
  },
  {
    level: "4e",
    chapterRank: 5,
    progressionStep: "trimester1",
    domain: "puissances",
    difficulty: 3,
    title: "Puissance de 10",
    statementTemplate: "Calcule : $10^{{n}}$.",
    answerTemplate: "{{10**n}}",
    correctionTemplate: "$10^{{n}}={{10**n}}$.",
    variablesSchema: { n: { type: "int", min: 2, max: 5 } },
    tags: ["puissances"]
  },
  {
    level: "4e",
    chapterRank: 8,
    progressionStep: "trimester2",
    domain: "nombres-calculs",
    difficulty: 3,
    title: "Divisibilite par 3",
    statementTemplate: "$ {{100*a+10*b+c}}$ est-il divisible par $3$ ?",
    answerTemplate: "{{(a+b+c)%3===0 ? 'Oui' : 'Non'}}",
    correctionTemplate: "Somme des chiffres : ${{a}}+{{b}}+{{c}}={{a+b+c}}$.",
    variablesSchema: { a: { type: "int", min: 1, max: 9 }, b: { type: "int", min: 0, max: 9 }, c: { type: "int", min: 0, max: 9 } },
    tags: ["divisibilite"]
  },
  {
    level: "4e",
    chapterRank: 12,
    progressionStep: "end",
    domain: "statistiques",
    difficulty: 3,
    title: "Médiane et étendue",
    statementTemplate: "Pour la série ${{a+6*d}}; {{a+d}}; {{a}}; {{a+2*d}}$, donne la médiane et l'étendue.",
    answerTemplate: "médiane {{a+3*d/2}} ; étendue {{6*d}}",
    correctionTemplate: "On ordonne : ${{a}}; {{a+d}}; {{a+2*d}}; {{a+6*d}}$. La médiane est la moyenne des deux valeurs centrales, soit {{a+3*d/2}}, et l'étendue vaut {{a+6*d}}-{{a}}={{6*d}}.",
    variablesSchema: { a: { type: "int", min: 2, max: 12 }, d: { type: "choice", values: [2, 4, 6] } },
    tags: ["statistiques", "mediane", "etendue"]
  },
  {
    level: "4e",
    chapterRank: 15,
    progressionStep: "end",
    domain: "equations",
    difficulty: 3,
    title: "Équation dans les deux membres",
    statementTemplate: "Résous : ${{a}}x+{{b}}={{c}}x+{{(a-c)*x+b}}$.",
    answerTemplate: "$x={{x}}$",
    correctionTemplate: "$ {{a-c}}x={{(a-c)*x}}$, donc $x={{x}}$.",
    variablesSchema: { a: { type: "int", min: 6, max: 10 }, c: { type: "int", min: 2, max: 5 }, b: { type: "int", min: -8, max: 8 }, x: { type: "int", min: -6, max: 9, exclude: [0] } },
    tags: ["equations", "inconnue dans les deux membres"]
  },
  {
    level: "4e",
    chapterRank: 17,
    progressionStep: "end",
    domain: "probabilites",
    difficulty: 3,
    title: "Probabilite simple",
    statementTemplate: "$ {{r}}$ rouges, ${{b}}$ bleues. Probabilite de tirer rouge ?",
    answerTemplate: "{{formatFraction(r,r+b)}}",
    correctionTemplate: "$\\dfrac{ {{r}} }{ {{r+b}} }={{formatFraction(r,r+b)}}$.",
    variablesSchema: { r: { type: "int", min: 2, max: 8 }, b: { type: "int", min: 2, max: 8 } },
    tags: ["probabilites"]
  },
  {
    level: "3e",
    chapterRank: 1,
    progressionStep: "start",
    domain: "statistiques",
    difficulty: 3,
    title: "Frequence",
    statementTemplate: "$ {{a}}$ reussites sur ${{n}}$. Quelle frequence ?",
    answerTemplate: "{{formatFraction(a,n)}}",
    correctionTemplate: "$\\dfrac{ {{a}} }{ {{n}} }={{formatFraction(a,n)}}$.",
    variablesSchema: { n: { type: "choice", values: [20, 24, 25, 30] }, a: { type: "int", min: 5, max: 18 } },
    tags: ["statistiques"]
  },
  {
    level: "3e",
    chapterRank: 3,
    progressionStep: "start",
    domain: "nombres-calculs",
    difficulty: 3,
    title: "Calcul prioritaire",
    statementTemplate: "Calcule : ${{a}}^2-{{b}}\\times {{c}}$.",
    answerTemplate: "{{a*a-b*c}}",
    correctionTemplate: "$ {{a}}^2={{a*a}}$ et ${{b}}\\times {{c}}={{b*c}}$. Donc ${{a*a}}-{{b*c}}={{a*a-b*c}}$.",
    variablesSchema: { a: { type: "int", min: 5, max: 15 }, b: { type: "int", min: 2, max: 9 }, c: { type: "int", min: 2, max: 9 } },
    tags: ["priorites"]
  },
  {
    level: "3e",
    chapterRank: 4,
    progressionStep: "trimester1",
    domain: "nombres-calculs",
    difficulty: 3,
    title: "PGCD visible",
    statementTemplate: "PGCD de ${{a*k}}$ et ${{b*k}}$ ?",
    answerTemplate: "{{k}}",
    correctionTemplate: "$ {{a*k}}={{k}}\\times {{a}}$ et ${{b*k}}={{k}}\\times {{b}}$.",
    variablesSchema: { a: { type: "choice", values: [2, 3, 4, 5] }, b: { type: "choice", values: [7, 11, 13] }, k: { type: "int", min: 3, max: 12 } },
    tags: ["arithmetique"]
  },
  {
    level: "3e",
    chapterRank: 6,
    progressionStep: "trimester1",
    domain: "equations",
    difficulty: 3,
    title: "Equation produit",
    statementTemplate: "Resous : ${{a}}x={{a*x}}$.",
    answerTemplate: "$x={{x}}$",
    correctionTemplate: "$x={{a*x}}\\div {{a}}={{x}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 9 }, x: { type: "int", min: -5, max: 12 } },
    tags: ["equations"]
  },
  {
    level: "3e",
    chapterRank: 6,
    progressionStep: "trimester1",
    domain: "equations",
    difficulty: 3,
    title: "Equation addition",
    statementTemplate: "Resous : $x-{{a}}={{b}}$.",
    answerTemplate: "$x={{a+b}}$",
    correctionTemplate: "$x={{b}}+{{a}}={{a+b}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 20 }, b: { type: "int", min: -5, max: 30 } },
    tags: ["equations"]
  },
  {
    level: "3e",
    chapterRank: 7,
    progressionStep: "trimester2",
    domain: "calcul-litteral",
    difficulty: 4,
    title: "Double distributivite",
    statementTemplate: "Developpe : $(x+{{a}})(x+{{b}})$.",
    answerTemplate: "$x^2+{{a+b}}x+{{a*b}}$",
    correctionTemplate: "$(x+{{a}})(x+{{b}})=x^2+{{a+b}}x+{{a*b}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 9 }, b: { type: "int", min: 2, max: 9 } },
    tags: ["litteral"]
  },
  {
    level: "3e",
    chapterRank: 8,
    progressionStep: "trimester2",
    domain: "fonctions",
    difficulty: 3,
    title: "Image de fonction",
    statementTemplate: "Pour $f(x)={{a}}x+{{b}}$, calcule $f({{x}})$.",
    answerTemplate: "{{a*x+b}}",
    correctionTemplate: "$f({{x}})={{a}}\\times {{x}}+{{b}}={{a*x+b}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 8 }, b: { type: "int", min: -9, max: 12 }, x: { type: "int", min: -4, max: 8 } },
    tags: ["fonctions"]
  },
  {
    level: "3e",
    chapterRank: 9,
    progressionStep: "trimester2",
    domain: "calcul-litteral",
    difficulty: 4,
    title: "Identite remarquable",
    statementTemplate: "Developpe : $(x+{{a}})^2$.",
    answerTemplate: "$x^2+{{2*a}}x+{{a*a}}$",
    correctionTemplate: "$(x+{{a}})^2=x^2+{{2*a}}x+{{a*a}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 9 } },
    tags: ["litteral"]
  },
  {
    level: "3e",
    chapterRank: 10,
    progressionStep: "trimester2",
    domain: "trigonometrie",
    difficulty: 3,
    title: "Rapport cosinus",
    statementTemplate: "Quel rapport écrit-on pour le cosinus dans un triangle rectangle ?",
    answerTemplate: "$\\dfrac{\\text{adjacent}}{\\text{hypoténuse}}$",
    correctionTemplate: "$\\cos(\\alpha)=\\dfrac{\\text{adjacent}}{\\text{hypoténuse}}$.",
    variablesSchema: {},
    figureTemplate: { kind: "right-triangle", legALabel: "opposé", legBLabel: "adjacent", hypotenuseLabel: "hypoténuse" },
    tags: ["trigonometrie", "rapport"]
  },
  {
    level: "3e",
    chapterRank: 11,
    progressionStep: "end",
    domain: "fonctions",
    difficulty: 3,
    title: "Coefficient lineaire",
    statementTemplate: "Fonction lineaire : $f({{x}})={{a*x}}$. Quel coefficient ?",
    answerTemplate: "{{a}}",
    correctionTemplate: "$ {{a*x}}\\div {{x}}={{a}}$.",
    variablesSchema: { a: { type: "int", min: 2, max: 9 }, x: { type: "int", min: 2, max: 12 } },
    tags: ["fonctions"]
  },
  {
    level: "3e",
    chapterRank: 13,
    progressionStep: "end",
    domain: "probabilites",
    difficulty: 3,
    title: "Probabilite contraire",
    statementTemplate: "Si $P(A)=\\dfrac{ {{a}} }{ {{d}} }$, calcule $P(\\overline A)$.",
    answerTemplate: "{{formatFraction(d-a,d)}}",
    correctionTemplate: "$P(\\overline A)=\\dfrac{ {{d-a}} }{ {{d}} }={{formatFraction(d-a,d)}}$.",
    variablesSchema: { a: { type: "int", min: 1, max: 5 }, d: { type: "choice", values: [6, 8, 10, 12] } },
    tags: ["probabilites"]
  }
];

export const mentalCalculAutomatismes: Automatisme[] = seeds.map((seed, index) => mental(seed, index + 1));
