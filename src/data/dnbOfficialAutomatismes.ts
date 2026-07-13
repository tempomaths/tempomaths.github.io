import type { Automatisme, MathDomain } from "../types";

export const DNB_OFFICIAL_TAG = "dnb-officiel";

const sources = {
  sujet0: "Eduscol, sujet zero DNB mathematiques serie generale",
  ameriqueNord2026: "DNB 2026 mathematiques serie generale, Amerique du Nord",
  antillesGuyane2026: "DNB 2026 mathematiques serie generale, Antilles-Guyane",
  asie2026: "DNB 2026 mathematiques serie generale, centres en Asie",
  centresGroupe12026: "DNB 2026 mathematiques serie generale, centres etrangers groupe 1"
} as const;

type DnbSeed = {
  id: string;
  title: string;
  domain: MathDomain;
  subdomain: string;
  difficulty: Automatisme["difficulty"];
  statementTemplate: string;
  correctionTemplate: string;
  answerTemplate: string;
  sourceNote: string;
  tags: string[];
  figureTemplate?: Automatisme["figureTemplate"];
};

function dnb(seed: DnbSeed): Automatisme {
  return {
    ...seed,
    id: `dnb-officiel:${seed.id}`,
    levels: ["3e"],
    progressionStep: "end",
    chapterId: "3e-chap-20",
    chapterRank: 20,
    chapterTitle: "DNB officiel",
    variablesSchema: {},
    defaultDurationSeconds: seed.difficulty >= 4 ? 60 : 45,
    tags: [DNB_OFFICIAL_TAG, "dnb", "brevet", "automatismes", ...seed.tags],
    status: "official"
  };
}

