import type { Automatisme, ChapterInfo, FigureTemplate, VariableSchema } from "../types";

export type ChapterCompletionTemplate = {
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

type ShortTemplate = Omit<ChapterCompletionTemplate, "subdomain">;

const int = (min: number, max: number, exclude?: number[]) => ({ type: "int", min, max, ...(exclude ? { exclude } : {}) } as const);
const decimal = (min: number, max: number, decimals: number) => ({ type: "decimal", min, max, decimals } as const);
const choice = (values: Array<string | number>) => ({ type: "choice", values } as const);

function withChapter(chapter: ChapterInfo, templates: ShortTemplate[]): ChapterCompletionTemplate[] {
  return templates.map((template) => ({ ...template, subdomain: chapter.title }));
}

function q(
  title: string,
  statementTemplate: string,
  answerTemplate: string,
  correctionTemplate: string,
  variablesSchema: VariableSchema = {},
  tags: string[] = [],
  figureTemplate?: FigureTemplate,
  difficulty?: Automatisme["difficulty"]
): ShortTemplate {
  return { title, statementTemplate, answerTemplate, correctionTemplate, variablesSchema, tags, figureTemplate, difficulty };
}

const thalesTriangleFigure: FigureTemplate = {
  kind: "thales",
  smallLeftLabel: "AM",
  bigLeftLabel: "AB",
  smallRightLabel: "AN",
  bigRightLabel: "AC",
  parallelLabel: "(MN) \\parallel (BC)",
  configuration: "triangle"
};

const thalesReciprocalFigure: FigureTemplate = {
  ...thalesTriangleFigure,
  parallelLabel: "(MN) \\parallel (BC)"
};

const thalesButterflyFigure: FigureTemplate = {
  kind: "thales",
  smallLeftLabel: "OA",
  bigLeftLabel: "OC",
  smallRightLabel: "OB",
  bigRightLabel: "OD",
  parallelLabel: "(AB) \\parallel (CD)",
  configuration: "papillon"
};

const thalesButterflyReciprocalFigure: FigureTemplate = {
  ...thalesButterflyFigure,
  parallelLabel: "(AB) \\parallel (CD)"
};

function directThalesCompletions(chapter: ChapterInfo, includeButterfly: boolean): ChapterCompletionTemplate[] {
  const templates: ShortTemplate[] = [
    q("Calculer AN avec Thalès", "Dans le triangle ABC, $M\\in[AB]$, $N\\in[AC]$ et $(MN)\\parallel(BC)$. On donne $AM={{a}}$ cm, $AB={{a*k}}$ cm et $AC={{c*k}}$ cm. Calcule AN.", "{{c}} cm", "$AN=AC\\times AM\\div AB={{c*k}}\\times{{a}}\\div{{a*k}}={{c}}$ cm.", { a: int(2, 7), c: int(3, 10), k: int(2, 4) }, ["thales", "rapports", "thales-direct", "calcul-longueur"], thalesTriangleFigure),
    q("Calculer MN avec Thalès", "Dans la même configuration, $AM={{a}}$ cm, $AB={{a*k}}$ cm et $BC={{c*k}}$ cm. Calcule MN.", "{{c}} cm", "$MN=BC\\times AM\\div AB={{c*k}}\\times{{a}}\\div{{a*k}}={{c}}$ cm.", { a: int(2, 7), c: int(3, 10), k: int(2, 4) }, ["thales", "rapports", "thales-direct", "calcul-longueur"], thalesTriangleFigure),
    q("Calculer AB avec Thalès", "On sait que $(MN)\\parallel(BC)$, $AM={{a}}$ cm, $AN={{c}}$ cm et $AC={{c*k}}$ cm. Calcule AB.", "{{a*k}} cm", "$AB=AM\\times AC\\div AN={{a}}\\times{{c*k}}\\div{{c}}={{a*k}}$ cm.", { a: int(2, 8), c: int(2, 9), k: int(2, 4) }, ["thales", "rapports", "thales-direct", "calcul-longueur"], thalesTriangleFigure),
    q("Calculer AC avec Thalès", "On sait que $(MN)\\parallel(BC)$, $AM={{a}}$ cm, $AB={{a*k}}$ cm et $AN={{c}}$ cm. Calcule AC.", "{{c*k}} cm", "$AC=AN\\times AB\\div AM={{c}}\\times{{a*k}}\\div{{a}}={{c*k}}$ cm.", { a: int(2, 8), c: int(2, 9), k: int(2, 4) }, ["thales", "rapports", "thales-direct", "calcul-longueur"], thalesTriangleFigure),
    q("Coefficient petit sur grand", "Si $AM={{a}}$ cm et $AB={{a*k}}$ cm, quel est le rapport petit triangle sur grand triangle ?", "$\\dfrac{1}{ {{k}} }$", "$\\dfrac{AM}{AB}=\\dfrac{ {{a}} }{ {{a*k}} }=\\dfrac{1}{ {{k}} }$.", { a: int(2, 9), k: int(2, 5) }, ["thales", "rapports", "thales-direct", "coefficient"], thalesTriangleFigure),
    q("Côtés homologues", "Dans les triangles AMN et ABC, quel côté du grand triangle correspond à MN ?", "$BC$", "Les correspondances sont $AM\\leftrightarrow AB$, $AN\\leftrightarrow AC$ et $MN\\leftrightarrow BC$.", {}, ["thales", "rapports", "thales-direct", "correspondance"], thalesTriangleFigure)
  ];

  if (includeButterfly) {
    templates.push(
      q("Papillon : calculer OB", "Dans une configuration papillon, $(AB)\\parallel(CD)$. On donne $OA={{a}}$ cm, $OC={{a*k}}$ cm et $OD={{d*k}}$ cm. Calcule OB.", "{{d}} cm", "$OB=OD\\times OA\\div OC={{d*k}}\\times{{a}}\\div{{a*k}}={{d}}$ cm.", { a: int(2, 7), d: int(2, 9), k: int(2, 4) }, ["thales", "rapports", "thales-direct", "calcul-longueur", "papillon"], thalesButterflyFigure),
      q("Papillon : calculer AB", "Dans une configuration papillon, $(AB)\\parallel(CD)$. On donne $OA={{a}}$ cm, $OC={{a*k}}$ cm et $CD={{s*k}}$ cm. Calcule AB.", "{{s}} cm", "$AB=CD\\times OA\\div OC={{s*k}}\\times{{a}}\\div{{a*k}}={{s}}$ cm.", { a: int(2, 7), s: int(2, 9), k: int(2, 4) }, ["thales", "rapports", "thales-direct", "calcul-longueur", "papillon"], thalesButterflyFigure)
    );
  }

  return withChapter(chapter, templates);
}

function reciprocalThalesCompletions(chapter: ChapterInfo, includeButterfly: boolean): ChapterCompletionTemplate[] {
  const templates: ShortTemplate[] = [
    q("Prouver deux droites parallèles", "Les points A, M, B sont alignés, ainsi que A, N, C. On donne $AM={{a}}$, $AB={{a*k}}$, $AN={{b}}$ et $AC={{b*k}}$. Les droites $(MN)$ et $(BC)$ sont-elles parallèles ?", "Oui", "$\\dfrac{AM}{AB}=\\dfrac{1}{ {{k}} }$ et $\\dfrac{AN}{AC}=\\dfrac{1}{ {{k}} }$ : d'après la réciproque de Thalès, $(MN)\\parallel(BC)$.", { a: int(2, 8), b: int(2, 9), k: int(2, 5) }, ["thales", "reciproque", "thales-reciprocal", "rapports"], thalesReciprocalFigure),
    q("Prouver que les droites ne sont pas parallèles", "Les points sont alignés dans le même ordre. On donne $AM={{a}}$, $AB={{a*k}}$, $AN={{b}}$ et $AC={{b*k+1}}$. Les droites $(MN)$ et $(BC)$ sont-elles parallèles ?", "Non", "$\\dfrac{AM}{AB}=\\dfrac{1}{ {{k}} }$ mais $\\dfrac{AN}{AC}=\\dfrac{ {{b}} }{ {{b*k+1}} }$ : les rapports sont différents.", { a: int(2, 8), b: int(2, 9), k: int(2, 5) }, ["thales", "contraposee", "thales-reciprocal", "rapports"], thalesReciprocalFigure),
    q("Longueur pour obtenir le parallélisme", "On a $AM={{a}}$, $AB={{a*k}}$ et $AN={{b}}$. Quelle valeur doit avoir AC pour que $(MN)\\parallel(BC)$ ?", "{{b*k}}", "Il faut $\\dfrac{AM}{AB}=\\dfrac{AN}{AC}=\\dfrac{1}{ {{k}} }$, donc $AC={{b*k}}$.", { a: int(2, 8), b: int(2, 9), k: int(2, 5) }, ["thales", "reciproque", "thales-reciprocal", "valeur manquante"], thalesReciprocalFigure),
    q("Longueur intérieure pour le parallélisme", "On a $AM={{a}}$, $AB={{a*k}}$ et $AC={{b*k}}$. Quelle valeur doit avoir AN pour que $(MN)\\parallel(BC)$ ?", "{{b}}", "Le rapport attendu vaut $1/{{k}}$, donc $AN={{b*k}}\\div{{k}}={{b}}$.", { a: int(2, 8), b: int(2, 9), k: int(2, 5) }, ["thales", "reciproque", "thales-reciprocal", "valeur manquante"], thalesReciprocalFigure),
    q("Comparer deux rapports égaux", "Compare $\\dfrac{2{,}5}{5}$ et $\\dfrac{3{,}5}{7}$. Ces rapports permettent-ils de conclure au parallélisme si les points sont correctement alignés ?", "Oui", "Les deux rapports valent $0{,}5$ ; la réciproque de Thalès s'applique.", {}, ["thales", "reciproque", "thales-reciprocal", "rapports décimaux"], thalesReciprocalFigure),
    q("Comparer deux rapports différents", "Compare $\\dfrac25$ et $\\dfrac38$. Peut-on conclure que les droites sont parallèles ?", "Non", "$\\dfrac25=0{,}4$ tandis que $\\dfrac38=0{,}375$ : les rapports sont différents.", {}, ["thales", "contraposee", "thales-reciprocal", "rapports"], thalesReciprocalFigure),
    q("Condition d'alignement", "Avant d'utiliser la réciproque de Thalès, quelle condition géométrique faut-il vérifier en plus de l'égalité des rapports ?", "l'alignement des points dans le même ordre", "On doit vérifier que A, M, B sont alignés et que A, N, C sont alignés dans le même ordre.", {}, ["thales", "reciproque", "thales-reciprocal", "alignement"], thalesReciprocalFigure),
    q("Nom du théorème utilisé", "Les rapports $\\dfrac{AM}{AB}$ et $\\dfrac{AN}{AC}$ sont égaux et les points sont alignés dans le même ordre. Quel résultat permet de conclure au parallélisme ?", "la réciproque du théorème de Thalès", "La réciproque de Thalès transforme l'égalité des rapports en une conclusion de parallélisme.", {}, ["thales", "reciproque", "thales-reciprocal", "méthode"], thalesReciprocalFigure),
    q("Contraposée de Thalès", "Les deux rapports portés par les sécantes sont différents. Que peut-on conclure sur les droites candidates ?", "elles ne sont pas parallèles", "Si les droites étaient parallèles, les rapports seraient égaux ; elles ne le sont donc pas.", {}, ["thales", "contraposee", "thales-reciprocal", "méthode"], thalesReciprocalFigure),
    q("Rapports un tiers", "On donne $AM=3$, $AB=9$, $AN=5$ et $AC=15$. Les droites $(MN)$ et $(BC)$ sont-elles parallèles, si les points sont alignés dans le même ordre ?", "Oui", "$\\dfrac39=\\dfrac13$ et $\\dfrac5{15}=\\dfrac13$ : les droites sont parallèles.", {}, ["thales", "reciproque", "thales-reciprocal", "rapports"], thalesReciprocalFigure)
  ];

  if (includeButterfly) {
    templates.push(
      q("Papillon parallèle", "Dans un papillon, O, A, C sont alignés et O, B, D sont alignés. On donne $OA={{a}}$, $OC={{a*k}}$, $OB={{b}}$ et $OD={{b*k}}$. Les droites $(AB)$ et $(CD)$ sont-elles parallèles ?", "Oui", "Les rapports $OA/OC$ et $OB/OD$ valent tous deux $1/{{k}}$ : la réciproque de Thalès s'applique.", { a: int(2, 8), b: int(2, 9), k: int(2, 5) }, ["thales", "reciproque", "thales-reciprocal", "papillon"], thalesButterflyReciprocalFigure),
      q("Papillon non parallèle", "Dans un papillon, on donne $OA={{a}}$, $OC={{a*k}}$, $OB={{b}}$ et $OD={{b*k+1}}$. Les droites $(AB)$ et $(CD)$ sont-elles parallèles ?", "Non", "$OA/OC=1/{{k}}$ mais $OB/OD={{b}}/{{b*k+1}}$ : les rapports sont différents.", { a: int(2, 8), b: int(2, 9), k: int(2, 5) }, ["thales", "contraposee", "thales-reciprocal", "papillon"], thalesButterflyReciprocalFigure),
      q("Papillon : valeur manquante", "Dans un papillon, $OA={{a}}$, $OC={{a*k}}$ et $OB={{b}}$. Quelle valeur de OD rend $(AB)$ parallèle à $(CD)$ ?", "{{b*k}}", "Il faut $OA/OC=OB/OD=1/{{k}}$, donc $OD={{b*k}}$.", { a: int(2, 8), b: int(2, 9), k: int(2, 5) }, ["thales", "reciproque", "thales-reciprocal", "papillon"], thalesButterflyReciprocalFigure)
    );
  }

  return withChapter(chapter, templates);
}

function sixthGradeCompletions(chapter: ChapterInfo): ChapterCompletionTemplate[] {
  switch (chapter.id) {
    case "6e-chap-01":
      return withChapter(chapter, [
        q("Valeur d'un chiffre", "Dans le nombre ${{n}}$, quelle est la valeur du chiffre des centaines ?", "{{Math.floor(n/100)%10*100}}", "Le chiffre des centaines est {{Math.floor(n/100)%10}} : sa valeur est {{Math.floor(n/100)%10*100}}.", { n: int(1200, 9899) }, ["numération", "chiffre"]),
        q("Décomposition d'un entier", "Décompose ${{n}}$ en milliers, centaines, dizaines et unités.", "$ {{Math.floor(n/1000)}}\\times1000+{{Math.floor(n/100)%10}}\\times100+{{Math.floor(n/10)%10}}\\times10+{{n%10}}$", "On lit chaque chiffre selon sa position dans l'écriture décimale.", { n: int(1200, 9899) }, ["numération", "décomposition"]),
        q("Comparer deux entiers", "Compare ${{a}}$ et ${{a+d}}$ avec le symbole adapté.", "$ {{a}}<{{a+d}}$", "Les deux nombres ont le même nombre de chiffres et {{a+d}} est le plus grand.", { a: int(1000, 8000), d: int(10, 900) }, ["comparaison", "entiers"]),
        q("Ranger trois entiers", "Range dans l'ordre croissant : ${{c}}$, ${{a}}$, ${{b}}$.", "$ {{a}}<{{b}}<{{c}}$", "On compare d'abord le nombre de milliers, puis les centaines.", { a: int(1000, 2999), b: int(3000, 5999), c: int(6000, 9999) }, ["rangement", "entiers"]),
        q("Abscisse sur une graduation", "Une demi-droite commence à {{start}} et chaque graduation vaut {{step}}. Quelle est l'abscisse de la {{rank}}e graduation après {{start}} ?", "{{start+rank*step}}", "$ {{start}}+{{rank}}\\times{{step}}={{start+rank*step}}$.", { start: int(0, 200), step: choice([10, 20, 50, 100]), rank: int(2, 8) }, ["demi-droite graduée", "abscisse"]),
        q("Arrondi à la centaine", "Quel est l'entier obtenu en arrondissant {{n}} à la centaine la plus proche ?", "{{Math.round(n/100)*100}}", "On regarde le chiffre des dizaines : il indique la centaine la plus proche.", { n: int(1050, 9850) }, ["entiers", "arrondi"])
      ]);

    case "6e-chap-03":
      return withChapter(chapter, [
        q("Relation de division euclidienne", "Complète : ${{d*q+r}}={{d}}\\times{{q}}+\\ldots$.", "{{r}}", "Dans une division euclidienne : dividende = diviseur × quotient + reste.", { d: choice([5, 6, 7, 8, 9]), q: int(4, 20), r: int(1, 4) }, ["division euclidienne", "reste"]),
        q("Quotient et reste", "Dans la division euclidienne de {{d*q+r}} par {{d}}, donne le quotient et le reste.", "quotient {{q}}, reste {{r}}", "$ {{d*q+r}}={{d}}\\times{{q}}+{{r}}$ avec ${{r}}<{{d}}$.", { d: choice([5, 6, 7, 8, 9]), q: int(4, 20), r: int(1, 4) }, ["division euclidienne", "quotient", "reste"]),
        q("Divisibilité par 2", "Le nombre {{n}} est-il divisible par 2 ?", "{{n%2===0 ? 'Oui' : 'Non'}}", "Un entier est divisible par 2 lorsque son chiffre des unités est pair.", { n: int(100, 999) }, ["divisibilité", "2"]),
        q("Divisibilité par 5", "Le nombre {{n}} est-il divisible par 5 ?", "{{n%5===0 ? 'Oui' : 'Non'}}", "Un entier divisible par 5 se termine par 0 ou 5.", { n: int(100, 999) }, ["divisibilité", "5"]),
        q("Facteur manquant", "Complète : ${{a}}\\times\\Box={{a*b}}$.", "{{b}}", "$ {{a*b}}\\div{{a}}={{b}}$.", { a: int(3, 12), b: int(3, 15) }, ["multiplication", "nombre manquant"]),
        q("Groupements complets", "On range {{packs*size}} objets par groupes de {{size}}. Combien de groupes complets obtient-on ?", "{{packs}} groupes", "$ {{packs*size}}\\div{{size}}={{packs}}$.", { packs: int(4, 18), size: int(3, 12) }, ["division", "groupement"]),
        q("Paquets et objets restants", "On range {{d*q+r}} objets dans des paquets de {{d}}. Combien de paquets complets peut-on faire et combien d'objets restent ?", "{{q}} paquets et {{r}} objets", "$ {{d*q+r}}={{d}}\\times{{q}}+{{r}}$.", { d: choice([5, 6, 7, 8, 9]), q: int(4, 16), r: int(1, 4) }, ["division", "groupement", "reste"]),
        q("Multiple suivant", "Quel est le plus petit multiple de {{d}} strictement supérieur à {{d*q+r}} ?", "{{d*(q+1)}}", "$ {{d*q+r}}={{d}}\\times{{q}}+{{r}}$, donc le multiple suivant est ${{d}}\\times{{q+1}}={{d*(q+1)}}$.", { d: choice([5, 6, 7, 8, 9]), q: int(4, 15), r: int(1, 4) }, ["multiple", "division"])
      ]);

    case "6e-chap-06":
      return withChapter(chapter, [
        q("Sommet dans la notation d'un angle", "Dans la notation $\\widehat{ABC}$, quelle lettre désigne le sommet de l'angle ?", "B", "Dans le nom d'un angle, la lettre du sommet se place au milieu.", {}, ["angle", "notation", "sommet"]),
        q("Nommer un angle", "Un angle a pour sommet O et pour côtés les demi-droites $[OA)$ et $[OB)$. Donne un nom possible pour cet angle.", "$\\widehat{AOB}$", "Le sommet O se place au milieu : $\\widehat{AOB}$ ou $\\widehat{BOA}$.", {}, ["angle", "notation", "demi-droite"]),
        q("Reconnaître un angle aigu", "Un angle mesure {{a}}°. Quelle est sa nature ?", "aigu", "Sa mesure est inférieure à 90°.", { a: int(15, 85) }, ["angle", "aigu", "degré"]),
        q("Reconnaître un angle obtus", "Un angle mesure {{a}}°. Quelle est sa nature ?", "obtus", "Sa mesure est comprise entre 90° et 180°.", { a: int(95, 170) }, ["angle", "obtus", "degré"]),
        q("Angle plat", "Combien de degrés mesure un angle plat ?", "180°", "Un angle plat forme une ligne droite et mesure 180°.", {}, ["angle", "degré"]),
        q("Lecture au rapporteur", "Le premier côté d'un angle passe par 0° et le second par {{a}}°. Quelle est sa mesure ?", "{{a}}°", "On lit directement la graduation {{a}}° à partir du zéro choisi.", { a: int(20, 160) }, ["angle", "rapporteur", "degré"]),
        q("Comparer deux angles", "Lequel est le plus grand : un angle de {{a}}° ou un angle de {{a+d}}° ?", "l'angle de {{a+d}}°", "On compare directement leurs mesures en degrés.", { a: int(20, 120), d: int(5, 40) }, ["angle", "comparaison", "degré"]),
        q("Angle droit", "Quelle mesure faut-il tracer au rapporteur pour construire un angle droit ?", "90°", "Un angle droit mesure exactement 90°.", {}, ["angle", "droit", "rapporteur"]),
        q("Angle plat et demi-tour", "Un demi-tour correspond à quel type d'angle et à quelle mesure ?", "un angle plat de 180°", "Un demi-tour forme deux demi-droites opposées.", {}, ["angle", "plat", "degré"]),
        q("Construire un angle", "Pour construire un angle de {{a}}°, où place-t-on le centre du rapporteur ?", "sur le sommet de l'angle", "Le centre du rapporteur doit coïncider avec le sommet.", { a: choice([30, 45, 60, 120]) }, ["angle", "rapporteur", "construction"]),
        q("Côtés d'un angle", "Quels objets géométriques forment les deux côtés d'un angle ?", "deux demi-droites de même origine", "L'origine commune est le sommet de l'angle.", {}, ["angle", "demi-droite", "sommet"])
      ]);

    case "6e-chap-04":
      return withChapter(chapter, [
        q("Réciproque de l'équidistance", "On sait que $PA=PB$. Où se situe le point P par rapport au segment $[AB]$ ?", "sur la médiatrice de $[AB]$", "Un point équidistant des extrémités d'un segment appartient à sa médiatrice.", {}, ["médiatrice", "équidistance"]),
        q("Milieu sur une médiatrice", "La médiatrice de $[AB]$ coupe $[AB]$ en I. Si $AB={{2*d}}$ cm, que vaut $AI$ ?", "{{d}} cm", "La médiatrice passe par le milieu I, donc $AI=IB=AB÷2$.", { d: int(2, 10) }, ["médiatrice", "milieu"]),
        q("Triangle équilatéral", "Un triangle a ses trois côtés de longueur {{d}} cm. Quelle est sa nature ?", "triangle équilatéral", "Un triangle dont les trois côtés sont égaux est équilatéral.", { d: int(2, 12) }, ["triangle", "équilatéral"]),
        q("Triangle isocèle", "Dans le triangle ABC, $AB=AC$ et $BC$ a une autre longueur. Quelle est sa nature ?", "triangle isocèle en A", "Deux côtés égaux issus de A définissent un triangle isocèle en A.", {}, ["triangle", "isocèle"]),
        q("Triangle constructible", "Peut-on construire un triangle de côtés {{a}} cm, {{b}} cm et {{a+b-1}} cm ?", "Oui", "$ {{a}}+{{b}}>{{a+b-1}}$ : les deux plus petites longueurs permettent de fermer le triangle.", { a: int(3, 8), b: int(4, 9) }, ["triangle", "construction"], { kind: "triangle", labelA: "{{a}} cm", labelB: "{{b}} cm", labelC: "{{a+b-1}} cm" }),
        q("Triangle non constructible", "Peut-on construire un triangle de côtés {{a}} cm, {{b}} cm et {{a+b+1}} cm ?", "Non", "$ {{a}}+{{b}}<{{a+b+1}}$ : les deux petits côtés ne peuvent pas rejoindre leurs extrémités.", { a: int(2, 7), b: int(3, 8) }, ["triangle", "construction"], { kind: "triangle", labelA: "{{a}} cm", labelB: "{{b}} cm", labelC: "{{a+b+1}} cm" }),
        q("Cercle et équidistance", "A et B appartiennent à un cercle de centre O et de rayon {{r}} cm. Compare $OA$ et $OB$.", "$OA=OB={{r}}$ cm", "Tous les rayons d'un même cercle ont la même longueur.", { r: int(2, 10) }, ["distance", "équidistance"]),
        q("Construction au compas", "Pour construire un point à {{r}} cm de A et à {{s}} cm de B, quels tracés faut-il faire ?", "deux cercles de centres A et B", "Les points cherchés sont les intersections des deux cercles de rayons {{r}} cm et {{s}} cm.", { r: int(3, 8), s: int(3, 8) }, ["triangle", "construction", "distance"])
      ]);

    case "6e-chap-11":
      return withChapter(chapter, [
        q("Reconnaître un triangle rectangle", "Un triangle possède un angle de $90^\\circ$. Quelle est sa nature ?", "triangle rectangle", "Un triangle qui possède un angle droit est un triangle rectangle.", {}, ["triangle", "angle droit"]),
        q("Reconnaître un triangle isocèle", "Dans un triangle, deux angles mesurent chacun {{a}}°. Que peut-on dire des côtés opposés à ces angles ?", "ils ont la même longueur", "Dans un triangle, des angles égaux sont opposés à des côtés de même longueur.", { a: int(35, 75) }, ["triangle", "angles", "isocèle"]),
        q("Bissectrice d'un angle", "La bissectrice partage un angle de {{2*a}}° en deux angles égaux. Quelle est la mesure de chacun ?", "{{a}}°", "$ {{2*a}}°\\div2={{a}}°$.", { a: int(15, 70) }, ["angle", "bissectrice"]),
        q("Angles impossibles dans un triangle", "Un triangle peut-il avoir des angles de {{a}}°, {{b}}° et {{180-a-b+10}}° ?", "Non", "Leur somme vaut $190°$ au lieu de $180°$.", { a: int(30, 60), b: int(40, 70) }, ["triangle", "angles", "somme"])
      ]);

    case "6e-chap-07":
      return withChapter(chapter, [
        q("Comparer des décimaux", "Compare ${{formatDecimalFrench(a)}}$ et ${{formatDecimalFrench(a+d)}}$.", "$ {{formatDecimalFrench(a)}}<{{formatDecimalFrench(a+d)}}$", "On aligne les virgules puis on compare les chiffres de même rang.", { a: decimal(1.1, 20.5, 2), d: choice([0.01, 0.1, 0.25]) }, ["décimal", "comparaison"]),
        q("Encadrement d'un décimal", "Encadre {{formatDecimalFrench(a)}} entre deux entiers consécutifs.", "$ {{Math.floor(a)}}<{{formatDecimalFrench(a)}}<{{Math.floor(a)+1}}$", "La partie entière est {{Math.floor(a)}}.", { a: decimal(1.1, 49.9, 2) }, ["décimal", "encadrement"]),
        q("Arrondi au dixième", "Arrondis {{formatDecimalFrench(a)}} au dixième.", "{{formatDecimalFrench(Math.round(a*10)/10)}}", "On observe le chiffre des centièmes pour arrondir le chiffre des dixièmes.", { a: decimal(1.11, 49.99, 2) }, ["décimal", "arrondi"]),
        q("Abscisse décimale", "Chaque graduation vaut 0,1. Quelle est l'abscisse de la {{n}}e graduation après 2 ?", "{{formatDecimalFrench(2+n/10)}}", "$2+{{n}}\\times0{,}1={{formatDecimalFrench(2+n/10)}}$.", { n: int(1, 9) }, ["décimal", "droite graduée", "abscisse"]),
        q("Décomposition décimale", "Décompose {{formatDecimalFrench(u+d/10+c/100)}} en unités, dixièmes et centièmes.", "{{u}} + {{d}}/10 + {{c}}/100", "On lit chaque chiffre selon sa position.", { u: int(1, 20), d: int(1, 9), c: int(1, 9) }, ["décimal", "décomposition", "dixième", "centième"])
      ]);

    case "legacy-6e-chap-10-problems":
      return withChapter(chapter, [
        q("Total d'une collection", "Une bibliothèque possède {{a}} romans et reçoit {{b}} nouveaux romans. Combien en possède-t-elle maintenant ?", "{{a+b}} romans", "$ {{a}}+{{b}}={{a+b}}$.", { a: int(120, 850), b: int(20, 180) }, ["problème", "addition"]),
        q("Reste après une dépense", "Lina dispose de {{a}} € et dépense {{b}} €. Combien lui reste-t-il ?", "{{a-b}} €", "$ {{a}}-{{b}}={{a-b}}$.", { a: int(60, 200), b: int(10, 50) }, ["problème", "soustraction"]),
        q("Écart entre deux valeurs", "Une ville compte {{a+b}} habitants et une autre {{a}}. Quel est l'écart entre les deux populations ?", "{{b}} habitants", "$ {{a+b}}-{{a}}={{b}}$.", { a: int(500, 5000), b: int(50, 900) }, ["problème", "comparaison", "soustraction"]),
        q("Quantité initiale", "Après avoir ajouté {{b}} billes, Hugo en possède {{total}}. Combien en avait-il au départ ?", "{{total-b}} billes", "$ {{total}}-{{b}}={{total-b}}$.", { total: int(80, 250), b: int(10, 60) }, ["problème", "complément"]),
        q("Durée en minutes", "Un film commence à {{h}} h {{m}} et dure {{d}} minutes, sans changer d'heure. À quelle minute se termine-t-il ?", "{{h}} h {{m+d}}", "$ {{m}}+{{d}}={{m+d}}$ minutes après {{h}} h.", { h: int(8, 20), m: int(0, 25), d: int(10, 30) }, ["problème", "durée", "addition"]),
        q("Distance restante", "Une randonnée mesure {{total}} km. Après {{done}} km, quelle distance reste-t-il ?", "{{total-done}} km", "$ {{total}}-{{done}}={{total-done}}$.", { total: int(20, 60), done: int(5, 18) }, ["problème", "distance", "soustraction"]),
        q("Deux achats", "On achète un livre à {{a}} € et un jeu à {{b}} €. Quel est le prix total ?", "{{a+b}} €", "$ {{a}}+{{b}}={{a+b}}$.", { a: int(8, 30), b: int(12, 50) }, ["problème", "prix", "addition"]),
        q("Problème en deux étapes", "Un car transporte {{a}} personnes. {{out}} descendent puis {{inside}} montent. Combien de personnes sont dans le car ?", "{{a-out+inside}} personnes", "$ {{a}}-{{out}}+{{inside}}={{a-out+inside}}$.", { a: int(30, 70), out: int(5, 20), inside: int(3, 18) }, ["problème", "addition", "soustraction"])
      ]);

    case "6e-chap-09":
      return withChapter(chapter, [
        q("Produit décimal", "Calcule ${{formatDecimalFrench(a)}}\\times{{b}}$.", "{{formatDecimalFrench(a*b)}}", "$ {{formatDecimalFrench(a)}}\\times{{b}}={{formatDecimalFrench(a*b)}}$.", { a: decimal(1.2, 19.8, 1), b: int(2, 9) }, ["décimal", "multiplication"]),
        q("Partage décimal", "On partage {{formatDecimalFrench(total)}} L également dans {{parts}} bouteilles. Quel volume contient une bouteille ?", "{{formatDecimalFrench(total/parts)}} L", "$ {{formatDecimalFrench(total)}}\\div{{parts}}={{formatDecimalFrench(total/parts)}}$.", { total: choice([4.8, 6.4, 7.2, 9.6, 12.5]), parts: choice([2, 4, 5]) }, ["décimal", "division", "problème"]),
        q("Facteur décimal manquant", "Complète : ${{b}}\\times\\Box={{formatDecimalFrench(a*b)}}$.", "{{formatDecimalFrench(a)}}", "On divise le produit par {{b}}.", { a: decimal(1.2, 9.8, 1), b: int(2, 8) }, ["décimal", "multiplication", "nombre manquant"])
      ]);

    case "6e-chap-08":
      return withChapter(chapter, [
        q("Point sur l'axe", "Le point M appartient à l'axe de symétrie. Quelle est son image ?", "M lui-même", "Tout point situé sur l'axe reste fixe par symétrie axiale.", {}, ["symétrie axiale", "axe"]),
        q("Conservation d'une longueur", "A' et B' sont les images de A et B par symétrie axiale. Si $AB={{d}}$ cm, que vaut $A'B'$ ?", "{{d}} cm", "La symétrie axiale conserve les longueurs.", { d: int(2, 14) }, ["symétrie axiale", "longueur"]),
        q("Conservation d'un angle", "Un angle de {{a}}° est transformé par symétrie axiale. Quelle est la mesure de son image ?", "{{a}}°", "La symétrie axiale conserve les mesures des angles.", { a: int(20, 150) }, ["symétrie axiale", "angle"]),
        q("Segment point-image", "A' est l'image de A par rapport à l'axe $(d)$. Quelle relation lie $(d)$ et $[AA']$ ?", "$(d)$ est la médiatrice de $[AA']$", "L'axe est perpendiculaire au segment point-image et passe par son milieu.", {}, ["symétrie axiale", "point-image", "médiatrice"]),
        q("Distance à l'axe", "A est à {{d}} cm de l'axe. À quelle distance de l'axe se trouve son image A' ?", "{{d}} cm", "A et A' sont à égale distance de l'axe.", { d: int(1, 10) }, ["symétrie axiale", "distance à l'axe"]),
        q("Conservation de l'alignement", "A, B et C sont alignés. Leurs images A', B' et C' le sont-elles ?", "Oui", "La symétrie axiale conserve l'alignement.", {}, ["symétrie axiale", "alignement"]),
        q("Image d'une droite", "Une droite est parallèle à l'axe de symétrie. Quelle est la position de sa droite image ?", "elle est parallèle à la droite initiale", "Deux droites symétriques d'une droite parallèle à l'axe sont parallèles.", {}, ["symétrie axiale", "droite"])
      ]);

    case "legacy-6e-chap-13.5":
      return withChapter(chapter, [
        q("Axes du carré", "Combien d'axes de symétrie possède un carré ?", "4", "Les deux diagonales et les deux médiatrices des côtés sont des axes.", {}, ["axe de symétrie", "carré"]),
        q("Axes du rectangle", "Combien d'axes de symétrie possède un rectangle qui n'est pas un carré ?", "2", "Les deux droites passant par les milieux des côtés opposés sont les axes.", {}, ["axe de symétrie", "rectangle"]),
        q("Axes du losange", "Combien d'axes de symétrie possède un losange qui n'est pas un carré ?", "2", "Les deux diagonales du losange sont ses axes de symétrie.", {}, ["axe de symétrie", "losange"]),
        q("Axes du triangle équilatéral", "Combien d'axes de symétrie possède un triangle équilatéral ?", "3", "Chaque axe passe par un sommet et le milieu du côté opposé.", {}, ["axe de symétrie", "triangle"]),
        q("Axe du triangle isocèle", "Combien d'axes de symétrie possède un triangle isocèle non équilatéral ?", "1", "Son axe passe par le sommet principal et le milieu de la base.", {}, ["axe de symétrie", "triangle"]),
        q("Triangle sans axe", "Combien d'axes de symétrie possède un triangle quelconque sans côtés égaux ?", "0", "Un triangle scalène ne se superpose pas à lui-même par pliage.", {}, ["axe de symétrie", "triangle"]),
        q("Axes du cercle", "Combien d'axes de symétrie possède un cercle ?", "une infinité", "Toute droite passant par le centre du cercle est un axe.", {}, ["axe de symétrie", "cercle"]),
        q("Polygone régulier", "Combien d'axes de symétrie possède un pentagone régulier ?", "5", "Un polygone régulier à 5 côtés possède 5 axes.", {}, ["axe de symétrie", "figure"]),
        q("Test d'un axe", "Pour vérifier qu'une droite est un axe de symétrie d'une figure, quelle superposition peut-on imaginer ?", "un pliage le long de la droite", "Après pliage, les deux parties de la figure doivent se superposer exactement.", {}, ["axe de symétrie", "figure"])
      ]);

    case "6e-chap-15":
      return withChapter(chapter, [
        q("Dix pour cent", "Calcule 10 % de {{base}}.", "{{base/10}}", "$10\%=\\dfrac{1}{10}$, donc on divise {{base}} par 10.", { base: choice([40, 60, 80, 120, 200, 350]) }, ["pourcentage", "10 %"]),
        q("Vingt-cinq pour cent", "Calcule 25 % de {{base}}.", "{{base/4}}", "$25\%=\\dfrac14$, donc on prend le quart de {{base}}.", { base: choice([40, 60, 80, 100, 120, 200]) }, ["pourcentage", "25 %"]),
        q("Cinquante pour cent", "Calcule 50 % de {{base}}.", "{{base/2}}", "$50\%=\\dfrac12$, donc on prend la moitié.", { base: choice([40, 60, 90, 120, 200, 350]) }, ["pourcentage", "50 %"]),
        q("Soixante-quinze pour cent", "Calcule 75 % de {{base}}.", "{{3*base/4}}", "$75\%=\\dfrac34$, donc on prend trois quarts de {{base}}.", { base: choice([40, 60, 80, 100, 120, 200]) }, ["pourcentage", "75 %"]),
        q("Pourcentage en fraction", "Écris 25 % sous forme d'une fraction simplifiée.", "$\\dfrac14$", "$25\%=\\dfrac{25}{100}=\\dfrac14$.", {}, ["pourcentage", "fraction"]),
        q("Pourcentage en décimal", "Écris 75 % sous forme décimale.", "0,75", "$75\%=\\dfrac{75}{100}=0{,}75$.", {}, ["pourcentage", "décimal"]),
        q("Fraction en pourcentage", "Écris $\\dfrac12$ sous forme de pourcentage.", "50 %", "$\\dfrac12=\\dfrac{50}{100}=50\%$.", {}, ["pourcentage", "fraction"]),
        q("Complément à cent pour cent", "Dans une classe, {{p}} % des élèves déjeunent à la cantine. Quel pourcentage n'y déjeune pas ?", "{{100-p}} %", "$100\%-{{p}}\%={{100-p}}\%$.", { p: choice([25, 40, 50, 60, 75]) }, ["pourcentage", "complément"]),
        q("Décimal en pourcentage", "Écris {{formatDecimalFrench(p/100)}} sous forme de pourcentage.", "{{p}} %", "$ {{formatDecimalFrench(p/100)}}=\\dfrac{ {{p}} }{100}={{p}}\%$.", { p: choice([10, 20, 25, 40, 50, 75]) }, ["pourcentage", "décimal"]),
        q("Cases colorées sur cent", "Une grille contient 100 cases dont {{p}} sont colorées. Quel pourcentage des cases est coloré ?", "{{p}} %", "Sur 100 cases, le nombre de cases colorées donne directement le pourcentage.", { p: choice([15, 20, 25, 40, 60, 75]) }, ["pourcentage", "figure"])
      ]);

    case "legacy-6e-chap-15-quadrilaterals":
      return withChapter(chapter, [
        q("Propriété du rectangle", "Quelle propriété possèdent les quatre angles d'un rectangle ?", "ils sont droits", "Un rectangle est un quadrilatère qui possède quatre angles droits.", {}, ["quadrilatère", "rectangle"]),
        q("Propriété du losange", "Quelle propriété possèdent les quatre côtés d'un losange ?", "ils ont la même longueur", "Un losange est un quadrilatère à quatre côtés égaux.", {}, ["quadrilatère", "losange"]),
        q("Propriétés du carré", "Un quadrilatère a quatre côtés égaux et quatre angles droits. Quelle est sa nature ?", "un carré", "Il vérifie à la fois les propriétés du losange et du rectangle.", {}, ["quadrilatère", "carré"]),
        q("Diagonales du rectangle", "Que peut-on dire des longueurs des diagonales d'un rectangle ?", "elles sont égales", "Les diagonales d'un rectangle ont la même longueur.", {}, ["quadrilatère", "rectangle", "diagonale"]),
        q("Diagonales du losange", "Que peut-on dire de l'angle formé par les diagonales d'un losange ?", "c'est un angle droit", "Les diagonales d'un losange sont perpendiculaires.", {}, ["quadrilatère", "losange", "diagonale"]),
        q("Reconnaître un rectangle", "Un quadrilatère possède quatre angles droits et deux côtés consécutifs de longueurs différentes. Quelle est sa nature ?", "un rectangle", "Quatre angles droits caractérisent un rectangle ; les longueurs différentes excluent le carré.", {}, ["quadrilatère", "rectangle"]),
        q("Diagonales du carré", "Quelles sont les deux propriétés principales des diagonales d'un carré ?", "elles sont égales et perpendiculaires", "Le carré est à la fois un rectangle et un losange.", {}, ["quadrilatère", "carré", "diagonale"])
      ]);

    case "6e-chap-02":
      return withChapter(chapter, [
        q("Rayon d'un cercle", "A appartient au cercle de centre O et de rayon {{r}} cm. Que vaut OA ?", "{{r}} cm", "OA est un rayon du cercle, donc $OA={{r}}$ cm.", { r: int(2, 10) }, ["cercle", "rayon", "distance"]),
        q("Diamètre d'un cercle", "Un cercle a un rayon de {{r}} cm. Quel est son diamètre ?", "{{2*r}} cm", "$d=2\\times r=2\\times{{r}}={{2*r}}$ cm.", { r: int(2, 10) }, ["cercle", "diamètre", "distance"], { kind: "circle", radiusLabel: "{{r}} cm" }),
        q("Point sur un cercle", "Le point M appartient au cercle de centre O et de rayon {{r}} cm. Quelle égalité peut-on écrire ?", "$OM={{r}}$ cm", "Tous les points du cercle sont à la distance {{r}} cm du centre O.", { r: int(2, 9) }, ["cercle", "distance", "point"]),
        q("Notation d'une droite", "Quelle notation désigne la droite passant par A et B ?", "$(AB)$", "Les parenthèses désignent une droite : $(AB)$.", {}, ["droite", "notation"]),
        q("Notation d'un segment", "Quelle notation désigne le segment d'extrémités A et B ?", "$[AB]$", "Les crochets désignent le segment : $[AB]$.", {}, ["segment", "notation"]),
        q("Milieu et distance", "I est le milieu de $[AB]$ et $AB={{2*d}}$ cm. Calcule AI.", "{{d}} cm", "$AI=AB\\div2={{2*d}}\\div2={{d}}$ cm.", { d: int(2, 10) }, ["milieu", "distance", "segment"])
      ]);

    case "6e-chap-05":
      return withChapter(chapter, [
        q("Comparer une fraction à 1", "Compare $\\dfrac{ {{a}} }{ {{b}} }$ à 1.", "{{a<b?'< 1':a===b?'= 1':'> 1'}}", "On compare le numérateur {{a}} au dénominateur {{b}}.", { a: int(2, 12), b: int(2, 12) }, ["fraction", "comparaison"]),
        q("Encadrer une fraction", "Encadre $\\dfrac{ {{b+a}} }{ {{b}} }$ entre deux entiers consécutifs, avec $a<b$.", "$1<\\dfrac{ {{b+a}} }{ {{b}} }<2$", "Le numérateur est compris entre {{b}} et {{2*b}}.", { a: int(1, 4), b: choice([5, 6, 8, 10]) }, ["fraction", "encadrement"]),
        q("Fraction d'une figure", "Une figure est partagée en {{den}} parts égales et {{num}} sont coloriées. Quelle fraction est coloriée ?", "$\\dfrac{ {{num}} }{ {{den}} }$", "On place le nombre de parts coloriées au numérateur et le nombre total au dénominateur.", { num: int(1, 4), den: choice([5, 6, 8, 10]) }, ["fraction", "partage"]),
        q("Fraction supérieure à 1", "La fraction $\\dfrac{ {{b+d}} }{ {{b}} }$ est-elle supérieure à 1 ?", "Oui", "Son numérateur {{b+d}} est supérieur à son dénominateur {{b}}.", { b: int(3, 10), d: int(1, 5) }, ["fraction", "comparaison"]),
        q("Abscisse fractionnaire", "Une unité est partagée en {{den}} intervalles égaux. Quelle est l'abscisse de la {{num}}e graduation ?", "$\\dfrac{ {{num}} }{ {{den}} }$", "Chaque intervalle vaut $1/{{den}}$.", { num: int(1, 9), den: choice([4, 5, 8, 10]) }, ["fraction", "droite graduée"]),
        q("Numérateur et dénominateur", "Dans $\\dfrac{ {{num}} }{ {{den}} }$, donne le numérateur puis le dénominateur.", "{{num}} puis {{den}}", "Le numérateur est au-dessus de la barre et le dénominateur en dessous.", { num: int(1, 9), den: int(2, 12) }, ["fraction", "numérateur", "dénominateur"])
      ]);

    case "6e-chap-10":
      return withChapter(chapter, [
        q("Fraction quotient", "Écris le quotient de {{a}} par {{b}} sous forme de fraction.", "$\\dfrac{ {{a}} }{ {{b}} }$", "Le quotient de {{a}} par {{b}} s'écrit $\\dfrac{ {{a}} }{ {{b}} }$.", { a: int(2, 20), b: int(2, 10) }, ["fraction", "quotient"]),
        q("Valeur d'une fraction quotient", "Calcule $\\dfrac{ {{a*b}} }{ {{b}} }$.", "{{a}}", "$\\dfrac{ {{a*b}} }{ {{b}} }={{a*b}}\\div{{b}}={{a}}$.", { a: int(2, 12), b: int(2, 9) }, ["fraction", "quotient"]),
        q("Dénominateur manquant", "Complète $\\dfrac{ {{a}} }{ {{b}} }=\\dfrac{ {{a*k}} }{\\Box}$.", "{{b*k}}", "On multiplie le numérateur et le dénominateur par {{k}}.", { a: int(1, 6), b: int(2, 9), k: int(2, 5) }, ["fraction", "égalité"]),
        q("Numérateur manquant", "Complète $\\dfrac{ {{a}} }{ {{b}} }=\\dfrac{\\Box}{ {{b*k}} }$.", "{{a*k}}", "Le dénominateur est multiplié par {{k}}, donc le numérateur aussi.", { a: int(1, 6), b: int(2, 9), k: int(2, 5) }, ["fraction", "égalité"]),
        q("Simplification guidée", "Simplifie $\\dfrac{ {{a*k}} }{ {{b*k}} }$ en divisant par {{k}}.", "$\\dfrac{ {{a}} }{ {{b}} }$", "On divise le numérateur et le dénominateur par {{k}}.", { a: int(1, 6), b: int(2, 9), k: int(2, 5) }, ["fraction", "simplifier"]),
        q("Tester une égalité", "Les fractions $\\dfrac{ {{a}} }{ {{b}} }$ et $\\dfrac{ {{a*k}} }{ {{b*k}} }$ sont-elles égales ?", "Oui", "La seconde est obtenue en multipliant les deux termes par {{k}}.", { a: int(1, 6), b: int(2, 9), k: int(2, 5) }, ["fraction", "égalité"]),
        q("Quotient exact", "Quel quotient représente la fraction $\\dfrac{ {{a*b}} }{ {{b}} }$ ?", "{{a*b}} ÷ {{b}}", "Une barre de fraction signifie une division.", { a: int(2, 10), b: int(2, 9) }, ["fraction", "quotient"]),
        q("Fraction égale à un entier", "Complète : $\\dfrac{\\Box}{ {{b}} }={{a}}$.", "{{a*b}}", "Il faut {{a}} groupes de {{b}}, soit {{a*b}} au numérateur.", { a: int(2, 10), b: int(2, 9) }, ["fraction", "quotient", "égalité"])
      ]);

    case "6e-chap-12":
      return withChapter(chapter, [
        q("Passage à l'unité", "{{a}} objets coûtent {{a*p}} €. Combien coûte un objet ?", "{{p}} €", "$ {{a*p}}\\div{{a}}={{p}}$ €.", { a: int(2, 6), p: int(2, 12) }, ["proportionnalité", "passage à l'unité"]),
        q("Prix proportionnel", "Un objet coûte {{p}} €. Combien coûtent {{q}} objets ?", "{{p*q}} €", "$ {{p}}\\times{{q}}={{p*q}}$ €.", { p: int(2, 12), q: int(2, 10) }, ["proportionnalité", "prix"]),
        q("Échelle simple", "Sur un plan à l'échelle 1:{{k}}, 1 cm représente combien de centimètres réels ?", "{{k}} cm", "Le dénominateur de l'échelle donne la longueur réelle correspondant à 1 cm.", { k: choice([50, 100, 200, 500]) }, ["proportionnalité", "échelle"]),
        q("Distance réelle", "À l'échelle 1:{{k}}, une longueur mesure {{d}} cm sur le plan. Quelle est la longueur réelle ?", "{{d*k}} cm", "$ {{d}}\\times{{k}}={{d*k}}$ cm.", { k: choice([50, 100, 200]), d: int(2, 9) }, ["proportionnalité", "échelle"]),
        q("Compléter un tableau", "Dans une situation proportionnelle, on passe de {{a}} à {{a*k}}. À quelle valeur correspond {{b}} ?", "{{b*k}}", "Le coefficient de proportionnalité est {{k}}.", { a: int(2, 6), b: int(3, 10), k: int(2, 8) }, ["proportionnalité", "tableau"]),
        q("Reconnaître une proportionnalité", "Tous les articles coûtent {{p}} € l'unité. Le prix total est-il proportionnel au nombre d'articles ?", "Oui", "Le prix s'obtient toujours en multipliant le nombre d'articles par {{p}}.", { p: int(2, 12) }, ["proportionnalité", "coefficient"])
      ]);

    case "6e-chap-13":
      return withChapter(chapter, [
        q("Addition de même dénominateur", "Calcule $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ {{b}} }{ {{den}} }$.", "$\\dfrac{ {{a+b}} }{ {{den}} }$", "On conserve le dénominateur et on additionne les numérateurs.", { a: int(1, 5), b: int(1, 5), den: choice([7, 8, 9, 10, 12]) }, ["fraction", "addition"]),
        q("Soustraction de même dénominateur", "Calcule $\\dfrac{ {{a+b}} }{ {{den}} }-\\dfrac{ {{b}} }{ {{den}} }$.", "$\\dfrac{ {{a}} }{ {{den}} }$", "On conserve le dénominateur et on soustrait les numérateurs.", { a: int(1, 5), b: int(1, 5), den: choice([7, 8, 9, 10, 12]) }, ["fraction", "soustraction"]),
        q("Comparer même dénominateur", "Compare $\\dfrac{ {{a}} }{ {{den}} }$ et $\\dfrac{ {{a+d}} }{ {{den}} }$.", "$\\dfrac{ {{a}} }{ {{den}} }<\\dfrac{ {{a+d}} }{ {{den}} }$", "À dénominateur égal, on compare les numérateurs.", { a: int(1, 6), d: int(1, 4), den: choice([8, 10, 12]) }, ["fraction", "comparaison"]),
        q("Complément à l'unité", "Complète $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{\\Box}{ {{den}} }=1$.", "{{den-a}}", "$1=\\dfrac{ {{den}} }{ {{den}} }$, il manque donc {{den-a}} au numérateur.", { a: int(1, 7), den: choice([8, 10, 12]) }, ["fraction", "addition", "complément"]),
        q("Part restante", "Lina parcourt $\\dfrac{ {{a}} }{ {{den}} }$ d'un trajet le matin et $\\dfrac{ {{b}} }{ {{den}} }$ l'après-midi. Quelle fraction a-t-elle parcourue ?", "$\\dfrac{ {{a+b}} }{ {{den}} }$", "Les dénominateurs sont identiques : on additionne {{a}} et {{b}}.", { a: int(1, 4), b: int(1, 4), den: choice([8, 10, 12]) }, ["fraction", "addition", "problème"]),
        q("Différence de fractions", "Quelle est la différence entre $\\dfrac{ {{a+d}} }{ {{den}} }$ et $\\dfrac{ {{a}} }{ {{den}} }$ ?", "$\\dfrac{ {{d}} }{ {{den}} }$", "On soustrait les numérateurs : {{a+d}}-{{a}}={{d}}.", { a: int(1, 5), d: int(1, 4), den: choice([8, 10, 12]) }, ["fraction", "soustraction", "comparaison"]),
        q("Somme égale à un", "Calcule $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ {{den-a}} }{ {{den}} }$.", "1", "La somme des numérateurs vaut le dénominateur.", { a: int(1, 7), den: choice([8, 10, 12]) }, ["fraction", "addition"]),
        q("Numérateur manquant dans une somme", "Complète $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{\\Box}{ {{den}} }=\\dfrac{ {{target}} }{ {{den}} }$.", "{{target-a}}", "$ {{target}}-{{a}}={{target-a}}$.", { a: int(1, 4), target: int(6, 10), den: choice([10, 12]) }, ["fraction", "addition", "nombre manquant"])
      ]);

    case "6e-chap-14":
      return withChapter(chapter, [
        q("Aire d'un rectangle", "Calcule l'aire d'un rectangle de {{l}} cm sur {{w}} cm.", "{{l*w}} cm²", "$\\mathcal{A}={{l}}\\times{{w}}={{l*w}}$ cm².", { l: int(3, 15), w: int(2, 10) }, ["aire", "rectangle"], { kind: "rectangle", widthLabel: "{{l}} cm", heightLabel: "{{w}} cm" }),
        q("Périmètre d'un carré", "Calcule le périmètre d'un carré de côté {{c}} cm.", "{{4*c}} cm", "$P=4\\times{{c}}={{4*c}}$ cm.", { c: int(2, 15) }, ["périmètre", "carré"]),
        q("Aire d'un carré", "Calcule l'aire d'un carré de côté {{c}} cm.", "{{c*c}} cm²", "$\\mathcal{A}={{c}}\\times{{c}}={{c*c}}$ cm².", { c: int(2, 15) }, ["aire", "carré"]),
        q("Périmètre d'un rectangle", "Calcule le périmètre d'un rectangle de {{l}} cm sur {{w}} cm.", "{{2*(l+w)}} cm", "$P=2\\times({{l}}+{{w}})={{2*(l+w)}}$ cm.", { l: int(3, 15), w: int(2, 10) }, ["périmètre", "rectangle"], { kind: "rectangle", widthLabel: "{{l}} cm", heightLabel: "{{w}} cm" }),
        q("Périmètre du cercle en fonction de π", "Un cercle a un rayon de {{r}} cm. Donne son périmètre en fonction de π.", "{{2*r}}π cm", "$P=2\\pi r={{2*r}}\\pi$ cm.", { r: int(2, 10) }, ["périmètre", "cercle", "rayon"], { kind: "circle", radiusLabel: "{{r}} cm" }),
        q("Choisir la bonne unité", "Quelle unité convient pour l'aire d'une feuille : cm ou cm² ?", "cm²", "Une aire s'exprime avec une unité carrée.", {}, ["aire", "unité"]),
        q("Retrouver un côté du rectangle", "Un rectangle a une aire de {{l*w}} cm² et une largeur de {{w}} cm. Quelle est sa longueur ?", "{{l}} cm", "$ {{l*w}}\\div{{w}}={{l}}$ cm.", { l: int(3, 12), w: int(2, 8) }, ["aire", "rectangle", "nombre manquant"]),
        q("Comparer aire et périmètre", "Pour mesurer la surface occupée par un tapis, faut-il calculer son aire ou son périmètre ?", "son aire", "La surface intérieure se mesure avec l'aire.", {}, ["aire", "périmètre", "vocabulaire"])
      ]);

    case "6e-chap-16":
      return withChapter(chapter, [
        q("Faces d'un cube", "Combien de faces possède un cube ?", "6", "Un cube possède 6 faces carrées.", {}, ["solide", "cube", "face"], { kind: "solid", solid: "pave", labels: ["", "", ""] }),
        q("Arêtes d'un cube", "Combien d'arêtes possède un cube ?", "12", "Un cube possède 12 arêtes.", {}, ["solide", "cube", "arête"]),
        q("Sommets d'un pavé", "Combien de sommets possède un pavé droit ?", "8", "Un pavé droit possède 8 sommets.", {}, ["solide", "pavé", "sommet"]),
        q("Nature des faces", "Quelle est la nature des faces d'un pavé droit ?", "des rectangles", "Les six faces d'un pavé droit sont des rectangles.", {}, ["solide", "pavé", "face"]),
        q("Patron d'un cube", "Combien de carrés composent un patron de cube ?", "6", "Chaque carré devient une face du cube.", {}, ["solide", "cube", "patron"]),
        q("Bases d'un prisme", "Combien de bases possède un prisme droit ?", "2", "Un prisme possède deux bases parallèles et superposables.", {}, ["solide", "prisme", "base"]),
        q("Vue en perspective", "Dans une perspective cavalière, comment représente-t-on généralement les arêtes cachées ?", "en pointillés", "Les pointillés distinguent les arêtes non visibles.", {}, ["solide", "perspective", "arête"]),
        q("Reconnaître un solide", "Un solide possède six faces rectangulaires. Quel solide usuel peut-il être ?", "un pavé droit", "Un pavé droit possède six faces rectangulaires.", {}, ["solide", "pavé", "face"]),
        q("Faces opposées", "Dans un pavé droit, que peut-on dire de deux faces opposées ?", "elles sont parallèles et superposables", "Les faces opposées d'un pavé droit ont la même forme et sont parallèles.", {}, ["solide", "pavé", "face"]),
        q("Arête commune", "Deux faces voisines d'un polyèdre se rencontrent selon quel objet ?", "une arête", "L'intersection de deux faces voisines est une arête.", {}, ["solide", "face", "arête"])
      ]);

    case "6e-chap-17":
      return withChapter(chapter, [
        q("Heures en minutes", "Convertis {{h}} h en minutes.", "{{60*h}} min", "$1$ h = $60$ min, donc ${{h}}\\times60={{60*h}}$ min.", { h: int(2, 8) }, ["durée", "heure", "minute"]),
        q("Minutes en secondes", "Convertis {{m}} min en secondes.", "{{60*m}} s", "$1$ min = $60$ s.", { m: int(2, 15) }, ["durée", "minute", "seconde"]),
        q("Minutes en heures et minutes", "Convertis {{60*h+m}} min en heures et minutes.", "{{h}} h {{m}} min", "$ {{60*h+m}}={{h}}\\times60+{{m}}$.", { h: int(1, 5), m: int(1, 50) }, ["durée", "conversion"]),
        q("Addition de durées", "Calcule {{h}} h {{m}} min + {{d}} min, sans changement d'heure.", "{{h}} h {{m+d}} min", "$ {{m}}+{{d}}={{m+d}}$ min.", { h: int(8, 18), m: int(0, 25), d: int(5, 30) }, ["durée", "addition", "horaire"]),
        q("Changement d'heure", "Il est {{h}} h {{m}}. Quelle heure sera-t-il {{d}} minutes plus tard ?", "{{h+1}} h {{m+d-60}}", "$ {{m}}+{{d}}={{m+d}}$ min, soit 1 h et {{m+d-60}} min.", { h: int(8, 18), m: int(35, 55), d: int(30, 50) }, ["durée", "addition", "horaire"]),
        q("Durée écoulée", "Une activité commence à {{h}} h {{m}} et se termine à {{h}} h {{m+d}}. Combien de temps dure-t-elle ?", "{{d}} min", "$ {{m+d}}-{{m}}={{d}}$ min.", { h: int(8, 18), m: int(0, 25), d: int(10, 30) }, ["durée", "soustraction", "horaire"]),
        q("Quart d'heure", "Combien de minutes y a-t-il dans un quart d'heure ?", "15 min", "$60\\div4=15$ min.", {}, ["durée", "heure", "minute"]),
        q("Demi-heure", "Combien de minutes y a-t-il dans une demi-heure ?", "30 min", "$60\\div2=30$ min.", {}, ["durée", "heure", "minute"]),
        q("Secondes en minutes", "Convertis {{60*m}} secondes en minutes.", "{{m}} min", "$ {{60*m}}\\div60={{m}}$ min.", { m: int(2, 12) }, ["durée", "seconde", "minute"]),
        q("Choisir une unité", "Pour mesurer la durée d'un clignement d'œil, choisit-on plutôt l'heure, la minute ou la seconde ?", "la seconde", "Un clignement est une durée très courte.", {}, ["durée", "seconde", "unité"])
      ]);

    case "6e-chap-18":
      return withChapter(chapter, [
        q("Traduire une somme", "Écris une expression pour « le nombre $x$ augmenté de {{a}} ».", "$x+{{a}}$", "Augmenter de {{a}} signifie ajouter {{a}}.", { a: int(2, 15) }, ["algèbre", "expression littérale"]),
        q("Traduire un produit", "Écris une expression pour « {{a}} fois le nombre $x$ ».", "${{a}}x$", "Multiplier $x$ par {{a}} s'écrit ${{a}}x$.", { a: int(2, 9) }, ["algèbre", "expression littérale"]),
        q("Substitution dans une somme", "Calcule $x+{{a}}$ pour $x={{x}}$.", "{{x+a}}", "On remplace $x$ par {{x}} : ${{x}}+{{a}}={{x+a}}$.", { a: int(2, 15), x: int(1, 20) }, ["algèbre", "substitution"]),
        q("Substitution dans un produit", "Calcule ${{a}}x$ pour $x={{x}}$.", "{{a*x}}", "$ {{a}}\\times{{x}}={{a*x}}$.", { a: int(2, 9), x: int(1, 15) }, ["algèbre", "substitution"]),
        q("Programme de calcul", "On choisit {{x}}, on le multiplie par {{a}} puis on ajoute {{b}}. Quel résultat obtient-on ?", "{{a*x+b}}", "$ {{x}}\\times{{a}}+{{b}}={{a*x+b}}$.", { x: int(1, 15), a: int(2, 8), b: int(1, 12) }, ["algèbre", "programme de calcul"]),
        q("Nombre inconnu dans une addition", "Trouve $x$ : $x+{{a}}={{a+x}}$.", "$x={{x}}$", "$ {{a+x}}-{{a}}={{x}}$.", { a: int(2, 20), x: int(1, 20) }, ["algèbre", "nombre inconnu", "égalité"]),
        q("Nombre inconnu dans un produit", "Trouve $x$ : ${{a}}x={{a*x}}$.", "$x={{x}}$", "$ {{a*x}}\\div{{a}}={{x}}$.", { a: int(2, 9), x: int(1, 15) }, ["algèbre", "nombre inconnu", "égalité"]),
        q("Tester une égalité", "Pour $x={{x}}$, l'égalité $x+{{a}}={{x+a}}$ est-elle vraie ?", "Oui", "En remplaçant $x$ par {{x}}, les deux membres valent {{x+a}}.", { a: int(2, 15), x: int(1, 20) }, ["algèbre", "égalité", "substitution"]),
        q("Périmètre littéral", "Un carré a pour côté $x$ cm. Exprime son périmètre.", "$4x$ cm", "Le périmètre d'un carré vaut quatre fois son côté.", {}, ["algèbre", "expression littérale"]),
        q("Double d'un nombre", "Exprime le double d'un nombre $x$ puis calcule-le pour $x={{x}}$.", "$2x={{2*x}}$", "Le double de $x$ est $2x$ ; pour $x={{x}}$, il vaut {{2*x}}.", { x: int(1, 20) }, ["algèbre", "substitution", "expression littérale"])
      ]);

    case "6e-chap-19":
      return withChapter(chapter, [
        q("Issues d'un dé", "Combien d'issues possède le lancer d'un dé classique ?", "6", "Les issues sont 1, 2, 3, 4, 5 et 6.", {}, ["probabilité", "issue", "dé équilibré"]),
        q("Événement certain", "Sur un dé classique, l'événement « obtenir un nombre inférieur à 7 » est-il certain ?", "Oui", "Toutes les issues 1 à 6 conviennent.", {}, ["probabilité", "événement"]),
        q("Événement impossible", "Sur un dé classique, quelle est la probabilité d'obtenir 8 ?", "0", "8 ne fait pas partie des issues possibles.", {}, ["probabilité", "événement", "dé équilibré"]),
        q("Pile ou face", "On lance une pièce équilibrée. Quelle est la probabilité d'obtenir pile ?", "$\\dfrac12$", "Il y a deux issues équiprobables dont une favorable.", {}, ["probabilité", "issue", "tirage"]),
        q("Nombre pair sur un dé", "On lance un dé équilibré. Quelle est la probabilité d'obtenir un nombre pair ?", "$\\dfrac12$", "Les issues favorables sont 2, 4 et 6 : $3/6=1/2$.", {}, ["probabilité", "dé équilibré"]),
        q("Boule bleue", "Un sac contient {{r}} boules rouges et {{b}} bleues. Quelle est la probabilité de tirer une bleue ?", "$\\dfrac{ {{b}} }{ {{r+b}} }$", "Il y a {{b}} issues favorables sur {{r+b}} boules.", { r: int(2, 8), b: int(2, 8) }, ["probabilité", "tirage", "issue"])
      ]);

    case "legacy-6e-chap-18-volumes":
      return withChapter(chapter, [
        q("Volume d'un cube", "Calcule le volume d'un cube d'arête {{a}} cm.", "{{a*a*a}} cm³", "$V={{a}}\\times{{a}}\\times{{a}}={{a*a*a}}$ cm³.", { a: int(2, 9) }, ["volume", "cube"], { kind: "solid", solid: "pave", labels: ["{{a}} cm", "{{a}} cm", "{{a}} cm"] }),
        q("Cube unité", "Un solide est formé de {{a}} couches de {{b}} cubes chacune. Combien contient-il de cubes unités ?", "{{a*b}} cubes", "$ {{a}}\\times{{b}}={{a*b}}$ cubes unités.", { a: int(2, 8), b: int(3, 15) }, ["volume", "cube unité"]),
        q("Litres et décimètres cubes", "Convertis {{v}} L en dm³.", "{{v}} dm³", "$1$ L = $1$ dm³.", { v: int(2, 25) }, ["volume", "conversion", "litre"]),
        q("Millilitres et centimètres cubes", "Convertis {{v}} mL en cm³.", "{{v}} cm³", "$1$ mL = $1$ cm³.", { v: int(20, 900) }, ["volume", "conversion"]),
        q("Hauteur d'un pavé", "Un pavé droit a un volume de {{l*w*h}} cm³, une longueur de {{l}} cm et une largeur de {{w}} cm. Quelle est sa hauteur ?", "{{h}} cm", "$h={{l*w*h}}\\div({{l}}\\times{{w}})={{h}}$ cm.", { l: int(2, 8), w: int(2, 7), h: int(2, 9) }, ["volume", "pavé"], { kind: "solid", solid: "pave", labels: ["{{l}} cm", "{{w}} cm", "hauteur"] }),
        q("Comparer deux pavés", "Un pavé mesure {{a}} cm × {{b}} cm × {{c}} cm et un autre {{a}} cm × {{b}} cm × {{c+1}} cm. Lequel a le plus grand volume ?", "le second", "Les deux premières dimensions sont identiques et {{c+1}}>{{c}}.", { a: int(2, 6), b: int(2, 6), c: int(2, 8) }, ["volume", "pavé", "comparaison"]),
        q("Unité de volume", "Quelle unité convient pour mesurer le volume d'une boîte à chaussures : cm, cm² ou cm³ ?", "cm³", "Un volume s'exprime avec une unité cubique.", {}, ["volume", "unité"]),
        q("Volume et dimensions", "Un pavé droit mesure {{l}} cm, {{w}} cm et {{h}} cm. Quel produit donne son volume ?", "$ {{l}}\\times{{w}}\\times{{h}}$", "On multiplie les trois dimensions du pavé droit.", { l: int(2, 9), w: int(2, 8), h: int(2, 7) }, ["volume", "pavé"], { kind: "solid", solid: "pave", labels: ["{{l}} cm", "{{w}} cm", "{{h}} cm"] })
      ]);

    default:
      return [];
  }
}

function fifthGradeCompletions(chapter: ChapterInfo): ChapterCompletionTemplate[] {
  switch (chapter.id) {
    case "5e-chap-01":
      return withChapter(chapter, [
        q("Priorité d'une division", "Calcule ${{a}}+{{b*c}}\\div{{c}}$.", "{{a+b}}", "La division est prioritaire : ${{b*c}}\\div{{c}}={{b}}$, puis ${{a}}+{{b}}={{a+b}}$.", { a: int(2, 20), b: int(2, 12), c: int(2, 8) }, ["priorité", "division"]),
        q("Parenthèses au dénominateur", "Calcule ${{a*b}}\\div({{a-b}}+{{b}})$.", "{{b}}", "On calcule la parenthèse : ${{a-b}}+{{b}}={{a}}$, puis ${{a*b}}\\div{{a}}={{b}}$.", { a: int(6, 12), b: int(2, 5) }, ["priorité", "parenthèses"]),
        q("Deux produits à additionner", "Calcule ${{a}}\\times{{b}}+{{c}}\\times{{d}}$.", "{{a*b+c*d}}", "On calcule les deux produits avant de les additionner.", { a: int(2, 9), b: int(2, 9), c: int(2, 9), d: int(2, 9) }, ["priorité", "calcul en deux étapes"]),
        q("Soustraction après parenthèses", "Calcule ${{a}}-({{b}}+{{c}})$.", "{{a-b-c}}", "La parenthèse vaut {{b+c}}, donc ${{a}}-{{b+c}}={{a-b-c}}$.", { a: int(50, 100), b: int(5, 20), c: int(5, 20) }, ["priorité", "parenthèses"])
      ]);

    case "5e-chap-02":
      return withChapter(chapter, [
        q("Bases d'un prisme", "Combien de bases possède un prisme droit ?", "2", "Un prisme possède deux bases polygonales parallèles et superposables.", {}, ["solide", "prisme", "base"], { kind: "solid", solid: "prisme", labels: ["base", "base", "hauteur"] }),
        q("Faces latérales d'un prisme", "Quelle est la nature des faces latérales d'un prisme droit ?", "des rectangles", "Dans un prisme droit, les faces latérales sont rectangulaires.", {}, ["solide", "prisme", "face"], { kind: "solid", solid: "prisme", labels: ["", "", ""] }),
        q("Bases d'un cylindre", "Quelle est la nature des deux bases d'un cylindre de révolution ?", "deux disques", "Les deux bases sont des disques parallèles et de même rayon.", {}, ["solide", "cylindre", "base"], { kind: "solid", solid: "cylindre", labels: ["rayon", "hauteur"] }),
        q("Patron d'un prisme triangulaire", "Quelles figures composent le patron d'un prisme droit à base triangulaire ?", "2 triangles et 3 rectangles", "Il faut deux bases triangulaires et une face rectangulaire par côté du triangle.", {}, ["solide", "prisme", "patron"]),
        q("Arêtes d'un prisme triangulaire", "Combien d'arêtes possède un prisme triangulaire ?", "9", "Chaque base a 3 arêtes et 3 arêtes relient les bases : $3+3+3=9$.", {}, ["solide", "prisme", "arête"], { kind: "solid", solid: "prisme", labels: ["", "", ""] }),
        q("Sommets d'un prisme triangulaire", "Combien de sommets possède un prisme triangulaire ?", "6", "Chaque base triangulaire possède 3 sommets, soit $2\\times3=6$.", {}, ["solide", "prisme", "sommet"], { kind: "solid", solid: "prisme", labels: ["", "", ""] })
      ]);

    case "5e-chap-03":
      return withChapter(chapter, [
        q("Passage à l'unité", "{{a}} kg de fruits coûtent {{a*p}} €. Quel est le prix de 1 kg ?", "{{p}} €", "$ {{a*p}}\\div{{a}}={{p}}$.", { a: int(2, 6), p: int(2, 9) }, ["proportionnalité", "unité", "prix"]),
        q("Coefficient d'un tableau", "Dans un tableau, on passe de {{a}} à {{a*k}}. Quel est le coefficient de proportionnalité ?", "{{k}}", "$ {{a*k}}\\div{{a}}={{k}}$.", { a: int(2, 12), k: int(2, 8) }, ["proportionnalité", "coefficient", "tableau"]),
        q("Recette proportionnelle", "Une recette pour {{people}} personnes utilise {{people*amount}} g de riz. Quelle masse faut-il pour {{target}} personnes ?", "{{target*amount}} g", "Il faut {{amount}} g par personne, donc ${{target}}\\times{{amount}}={{target*amount}}$ g.", { people: int(2, 6), target: int(7, 12), amount: choice([40, 50, 60, 75]) }, ["proportionnalité", "application"])
      ]);

    case "5e-chap-04":
      return withChapter(chapter, [
        q("Critère de divisibilité par 2", "Le nombre {{n}} est-il divisible par 2 ?", "{{n%2===0 ? 'Oui' : 'Non'}}", "On regarde si le chiffre des unités est pair.", { n: int(100, 999) }, ["divisibilité", "critère", "2"]),
        q("Critère de divisibilité par 5", "Le nombre {{n}} est-il divisible par 5 ?", "{{n%5===0 ? 'Oui' : 'Non'}}", "Un multiple de 5 se termine par 0 ou 5.", { n: int(100, 999) }, ["divisibilité", "critère", "5"]),
        q("Critère de divisibilité par 10", "Le nombre {{n}} est-il divisible par 10 ?", "{{n%10===0 ? 'Oui' : 'Non'}}", "Un multiple de 10 se termine par 0.", { n: int(100, 999) }, ["divisibilité", "critère", "10"]),
        q("Somme des chiffres", "Calcule la somme des chiffres de {{100*a+10*b+c}} pour tester la divisibilité par 3.", "{{a+b+c}}", "$ {{a}}+{{b}}+{{c}}={{a+b+c}}$.", { a: int(1, 9), b: int(0, 9), c: int(0, 9) }, ["divisibilité", "critère", "3"]),
        q("Diviseur d'un entier", "Le nombre {{d}} est-il un diviseur de {{d*q}} ?", "Oui", "$ {{d*q}}={{d}}\\times{{q}}$.", { d: int(2, 12), q: int(3, 15) }, ["diviseur", "multiple"]),
        q("Multiple commun", "Donne le plus petit multiple commun positif de {{a}} et {{b}}.", "{{a*b}}", "Ici {{a}} et {{b}} sont premiers entre eux, donc leur plus petit multiple commun vaut ${{a}}\\times{{b}}={{a*b}}$.", { a: choice([3, 4, 5]), b: choice([7, 11]) }, ["multiple", "divisibilité"]),
        q("Division euclidienne complète", "Dans ${{d*q+r}}={{d}}\\times{{q}}+{{r}}$, identifie le diviseur.", "{{d}}", "La forme est dividende = diviseur × quotient + reste.", { d: int(5, 12), q: int(3, 15), r: int(1, 4) }, ["division euclidienne", "diviseur"])
      ]);

    case "5e-chap-05":
      return withChapter(chapter, [
        q("Trois fractions à dénominateurs multiples", "Calcule $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ {{b}} }{ {{2*den}} }+\\dfrac{ {{c}} }{ {{4*den}} }$.", "{{formatFraction(4*a+2*b+c,4*den)}}", "On utilise le dénominateur commun {{4*den}} : le numérateur devient $4\\times{{a}}+2\\times{{b}}+{{c}}$.", { a: int(1, 6), b: int(1, 7), c: int(1, 8), den: int(3, 9) }, ["fractions", "addition", "denominateurs-multiples"]),
        q("Numérateur avec dénominateur multiple", "Pour additionner $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ {{b}} }{ {{den*k}} }$, par quel numérateur remplace-t-on {{a}} quand la première fraction est écrite sur {{den*k}} ?", "{{a*k}}", "$\\dfrac{ {{a}} }{ {{den}} }=\\dfrac{ {{a*k}} }{ {{den*k}} }$ : on multiplie le numérateur et le dénominateur par {{k}}.", { a: int(1, 8), b: int(1, 9), den: int(3, 9), k: choice([2, 3, 4]) }, ["fractions", "dénominateur commun", "denominateurs-multiples"]),
        q("Addition à dénominateurs quelconques", "Calcule $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ {{b}} }{ {{den+1}} }$.", "{{formatFraction(a*(den+1)+b*den,den*(den+1))}}", "Le produit {{den*(den+1)}} est un dénominateur commun : $\\dfrac{ {{a*(den+1)}}+{{b*den}} }{ {{den*(den+1)}} }={{formatFraction(a*(den+1)+b*den,den*(den+1))}}$.", { a: int(1, 7), b: int(1, 7), den: int(3, 9) }, ["fractions", "addition", "denominateurs-quelconques"]),
        q("Soustraction à dénominateurs quelconques", "Calcule $\\dfrac{ {{a}} }{ {{den}} }-\\dfrac{ {{b}} }{ {{den+1}} }$.", "{{formatFraction(a*(den+1)-b*den,den*(den+1))}}", "On utilise le dénominateur commun {{den*(den+1)}} : $\\dfrac{ {{a*(den+1)}}-{{b*den}} }{ {{den*(den+1)}} }={{formatFraction(a*(den+1)-b*den,den*(den+1))}}$.", { a: int(4, 8), b: int(1, 2), den: int(3, 9) }, ["fractions", "soustraction", "denominateurs-quelconques"]),
        q("Comparer des fractions à dénominateurs quelconques", "Compare $\\dfrac{ {{a}} }{ {{den}} }$ et $\\dfrac{ {{b}} }{ {{den+1}} }$.", "{{a*(den+1)===b*den ? '=' : a*(den+1)>b*den ? '>' : '<'}}", "On compare les produits en croix ${{a}}\\times{{den+1}}={{a*(den+1)}}$ et ${{b}}\\times{{den}}={{b*den}}$.", { a: int(1, 9), b: int(1, 9), den: int(3, 9) }, ["fractions", "comparaison", "denominateurs-quelconques"]),
        q("Choisir un dénominateur commun", "Quel dénominateur commun peut-on toujours utiliser pour $\\dfrac{ {{a}} }{ {{den}} }$ et $\\dfrac{ {{b}} }{ {{den+1}} }$ ?", "{{den*(den+1)}}", "Le produit de deux dénominateurs non nuls est toujours un dénominateur commun.", { a: int(1, 7), b: int(1, 7), den: int(3, 9) }, ["fractions", "dénominateur commun", "denominateurs-quelconques"])
      ]);

    case "5e-chap-06":
      return withChapter(chapter, [
        q("Angle au sommet d'un isocèle", "Un triangle isocèle a deux angles à la base de {{a}}°. Calcule l'angle au sommet.", "{{180-2*a}}°", "$180°-2\\times{{a}}°={{180-2*a}}°$.", { a: int(35, 75) }, ["triangle", "somme des angles", "isocèle"]),
        q("Angles à la base d'un isocèle", "L'angle au sommet d'un triangle isocèle mesure {{vertex}}°. Calcule chacun des deux angles à la base.", "{{(180-vertex)/2}}°", "$ (180°-{{vertex}}°)\\div2={{(180-vertex)/2}}°$.", { vertex: choice([40, 50, 60, 70, 80]) }, ["triangle", "somme des angles", "isocèle"]),
        q("Définition d'une médiane", "Dans un triangle, par quels points passe une médiane ?", "un sommet et le milieu du côté opposé", "Une médiane joint un sommet au milieu du côté opposé.", {}, ["triangle", "médiane", "droite remarquable"]),
        q("Définition d'une médiatrice", "Dans un triangle, que caractérise la médiatrice d'un côté ?", "les points équidistants des extrémités du côté", "La médiatrice est perpendiculaire au côté et passe par son milieu.", {}, ["triangle", "médiatrice", "droite remarquable"]),
        q("Médiane et milieu", "M est le milieu de $[BC]$. Comment se nomme le segment $[AM]$ dans le triangle ABC ?", "une médiane", "Il relie le sommet A au milieu du côté opposé.", {}, ["triangle", "médiane"]),
        q("Milieu d'un côté", "Dans le triangle ABC, la médiane issue de A coupe $[BC]$ en M. Si $BC={{2*d}}$ cm, que vaut $BM$ ?", "{{d}} cm", "Une médiane coupe le côté opposé en son milieu, donc $BM=BC\\div2={{d}}$ cm.", { d: int(2, 10) }, ["triangle", "médiane", "milieu"]),
        q("Nombre de médianes", "Combien de médianes possède un triangle ?", "3", "Il existe une médiane issue de chacun des trois sommets.", {}, ["triangle", "médiane"]),
        q("Centre du cercle circonscrit", "Comment nomme-t-on le point d'intersection des trois médiatrices d'un triangle ?", "le centre du cercle circonscrit", "Ce point est équidistant des trois sommets du triangle.", {}, ["triangle", "médiatrice", "équidistance"]),
        q("Triangle rectangle isocèle", "Un triangle rectangle est aussi isocèle. Quelles sont les mesures de ses deux angles aigus ?", "45° et 45°", "Ils sont égaux et leur somme vaut $90°$.", {}, ["triangle", "somme des angles"])
      ]);

    case "5e-chap-07":
      return withChapter(chapter, [
        q("Distance à zéro", "Quelle est la distance à zéro du nombre $-{{a}}$ ?", "{{a}}", "La distance à zéro est la valeur absolue : elle est positive.", { a: int(2, 30) }, ["relatif", "repérage"]),
        q("Opposé d'un décimal", "Quel est l'opposé de {{formatDecimalFrench(a)}} ?", "{{formatDecimalFrench(-a)}}", "Deux nombres opposés ont la même distance à zéro et des signes contraires.", { a: decimal(-20, 20, 1) }, ["relatif", "opposé"]),
        q("Ordre de trois relatifs", "Range dans l'ordre croissant : ${{p}}$, $-{{a}}$, ${{b}}$.", "$-{{a}}<{{b}}<{{p}}$", "Le nombre négatif est le plus petit, puis viennent les nombres positifs.", { a: int(2, 20), b: int(1, 9), p: int(10, 30) }, ["relatif", "comparaison"]),
        q("Quadrant d'un point", "Dans quel quadrant se trouve le point $A(-{{a}};{{b}})$ ?", "en haut à gauche", "L'abscisse est négative et l'ordonnée est positive.", { a: int(1, 9), b: int(1, 9) }, ["coordonnées relatives", "repérage"]),
        q("Point sur l'axe des abscisses", "Le point $A({{a}};0)$ appartient à quel axe ?", "l'axe des abscisses", "Son ordonnée est nulle.", { a: int(-10, 10) }, ["coordonnées relatives", "repérage"]),
        q("Même abscisse", "Les points $A({{a}};{{b}})$ et $B({{a}};{{c}})$ sont alignés selon quelle direction ?", "verticalement", "Ils ont la même abscisse.", { a: int(-8, 8), b: int(-8, -1), c: int(1, 8) }, ["coordonnées relatives", "repérage"])
      ]);

    case "5e-chap-08":
      return withChapter(chapter, [
        q("Centre comme milieu", "A' est l'image de A par la symétrie de centre O. Quelle est la position de O sur $[AA']$ ?", "O est le milieu de $[AA']$", "Une symétrie centrale transforme A en A' par un demi-tour de centre O.", {}, ["symétrie centrale", "centre", "milieu point-image"]),
        q("Point fixe central", "Quel point reste fixe dans une symétrie centrale de centre O ?", "O", "Le centre de la symétrie est son unique point fixe.", {}, ["symétrie centrale", "centre"]),
        q("Conservation des angles", "Un angle de {{a}}° est transformé par symétrie centrale. Quelle est la mesure de son image ?", "{{a}}°", "La symétrie centrale conserve les mesures des angles.", { a: int(20, 150) }, ["symétrie centrale", "conservation"]),
        q("Image d'un segment", "Le segment $[AB]$ a pour image $[A'B']$. Compare les droites $(AB)$ et $(A'B')$.", "elles sont parallèles", "Une symétrie centrale transforme une droite ne passant pas par le centre en une droite parallèle.", {}, ["symétrie centrale", "image d'une droite"])
      ]);

    case "5e-chap-09":
      return withChapter(chapter, [
        q("Traduire une somme", "Écris une expression pour la somme du nombre $n$ et de {{a}}.", "$n+{{a}}$", "On traduit « somme » par une addition.", { a: int(2, 15) }, ["expression littérale", "traduire"]),
        q("Traduire un produit", "Écris une expression pour le produit de {{a}} par le nombre $n$.", "${{a}}n$", "Le produit de {{a}} par $n$ s'écrit ${{a}}\\times n$, soit ${{a}}n$.", { a: int(2, 9) }, ["expression littérale", "traduire"]),
        q("Réduire deux termes", "Réduis ${{a}}n+{{b}}n$.", "${{a+b}}n$", "On additionne les coefficients : ${{a}}+{{b}}={{a+b}}$.", { a: int(2, 9), b: int(2, 9) }, ["réduire", "expression littérale"]),
        q("Valeur d'une expression", "Calcule ${{a}}n+{{b}}$ pour $n={{n}}$.", "{{a*n+b}}", "$ {{a}}\\times{{n}}+{{b}}={{a*n+b}}$.", { a: int(2, 8), b: int(1, 12), n: int(2, 10) }, ["substitution", "valeur d'une expression"]),
        q("Identifier le coefficient", "Dans l'expression ${{a}}n+{{b}}$, quel est le coefficient de $n$ ?", "{{a}}", "Le coefficient est le nombre qui multiplie la variable.", { a: int(2, 9), b: int(1, 15) }, ["expression littérale", "coefficient"]),
        q("Périmètre littéral", "Un rectangle a pour longueur $n+{{a}}$ et pour largeur {{b}}. Écris son périmètre sans développer.", "$2(n+{{a}})+2\\times{{b}}$", "Le périmètre d'un rectangle vaut deux longueurs plus deux largeurs.", { a: int(1, 8), b: int(2, 9) }, ["expression littérale", "modéliser"]),
        q("Expression équivalente", "Laquelle est réduite : ${{a}}n+{{b}}n$ ou ${{a+b}}n$ ?", "${{a+b}}n$", "Les termes de même nature se regroupent.", { a: int(2, 8), b: int(2, 8) }, ["réduire", "expression littérale"]),
        q("Réduire termes et constantes", "Réduis ${{a}}n+{{b}}+{{c}}n+{{d}}$.", "${{a+c}}n+{{b+d}}$", "On regroupe les termes en $n$, puis les constantes.", { a: int(2, 8), b: int(1, 9), c: int(2, 8), d: int(1, 9) }, ["réduire", "expression littérale"]),
        q("Carré dans une expression", "Calcule $n^2+{{b}}$ pour $n={{n}}$.", "{{n*n+b}}", "$ {{n}}^2+{{b}}={{n*n}}+{{b}}={{n*n+b}}$.", { n: int(2, 10), b: int(1, 12) }, ["substitution", "valeur d'une expression"]),
        q("Traduire une différence", "Écris une expression pour la différence entre le nombre $n$ et {{a}}.", "$n-{{a}}$", "On traduit « différence » par une soustraction en respectant l'ordre.", { a: int(2, 15) }, ["expression littérale", "traduire"]),
        q("Aire littérale", "Un rectangle mesure $n$ cm de longueur et {{a}} cm de largeur. Écris son aire.", "${{a}}n$ cm²", "$\\mathcal{A}=n\\times{{a}}={{a}}n$ cm².", { a: int(2, 9) }, ["expression littérale", "modéliser"])
      ]);

    case "5e-chap-10":
      return withChapter(chapter, [
        q("Angle alterne-interne", "Deux parallèles sont coupées par une sécante. Un angle alterne-interne mesure {{a}}°. Quelle est la mesure de son associé ?", "{{a}}°", "Des angles alternes-internes formés par deux parallèles sont égaux.", { a: int(25, 150) }, ["angles alternes-internes", "droites parallèles"], { kind: "parallel-lines", angleLabel: "{{a}}°", anglePair: "alternate-interior" }),
        q("Supplémentaire sur une droite", "Un angle mesure {{a}}°. Calcule l'angle adjacent formant une ligne droite.", "{{180-a}}°", "$180°-{{a}}°={{180-a}}°$.", { a: int(25, 155) }, ["angles parallèles", "sécante"]),
        q("Prouver le parallélisme", "Deux angles correspondants ont la même mesure. Que peut-on conclure sur les deux droites coupées par la sécante ?", "elles sont parallèles", "L'égalité d'angles correspondants permet de prouver le parallélisme.", {}, ["angles correspondants", "droites parallèles"]),
        q("Réciproque avec alternes-internes", "Deux angles alternes-internes sont égaux. Quelle conclusion peut-on formuler ?", "les deux droites sont parallèles", "C'est la réciproque de la propriété des angles alternes-internes.", {}, ["angles alternes-internes", "droites parallèles"]),
        q("Reconnaître la paire", "Deux angles situés entre les parallèles et de part et d'autre de la sécante sont de quel type ?", "alternes-internes", "« Internes » signifie entre les droites et « alternes » signifie de côtés opposés.", {}, ["angle", "alterne", "parallèles"]),
        q("Reconnaître des correspondants", "Deux angles occupent la même position aux deux intersections d'une sécante. Comment les nomme-t-on ?", "angles correspondants", "Ils sont dans des positions correspondantes.", {}, ["angles correspondants", "parallèles"]),
        q("Angles correspondants non égaux", "Deux angles correspondants mesurent {{a}}° et {{a+d}}°. Les droites peuvent-elles être parallèles ?", "Non", "S'ils étaient formés par deux parallèles, les angles correspondants seraient égaux.", { a: int(30, 120), d: int(5, 30) }, ["angles correspondants", "droites parallèles"]),
        q("Angles opposés par le sommet", "À l'intersection d'une sécante et d'une droite, un angle mesure {{a}}°. Combien mesure l'angle opposé par le sommet ?", "{{a}}°", "Deux angles opposés par le sommet ont la même mesure.", { a: int(25, 155) }, ["angles parallèles", "sécante"]),
        q("Correspondant puis supplémentaire", "Deux parallèles sont coupées par une sécante. Un angle mesure {{a}}°. Combien mesure l'angle adjacent à son angle correspondant ?", "{{180-a}}°", "L'angle correspondant mesure {{a}}°, puis son adjacent mesure $180°-{{a}}°={{180-a}}°$.", { a: int(30, 150) }, ["angles correspondants", "droites parallèles"]),
        q("Intérieurs du même côté", "Deux angles intérieurs situés du même côté d'une sécante coupant deux parallèles sont-ils égaux ou supplémentaires ?", "supplémentaires", "Leur somme vaut $180°$.", {}, ["angles parallèles", "sécante"])
      ]);

    case "5e-chap-11":
      return withChapter(chapter, [
        q("Somme de deux négatifs", "Calcule $(-{{a}})+(-{{b}})$.", "{{-a-b}}", "On additionne les distances à zéro et on conserve le signe négatif.", { a: int(2, 20), b: int(2, 20) }, ["addition de relatifs"]),
        q("Somme de signes contraires", "Calcule $(-{{a+b}})+{{a}}$.", "{{-b}}", "Les signes sont contraires : on soustrait les distances à zéro.", { a: int(2, 15), b: int(2, 15) }, ["addition de relatifs"]),
        q("Soustraire un positif", "Calcule ${{a}}-{{b}}$.", "{{a-b}}", "Soustraire {{b}} revient à ajouter $-{{b}}$.", { a: int(-15, 15), b: int(2, 20) }, ["soustraction de relatifs"]),
        q("Soustraire un négatif", "Calcule ${{a}}-(-{{b}})$.", "{{a+b}}", "Soustraire $-{{b}}$ revient à ajouter {{b}}.", { a: int(-15, 15), b: int(2, 20) }, ["soustraction de relatifs"]),
        q("Relatifs décimaux", "Calcule ${{formatDecimalFrench(-a)}}+{{formatDecimalFrench(b)}}$.", "{{formatDecimalFrench(b-a)}}", "On compare les distances à zéro puis on garde le signe du plus éloigné.", { a: decimal(1.1, 9.9, 1), b: decimal(10.1, 19.9, 1) }, ["addition de relatifs", "décimaux"]),
        q("Température", "La température est de $-{{a}}$ °C puis augmente de {{b}} °C. Quelle est la nouvelle température ?", "{{b-a}} °C", "$-{{a}}+{{b}}={{b-a}}$.", { a: int(2, 15), b: int(3, 20) }, ["addition de relatifs", "problème"]),
        q("Altitude relative", "Un plongeur est à $-{{a}}$ m et descend encore de {{b}} m. Quelle est sa nouvelle altitude ?", "{{-a-b}} m", "$-{{a}}-{{b}}={{-a-b}}$.", { a: int(2, 20), b: int(2, 15) }, ["soustraction de relatifs", "problème"]),
        q("Terme manquant relatif", "Complète : $-{{a}}+\\Box={{b}}$.", "{{a+b}}", "$ {{b}}-(-{{a}})={{a+b}}$.", { a: int(2, 15), b: int(2, 15) }, ["addition de relatifs", "nombre manquant"]),
        q("Distance entre deux relatifs", "Quelle est la distance entre $-{{a}}$ et {{b}} sur une droite graduée ?", "{{a+b}}", "$ {{b}}-(-{{a}})={{a+b}}$.", { a: int(2, 15), b: int(2, 15) }, ["soustraction de relatifs", "distance"]),
        q("Ascenseur et étages", "Un ascenseur part de l'étage $-{{a}}$, monte de {{b}} étages puis descend de {{c}} étages. À quel étage arrive-t-il ?", "{{-a+b-c}}", "$-{{a}}+{{b}}-{{c}}={{-a+b-c}}$.", { a: int(1, 5), b: int(6, 15), c: int(2, 8) }, ["addition de relatifs", "soustraction de relatifs", "problème"]),
        q("Opposé d'une somme", "Calcule l'opposé de $(-{{a}})+{{b}}$.", "{{a-b}}", "La somme vaut {{b-a}} ; son opposé vaut {{a-b}}.", { a: int(3, 15), b: int(2, 12) }, ["addition de relatifs", "opposé"]),
        q("Variation totale", "Une température baisse de {{a}} °C puis augmente de {{b}} °C. Quelle est la variation totale ?", "{{b-a}} °C", "$-{{a}}+{{b}}={{b-a}}$.", { a: int(2, 15), b: int(2, 15) }, ["addition de relatifs", "variation"])
      ]);

    case "5e-chap-12":
      return withChapter(chapter, [
        q("Diagonales d'un parallélogramme", "Quelle propriété vérifient les diagonales d'un parallélogramme ?", "elles se coupent en leur milieu", "Le point d'intersection est le milieu de chaque diagonale.", {}, ["parallélogramme", "diagonale"]),
        q("Reconnaître par les diagonales", "Un quadrilatère a des diagonales qui se coupent en leur milieu. Quelle est sa nature ?", "un parallélogramme", "Cette propriété caractérise les parallélogrammes.", {}, ["parallélogramme", "propriété"]),
        q("Côtés opposés parallèles", "Dans un parallélogramme ABCD, quelle relation lie les droites $(AB)$ et $(CD)$ ?", "elles sont parallèles", "Les côtés opposés d'un parallélogramme sont parallèles.", {}, ["parallélogramme", "côtés opposés"]),
        q("Demi-diagonale", "Les diagonales d'un parallélogramme se coupent en O. Si $AC={{2*d}}$ cm, que vaut $AO$ ?", "{{d}} cm", "O est le milieu de $[AC]$, donc $AO=AC\\div2={{d}}$ cm.", { d: int(2, 10) }, ["parallélogramme", "diagonale"]),
        q("Centre de symétrie", "Quel point est le centre de symétrie d'un parallélogramme ?", "l'intersection de ses diagonales", "Un demi-tour autour de l'intersection des diagonales superpose le parallélogramme à lui-même.", {}, ["parallélogramme", "diagonale"]),
        q("Caractériser par deux côtés", "Un quadrilatère possède une paire de côtés opposés à la fois parallèles et de même longueur. Quelle est sa nature ?", "un parallélogramme", "Cette propriété suffit pour caractériser un parallélogramme.", {}, ["parallélogramme", "côtés opposés"])
      ]);

    case "5e-chap-13":
      return withChapter(chapter, [
        q("Lire une puissance", "Dans ${{a}}^{{n}}$, quelle est la base ?", "{{a}}", "La base est le nombre répété dans le produit.", { a: int(2, 9), n: int(2, 6) }, ["puissance", "notation"]),
        q("Lire un exposant", "Dans ${{a}}^{{n}}$, quel est l'exposant ?", "{{n}}", "L'exposant indique le nombre de facteurs égaux à {{a}}.", { a: int(2, 9), n: int(2, 6) }, ["puissance", "notation"]),
        q("Produit sous forme de puissance", "Écris ${{a}}\\times{{a}}\\times{{a}}\\times{{a}}$ sous forme d'une puissance.", "$ {{a}}^4$", "Le facteur {{a}} apparaît quatre fois.", { a: int(2, 9) }, ["puissance", "écriture"]),
        q("Cube d'un entier", "Calcule le cube de {{a}}.", "{{a*a*a}}", "$ {{a}}^3={{a}}\\times{{a}}\\times{{a}}={{a*a*a}}$.", { a: int(2, 10) }, ["puissance", "cube"]),
        q("Décomposition d'une puissance", "Écris ${{a}}^4$ comme un produit de facteurs égaux.", "${{a}}\\times{{a}}\\times{{a}}\\times{{a}}$", "L'exposant 4 indique que le facteur {{a}} apparaît quatre fois.", { a: int(2, 7) }, ["puissance", "écriture"])
      ]);

    case "5e-chap-14":
      return withChapter(chapter, [
        q("Distributivité directe", "Développe ${{a}}(n+{{b}})$.", "${{a}}n+{{a*b}}$", "$ {{a}}(n+{{b}})={{a}}n+{{a}}\\times{{b}}={{a}}n+{{a*b}}$.", { a: int(2, 9), b: int(2, 12) }, ["distributivité", "développer"]),
        q("Distributivité avec différence", "Développe ${{a}}(n-{{b}})$.", "${{a}}n-{{a*b}}$", "$ {{a}}(n-{{b}})={{a}}n-{{a}}\\times{{b}}$.", { a: int(2, 9), b: int(2, 12) }, ["distributivité", "développer"]),
        q("Facteur commun numérique", "Factorise ${{a}}n+{{a*b}}$.", "$ {{a}}(n+{{b}})$", "Le facteur commun {{a}} est placé devant la parenthèse.", { a: int(2, 9), b: int(2, 12) }, ["factoriser", "facteur commun"]),
        q("Factoriser une différence", "Factorise ${{a}}n-{{a*b}}$.", "$ {{a}}(n-{{b}})$", "Les deux termes ont {{a}} comme facteur commun.", { a: int(2, 9), b: int(2, 12) }, ["factoriser", "facteur commun"]),
        q("Tester une distributivité", "Calcule les deux membres de ${{a}}(n+{{b}})={{a}}n+{{a*b}}$ pour $n={{n}}$.", "{{a*(n+b)}} pour chacun", "Membre gauche : {{a*(n+b)}} ; membre droit : ${{a*n}}+{{a*b}}={{a*(n+b)}}$.", { a: int(2, 8), b: int(2, 9), n: int(2, 10) }, ["distributivité", "substitution"]),
        q("Compléter un développement", "Complète : ${{a}}(n+{{b}})={{a}}n+\\Box$.", "{{a*b}}", "Le second terme vaut ${{a}}\\times{{b}}={{a*b}}$.", { a: int(2, 9), b: int(2, 12) }, ["distributivité", "développer"]),
        q("Choisir la forme factorisée", "Quelle forme est factorisée : ${{a}}n+{{a*b}}$ ou ${{a}}(n+{{b}})$ ?", "$ {{a}}(n+{{b}})$", "Une forme factorisée est écrite comme un produit.", { a: int(2, 9), b: int(2, 12) }, ["factoriser", "distributivité"]),
        q("Réduire après développement", "Développe puis réduis ${{a}}(n+{{b}})+{{c}}n$.", "${{a+c}}n+{{a*b}}$", "On développe puis on regroupe ${{a}}n+{{c}}n$.", { a: int(2, 7), b: int(2, 10), c: int(2, 7) }, ["distributivité", "développer"]),
        q("Facteur littéral commun", "Factorise ${{a}}n+{{b}}n$ par $n$.", "$n({{a+b}})$", "Le facteur commun aux deux termes est $n$.", { a: int(2, 9), b: int(2, 9) }, ["factoriser", "facteur commun"]),
        q("Distributivité numérique", "Calcule astucieusement ${{a}}\\times{{b}}+{{a}}\\times{{c}}$ en factorisant.", "{{a*(b+c)}}", "$ {{a}}\\times({{b}}+{{c}})={{a}}\\times{{b+c}}={{a*(b+c)}}$.", { a: int(2, 12), b: int(3, 15), c: int(2, 10) }, ["distributivité", "factoriser"]),
        q("Repérer une erreur de développement", "L'égalité ${{a}}(n+{{b}})={{a}}n+{{b}}$ est-elle correcte ?", "Non", "Il faut multiplier les deux termes de la parenthèse : ${{a}}n+{{a*b}}$.", { a: int(2, 9), b: int(2, 12) }, ["distributivité", "développer"]),
        q("Compléter une factorisation", "Complète : ${{a}}n+{{a*b}}={{a}}(n+\\Box)$.", "{{b}}", "En divisant le second terme par {{a}}, on obtient {{b}}.", { a: int(2, 9), b: int(2, 12) }, ["factoriser", "facteur commun"])
      ]);

    case "5e-chap-15":
      return withChapter(chapter, [
        q("Lire le maximum d'un graphique", "Un graphique donne {{a}} ventes en janvier, {{b}} en février et {{c}} en mars. Quel mois a la valeur la plus élevée ?", "mars", "La barre de mars atteint {{c}}, valeur supérieure à {{a}} et {{b}}.", { a: int(10, 20), b: int(21, 30), c: int(31, 45) }, ["graphique", "lecture", "maximum"]),
        q("Total de trois catégories", "Un graphique présente trois effectifs : {{a}}, {{b}} et {{c}}. Quel est l'effectif total ?", "{{a+b+c}}", "$ {{a}}+{{b}}+{{c}}={{a+b+c}}$.", { a: int(8, 20), b: int(8, 20), c: int(8, 20) }, ["graphique", "effectif", "total"]),
        q("Secteur circulaire", "Dans un diagramme circulaire, un secteur mesure {{angle}}°. Quel pourcentage du disque représente-t-il ?", "{{angle/3.6}} %", "$ {{angle}}\\div360\\times100={{angle/3.6}}\%$.", { angle: choice([90, 180, 270]) }, ["diagramme", "pourcentage", "angle"]),
        q("Effectif à partir d'un pourcentage", "Dans un groupe de {{total}} personnes, {{p}} % choisissent une activité. Combien de personnes cela représente-t-il ?", "{{total*p/100}} personnes", "$ {{total}}\\times{{p}}\\div100={{total*p/100}}$.", { total: choice([40, 100]), p: choice([10, 20, 25, 50]) }, ["pourcentage", "effectif", "diagramme"]),
        q("Choisir une représentation", "Pour comparer visuellement les effectifs de plusieurs catégories, quel type de diagramme est particulièrement adapté ?", "un diagramme en barres", "La hauteur de chaque barre permet de comparer rapidement les effectifs.", {}, ["graphique", "diagramme", "lecture"])
      ]);

    case "5e-chap-16":
      return withChapter(chapter, [
        q("Aire d'un carré", "Calcule l'aire d'un carré de côté {{c}} cm.", "{{c*c}} cm²", "$\\mathcal{A}={{c}}^2={{c*c}}$ cm².", { c: int(2, 15) }, ["aire", "formule"]),
        q("Aire d'un parallélogramme", "Un parallélogramme a une base de {{b}} cm et une hauteur de {{h}} cm. Calcule son aire.", "{{b*h}} cm²", "$\\mathcal{A}=b\\times h={{b}}\\times{{h}}={{b*h}}$ cm².", { b: int(3, 15), h: int(2, 12) }, ["aire", "formule"]),
        q("Hauteur d'un triangle", "Un triangle a une aire de {{b*h/2}} cm² et une base de {{b}} cm. Quelle est sa hauteur ?", "{{h}} cm", "$h=2\\mathcal{A}\\div b={{b*h}}\\div{{b}}={{h}}$ cm.", { b: choice([4, 6, 8, 10, 12]), h: int(3, 12) }, ["aire d'un triangle", "hauteur"]),
        q("Rayon à partir du diamètre", "Un disque a un diamètre de {{2*r}} cm. Quel rayon utiliser dans la formule de son aire ?", "{{r}} cm", "Le rayon est la moitié du diamètre : ${{2*r}}\\div2={{r}}$ cm.", { r: int(2, 10) }, ["aire d'un disque", "rayon"], { kind: "circle", radiusLabel: "?" }),
        q("Aire du disque avec pi", "Calcule l'aire d'un disque de rayon {{r}} cm avec $\\pi\\approx3{,}14$.", "{{formatDecimalFrench(3.14*r*r)}} cm²", "$\\mathcal{A}=\\pi r^2\\approx3{,}14\\times{{r}}^2={{formatDecimalFrench(3.14*r*r)}}$ cm².", { r: int(2, 8) }, ["aire d'un disque", "formule"], { kind: "circle", radiusLabel: "{{r}} cm" }),
        q("Choisir l'unité d'aire", "Quelle unité convient à l'aire d'une feuille : cm, cm² ou cm³ ?", "cm²", "Une aire s'exprime avec une unité carrée.", {}, ["aire", "unité"])
      ]);

    case "5e-chap-17":
      return withChapter(chapter, [
        q("Équation additive", "Résous $n+{{a}}={{b}}$.", "$n={{b-a}}$", "On soustrait {{a}} aux deux membres.", { a: int(2, 20), b: int(25, 60) }, ["équation", "résolution"]),
        q("Équation soustractive", "Résous $n-{{a}}={{b}}$.", "$n={{a+b}}$", "On ajoute {{a}} aux deux membres.", { a: int(2, 20), b: int(2, 30) }, ["équation", "résolution"]),
        q("Équation multiplicative", "Résous ${{a}}n={{a*x}}$.", "$n={{x}}$", "On divise les deux membres par {{a}}.", { a: int(2, 9), x: int(2, 15) }, ["équation", "résolution"]),
        q("Équation avec quotient", "Résous $n\\div{{a}}={{b}}$.", "$n={{a*b}}$", "On multiplie les deux membres par {{a}}.", { a: int(2, 9), b: int(2, 15) }, ["équation", "résolution"]),
        q("Vérifier une égalité", "Le nombre {{x}} est-il solution de ${{a}}n+{{b}}={{a*x+b}}$ ?", "Oui", "$ {{a}}\\times{{x}}+{{b}}={{a*x+b}}$.", { a: int(2, 8), b: int(1, 15), x: int(2, 12) }, ["équation", "vérifier une solution"]),
        q("Solution non valable", "Le nombre {{x+1}} est-il solution de ${{a}}n={{a*x}}$ ?", "Non", "$ {{a}}\\times{{x+1}}={{a*(x+1)}}\\ne{{a*x}}$.", { a: int(2, 9), x: int(2, 12) }, ["équation", "tester une solution"]),
        q("Mettre en équation", "Un nombre augmenté de {{a}} vaut {{b}}. Quelle équation traduit cette phrase ?", "$n+{{a}}={{b}}$", "On note le nombre inconnu $n$ puis on traduit « augmenté de » par +.", { a: int(2, 15), b: int(20, 50) }, ["équation", "modéliser"])
      ]);

    case "5e-chap-19":
      return withChapter(chapter, [
        q("Volume d'un cube", "Calcule le volume d'un cube d'arête {{a}} cm.", "{{a*a*a}} cm³", "$V={{a}}^3={{a*a*a}}$ cm³.", { a: int(2, 10) }, ["volume", "pavé"], { kind: "solid", solid: "pave", labels: ["{{a}} cm", "{{a}} cm", "{{a}} cm"] }),
        q("Volume par aire de base", "Un prisme a une aire de base de {{base}} cm² et une hauteur de {{h}} cm. Calcule son volume.", "{{base*h}} cm³", "$V=\\mathcal{A}_{\\text{base}}\\times h={{base}}\\times{{h}}={{base*h}}$ cm³.", { base: int(6, 30), h: int(3, 12) }, ["volume prisme", "base"], { kind: "solid", solid: "prisme", labels: ["base {{base}} cm²", "hauteur {{h}} cm", ""] }),
        q("Hauteur d'un prisme", "Un prisme a un volume de {{base*h}} cm³ et une aire de base de {{base}} cm². Quelle est sa hauteur ?", "{{h}} cm", "$h=V\\div \\mathcal{A}_{\\text{base}}={{base*h}}\\div{{base}}={{h}}$ cm.", { base: int(6, 30), h: int(3, 12) }, ["volume prisme", "hauteur"], { kind: "solid", solid: "prisme", labels: ["base {{base}} cm²", "hauteur", ""] }),
        q("Volume d'un cylindre", "Calcule le volume d'un cylindre de rayon {{r}} cm et de hauteur {{h}} cm avec $\\pi\\approx3{,}14$.", "{{formatDecimalFrench(3.14*r*r*h)}} cm³", "$V=\\pi r^2h\\approx3{,}14\\times{{r}}^2\\times{{h}}={{formatDecimalFrench(3.14*r*r*h)}}$ cm³.", { r: int(2, 6), h: int(3, 12) }, ["volume cylindre"], { kind: "solid", solid: "cylindre", labels: ["{{r}} cm", "{{h}} cm"] }),
        q("Litres en centimètres cubes", "Convertis {{v}} L en cm³.", "{{v*1000}} cm³", "$1$ L = $1000$ cm³.", { v: int(2, 20) }, ["conversion de volume"]),
        q("Centimètres cubes en litres", "Convertis {{v*1000}} cm³ en litres.", "{{v}} L", "On divise par 1000 car $1000$ cm³ = $1$ L.", { v: int(2, 20) }, ["conversion de volume"]),
        q("Comparer des volumes", "Un pavé a un volume de {{v}} cm³ et un prisme {{v+d}} cm³. Lequel est le plus volumineux ?", "le prisme", "$ {{v+d}}>{{v}}$.", { v: int(50, 300), d: int(10, 100) }, ["volume prisme", "comparaison"]),
        q("Formule du cylindre", "Quelle formule permet de calculer le volume d'un cylindre de rayon $r$ et de hauteur $h$ ?", "$V=\\pi r^2h$", "On multiplie l'aire du disque de base $\\pi r^2$ par la hauteur $h$.", {}, ["volume cylindre", "formule"]),
        q("Aire de base d'un prisme", "Un prisme a un volume de {{base*h}} cm³ et une hauteur de {{h}} cm. Quelle est l'aire de sa base ?", "{{base}} cm²", "$\\mathcal{A}_{\\text{base}}=V\\div h={{base*h}}\\div{{h}}={{base}}$ cm².", { base: int(6, 30), h: int(3, 12) }, ["volume prisme", "base"]),
        q("Diamètre d'un cylindre", "Un cylindre a un diamètre de {{2*r}} cm. Quel rayon faut-il utiliser dans sa formule de volume ?", "{{r}} cm", "Le rayon est la moitié du diamètre.", { r: int(2, 8) }, ["volume cylindre", "rayon"]),
        q("Unité de volume", "Quelle unité convient au volume d'une boîte mesurée en centimètres : cm, cm² ou cm³ ?", "cm³", "Un volume s'exprime avec une unité cubique.", {}, ["volume prisme", "unité"])
      ]);

    default:
      return [];
  }
}

function fourthGradeCompletions(chapter: ChapterInfo): ChapterCompletionTemplate[] {
  switch (chapter.id) {
    case "4e-chap-01":
      return withChapter(chapter, [
        q("Quatrième proportionnelle", "Complète $\\dfrac{ {{a}} }{ {{b}} }=\\dfrac{ n }{ {{d}} }$.", "$n={{a*d/b}}$", "$n={{a}}\\times{{d}}\\div{{b}}={{a*d/b}}$.", { a: choice([2, 3, 4, 5]), b: choice([2, 4, 5, 10]), d: choice([20, 40, 60]) }, ["produit en croix", "quatrième proportionnelle"]),
        q("Produit des extrêmes", "Pour tester si $\\dfrac{ {{a}} }{ {{b}} }$ et $\\dfrac{ {{c}} }{ {{d}} }$ sont égaux, quel produit compare-t-on à ${{b}}\\times{{c}}$ ?", "$ {{a}}\\times{{d}}$", "Les deux rapports sont égaux exactement lorsque les produits en croix sont égaux.", { a: int(2, 9), b: int(2, 9), c: int(2, 9), d: int(2, 9) }, ["produit en croix", "égalité de rapports"]),
        q("Vérifier deux rapports", "Les rapports $\\dfrac{ {{a}} }{ {{b}} }$ et $\\dfrac{ {{a*k}} }{ {{b*k}} }$ sont-ils égaux ?", "Oui", "$ {{a}}\\times{{b*k}}={{a*b*k}}$ et ${{b}}\\times{{a*k}}={{a*b*k}}$.", { a: int(2, 9), b: int(2, 9), k: int(2, 6) }, ["produit en croix", "égalité de rapports"]),
        q("Rapports non égaux", "Les rapports $\\dfrac{ {{a}} }{ {{b}} }$ et $\\dfrac{ {{a*k+1}} }{ {{b*k}} }$ sont-ils égaux ?", "Non", "Les deux produits en croix diffèrent de {{b}}.", { a: int(2, 8), b: int(2, 8), k: int(2, 5) }, ["produit en croix", "égalité de rapports"]),
        q("Prix par produit en croix", "{{a}} articles coûtent {{a*p}} €. Combien coûtent {{q}} articles au même prix unitaire ?", "{{p*q}} €", "$n={{a*p}}\\times{{q}}\\div{{a}}={{p*q}}$.", { a: int(2, 7), p: int(2, 12), q: int(8, 15) }, ["produit en croix", "quatrième proportionnelle"]),
        q("Échelle par produit en croix", "Sur un plan, {{map}} cm représentent {{real}} m. Une autre longueur mesure {{other}} cm sur le plan. Quelle distance réelle représente-t-elle ?", "{{real*other/map}} m", "$n={{real}}\\times{{other}}\\div{{map}}={{real*other/map}}$.", { map: choice([2, 4, 5]), real: choice([20, 40, 100]), other: choice([20, 40]) }, ["produit en croix", "quatrième proportionnelle"]),
        q("Tableau à compléter", "Dans un tableau proportionnel, {{a}} correspond à {{b}} et {{c}} correspond à $n$. Écris le calcul de $n$ par produit en croix.", "$n={{b}}\\times{{c}}\\div{{a}}$", "On multiplie les valeurs en diagonale puis on divise par la troisième.", { a: int(2, 9), b: int(3, 15), c: int(4, 12) }, ["produit en croix", "quatrième proportionnelle"]),
        q("Unité de la valeur cherchée", "Dans un tableau de prix, les valeurs de la seconde ligne sont exprimées en euros. Dans quelle unité s'exprime la valeur cherchée sur cette ligne ?", "en euros", "Une valeur cherchée conserve l'unité de la ligne à laquelle elle appartient.", {}, ["quatrième proportionnelle", "tableau", "unité"])
      ]);

    case "4e-chap-02":
      return withChapter(chapter, [
        q("Quotient de signes contraires", "Calcule $(-{{a*b}})\\div{{b}}$.", "{{-a}}", "Le quotient de deux nombres de signes contraires est négatif.", { a: int(2, 15), b: int(2, 10) }, ["relatifs", "quotient", "règle de signes"]),
        q("Quotient de deux négatifs", "Calcule $(-{{a*b}})\\div(-{{b}})$.", "{{a}}", "Le quotient de deux nombres négatifs est positif.", { a: int(2, 15), b: int(2, 10) }, ["relatifs", "quotient", "règle de signes"]),
        q("Produit de trois relatifs", "Détermine le signe de $(-{{a}})\\times(-{{b}})\\times(-{{c}})$.", "négatif", "Il y a trois facteurs négatifs : leur nombre est impair.", { a: int(2, 9), b: int(2, 9), c: int(2, 9) }, ["relatifs", "produit", "règle de signes"]),
        q("Produit avec quatre facteurs", "Détermine le signe d'un produit de quatre facteurs négatifs.", "positif", "Un nombre pair de facteurs négatifs donne un produit positif.", {}, ["relatifs", "produit", "règle de signes"]),
        q("Expression avec parenthèses", "Calcule $(-{{a}})\\times({{b}}-{{c}})$.", "{{-a*(b-c)}}", "On calcule d'abord la parenthèse, puis on applique la règle des signes.", { a: int(2, 9), b: int(10, 20), c: int(2, 9) }, ["relatifs", "parenthèses", "produit"]),
        q("Produit de relatifs décimaux", "Calcule ${{formatDecimalFrench(-a)}}\\times{{b}}$.", "{{formatDecimalFrench(-a*b)}}", "Un facteur est négatif et l'autre positif : le produit est négatif.", { a: decimal(1.1, 9.9, 1), b: int(2, 8) }, ["relatifs", "produit", "décimaux"])
      ]);

    case "4e-chap-04":
      return withChapter(chapter, [
        q("Calculer une distance", "Un véhicule roule à {{v}} km/h pendant {{t}} h. Quelle distance parcourt-il ?", "{{v*t}} km", "$d=v\\times t={{v}}\\times{{t}}={{v*t}}$ km.", { v: choice([40, 50, 60, 80, 90]), t: int(2, 5) }, ["vitesse", "distance"]),
        q("Calculer une durée", "Un train parcourt {{v*t}} km à {{v}} km/h. Quelle est la durée du trajet ?", "{{t}} h", "$t=d\\div v={{v*t}}\\div{{v}}={{t}}$ h.", { v: choice([50, 60, 80, 100]), t: int(2, 6) }, ["vitesse", "durée"]),
        q("Vitesse en mètres par seconde", "Un coureur parcourt {{v*t}} m en {{t}} s. Calcule sa vitesse moyenne.", "{{v}} m/s", "$v=d\\div t={{v*t}}\\div{{t}}={{v}}$ m/s.", { v: int(3, 12), t: int(5, 20) }, ["vitesse", "grandeur composée"]),
        q("Kilomètres par heure vers mètres par seconde", "Convertis {{v*3.6}} km/h en m/s.", "{{v}} m/s", "On divise une vitesse en km/h par 3,6.", { v: choice([5, 10, 15, 20, 25]) }, ["vitesse", "conversion"]),
        q("Mètres par seconde vers kilomètres par heure", "Convertis {{v}} m/s en km/h.", "{{formatDecimalFrench(v*3.6)}} km/h", "On multiplie une vitesse en m/s par 3,6.", { v: choice([5, 10, 15, 20, 25]) }, ["vitesse", "conversion"]),
        q("Distance en minutes", "Un cycliste roule à {{v}} km/h pendant 30 minutes. Quelle distance parcourt-il ?", "{{v/2}} km", "30 minutes représentent une demi-heure, donc $d={{v}}\\times0{,}5={{v/2}}$ km.", { v: choice([20, 30, 40, 50]) }, ["vitesse", "distance", "durée"]),
        q("Durée en minutes", "À {{v}} km/h, combien de minutes faut-il pour parcourir {{v/2}} km ?", "30 minutes", "$t={{v/2}}\\div{{v}}=0{,}5$ h, soit 30 minutes.", { v: choice([20, 30, 40, 50]) }, ["vitesse", "durée"]),
        q("Comparer deux vitesses", "Qui va le plus vite : A à {{v}} m/s ou B à {{formatDecimalFrench(v*3.6+d)}} km/h ?", "B", "A roule à {{formatDecimalFrench(v*3.6)}} km/h et ${{formatDecimalFrench(v*3.6+d)}}>{{formatDecimalFrench(v*3.6)}}$.", { v: int(5, 20), d: int(2, 15) }, ["vitesse", "comparaison", "conversion"]),
        q("Formule de la vitesse", "Quelle formule permet de calculer une vitesse moyenne à partir de la distance et de la durée ?", "$v=\\dfrac d t$", "Une vitesse est une distance parcourue par unité de temps.", {}, ["vitesse", "formule"])
      ]);

    case "4e-chap-06":
      return withChapter(chapter, [
        q("Calculer une hypoténuse 3-4-5", "Un triangle rectangle a pour côtés de l'angle droit {{3*k}} cm et {{4*k}} cm. Calcule son hypoténuse.", "{{5*k}} cm", "$c=\\sqrt{({{3*k}})^2+({{4*k}})^2}={{5*k}}$ cm.", { k: int(1, 4) }, ["pythagore", "calcul-longueur", "hypoténuse"], { kind: "right-triangle", legALabel: "{{3*k}} cm", legBLabel: "{{4*k}} cm", hypotenuseLabel: "?" }),
        q("Calculer une hypoténuse 5-12-13", "Les côtés de l'angle droit d'un triangle rectangle mesurent {{5*k}} cm et {{12*k}} cm. Calcule l'hypoténuse.", "{{13*k}} cm", "$c=\\sqrt{({{5*k}})^2+({{12*k}})^2}={{13*k}}$ cm.", { k: int(1, 3) }, ["pythagore", "calcul-longueur", "hypoténuse"], { kind: "right-triangle", legALabel: "{{5*k}} cm", legBLabel: "{{12*k}} cm", hypotenuseLabel: "?" }),
        q("Calculer un côté 5-12-13", "L'hypoténuse d'un triangle rectangle mesure {{13*k}} cm et un côté de l'angle droit {{5*k}} cm. Calcule l'autre côté.", "{{12*k}} cm", "$b=\\sqrt{({{13*k}})^2-({{5*k}})^2}={{12*k}}$ cm.", { k: int(1, 3) }, ["pythagore", "calcul-longueur", "côté"], { kind: "right-triangle", legALabel: "{{5*k}} cm", legBLabel: "?", hypotenuseLabel: "{{13*k}} cm" }),
        q("Calculer un côté 6-8-10", "Dans un triangle rectangle, l'hypoténuse mesure {{10*k}} cm et un autre côté {{6*k}} cm. Calcule le dernier côté.", "{{8*k}} cm", "$b=\\sqrt{({{10*k}})^2-({{6*k}})^2}={{8*k}}$ cm.", { k: int(1, 4) }, ["pythagore", "calcul-longueur", "côté"], { kind: "right-triangle", legALabel: "{{6*k}} cm", legBLabel: "?", hypotenuseLabel: "{{10*k}} cm" }),
        q("Hypoténuse arrondie", "Les côtés de l'angle droit mesurent {{a}} cm et {{b}} cm. Calcule l'hypoténuse au dixième près.", "{{formatDecimalFrench(roundTo(Math.sqrt(a*a+b*b),1))}} cm", "$c=\\sqrt{ {{a}}^2+{{b}}^2}\\approx{{formatDecimalFrench(roundTo(Math.sqrt(a*a+b*b),1))}}$ cm.", { a: choice([5, 7, 9]), b: choice([6, 8, 10]) }, ["pythagore", "calcul-longueur", "arrondi"], { kind: "right-triangle", legALabel: "{{a}} cm", legBLabel: "{{b}} cm", hypotenuseLabel: "?" }),
        q("Côté arrondi", "Une hypoténuse mesure 10 cm et un côté de l'angle droit 7 cm. Calcule l'autre côté au dixième près.", "7,1 cm", "$b=\\sqrt{10^2-7^2}=\\sqrt{51}\\approx7{,}1$ cm.", {}, ["pythagore", "calcul-longueur", "arrondi"], { kind: "right-triangle", legALabel: "7 cm", legBLabel: "?", hypotenuseLabel: "10 cm" }),
        q("Formule de l'hypoténuse", "ABC est rectangle en A. Quelle formule permet de calculer BC à partir de AB et AC ?", "$BC=\\sqrt{AB^2+AC^2}$", "On part de $BC^2=AB^2+AC^2$ puis on prend la racine carrée.", {}, ["pythagore", "calcul-longueur", "formule"], { kind: "right-triangle", legALabel: "AB", legBLabel: "AC", hypotenuseLabel: "BC" }),
        q("Formule d'un côté de l'angle droit", "ABC est rectangle en A. Quelle formule permet de calculer AB à partir de BC et AC ?", "$AB=\\sqrt{BC^2-AC^2}$", "De $BC^2=AB^2+AC^2$, on déduit $AB^2=BC^2-AC^2$.", {}, ["pythagore", "calcul-longueur", "formule"], { kind: "right-triangle", legALabel: "AB", legBLabel: "AC", hypotenuseLabel: "BC" })
      ]);

    case "4e-chap-07":
      return withChapter(chapter, [
        q("Développement avec relatif", "Développe $-{{a}}(n+{{b}})$.", "$-{{a}}n-{{a*b}}$", "On distribue $-{{a}}$ à chacun des termes.", { a: int(2, 9), b: int(2, 12) }, ["développer", "distributivité"]),
        q("Développement d'une différence", "Développe ${{a}}({{b}}-n)$.", "${{a*b}}-{{a}}n$", "$ {{a}}\\times{{b}}-{{a}}\\times n$.", { a: int(2, 9), b: int(2, 12) }, ["développer", "distributivité"]),
        q("Factoriser par une variable", "Factorise ${{a}}n^2+{{b}}n$.", "$n({{a}}n+{{b}})$", "Les deux termes contiennent le facteur commun $n$.", { a: int(2, 8), b: int(2, 10) }, ["factoriser", "facteur commun"]),
        q("Factoriser un coefficient", "Factorise ${{a*c}}n+{{a*b}}$ par {{a}}.", "$ {{a}}({{c}}n+{{b}})$", "On divise chaque terme par le facteur commun {{a}}.", { a: int(2, 8), b: int(2, 10), c: int(2, 8) }, ["factoriser", "facteur commun"]),
        q("Réduire après développement", "Développe et réduis ${{a}}(n+{{b}})-{{c}}n$.", "${{a-c}}n+{{a*b}}$", "Après développement, on regroupe les termes en $n$.", { a: int(5, 12), b: int(2, 9), c: int(2, 4) }, ["développer", "réduire"]),
        q("Facteur commun négatif", "Factorise $-{{a}}n-{{a*b}}$.", "$-{{a}}(n+{{b}})$", "Le facteur commun $-{{a}}$ fait apparaître une somme dans la parenthèse.", { a: int(2, 9), b: int(2, 10) }, ["factoriser", "facteur commun"]),
        q("Développer un produit négatif", "Développe $-{{a}}(n-{{b}})$.", "$-{{a}}n+{{a*b}}$", "$-{{a}}\\times n+{{a}}\\times{{b}}=-{{a}}n+{{a*b}}$.", { a: int(2, 9), b: int(2, 10) }, ["développer", "distributivité", "relatif"]),
        q("Factoriser un binôme commun", "Factorise ${{a}}(n+{{b}})+{{c}}(n+{{b}})$.", "${{a+c}}(n+{{b}})$", "Le facteur commun est $(n+{{b}})$ ; on additionne {{a}} et {{c}}.", { a: int(2, 8), b: int(2, 9), c: int(2, 8) }, ["factoriser", "facteur commun"])
      ]);

    case "4e-chap-08":
      return withChapter(chapter, [
        q("Reconnaître un nombre premier", "Le nombre {{p}} est-il premier ?", "Oui", "Ses seuls diviseurs positifs sont 1 et lui-même.", { p: choice([2, 3, 5, 7, 11, 13, 17, 19, 23, 29]) }, ["nombre premier", "divisibilité"]),
        q("Reconnaître un nombre composé", "Le nombre {{a*b}} est-il premier ?", "Non", "Il possède les diviseurs {{a}} et {{b}} en plus de 1 et lui-même.", { a: int(2, 8), b: int(2, 9) }, ["nombre premier", "divisibilité"]),
        q("Décomposition en facteurs premiers", "Décompose {{2*3*p}} en facteurs premiers.", "$2\\times3\\times{{p}}$", "On divise successivement par les plus petits nombres premiers.", { p: choice([5, 7, 11, 13]) }, ["décomposition", "nombre premier"]),
        q("Nombre de diviseurs", "Liste les diviseurs positifs de 12.", "1, 2, 3, 4, 6 et 12", "On associe les produits $1\\times12$, $2\\times6$ et $3\\times4$.", {}, ["diviseur", "divisibilité"]),
        q("Diviseur commun", "Quel est le plus grand diviseur commun de {{2*a}} et {{3*a}} lorsque {{a}} est premier ?", "{{a}}", "$ {{2*a}}=2\\times{{a}}$ et ${{3*a}}=3\\times{{a}}$.", { a: choice([5, 7, 11, 13]) }, ["diviseur", "décomposition"]),
        q("Simplifier avec les facteurs premiers", "Simplifie $\\dfrac{ {{2*3*p}} }{ {{3*p}} }$.", "$2$", "On simplifie les facteurs communs $3$ et {{p}}.", { p: choice([5, 7, 11]) }, ["divisibilité", "décomposition"]),
        q("Critère de divisibilité par 9", "Le nombre {{100*a+10*b+c}} est-il divisible par 9 ?", "{{(a+b+c)%9===0 ? 'Oui' : 'Non'}}", "On additionne les chiffres : ${{a}}+{{b}}+{{c}}={{a+b+c}}$.", { a: int(1, 9), b: int(0, 9), c: int(0, 9) }, ["divisibilité", "critère"]),
        q("Multiple d'un nombre premier", "Quel est le plus petit multiple positif commun de {{p}} et {{qv}} ?", "{{p*qv}}", "Deux nombres premiers distincts n'ont pas de diviseur commun autre que 1.", { p: choice([3, 5, 7]), qv: choice([11, 13]) }, ["multiple", "nombre premier"]),
        q("Facteur premier manquant", "Complète la décomposition : ${{2*2*3*p}}=2^2\\times3\\times\\Box$.", "{{p}}", "Le facteur premier manquant est {{p}}.", { p: choice([5, 7, 11, 13]) }, ["décomposition", "nombre premier", "facteur"]),
        q("Diviseurs premiers d'un entier", "Quels sont les diviseurs premiers de {{2*3*p}} ?", "2, 3 et {{p}}", "$ {{2*3*p}}=2\\times3\\times{{p}}$.", { p: choice([5, 7, 11]) }, ["diviseur", "nombre premier", "décomposition"])
      ]);

    case "4e-chap-09":
      return withChapter(chapter, [
        q("Rectangle 3-4-5", "Un triangle a pour côtés {{3*k}} cm, {{4*k}} cm et {{5*k}} cm. Est-il rectangle ?", "Oui", "$({{3*k}})^2+({{4*k}})^2=({{5*k}})^2$ : d'après la réciproque de Pythagore, il est rectangle.", { k: int(1, 5) }, ["pythagore", "reciproque", "classification-pythagore"], { kind: "triangle", labelA: "{{3*k}} cm", labelB: "{{4*k}} cm", labelC: "{{5*k}} cm" }),
        q("Rectangle 5-12-13", "Un triangle a pour côtés {{5*k}} cm, {{12*k}} cm et {{13*k}} cm. Est-il rectangle ?", "Oui", "$({{5*k}})^2+({{12*k}})^2=({{13*k}})^2$ : la réciproque de Pythagore s'applique.", { k: int(1, 3) }, ["pythagore", "reciproque", "classification-pythagore"], { kind: "triangle", labelA: "{{5*k}} cm", labelB: "{{12*k}} cm", labelC: "{{13*k}} cm" }),
        q("Non rectangle 3-4-6", "Un triangle a pour côtés {{3*k}} cm, {{4*k}} cm et {{6*k}} cm. Est-il rectangle ?", "Non", "$({{3*k}})^2+({{4*k}})^2\\ne({{6*k}})^2$ : d'après la contraposée de Pythagore, il n'est pas rectangle.", { k: int(1, 4) }, ["pythagore", "contraposee", "classification-pythagore"], { kind: "triangle", labelA: "{{3*k}} cm", labelB: "{{4*k}} cm", labelC: "{{6*k}} cm" }),
        q("Non rectangle 5-12-14", "Un triangle a pour côtés {{5*k}} cm, {{12*k}} cm et {{14*k}} cm. Est-il rectangle ?", "Non", "$({{5*k}})^2+({{12*k}})^2\\ne({{14*k}})^2$ : il n'est pas rectangle.", { k: int(1, 3) }, ["pythagore", "contraposee", "classification-pythagore"], { kind: "triangle", labelA: "{{5*k}} cm", labelB: "{{12*k}} cm", labelC: "{{14*k}} cm" }),
        q("Choisir le plus grand côté", "Pour tester un triangle de côtés 9 cm, 12 cm et 15 cm, quel carré doit-on comparer à la somme des deux autres ?", "$15^2$", "On compare toujours le carré du plus grand côté, ici $15^2$, à $9^2+12^2$.", {}, ["pythagore", "reciproque", "classification-pythagore"], { kind: "triangle", labelA: "9 cm", labelB: "12 cm", labelC: "15 cm" }),
        q("Égalité de la réciproque", "Si $c$ est le plus grand côté, quelle égalité prouve qu'un triangle est rectangle ?", "$c^2=a^2+b^2$", "Lorsque cette égalité est vérifiée, la réciproque du théorème de Pythagore permet de conclure.", {}, ["pythagore", "reciproque", "classification-pythagore"], { kind: "triangle", labelA: "a", labelB: "b", labelC: "c" }),
        q("Inégalité et conclusion", "Si $c$ est le plus grand côté et $c^2\\ne a^2+b^2$, que conclure ?", "le triangle n'est pas rectangle", "C'est la contraposée du théorème de Pythagore.", {}, ["pythagore", "contraposee", "classification-pythagore"], { kind: "triangle", labelA: "a", labelB: "b", labelC: "c" }),
        q("Nom de la propriété", "Quelle propriété utilise-t-on pour prouver qu'un triangle est rectangle à partir de ses trois longueurs ?", "la réciproque du théorème de Pythagore", "On vérifie d'abord l'égalité entre le carré du plus grand côté et la somme des carrés des deux autres.", {}, ["pythagore", "reciproque", "classification-pythagore"], { kind: "triangle", labelA: "a", labelB: "b", labelC: "c" }),
        q("Sommet de l'angle droit", "Dans ABC, $AB=6$ cm, $AC=8$ cm et $BC=10$ cm. Après vérification, à quel sommet se trouve l'angle droit ?", "en A", "$6^2+8^2=10^2$ ; l'angle droit est opposé au plus grand côté $[BC]$, donc il est en A.", {}, ["pythagore", "reciproque", "classification-pythagore"], { kind: "triangle", labelA: "6 cm", labelB: "10 cm", labelC: "8 cm" }),
        q("Longueur pour rendre le triangle rectangle", "Un triangle a deux côtés de 9 cm et 12 cm formant l'angle que l'on veut droit. Quelle doit être la longueur du troisième côté ?", "15 cm", "$9^2+12^2=225=15^2$.", {}, ["pythagore", "reciproque", "classification-pythagore"], { kind: "triangle", labelA: "9 cm", labelB: "?", labelC: "12 cm" }),
        q("Repérer une comparaison incorrecte", "Pour tester les longueurs 6 cm, 8 cm et 10 cm, un élève compare $6^2$ à $8^2+10^2$. Quelle erreur commet-il ?", "il ne met pas le plus grand côté seul", "Il faut comparer $10^2$, carré du plus grand côté, à $6^2+8^2$.", {}, ["pythagore", "reciproque", "classification-pythagore", "erreur"]),
        q("Carré du plus grand côté", "Pour les longueurs 9 cm, 12 cm et 15 cm, calcule le carré du plus grand côté.", "225", "$15^2=225$.", {}, ["pythagore", "reciproque", "classification-pythagore"], { kind: "triangle", labelA: "9 cm", labelB: "12 cm", labelC: "15 cm" }),
        q("Somme des deux autres carrés", "Pour les longueurs 9 cm, 12 cm et 15 cm, calcule la somme des carrés des deux plus petits côtés.", "225", "$9^2+12^2=81+144=225$.", {}, ["pythagore", "reciproque", "classification-pythagore"], { kind: "triangle", labelA: "9 cm", labelB: "12 cm", labelC: "15 cm" }),
        q("Données insuffisantes", "Peut-on décider qu'un triangle est rectangle en connaissant seulement deux de ses trois longueurs ?", "Non", "Il faut comparer le carré du plus grand côté à la somme des carrés des deux autres : les trois longueurs sont nécessaires.", {}, ["pythagore", "reciproque", "classification-pythagore"], { kind: "triangle", labelA: "a", labelB: "b", labelC: "?" })
      ]);

    case "4e-chap-10":
      return withChapter(chapter, [
        q("Addition de fractions quelconques", "Calcule $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ {{b}} }{ {{den+1}} }$.", "{{formatFraction(a*(den+1)+b*den,den*(den+1))}}", "Avec le dénominateur commun {{den*(den+1)}} : $\\dfrac{ {{a*(den+1)}}+{{b*den}} }{ {{den*(den+1)}} }={{formatFraction(a*(den+1)+b*den,den*(den+1))}}$.", { a: int(1, 9), b: int(1, 9), den: int(3, 10) }, ["fractions", "addition", "denominateurs-quelconques"]),
        q("Somme relative à dénominateurs quelconques", "Calcule $-\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ {{b}} }{ {{den+1}} }$.", "{{formatFraction(-a*(den+1)+b*den,den*(den+1))}}", "On utilise {{den*(den+1)}} comme dénominateur commun : $\\dfrac{ -{{a*(den+1)}}+{{b*den}} }{ {{den*(den+1)}} }={{formatFraction(-a*(den+1)+b*den,den*(den+1))}}$.", { a: int(1, 8), b: int(1, 8), den: int(3, 10) }, ["fractions", "relatifs", "addition", "denominateurs-quelconques"]),
        q("Comparer deux fractions quelconques", "Compare $\\dfrac{ {{a}} }{ {{den}} }$ et $\\dfrac{ {{b}} }{ {{den+1}} }$ par produits en croix.", "{{a*(den+1)===b*den ? '=' : a*(den+1)>b*den ? '>' : '<'}}", "$ {{a}}\\times{{den+1}}={{a*(den+1)}}$ et ${{b}}\\times{{den}}={{b*den}}$.", { a: int(1, 10), b: int(1, 10), den: int(3, 10) }, ["fractions", "comparaison", "denominateurs-quelconques"]),
        q("Trois fractions et dénominateur commun", "Calcule $\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ {{b}} }{ {{den+1}} }-\\dfrac{ {{c}} }{ {{den*(den+1)}} }$.", "{{formatFraction(a*(den+1)+b*den-c,den*(den+1))}}", "Le dénominateur {{den*(den+1)}} convient : $\\dfrac{ {{a*(den+1)}}+{{b*den}}-{{c}} }{ {{den*(den+1)}} }={{formatFraction(a*(den+1)+b*den-c,den*(den+1))}}$.", { a: int(1, 7), b: int(1, 7), c: int(1, 8), den: int(3, 9) }, ["fractions", "addition", "soustraction", "denominateurs-quelconques"]),
        q("Plus petit dénominateur commun", "Les dénominateurs sont {{den}} et {{den*k}}. Quel est leur plus petit dénominateur commun ?", "{{den*k}}", "Comme {{den*k}} est un multiple de {{den}}, le plus petit dénominateur commun est {{den*k}}.", { den: int(3, 10), k: choice([2, 3, 4]) }, ["fractions", "dénominateur commun", "denominateurs-multiples"])
      ]);

    case "4e-chap-11":
      return directThalesCompletions(chapter, false);

    case "4e-chap-13":
      return withChapter(chapter, [
        q("Produit de deux fractions", "Calcule $\\dfrac{ {{a}} }{ {{b}} }\\times\\dfrac{ {{c}} }{ {{d}} }$.", "{{formatFraction(a*c,b*d)}}", "On multiplie les numérateurs entre eux et les dénominateurs entre eux, puis on simplifie.", { a: int(1, 9), b: int(2, 10), c: int(1, 9), d: int(2, 10) }, ["produit de fractions", "multiplication de fractions"]),
        q("Simplifier avant de multiplier", "Calcule $\\dfrac{ {{k*a}} }{ {{k*b}} }\\times\\dfrac{ {{c}} }{ {{d}} }$ en simplifiant d'abord la première fraction.", "{{formatFraction(a*c,b*d)}}", "$\\dfrac{ {{k*a}} }{ {{k*b}} }=\\dfrac{ {{a}} }{ {{b}} }$, puis on effectue le produit.", { a: int(1, 6), b: int(2, 9), c: int(1, 7), d: int(2, 9), k: int(2, 6) }, ["produit de fractions", "simplification"]),
        q("Entier multiplié par une fraction", "Calcule ${{n}}\\times\\dfrac{ {{a}} }{ {{b}} }$.", "{{formatFraction(n*a,b)}}", "On écrit l'entier ${{n}}$ sous la forme $\\dfrac{ {{n}} }1$, puis on multiplie.", { n: int(2, 9), a: int(1, 8), b: int(2, 10) }, ["produit de fractions", "multiplication de fractions"]),
        q("Quotient de deux fractions", "Calcule $\\dfrac{ {{a}} }{ {{b}} }\\div\\dfrac{ {{c}} }{ {{d}} }$.", "{{formatFraction(a*d,b*c)}}", "Diviser par une fraction revient à multiplier par son inverse : $\\dfrac{ {{a}} }{ {{b}} }\\times\\dfrac{ {{d}} }{ {{c}} }$.", { a: int(1, 9), b: int(2, 10), c: int(1, 9), d: int(2, 10) }, ["quotient de fractions", "division de fractions"]),
        q("Inverse d'une fraction", "Quel est l'inverse de $\\dfrac{ {{a}} }{ {{b}} }$ ?", "$\\dfrac{ {{b}} }{ {{a}} }$", "On échange le numérateur et le dénominateur.", { a: int(1, 9), b: int(2, 12) }, ["inverse", "division de fractions"]),
        q("Fraction divisée par un entier", "Calcule $\\dfrac{ {{a}} }{ {{b}} }\\div{{n}}$.", "{{formatFraction(a,b*n)}}", "Diviser par {{n}} revient à multiplier par $\\dfrac1{ {{n}} }$.", { a: int(1, 9), b: int(2, 10), n: int(2, 8) }, ["quotient de fractions", "division de fractions"]),
        q("Signe d'un produit de fractions", "Quel est le signe de $\\left(-\\dfrac{ {{a}} }{ {{b}} }\\right)\\times\\dfrac{ {{c}} }{ {{d}} }$ ?", "négatif", "Un seul facteur est négatif : le produit est négatif.", { a: int(1, 9), b: int(2, 10), c: int(1, 9), d: int(2, 10) }, ["produit de fractions", "signe"]),
        q("Facteur fractionnaire manquant", "Complète : $\\Box\\times\\dfrac{ {{a}} }{ {{b}} }=\\dfrac{ {{a*k}} }{ {{b}} }$.", "{{k}}", "Le second membre est {{k}} fois la fraction $\\dfrac{ {{a}} }{ {{b}} }$.", { a: int(1, 8), b: int(2, 10), k: int(2, 7) }, ["produit de fractions", "nombre manquant"]),
        q("Transformer un quotient", "Complète : $\\dfrac{ {{a}} }{ {{b}} }\\div\\dfrac{ {{c}} }{ {{d}} }=\\dfrac{ {{a}} }{ {{b}} }\\times\\Box$.", "$\\dfrac{ {{d}} }{ {{c}} }$", "On multiplie par l'inverse du diviseur.", { a: int(1, 9), b: int(2, 10), c: int(1, 9), d: int(2, 10) }, ["quotient de fractions", "inverse"]),
        q("Carré d'une fraction", "Calcule $\\left(\\dfrac{ {{a}} }{ {{b}} }\\right)^2$.", "{{formatFraction(a*a,b*b)}}", "On élève le numérateur et le dénominateur au carré.", { a: int(1, 8), b: int(2, 10) }, ["produit de fractions", "puissance"]),
        q("Fraction d'une fraction", "Calcule $\\dfrac34$ de $\\dfrac25$.", "$\\dfrac3{10}$", "Prendre une fraction d'une quantité revient à multiplier : $\\dfrac34\\times\\dfrac25=\\dfrac3{10}$.", {}, ["produit de fractions", "problème"])
      ]);

    case "4e-chap-14":
      return withChapter(chapter, [
        q("Volume d'une pyramide", "Une pyramide a une aire de base de {{base}} cm² et une hauteur de {{h}} cm. Calcule son volume.", "{{base*h/3}} cm³", "$V=\\dfrac{\\mathcal{A}_{\\text{base}}\\times h}{3}=\\dfrac{ {{base}}\\times{{h}} }3={{base*h/3}}$ cm³.", { base: choice([12, 18, 24, 30, 36]), h: choice([3, 6, 9, 12]) }, ["pyramide", "volume"], { kind: "solid", solid: "pyramide", labels: ["{{base}} cm²", "{{h}} cm"] }),
        q("Volume d'un cône", "Un cône a un rayon de {{r}} cm et une hauteur de {{h}} cm. Calcule son volume avec $\\pi\\approx3{,}14$.", "{{formatDecimalFrench(3.14*r*r*h/3)}} cm³", "$V=\\dfrac{\\pi r^2h}{3}\\approx{{formatDecimalFrench(3.14*r*r*h/3)}}$ cm³.", { r: int(2, 6), h: choice([3, 6, 9, 12]) }, ["cône", "volume"], { kind: "solid", solid: "cone", labels: ["{{r}} cm", "{{h}} cm"] }),
        q("Identifier la hauteur d'une pyramide", "Dans une pyramide, quelles propriétés relient la hauteur au plan de la base ?", "elle est perpendiculaire au plan de la base", "La hauteur joint le sommet au plan de la base perpendiculairement.", {}, ["pyramide", "hauteur"], { kind: "solid", solid: "pyramide", labels: ["base", "hauteur"] }),
        q("Identifier la génératrice", "Dans un cône de révolution, quel segment relie le sommet à un point du cercle de base ?", "une génératrice", "La génératrice est un segment oblique de la surface latérale.", {}, ["cône", "génératrice"], { kind: "solid", solid: "cone", labels: ["rayon", "hauteur", "génératrice"] }),
        q("Patron d'une pyramide carrée", "Quelles figures composent le patron d'une pyramide à base carrée ?", "1 carré et 4 triangles", "Le carré est la base et chaque côté porte une face triangulaire.", {}, ["pyramide", "patron"], { kind: "solid", solid: "pyramide", labels: ["base", "hauteur"] }),
        q("Patron d'un cône", "Quelles sont les deux parties du patron d'un cône ?", "un disque et un secteur de disque", "Le disque forme la base et le secteur forme la surface latérale.", {}, ["cône", "patron"], { kind: "solid", solid: "cone", labels: ["rayon", "hauteur"] }),
        q("Effet de la hauteur", "Deux pyramides ont la même base. La seconde a une hauteur double. Compare leurs volumes.", "le second volume est double", "Dans $V=\\mathcal{A}_{\\text{base}}h/3$, le volume est proportionnel à la hauteur.", {}, ["pyramide", "volume"], { kind: "solid", solid: "pyramide", labels: ["base", "hauteur"] }),
        q("Effet de l'aire de base", "Deux cônes ont la même hauteur. L'aire de base du second est triple. Compare leurs volumes.", "le second volume est triple", "Dans $V=\\mathcal{A}_{\\text{base}}h/3$, le volume est proportionnel à l'aire de base.", {}, ["cône", "volume"], { kind: "solid", solid: "cone", labels: ["rayon", "hauteur"] }),
        q("Hauteur d'une pyramide", "Une pyramide a un volume de {{base*h/3}} cm³ et une aire de base de {{base}} cm². Calcule sa hauteur.", "{{h}} cm", "$h=3V\\div \\mathcal{A}_{\\text{base}}={{base*h}}\\div{{base}}={{h}}$ cm.", { base: choice([12, 18, 24, 30]), h: choice([3, 6, 9, 12]) }, ["pyramide", "volume", "hauteur"], { kind: "solid", solid: "pyramide", labels: ["{{base}} cm²", "hauteur"] })
      ]);

    case "4e-chap-16":
      return reciprocalThalesCompletions(chapter, false);

    case "4e-chap-19":
      return withChapter(chapter, [
        q("Aire d'un trapèze", "Un trapèze a pour bases {{a}} cm et {{b}} cm et pour hauteur {{h}} cm. Calcule son aire.", "{{(a+b)*h/2}} cm²", "$\\mathcal{A}=\\dfrac{({{a}}+{{b}})\\times{{h}}}{2}={{(a+b)*h/2}}$ cm².", { a: int(3, 10), b: int(11, 20), h: choice([2, 4, 6, 8]) }, ["aire", "formule"]),
        q("Aire d'un disque", "Calcule l'aire d'un disque de rayon {{r}} cm avec $\\pi\\approx3{,}14$.", "{{formatDecimalFrench(3.14*r*r)}} cm²", "$\\mathcal{A}=\\pi r^2\\approx{{formatDecimalFrench(3.14*r*r)}}$ cm².", { r: int(2, 10) }, ["aire", "disque"], { kind: "circle", radiusLabel: "{{r}} cm" }),
        q("Volume d'un cylindre", "Calcule le volume d'un cylindre de rayon {{r}} cm et de hauteur {{h}} cm avec $\\pi\\approx3{,}14$.", "{{formatDecimalFrench(3.14*r*r*h)}} cm³", "$V=\\pi r^2h\\approx{{formatDecimalFrench(3.14*r*r*h)}}$ cm³.", { r: int(2, 7), h: int(3, 12) }, ["volume", "cylindre"], { kind: "solid", solid: "cylindre", labels: ["{{r}} cm", "{{h}} cm"] }),
        q("Conversion d'aire", "Convertis {{a}} m² en cm².", "{{a*10000}} cm²", "$1$ m² = $10 000$ cm².", { a: int(2, 20) }, ["aire", "conversion"]),
        q("Conversion de volume", "Convertis {{v}} dm³ en cm³.", "{{v*1000}} cm³", "$1$ dm³ = $1000$ cm³.", { v: int(2, 20) }, ["volume", "conversion"]),
        q("Distinguer aire et volume", "Une grandeur est exprimée en m³. S'agit-il d'une aire ou d'un volume ?", "un volume", "Une unité cubique mesure un volume.", {}, ["aire", "volume", "unité"]),
        q("Figure composée", "Une figure est formée de deux rectangles sans chevauchement d'aires {{a}} cm² et {{b}} cm². Quelle est son aire totale ?", "{{a+b}} cm²", "$ {{a}}+{{b}}={{a+b}}$ cm².", { a: int(20, 100), b: int(20, 100) }, ["aire", "figure plane"]),
        q("Solide composé", "Un solide est formé de deux pavés sans chevauchement de volumes {{a}} cm³ et {{b}} cm³. Quel est son volume total ?", "{{a+b}} cm³", "$ {{a}}+{{b}}={{a+b}}$ cm³.", { a: int(30, 200), b: int(30, 200) }, ["volume", "solide"])
      ]);

    default:
      return [];
  }
}

function thirdGradeCompletions(chapter: ChapterInfo): ChapterCompletionTemplate[] {
  switch (chapter.id) {
    case "3e-chap-03":
      return withChapter(chapter, [
        q("Produit de quatre relatifs", "Calcule $(-{{a}})\\times(-{{b}})\\times(-{{c}})\\times{{d}}$.", "{{-a*b*c*d}}", "Trois facteurs sont négatifs : le produit est négatif, puis on multiplie les valeurs absolues.", { a: int(2, 6), b: int(2, 6), c: int(2, 5), d: int(2, 5) }, ["calcul", "relatifs", "produit", "signes"]),
        q("Quotient de deux nombres négatifs", "Calcule $(-{{a*b}})\\div(-{{a}})$.", "{{b}}", "Le quotient de deux nombres négatifs est positif : ${{a*b}}\\div{{a}}={{b}}$.", { a: int(2, 9), b: int(2, 12) }, ["calcul", "relatifs", "quotient", "signes"]),
        q("Somme algébrique de relatifs", "Calcule $(-{{a}})+(-{{b}})-(-{{c}})$.", "{{-a-b+c}}", "Soustraire $-{{c}}$ revient à ajouter {{c}} : $-{{a}}-{{b}}+{{c}}={{-a-b+c}}$.", { a: int(2, 12), b: int(2, 12), c: int(2, 12) }, ["calcul", "relatifs", "somme algébrique"]),
        q("Fractions relatives quelconques", "Calcule $-\\dfrac{ {{a}} }{ {{den}} }+\\dfrac{ {{b}} }{ {{den+1}} }$.", "{{formatFraction(-a*(den+1)+b*den,den*(den+1))}}", "Le produit {{den*(den+1)}} est un dénominateur commun : $\\dfrac{ -{{a*(den+1)}}+{{b*den}} }{ {{den*(den+1)}} }={{formatFraction(-a*(den+1)+b*den,den*(den+1))}}$.", { a: int(1, 9), b: int(1, 9), den: int(3, 11) }, ["calcul", "relatifs", "fractions", "denominateurs-quelconques"]),
        q("Trois fractions quelconques", "Calcule $\\dfrac{ {{a}} }{ {{den}} }-\\dfrac{ {{b}} }{ {{den+1}} }+\\dfrac{ {{c}} }{ {{den*(den+1)}} }$.", "{{formatFraction(a*(den+1)-b*den+c,den*(den+1))}}", "Avec le dénominateur commun {{den*(den+1)}} : $\\dfrac{ {{a*(den+1)}}-{{b*den}}+{{c}} }{ {{den*(den+1)}} }={{formatFraction(a*(den+1)-b*den+c,den*(den+1))}}$.", { a: int(1, 9), b: int(1, 9), c: int(1, 9), den: int(3, 10) }, ["calcul", "relatifs", "fractions", "denominateurs-quelconques"]),
        q("Comparer des fractions relatives", "Compare $-\\dfrac{ {{a}} }{ {{den}} }$ et $-\\dfrac{ {{b}} }{ {{den+1}} }$.", "{{-a*(den+1)===-b*den ? '=' : -a*(den+1)>-b*den ? '>' : '<'}}", "On les écrit avec le même dénominateur positif {{den*(den+1)}}, puis on compare $-{{a*(den+1)}}$ et $-{{b*den}}$.", { a: int(1, 9), b: int(1, 9), den: int(3, 10) }, ["calcul", "relatifs", "fractions", "comparaison", "denominateurs-quelconques"])
      ]);

    case "3e-chap-02":
      return directThalesCompletions(chapter, true);

    case "3e-chap-04":
      return withChapter(chapter, [
        q("Décomposition première", "Décompose {{2*3*p*qv}} en facteurs premiers.", "$2\\times3\\times{{p}}\\times{{qv}}$", "On divise successivement par les nombres premiers 2, 3, {{p}} et {{qv}}.", { p: choice([5, 7]), qv: choice([11, 13]) }, ["arithmétique", "décomposition", "nombre premier"]),
        q("PGCD par décomposition", "Calcule le PGCD de ${{2*3*a}}$ et ${{2*5*a}}$, avec {{a}} premier.", "{{2*a}}", "Les facteurs premiers communs sont $2$ et {{a}}.", { a: choice([7, 11, 13]) }, ["arithmétique", "PGCD", "décomposition"]),
        q("Fraction irréductible", "Rends irréductible $\\dfrac{ {{6*a}} }{ {{9*a}} }$.", "$\\dfrac23$", "On simplifie par $3\\times{{a}}$.", { a: choice([5, 7, 11]) }, ["arithmétique", "fraction irréductible", "PGCD"]),
        q("Partage maximal", "On veut répartir {{a*k}} objets rouges et {{b*k}} objets bleus dans un maximum de lots identiques. Combien de lots peut-on faire ?", "{{k}} lots", "Le nombre maximal de lots est le PGCD des deux effectifs : $PGCD({{a*k}};{{b*k}})={{k}}$.", { a: choice([2, 3, 5]), b: choice([7, 11]), k: choice([4, 6, 8, 10]) }, ["arithmétique", "PGCD", "partage"]),
        q("Nombres premiers entre eux", "Les nombres {{a}} et {{b}} ont un PGCD égal à 1. Comment les qualifie-t-on ?", "premiers entre eux", "Deux entiers sont premiers entre eux lorsque leur seul diviseur commun est 1.", { a: choice([8, 9]), b: choice([25, 49]) }, ["arithmétique", "PGCD"]),
        q("Divisibilité par un premier", "Le nombre {{p*qv}} est-il divisible par {{p}} ?", "Oui", "$ {{p*qv}}={{p}}\\times{{qv}}$.", { p: choice([5, 7, 11]), qv: int(3, 15) }, ["arithmétique", "divisibilité"]),
        q("Racine d'un carré parfait", "Quel entier positif a pour carré {{a*a}} ?", "{{a}}", "$ {{a}}^2={{a*a}}$.", { a: int(2, 20) }, ["arithmétique", "carré parfait"])
      ]);

    case "3e-chap-05":
      return reciprocalThalesCompletions(chapter, true);

    case "3e-chap-09":
      return withChapter(chapter, [
        q("Carré d'une somme", "Développe $(n+{{a}})^2$.", "$n^2+{{2*a}}n+{{a*a}}$", "On utilise $(u+v)^2=u^2+2uv+v^2$.", { a: int(2, 12) }, ["identité remarquable", "carré"]),
        q("Carré d'une différence", "Développe $(n-{{a}})^2$.", "$n^2-{{2*a}}n+{{a*a}}$", "On utilise $(u-v)^2=u^2-2uv+v^2$.", { a: int(2, 12) }, ["identité remarquable", "carré"]),
        q("Somme par différence", "Développe $(n+{{a}})(n-{{a}})$.", "$n^2-{{a*a}}$", "On utilise $(u+v)(u-v)=u^2-v^2$.", { a: int(2, 12) }, ["identité remarquable", "différence de carrés"]),
        q("Factoriser un carré parfait", "Factorise $n^2+{{2*a}}n+{{a*a}}$.", "$(n+{{a}})^2$", "On reconnaît $u^2+2uv+v^2$.", { a: int(2, 12) }, ["identité remarquable", "factoriser"]),
        q("Factoriser une différence de carrés", "Factorise $n^2-{{a*a}}$.", "$(n-{{a}})(n+{{a}})$", "On reconnaît $u^2-v^2$.", { a: int(2, 12) }, ["identité remarquable", "différence de carrés"]),
        q("Terme du milieu", "Complète : $(n+{{a}})^2=n^2+\\Box n+{{a*a}}$.", "{{2*a}}", "Le terme du milieu vaut $2\\times n\\times{{a}}={{2*a}}n$.", { a: int(2, 12) }, ["identité remarquable", "carré"]),
        q("Tester une identité", "Calcule $(n+{{a}})^2$ pour $n={{n}}$.", "{{(n+a)*(n+a)}}", "$({{n}}+{{a}})^2={{n+a}}^2={{(n+a)*(n+a)}}$.", { a: int(2, 9), n: int(-8, 8) }, ["identité remarquable", "substitution"])
      ]);

    case "3e-chap-10": {
      const completeTriangle = { kind: "right-triangle" as const, legALabel: "{{3*k}} cm", legBLabel: "{{4*k}} cm", hypotenuseLabel: "{{5*k}} cm", angleLabel: "α" };
      return withChapter(chapter, [
        q("Calculer un cosinus", "Dans le triangle rectangle de la figure, calcule $\\cos(\\alpha)$.", "0,8", "$\\cos(\\alpha)=\\dfrac{AC}{BC}=\\dfrac{ {{4*k}} }{ {{5*k}} }=0{,}8$.", { k: int(1, 5) }, ["trigonométrie", "cosinus", "rapport"], completeTriangle),
        q("Calculer un sinus", "Dans le triangle rectangle de la figure, calcule $\\sin(\\alpha)$.", "0,6", "$\\sin(\\alpha)=\\dfrac{AB}{BC}=\\dfrac{ {{3*k}} }{ {{5*k}} }=0{,}6$.", { k: int(1, 5) }, ["trigonométrie", "sinus", "rapport"], completeTriangle),
        q("Calculer une tangente", "Dans le triangle rectangle de la figure, calcule $\\tan(\\alpha)$.", "0,75", "$\\tan(\\alpha)=\\dfrac{AB}{AC}=\\dfrac{ {{3*k}} }{ {{4*k}} }=0{,}75$.", { k: int(1, 5) }, ["trigonométrie", "tangente", "rapport"], completeTriangle),
        q("Calculer AC", "On sait que $\\cos(\\alpha)=0{,}8$ et $BC={{5*k}}$ cm. Calcule $AC$.", "{{4*k}} cm", "$AC=BC\\times0{,}8={{5*k}}\\times0{,}8={{4*k}}$ cm.", { k: int(1, 5) }, ["trigonométrie", "cosinus", "longueur"], { kind: "right-triangle", legALabel: "{{3*k}} cm", legBLabel: "?", hypotenuseLabel: "{{5*k}} cm", angleLabel: "α" }),
        q("Calculer AB", "On sait que $\\sin(\\alpha)=0{,}6$ et $BC={{5*k}}$ cm. Calcule $AB$.", "{{3*k}} cm", "$AB=BC\\times0{,}6={{5*k}}\\times0{,}6={{3*k}}$ cm.", { k: int(1, 5) }, ["trigonométrie", "sinus", "longueur"], { kind: "right-triangle", legALabel: "?", legBLabel: "{{4*k}} cm", hypotenuseLabel: "{{5*k}} cm", angleLabel: "α" }),
        q("Trouver avec la tangente", "On sait que $\\tan(\\alpha)=0{,}75$ et $AB={{3*k}}$ cm. Calcule $AC$.", "{{4*k}} cm", "$AC=AB\\div0{,}75={{3*k}}\\div0{,}75={{4*k}}$ cm.", { k: int(1, 5) }, ["trigonométrie", "tangente", "longueur"], { kind: "right-triangle", legALabel: "{{3*k}} cm", legBLabel: "?", hypotenuseLabel: "{{5*k}} cm", angleLabel: "α" }),
        q("Calculer BC", "On sait que $\\sin(\\alpha)=0{,}6$ et $AB={{3*k}}$ cm. Calcule $BC$.", "{{5*k}} cm", "$BC=AB\\div0{,}6={{3*k}}\\div0{,}6={{5*k}}$ cm.", { k: int(1, 5) }, ["trigonométrie", "sinus", "longueur"], { kind: "right-triangle", legALabel: "{{3*k}} cm", legBLabel: "{{4*k}} cm", hypotenuseLabel: "?", angleLabel: "α" }),
        q("Calculer l'angle alpha", "Dans le triangle rectangle de la figure, calcule l'angle $\\alpha$ au dixième de degré près.", "36,9°", "$\\alpha=\\arccos\\left(\\dfrac{AC}{BC}\\right)=\\arccos\\left(\\dfrac45\\right)\\approx36{,}9°$.", { k: int(1, 5) }, ["trigonométrie", "cosinus", "angle"], completeTriangle),
        q("Choisir la fonction réciproque", "On connaît $\\cos(\\alpha)=0{,}8$. Quelle touche de calculatrice permet d'obtenir $\\alpha$ ?", "$\\arccos$ ou $\\cos^{-1}$", "Pour retrouver un angle à partir de son cosinus, on utilise la fonction réciproque du cosinus.", { k: choice([1]) }, ["trigonométrie", "cosinus", "angle"], completeTriangle),
        q("Contrôler un cosinus", "Un élève trouve $\\cos(\\alpha)=1{,}3$. Cette valeur est-elle possible pour un angle aigu d'un triangle rectangle ?", "Non", "Le cosinus d'un angle aigu est compris entre 0 et 1.", { k: choice([1]) }, ["trigonométrie", "cosinus", "contrôle"], completeTriangle)
      ]);
    }

    case "3e-chap-11":
      return withChapter(chapter, [
        q("Reconnaître une fonction linéaire", "La fonction $f(n)={{a}}n+{{b}}$ est-elle linéaire ?", "Non", "Une fonction linéaire est de la forme $an$ sans terme constant.", { a: int(2, 8), b: int(1, 12) }, ["fonction linéaire", "fonction affine"]),
        q("Reconnaître une fonction affine", "La fonction $g(n)={{a}}n+{{b}}$ est-elle affine ?", "Oui", "Elle est de la forme $an+b$.", { a: int(-8, 8, [0]), b: int(-12, 12) }, ["fonction affine"]),
        q("Ordonnée à l'origine", "Dans $f(n)={{a}}n+{{b}}$, quelle est l'ordonnée à l'origine ?", "{{b}}", "C'est le terme constant, égal à $f(0)$.", { a: int(-8, 8, [0]), b: int(-12, 12) }, ["fonction affine", "ordonnée à l'origine"]),
        q("Coefficient directeur", "Dans $f(n)={{a}}n+{{b}}$, quel est le coefficient directeur ?", "{{a}}", "C'est le coefficient qui multiplie la variable.", { a: int(-8, 8, [0]), b: int(-12, 12) }, ["fonction affine", "coefficient directeur"]),
        q("Image par une fonction affine", "Calcule l'image de {{x}} par $f(n)={{a}}n+{{b}}$.", "{{a*x+b}}", "$f({{x}})={{a}}\\times{{x}}+{{b}}={{a*x+b}}$.", { a: int(-6, 8, [0]), b: int(-12, 12), x: int(-8, 8) }, ["fonction affine", "image"]),
        q("Antécédent par une fonction linéaire", "Pour $f(n)={{a}}n$, trouve l'antécédent de {{a*x}}.", "{{x}}", "On résout ${{a}}n={{a*x}}$, donc $n={{x}}$.", { a: int(2, 9), x: int(-10, 10) }, ["fonction linéaire", "antécédent"]),
        q("Variation d'une fonction affine", "La fonction $f(n)={{a}}n+{{b}}$ est-elle croissante ou décroissante ?", "{{a>0 ? 'croissante' : 'décroissante'}}", "Le sens de variation dépend du signe du coefficient directeur {{a}}.", { a: int(-8, 8, [0]), b: int(-12, 12) }, ["fonction affine", "coefficient directeur"]),
        q("Déterminer une fonction linéaire", "Une fonction linéaire vérifie $f({{x}})={{a*x}}$. Donne son expression.", "$f(n)={{a}}n$", "Le coefficient vaut ${{a*x}}\\div{{x}}={{a}}$.", { a: int(-8, 8, [0]), x: int(2, 10) }, ["fonction linéaire", "coefficient"])
      ]);

    case "3e-chap-12":
      return withChapter(chapter, [
        q("Rayon et diamètre", "Une sphère a un rayon de {{r}} cm. Quel est son diamètre ?", "{{2*r}} cm", "$d=2r=2\\times{{r}}={{2*r}}$ cm.", { r: int(2, 12) }, ["sphère", "rayon", "diamètre"], { kind: "solid", solid: "sphere", labels: ["{{r}} cm"] }),
        q("Diamètre vers rayon", "Une boule a un diamètre de {{2*r}} cm. Quel est son rayon ?", "{{r}} cm", "Le rayon est la moitié du diamètre.", { r: int(2, 12) }, ["boule", "rayon", "diamètre"], { kind: "solid", solid: "sphere", labels: ["{{r}} cm"] }),
        q("Aire d'une sphère", "Calcule l'aire d'une sphère de rayon {{r}} cm avec $\\pi\\approx3{,}14$.", "{{formatDecimalFrench(4*3.14*r*r)}} cm²", "$\\mathcal{A}=4\\pi r^2\\approx{{formatDecimalFrench(4*3.14*r*r)}}$ cm².", { r: int(2, 10) }, ["sphère", "aire"], { kind: "solid", solid: "sphere", labels: ["{{r}} cm"] }),
        q("Volume d'une boule", "Calcule le volume d'une boule de rayon {{r}} cm avec $\\pi\\approx3{,}14$.", "{{formatDecimalFrench(4*3.14*r*r*r/3)}} cm³", "$V=\\dfrac43\\pi r^3\\approx{{formatDecimalFrench(4*3.14*r*r*r/3)}}$ cm³.", { r: choice([3, 6, 9, 12]) }, ["boule", "volume"], { kind: "solid", solid: "sphere", labels: ["{{r}} cm"] }),
        q("Formule de l'aire sphérique", "Quelle formule donne l'aire d'une sphère de rayon $r$ ?", "$\\mathcal{A}=4\\pi r^2$", "L'aire de la surface sphérique vaut quatre fois l'aire d'un disque de même rayon.", {}, ["sphère", "aire", "formule"], { kind: "solid", solid: "sphere", labels: ["r"] }),
        q("Formule du volume de la boule", "Quelle formule donne le volume d'une boule de rayon $r$ ?", "$V=\\dfrac43\\pi r^3$", "Le volume dépend du cube du rayon.", {}, ["boule", "volume", "formule"], { kind: "solid", solid: "sphere", labels: ["r"] }),
        q("Sphère ou boule", "Quel mot désigne uniquement la surface : sphère ou boule ?", "sphère", "La sphère est la surface ; la boule contient aussi l'intérieur.", {}, ["sphère", "boule", "vocabulaire"], { kind: "solid", solid: "sphere", labels: ["rayon"] }),
        q("Unité d'une aire sphérique", "L'aire d'une sphère de rayon exprimé en cm s'exprime dans quelle unité ?", "cm²", "Une aire s'exprime en unités carrées.", {}, ["sphère", "aire", "unité"], { kind: "solid", solid: "sphere", labels: ["rayon"] }),
        q("Unité du volume d'une boule", "Le volume d'une boule de rayon exprimé en cm s'exprime dans quelle unité ?", "cm³", "Un volume s'exprime en unités cubiques.", {}, ["boule", "volume", "unité"], { kind: "solid", solid: "sphere", labels: ["rayon"] }),
        q("Effet d'un rayon double sur l'aire", "Le rayon d'une sphère est doublé. Par quel nombre son aire est-elle multipliée ?", "4", "L'aire dépend de $r^2$ : $2^2=4$.", {}, ["sphère", "aire", "agrandissement"], { kind: "solid", solid: "sphere", labels: ["r"] }),
        q("Effet d'un rayon double sur le volume", "Le rayon d'une boule est doublé. Par quel nombre son volume est-il multiplié ?", "8", "Le volume dépend de $r^3$ : $2^3=8$.", {}, ["boule", "volume", "agrandissement"], { kind: "solid", solid: "sphere", labels: ["r"] }),
        q("Section par le centre", "Quelle figure obtient-on en coupant une boule par un plan passant par son centre ?", "un disque de même rayon", "La section centrale d'une boule est un grand disque.", {}, ["boule", "sphère", "section"], { kind: "solid", solid: "sphere", labels: ["rayon"] })
      ]);

    default:
      return [];
  }
}

export function chapterCompletionTemplates(chapter: ChapterInfo): ChapterCompletionTemplate[] {
  if (chapter.level === "6e") return sixthGradeCompletions(chapter);
  if (chapter.level === "5e") return fifthGradeCompletions(chapter);
  if (chapter.level === "4e") return fourthGradeCompletions(chapter);
  if (chapter.level === "3e") return thirdGradeCompletions(chapter);
  return [];
}