export const dnbOfficialAutomatismes: Automatisme[] = [
  dnb({
    id: "sujet0-tiers-18",
    title: "Tiers de 18",
    domain: "fractions",
    subdomain: "Fractions",
    difficulty: 1,
    statementTemplate: "Calcule : le tiers de $18$.",
    answerTemplate: "$6$",
    correctionTemplate: "$18 \\div 3 = 6$.",
    sourceNote: sources.sujet0,
    tags: ["sujet-zero", "calcul-mental"]
  }),
  dnb({
    id: "sujet0-240-min-heures",
    title: "Minutes en heures",
    domain: "grandeurs-mesures",
    subdomain: "Durées",
    difficulty: 1,
    statementTemplate: "Convertis : $240$ min en heures.",
    answerTemplate: "$4$ h",
    correctionTemplate: "$240 \\div 60 = 4$, donc $240$ min = $4$ h.",
    sourceNote: sources.sujet0,
    tags: ["sujet-zero", "conversion"]
  }),
  dnb({
    id: "sujet0-mediane-notes",
    title: "Médiane de cinq notes",
    domain: "statistiques",
    subdomain: "Médiane",
    difficulty: 2,
    statementTemplate: "Donne la médiane : $8 ; 12 ; 6 ; 19 ; 15$.",
    answerTemplate: "$12$",
    correctionTemplate: "Ordre croissant : $6 ; 8 ; 12 ; 15 ; 19$. La valeur centrale est $12$.",
    sourceNote: sources.sujet0,
    tags: ["sujet-zero", "statistiques"]
  }),
  dnb({
    id: "sujet0-angle-triangle-rectangle",
    title: "Angles complémentaires",
    domain: "trigonometrie",
    subdomain: "Triangle rectangle",
    difficulty: 2,
    statementTemplate: "ABC est rectangle en B et $\\widehat{A}=35^\\circ$. Calcule $\\widehat{C}$.",
    answerTemplate: "$55^\\circ$",
    correctionTemplate: "Dans un triangle rectangle, les deux angles aigus sont complémentaires : $90^\\circ - 35^\\circ = 55^\\circ$.",
    sourceNote: sources.sujet0,
    tags: ["sujet-zero", "angles"],
    figureTemplate: { kind: "right-triangle", legALabel: "", legBLabel: "", hypotenuseLabel: "", vertexLabels: ["B", "C", "A"], angleLabel: "35°" }
  }),
  dnb({
    id: "sujet0-olympiade-pourcentage",
    title: "Pourcentage d'élèves",
    domain: "proportionnalite",
    subdomain: "Pourcentages",
    difficulty: 2,
    statementTemplate: "$25\\%$ des $300$ élèves participent. Combien ne participent pas ?",
    answerTemplate: "$225$",
    correctionTemplate: "$25\\%$ de $300$ vaut $75$. Donc $300 - 75 = 225$ élèves ne participent pas.",
    sourceNote: sources.sujet0,
    tags: ["sujet-zero", "pourcentages"]
  }),
  dnb({
    id: "sujet0-scratch-carre",
    title: "Scratch carré",
    domain: "algorithmique",
    subdomain: "Scratch",
    difficulty: 2,
    statementTemplate: "Complète le bloc Scratch pour tracer un carré.",
    answerTemplate: "$4$ répétitions et $90^\\circ$",
    correctionTemplate: "Un carré a $4$ côtés. À chaque sommet, le lutin tourne de $90^\\circ$.",
    sourceNote: sources.sujet0,
    tags: ["sujet-zero", "scratch"],
    figureTemplate: {
      kind: "scratch",
      blocks: ["quand drapeau vert cliqué", "répéter ? fois", "avancer de 50", "tourner de ? degrés"]
    }
  }),
  dnb({
    id: "an2026-fraction-somme",
    title: "Somme de fractions",
    domain: "fractions",
    subdomain: "Addition",
    difficulty: 3,
    statementTemplate: "Calcule : $\\dfrac{2}{3}+\\dfrac{3}{4}$.",
    answerTemplate: "$\\dfrac{17}{12}$",
    correctionTemplate: "$\\dfrac{2}{3}=\\dfrac{8}{12}$ et $\\dfrac{3}{4}=\\dfrac{9}{12}$. Donc $\\dfrac{8}{12}+\\dfrac{9}{12}=\\dfrac{17}{12}$.",
    sourceNote: sources.ameriqueNord2026,
    tags: ["2026", "amerique-nord", "fractions"]
  }),
  dnb({
    id: "an2026-reduction-45",
    title: "Réduction de 10 %",
    domain: "proportionnalite",
    subdomain: "Pourcentages",
    difficulty: 2,
    statementTemplate: "Un article coûte $45$ €. Calcule le prix après $10\\%$ de réduction.",
    answerTemplate: "$40{,}50$ €",
    correctionTemplate: "$10\\%$ de $45$ vaut $4{,}50$. Donc $45 - 4{,}50 = 40{,}50$.",
    sourceNote: sources.ameriqueNord2026,
    tags: ["2026", "amerique-nord", "pourcentages"]
  }),
  dnb({
    id: "an2026-equation",
    title: "Équation linéaire",
    domain: "equations",
    subdomain: "Équations",
    difficulty: 2,
    statementTemplate: "Résous : $5x - 15 = 20$.",
    answerTemplate: "$x=7$",
    correctionTemplate: "$5x - 15 = 20$ donc $5x = 35$. Ainsi $x = 7$.",
    sourceNote: sources.ameriqueNord2026,
    tags: ["2026", "amerique-nord", "equations"]
  }),
  dnb({
    id: "an2026-mediane",
    title: "Médiane de neuf valeurs",
    domain: "statistiques",
    subdomain: "Médiane",
    difficulty: 2,
    statementTemplate: "Donne la médiane : $8 ; 19 ; 12 ; 3 ; 12 ; 25 ; 3 ; 11 ; 1$.",
    answerTemplate: "$11$",
    correctionTemplate: "Ordre croissant : $1 ; 3 ; 3 ; 8 ; 11 ; 12 ; 12 ; 19 ; 25$. La 5e valeur est $11$.",
    sourceNote: sources.ameriqueNord2026,
    tags: ["2026", "amerique-nord", "statistiques"]
  }),
  dnb({
    id: "an2026-trigonometrie",
    title: "Cosinus dans un triangle rectangle",
    domain: "trigonometrie",
    subdomain: "Cosinus",
    difficulty: 3,
    statementTemplate: "ABC est rectangle en A, $BC=5$ cm et $\\widehat{ABC}=60^\\circ$. Quel calcul donne $AB$ ?",
    answerTemplate: "$5\\times\\cos(60^\\circ)$",
    correctionTemplate: "Le côté $AB$ est adjacent à l'angle de $60^\\circ$ et $BC$ est l'hypoténuse. Donc $AB = 5\\times\\cos(60^\\circ)$.",
    sourceNote: sources.ameriqueNord2026,
    tags: ["2026", "amerique-nord", "trigonometrie"],
    figureTemplate: { kind: "right-triangle", legALabel: "", legBLabel: "", hypotenuseLabel: "5 cm", vertexLabels: ["A", "C", "B"], angleLabel: "60°" }
  }),
  dnb({
    id: "an2026-diviseur-387",
    title: "Diviseur de 387",
    domain: "nombres-calculs",
    subdomain: "Divisibilité",
    difficulty: 3,
    statementTemplate: "Donne un diviseur de $387$, autre que $1$ et $387$.",
    answerTemplate: "$3$",
    correctionTemplate: "$3+8+7=18$, donc $387$ est divisible par $3$. Un diviseur possible est $3$.",
    sourceNote: sources.ameriqueNord2026,
    tags: ["2026", "amerique-nord", "divisibilite"]
  }),
  dnb({
    id: "an2026-fonction-image",
    title: "Image par une fonction",
    domain: "fonctions",
    subdomain: "Images",
    difficulty: 3,
    statementTemplate: "Calcule : $f(-4)$ pour $f(x)=(x-1)(x+3)$.",
    answerTemplate: "$5$",
    correctionTemplate: "$f(-4)=(-4-1)(-4+3)=(-5)\\times(-1)=5$.",
    sourceNote: sources.ameriqueNord2026,
    tags: ["2026", "amerique-nord", "fonctions"]
  }),
  dnb({
    id: "ag2026-frequence-pile",
    title: "Fréquence",
    domain: "probabilites",
    subdomain: "Fréquence",
    difficulty: 2,
    statementTemplate: "Sur $10$ lancers, pile apparaît $4$ fois. Donne sa fréquence.",
    answerTemplate: "$\\dfrac{4}{10}$",
    correctionTemplate: "La fréquence est $\\dfrac{\\text{effectif}}{\\text{total}}=\\dfrac{4}{10}$.",
    sourceNote: sources.antillesGuyane2026,
    tags: ["2026", "antilles-guyane", "probabilites"]
  }),
  dnb({
    id: "ag2026-moitie-n",
    title: "Moitié de n",
    domain: "calcul-litteral",
    subdomain: "Expressions",
    difficulty: 1,
    statementTemplate: "Écris la moitié de $n$.",
    answerTemplate: "$\\dfrac{n}{2}$",
    correctionTemplate: "Prendre la moitié revient à diviser par $2$ : $\\dfrac{n}{2}$.",
    sourceNote: sources.antillesGuyane2026,
    tags: ["2026", "antilles-guyane", "calcul-litteral"]
  }),
  dnb({
    id: "ag2026-dixieme-heure",
    title: "Dixième d'heure",
    domain: "grandeurs-mesures",
    subdomain: "Durées",
    difficulty: 2,
    statementTemplate: "Convertis : $\\dfrac{1}{10}$ d'heure en minutes.",
    answerTemplate: "$6$ min",
    correctionTemplate: "$1$ h = $60$ min, donc $\\dfrac{1}{10}$ h = $60 \\div 10 = 6$ min.",
    sourceNote: sources.antillesGuyane2026,
    tags: ["2026", "antilles-guyane", "conversion"]
  }),
  dnb({
    id: "ag2026-moyenne",
    title: "Moyenne de quatre valeurs",
    domain: "statistiques",
    subdomain: "Moyenne",
    difficulty: 2,
    statementTemplate: "Calcule la moyenne : $10 ; 10 ; 12 ; 16$.",
    answerTemplate: "$12$",
    correctionTemplate: "$\\dfrac{10+10+12+16}{4}=\\dfrac{48}{4}=12$.",
    sourceNote: sources.antillesGuyane2026,
    tags: ["2026", "antilles-guyane", "statistiques"]
  }),
  dnb({
    id: "ag2026-vitesse-velo",
    title: "Durée d'un trajet",
    domain: "grandeurs-mesures",
    subdomain: "Vitesse",
    difficulty: 3,
    statementTemplate: "À $20$ km/h, combien de temps faut-il pour parcourir $15$ km ?",
    answerTemplate: "$45$ min",
    correctionTemplate: "$t=\\dfrac{15}{20}$ h = $0{,}75$ h = $45$ min.",
    sourceNote: sources.antillesGuyane2026,
    tags: ["2026", "antilles-guyane", "vitesse"]
  }),
  dnb({
    id: "ag2026-programme-8x-10",
    title: "Programme de calcul",
    domain: "calcul-litteral",
    subdomain: "Expression",
    difficulty: 3,
    statementTemplate: "Résous : $8x-10=0$.",
    answerTemplate: "$x=1{,}25$",
    correctionTemplate: "$8x=10$, donc $x=\\dfrac{10}{8}=1{,}25$.",
    sourceNote: sources.antillesGuyane2026,
    tags: ["2026", "antilles-guyane", "programme-calcul"]
  }),
  dnb({
    id: "asie2026-notation-scientifique",
    title: "Notation scientifique",
    domain: "puissances",
    subdomain: "Notation scientifique",
    difficulty: 2,
    statementTemplate: "Écris $45\\,310$ en notation scientifique.",
    answerTemplate: "$4{,}531\\times10^4$",
    correctionTemplate: "$45\\,310 = 4{,}531\\times10^4$.",
    sourceNote: sources.asie2026,
    tags: ["2026", "asie", "puissances"]
  }),
  dnb({
    id: "asie2026-identite-remarquable",
    title: "Identité remarquable",
    domain: "calcul-litteral",
    subdomain: "Développement",
    difficulty: 3,
    statementTemplate: "Développe : $(4x-3)(4x+3)$.",
    answerTemplate: "$16x^2-9$",
    correctionTemplate: "$(4x-3)(4x+3)=(4x)^2-3^2=16x^2-9$.",
    sourceNote: sources.asie2026,
    tags: ["2026", "asie", "calcul-litteral", "puissances"]
  }),
  dnb({
    id: "asie2026-volume-pave",
    title: "Volume d'un pavé",
    domain: "grandeurs-mesures",
    subdomain: "Volumes",
    difficulty: 2,
    statementTemplate: "Calcule le volume d'un pavé $4{,}5$ cm × $4$ cm × $10$ cm.",
    answerTemplate: "$180\\ \\text{cm}^3$",
    correctionTemplate: "$V=4{,}5\\times4\\times10=180\\ \\text{cm}^3$.",
    sourceNote: sources.asie2026,
    tags: ["2026", "asie", "volumes"],
    figureTemplate: { kind: "solid", solid: "pave", labels: ["4,5 cm", "4 cm", "10 cm"] }
  }),
  dnb({
    id: "asie2026-divisibilite-9",
    title: "Divisibilité par 9",
    domain: "nombres-calculs",
    subdomain: "Divisibilité",
    difficulty: 2,
    statementTemplate: "Parmi $2025$ et $2026$, lequel est divisible par $9$ ?",
    answerTemplate: "$2025$ seulement",
    correctionTemplate: "$2+0+2+5=9$, donc $2025$ est divisible par $9$. $2+0+2+6=10$, donc $2026$ ne l'est pas.",
    sourceNote: sources.asie2026,
    tags: ["2026", "asie", "divisibilite"]
  }),
  dnb({
    id: "asie2026-vitesse-course",
    title: "Vitesse moyenne",
    domain: "grandeurs-mesures",
    subdomain: "Vitesse",
    difficulty: 3,
    statementTemplate: "Une personne court $9$ km en $45$ min. Calcule sa vitesse en km/h.",
    answerTemplate: "$12$ km/h",
    correctionTemplate: "$45$ min = $0{,}75$ h. Donc $v=\\dfrac{9}{0{,}75}=12$ km/h.",
    sourceNote: sources.asie2026,
    tags: ["2026", "asie", "vitesse"]
  }),
  dnb({
    id: "asie2026-reduction-60",
    title: "Prix après baisse",
    domain: "proportionnalite",
    subdomain: "Pourcentages",
    difficulty: 2,
    statementTemplate: "Un article coûte $60$ €. Calcule le prix après une baisse de $10\\%$.",
    answerTemplate: "$54$ €",
    correctionTemplate: "$10\\%$ de $60$ vaut $6$. Donc $60-6=54$.",
    sourceNote: sources.asie2026,
    tags: ["2026", "asie", "pourcentages"]
  }),
  dnb({
    id: "asie2026-offre-smartphone",
    title: "Comparer deux offres",
    domain: "fonctions",
    subdomain: "Fonctions affines",
    difficulty: 3,
    statementTemplate: "Compare sur $24$ mois : offre A $175+16x$, offre B $23x$.",
    answerTemplate: "Offre B",
    correctionTemplate: "Offre A : $175+16\\times24=559$. Offre B : $23\\times24=552$. L'offre B est moins chère.",
    sourceNote: sources.asie2026,
    tags: ["2026", "asie", "fonctions"]
  }),
  dnb({
    id: "g1-2026-mediane-temperatures",
    title: "Médiane de températures",
    domain: "statistiques",
    subdomain: "Médiane",
    difficulty: 2,
    statementTemplate: "Donne la médiane : $0 ; -1 ; 3 ; 7 ; 1$.",
    answerTemplate: "$1$",
    correctionTemplate: "Ordre croissant : $-1 ; 0 ; 1 ; 3 ; 7$. La valeur centrale est $1$.",
    sourceNote: sources.centresGroupe12026,
    tags: ["2026", "centres-etrangers-g1", "statistiques"]
  }),
  dnb({
    id: "g1-2026-proba-boules",
    title: "Probabilité simple",
    domain: "probabilites",
    subdomain: "Probabilités",
    difficulty: 2,
    statementTemplate: "Une urne contient $3$ boules rouges et $5$ vertes. Probabilité de tirer rouge ?",
    answerTemplate: "$\\dfrac{3}{8}$",
    correctionTemplate: "Il y a $8$ boules au total, dont $3$ rouges. La probabilité vaut $\\dfrac{3}{8}$.",
    sourceNote: sources.centresGroupe12026,
    tags: ["2026", "centres-etrangers-g1", "probabilites"]
  }),
  dnb({
    id: "g1-2026-scientifique-mars",
    title: "Grande distance",
    domain: "puissances",
    subdomain: "Notation scientifique",
    difficulty: 2,
    statementTemplate: "Écris $311\\,200\\,000$ en notation scientifique.",
    answerTemplate: "$3{,}112\\times10^8$",
    correctionTemplate: "$311\\,200\\,000 = 3{,}112\\times10^8$.",
    sourceNote: sources.centresGroupe12026,
    tags: ["2026", "centres-etrangers-g1", "puissances"]
  }),
  dnb({
    id: "g1-2026-distance-velo",
    title: "Distance avec vitesse",
    domain: "grandeurs-mesures",
    subdomain: "Vitesse",
    difficulty: 2,
    statementTemplate: "À $40$ km/h pendant $2$ h $30$ min, quelle distance parcourt-on ?",
    answerTemplate: "$100$ km",
    correctionTemplate: "$2$ h $30$ min = $2{,}5$ h. Donc $d=40\\times2{,}5=100$ km.",
    sourceNote: sources.centresGroupe12026,
    tags: ["2026", "centres-etrangers-g1", "vitesse"]
  }),
  dnb({
    id: "g1-2026-factorisation",
    title: "Factorisation simple",
    domain: "calcul-litteral",
    subdomain: "Factorisation",
    difficulty: 2,
    statementTemplate: "Factorise : $5x+5$.",
    answerTemplate: "$5(x+1)$",
    correctionTemplate: "$5x+5 = 5\\times x + 5\\times1 = 5(x+1)$.",
    sourceNote: sources.centresGroupe12026,
    tags: ["2026", "centres-etrangers-g1", "calcul-litteral"]
  }),
  dnb({
    id: "g1-2026-reduction-80",
    title: "Calcul de réduction",
    domain: "proportionnalite",
    subdomain: "Pourcentages",
    difficulty: 2,
    statementTemplate: "Un article coûte $80$ €. Calcule le prix après une baisse de $10\\%$.",
    answerTemplate: "$72$ €",
    correctionTemplate: "$10\\%$ de $80$ vaut $8$. Donc $80-8=72$.",
    sourceNote: sources.centresGroupe12026,
    tags: ["2026", "centres-etrangers-g1", "pourcentages"]
  }),
  dnb({
    id: "g1-2026-programme-carre",
    title: "Programme de calcul carré",
    domain: "calcul-litteral",
    subdomain: "Programme de calcul",
    difficulty: 3,
    statementTemplate: "Calcule : $10^2-9$.",
    answerTemplate: "$91$",
    correctionTemplate: "$10^2-9=100-9=91$.",
    sourceNote: sources.centresGroupe12026,
    tags: ["2026", "centres-etrangers-g1", "programme-calcul", "puissances"]
  })
];
