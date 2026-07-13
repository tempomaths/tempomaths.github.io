import type { Automatisme, GeneratedQuestion, Level } from "../types";
import { renderFigureTemplate } from "../utils/figures";
import { randomInt, seededRandom } from "../utils/random";
import { generateVariables, renderTemplate } from "../utils/templates";
import { repairVisibleText } from "../utils/textRepair";

function polishFrenchText(text: string): string {
  return text
    .replace(/\b(point|nombre|résultat|resultat|angle|segment|tableau)\s+donne\b/gi, "$1 donné")
    .replace(/\bdonnee\b/gi, "donnée")
    .replace(/\bdonnees\b/gi, "données")
    .replace(/\bquantite\b/gi, "quantité")
    .replace(/\bquantites\b/gi, "quantités")
    .replace(/\bdeja\b/gi, "déjà")
    .replace(/\bmeme\b/gi, "même")
    .replace(/\betre\b/gi, "être")
    .replace(/\becrire\b/gi, "écrire")
    .replace(/\becris\b/gi, "écris")
    .replace(/\becrit\b/gi, "écrit")
    .replace(/\bperimetre\b/gi, "périmètre")
    .replace(/\bperimetres\b/gi, "périmètres")
    .replace(/\bmediane\b/gi, "médiane")
    .replace(/\bmedianes\b/gi, "médianes")
    .replace(/\bmediatrice\b/gi, "médiatrice")
    .replace(/\bmediatric[e]?s\b/gi, "médiatrices")
    .replace(/\betendue\b/gi, "étendue")
    .replace(/\betendues\b/gi, "étendues")
    .replace(/\bserie\b/gi, "série")
    .replace(/\bseries\b/gi, "séries")
    .replace(/\bfrequence\b/gi, "fréquence")
    .replace(/\bfrequences\b/gi, "fréquences")
    .replace(/\bevenement\b/gi, "événement")
    .replace(/\bevenements\b/gi, "événements")
    .replace(/\bprobabilite\b/gi, "probabilité")
    .replace(/\bprobabilites\b/gi, "probabilités")
    .replace(/\bsymetrie\b/gi, "symétrie")
    .replace(/\bsymetrique\b/gi, "symétrique")
    .replace(/\bsymetriques\b/gi, "symétriques")
    .replace(/\bhomothetie\b/gi, "homothétie")
    .replace(/\balignes\b/gi, "alignés")
    .replace(/\b(point|sommet|segment|nombre)\s+aligne\b/gi, "$1 aligné")
    .replace(/\b(points|sommets|segments|nombres)\s+alignes\b/gi, "$1 alignés")
    .replace(/\best aligne\b/gi, "est aligné")
    .replace(/\bsont alignes\b/gi, "sont alignés")
    .replace(/\btroisieme\b/gi, "troisième")
    .replace(/\bordonnee\b/gi, "ordonnée")
    .replace(/\bordonnees\b/gi, "ordonnées")
    .replace(/\bthales\b/gi, "Thalès")
    .replace(/\bdifference\b/gi, "différence")
    .replace(/\bdefinition\b/gi, "définition")
    .replace(/\bdecomposition\b/gi, "décomposition")
    .replace(/\bpropriete\b/gi, "propriété")
    .replace(/\bproprietes\b/gi, "propriétés")
    .replace(/\breduire\b/gi, "réduire")
    .replace(/\bresoudre\b/gi, "résoudre")
    .replace(/\bduree\b/gi, "durée")
    .replace(/\binterieur\b/gi, "intérieur")
    .replace(/\bperpendicularite\b/gi, "perpendicularité")
    .replace(/\bparallelisme\b/gi, "parallélisme")
    .replace(/\bsecante\b/gi, "sécante")
    .replace(/\bsecantes\b/gi, "sécantes")
    .replace(/\bappelee\b/gi, "appelée")
    .replace(/\bdetermine\b/gi, "détermine")
    .replace(/\bdeterminent\b/gi, "déterminent")
    .replace(/\bparallele\b/gi, "parallèle")
    .replace(/\bparalleles\b/gi, "parallèles")
    .replace(/\breciproque\b/gi, "réciproque")
    .replace(/\btheoreme\b/gi, "théorème")
    .replace(/\begalite\b/gi, "égalité")
    .replace(/\begalites\b/gi, "égalités")
    .replace(/\binegalite\b/gi, "inégalité")
    .replace(/\binegalites\b/gi, "inégalités")
    .replace(/\bdecimal\b/gi, "décimal")
    .replace(/\bdecimale\b/gi, "décimale")
    .replace(/\bdecimaux\b/gi, "décimaux")
    .replace(/\bdixieme\b/gi, "dixième")
    .replace(/\bdixiemes\b/gi, "dixièmes")
    .replace(/\bcentieme\b/gi, "centième")
    .replace(/\bcentiemes\b/gi, "centièmes")
    .replace(/\bapres\b/gi, "après")
    .replace(/\bechelle\b/gi, "échelle")
    .replace(/\breel\b/gi, "réel")
    .replace(/\breels\b/gi, "réels")
    .replace(/\bpremiere\b/gi, "première")
    .replace(/\bmultipliee\b/gi, "multipliée")
    .replace(/\bdecale\b/gi, "décale")
    .replace(/\bunite\b/gi, "unité")
    .replace(/\brepresentent\b/gi, "représentent")
    .replace(/\begal\b/gi, "égal")
    .replace(/\brole\b/gi, "rôle")
    .replace(/\balignee\b/gi, "alignée")
    .replace(/\bequidistant\b/gi, "équidistant")
    .replace(/\bequidistante\b/gi, "équidistante")
    .replace(/\bcote\b/gi, "côté")
    .replace(/\bcotes\b/gi, "côtés")
    .replace(/\bcote adjacent\b/gi, "côté adjacent")
    .replace(/\bcote oppose\b/gi, "côté opposé")
    .replace(/\boppose\b/gi, "opposé")
    .replace(/\binferieur\b/gi, "inférieur")
    .replace(/\binferieure\b/gi, "inférieure")
    .replace(/\bsuperieur\b/gi, "supérieur")
    .replace(/\bsuperieure\b/gi, "supérieure")
    .replace(/\bverifie\b/gi, "vérifie")
    .replace(/\bverifier\b/gi, "vérifier")
    .replace(/\barete\b/gi, "arête")
    .replace(/\baretes\b/gi, "arêtes")
    .replace(/\baréte\b/gi, "arête")
    .replace(/\barétes\b/gi, "arêtes")
    .replace(/\bdeuxieme\b/gi, "deuxième")
    .replace(/\bcone\b/gi, "cône")
    .replace(/\bpiece\b/gi, "pièce")
    .replace(/\bcomplete\b/gi, "complète")
    .replace(/\bcompleter\b/gi, "compléter")
    .replace(/\bconservee\b/gi, "conservée")
    .replace(/\bcommencant\b/gi, "commençant")
    .replace(/\brapports\s+portes\b/gi, "rapports portés")
    .replace(/\bcoherent\b/gi, "cohérent")
    .replace(/\bcoherente\b/gi, "cohérente")
    .replace(/\bassociee\b/gi, "associée")
    .replace(/\bcontraposee\b/gi, "contraposée")
    .replace(/\bcoupee\b/gi, "coupée")
    .replace(/\bcoupees\b/gi, "coupées")
    .replace(/\bangle forme par\b/gi, "angle formé par")
    .replace(/\bformes\s+par\b/gi, "formés par")
    .replace(/\bsupplementaire\b/gi, "supplémentaire")
    .replace(/\bsupplementaires\b/gi, "supplémentaires")
    .replace(/\bdifferente\b/gi, "différente")
    .replace(/\bdifferentes\b/gi, "différentes")
    .replace(/\bdevelopper\b/gi, "développer")
    .replace(/\breduction\b/gi, "réduction")
    .replace(/\bpossede\b/gi, "possède")
    .replace(/\bpossedent\b/gi, "possèdent")
    .replace(/\bopposee\b/gi, "opposée")
    .replace(/\bopposees\b/gi, "opposées")
    .replace(/\brepetition\b/gi, "répétition")
    .replace(/\brepetitions\b/gi, "répétitions")
    .replace(/\brepeter\b/gi, "répéter")
    .replace(/\brepete\b/gi, "répète")
    .replace(/\breponse\b/gi, "réponse")
    .replace(/\bequilateral\b/gi, "équilatéral")
    .replace(/\bexterieur\b/gi, "extérieur")
    .replace(/\bPérimtre\b/g, "Périmètre")
    .replace(/\bpérimtre\b/g, "périmètre")
    .replace(/\bQuatriéme\b/g, "Quatrième")
    .replace(/\bPérimétre\b/g, "Périmètre")
    .replace(/\bpérimétre\b/g, "périmètre")
    .replace(/\bnegatif\b/gi, "négatif")
    .replace(/\bnegative\b/gi, "négative")
    .replace(/\bponderee\b/gi, "pondérée")
    .replace(/\bmedian\b/gi, "médian")
    .replace(/\bparenthese\b/gi, "parenthèse")
    .replace(/\bresous\b/gi, "résous")
    .replace(/\brepresente\b/gi, "représente")
    .replace(/\bjusqu['’]a\b/gi, "jusqu'à")
    .replace(/\btres\b/gi, "très")
    .replace(/\btrés\b/gi, "très")
    .replace(/\breussite\b/gi, "réussite")
    .replace(/\breussites\b/gi, "réussites")
    .replace(/\bidentite\b/gi, "identité")
    .replace(/Moiti \?/gi, "Moitié")
    .replace(/Double distributivit \?/gi, "Double distributivité")
    .replace(/Antéc \?dent/gi, "Antécédent")
    .replace(/proportionnalit \?/gi, "proportionnalité")
    .replace(/\bméme\b/gi, "même")
    .replace(/\bmètrès\b/gi, "mètres")
    .replace(/\bkilomètrès\b/gi, "kilomètres")
    .replace(/\bcentimètrès\b/gi, "centimètres")
    .replace(/\bcentimétrès\b/gi, "centimètres")
    .replace(/\bcoordonnee\b/gi, "coordonnée")
    .replace(/\bcoordonnees\b/gi, "coordonnées")
    .replace(/\bdeformation\b/gi, "déformation")
    .replace(/\bdeplace\b/gi, "déplace")
    .replace(/\bcompletes\b/gi, "complètes")
    .replace(/\bmultipliees\b/gi, "multipliées")
    .replace(/\bmultiplies\b/gi, "multipliés")
    .replace(/\breduit\b/gi, "réduit")
    .replace(/\brepere\b/gi, "repère")
    .replace(/\becart\b/gi, "écart")
    .replace(/\bperimètrès\b/gi, "périmètres")
    .replace(/\bpérimètrès\b/gi, "périmètres")
    .replace(/carrédu/gi, "carré du")
    .replace(/envoyésur/gi, "envoyé sur")
    .replace(/donnépar/gi, "donné par")
    .replace(/déplacédu/gi, "déplacé par le")
    .replace(/\best translate par\b/gi, "est déplacé par")
    .replace(/\b(point|sommet|segment|nombre)\s+situe\b/gi, "$1 situé")
    .replace(/partieségales/gi, "parties égales")
    .replace(/deuxétapes/gi, "deux étapes")
    .replace(/fractionsédénominateurs/gi, "fractions à dénominateurs")
    .replace(/Probabilitécomplémentaire/gi, "Probabilité complémentaire")
    .replace(/probabilitécomplémentaire/gi, "probabilité complémentaire")
    .replace(/Univers etévénement/gi, "Univers et événement")
    .replace(/probabilitéd['’]/gi, "probabilité d'")
    .replace(/Probabilitédécimale/gi, "Probabilité décimale")
    .replace(/probabilitédécimale/gi, "probabilité décimale")
    .replace(/\bequiprobabilite\b/gi, "équiprobabilité")
    .replace(/\bequiprobables\b/gi, "équiprobables")
    .replace(/sontégaux/gi, "sont égaux")
    .replace(/sontégales/gi, "sont égales")
    .replace(/\bangle aigu mesure\b/gi, "angle aigu mesure")
    .replace(/\b(perpendiculaire|perpendiculaires|extérieur|exterieur|inférieur|inferieur|supérieur|superieur|égal|egale?|correspond|associe|ajoute|appartient|rapport|revient|rejoignent|commence|tourne|opposé|oppose|rapports|vecteur|passe|met)\s+a\b/gi, "$1 à")
    .replace(/\b(est|sont|droite|droites)\s+(parallèle|parallèles)\s+a\b/gi, "$1 $2 à")
    .replace(/\bparallèles\s+a\s+(cette|une|un|la|le|l['’])/gi, "parallèles à $1")
    .replace(/\bunique parallèle\s+a\b/gi, "unique parallèle à")
    .replace(/\bA l['’]échelle\b/g, "À l'échelle")
    .replace(/\bA dénominateur\b/g, "À dénominateur")
    .replace(/\bpas\s+a\b/gi, "pas à")
    .replace(/\bcompl[eé]ment\s+a\b/gi, "complément à")
    .replace(/\bsuppl[eé]ment\s+a\b/gi, "supplément à")
    .replace(/\b(coefficient|vecteur)\s+a\s+(trouver|partir)\b/gi, "$1 à $2")
    .replace(/\s+a\s+chaque\b/gi, " à chaque")
    .replace(/(ajoute|ajouter|ajoutent|retire|retirer)\s+(\$[^$]+\$|[-\d,.]+)\s+a\b/gi, "$1 $2 à")
    .replace(/\bde\s+\$?([A-Z]'?)\$?\s+a\s+l['’]/g, "de $1 à l'")
    .replace(/(\$[^$]+\$\s*(?:cm|m|km)?)\s+a\s+(\$[^$]+\$)/g, "$1 à $2")
    .replace(/(\$1\$)\s+a\s+(\$6\$)/g, "$1 à $2");
}

function capitalizeSentences(text: string): string {
  return text.replace(/(^|[.!?]\s+)([a-zà-ÿ])/gu, (_match, punctuation: string, letter: string) =>
    `${punctuation}${letter.toLocaleUpperCase("fr")}`
  );
}

function formatFrenchDecimalMarks(text: string): string {
  return text
    // Keep signed calculations readable: 8+-3 becomes 8-3 and
    // 4\times-2 becomes 4\times(-2).
    .replace(/\+\s*-(?=\d)/g, "-")
    .replace(/-\s*-(?=\d)/g, "+")
    .replace(/(\\times|\\div)\s*-(\d+(?:[.,]\d+)?)/g, "$1(-$2)")
    .replace(/(?<!\d)1([a-z])\b/gi, "$1")
    .replace(/(\d)\.(\d)/g, "$1,$2")
    // In French, commas belong to decimal numbers. Consecutive numerical
    // values therefore use semicolons to avoid strings such as "10,5, 9,5".
    .replace(/(\d,\d+)\s*,\s*(?=-?\d+(?:,\d+)?)/g, "$1 ; ")
    .replace(/(-?\d+(?:[,.]\d+)?)\s*°C/g, "$1 °C")
    .replace(/([²³])(?=[A-Za-zÀ-ÿ])/g, "$1 ")
    .replace(/([^\s$])\$(?=[;!?])/g, "$1$ ");
}

function polishMentalFrenchText(text: string): string {
  return text
    .replace(/\bmoitie\b/gi, "moitié")
    .replace(/\bcoute\b/gi, "coûte")
    .replace(/\bcoutent\b/gi, "coûtent")
    .replace(/\bnumerateur\b/gi, "numérateur")
    .replace(/\bnumerateurs\b/gi, "numérateurs")
    .replace(/\bdenominateur\b/gi, "dénominateur")
    .replace(/\bdenominateurs\b/gi, "dénominateurs")
    .replace(/\bantecedent\b/gi, "antécédent")
    .replace(/\bantecedents\b/gi, "antécédents")
    .replace(/\breussi\b/gi, "réussi")
    .replace(/\breussissent\b/gi, "réussissent");
}

function normalizeStatementCommands(text: string): string {
  return text
    .replace(/^donné\s*:?\s*/i, "Donne : ")
    .replace(/^donnér\s*:?\s*/i, "Donne : ")
    .replace(/^complète\s*:?\s*/i, "Complète : ")
    .replace(/^Calculer\s*:?\s*/i, "Calcule : ")
    .replace(/^Simplifier\s*:?\s*/i, "Simplifie : ")
    .replace(/^Développer\s*:?\s*/i, "Développe : ")
    .replace(/^Factoriser\s*:?\s*/i, "Factorise : ")
    .replace(/^Résoudre\s*:?\s*/i, "Résous : ")
    .replace(/^Compléter\s*:?\s*/i, "Complète : ")
    .replace(/^Donner\s*:?\s*/i, "Donne : ")
    .replace(/\.\s+Calculer\b/g, ". Calcule")
    .replace(/\.\s+Donner\b/g, ". Donne")
    .replace(/\.\s+Écrire\b/g, ". Écris")
    .replace(/\.\s+Ecrire\b/g, ". Écris")
    .replace(/\.\s+Volume\s*\?/g, ". Quel est son volume ?");
}

function normalizeVisiblePunctuation(text: string): string {
  return text
    .replace(/\bdegres\b/gi, "°")
    .replace(/\bdegrés\b/gi, "°")
    .replace(/\bdegré\b/gi, "°")
    .replace(/(\d)\s*°/g, "$1°")
    .replace(/(\d)\s*%(?!\})/g, "$1 %")
    .replace(/\s+([,.])/g, "$1")
    .replace(/\s*;\s*/g, " ; ")
    .replace(/\s*([!?])/g, " $1")
    .replace(/\s*:\s*/g, " : ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function polishStatement(text: string): string {
  const firstPass = normalizeStatementCommands(polishMentalFrenchText(polishFrenchText(text)));
  const repaired = repairVisibleText(firstPass);
  const finalPass = normalizeStatementCommands(polishMentalFrenchText(polishFrenchText(repaired)));
  return formatFrenchDecimalMarks(capitalizeSentences(normalizeVisiblePunctuation(finalPass)));
}

function polishGeneratedText(text: string): string {
  const firstPass = polishMentalFrenchText(polishFrenchText(text));
  const repaired = repairVisibleText(firstPass);
  const finalPass = polishMentalFrenchText(polishFrenchText(repaired));
  return formatFrenchDecimalMarks(capitalizeSentences(normalizeVisiblePunctuation(finalPass)))
    .replace(/\bX=/g, "x=")
    .replace(/\bX\^/g, "x^")
    .replace(/^(?:Mm|Cm|Dm|Km|M)(?=²|³|\b)/, (unit) => unit.toLowerCase())
    .replace(/^(?:Mg|Cg|Dg|Dag|Hg|Kg|G)(?=\b)/, (unit) => unit.toLowerCase())
    .replace(/^(?:ML|CL|DL)(?=\b)/, (unit) => `${unit[0].toLowerCase()}L`);
}

export function generateQuestion(
  automatisme: Automatisme,
  seed: string,
  durationSeconds?: number,
  forcedLevel?: Level
): GeneratedQuestion {
  const rng = seededRandom(`${seed}:${automatisme.id}`);
  const variables = generateVariables(automatisme.variablesSchema, rng);

  let title = polishGeneratedText(automatisme.title);
  let statement = polishStatement(renderTemplate(automatisme.statementTemplate, variables));
  let correction = polishGeneratedText(renderTemplate(automatisme.correctionTemplate, variables));
  let shortAnswer = polishGeneratedText(renderTemplate(automatisme.answerTemplate, variables));
  let figure = renderFigureTemplate(automatisme.figureTemplate, variables);

  const contextSignal = `${automatisme.title} ${statement} ${(automatisme.tags ?? []).join(" ")}`;
  if (/\bangle\b|degr[ée]|parall[èe]le|triangle/i.test(contextSignal)) {
    shortAnswer = shortAnswer.replace(/(-?\d+(?:[,.]\d+)?)\s*\?$/, "$1°");
  }
  if (/\bprix\b|co[uû]t|euros?|€|achat|d[ée]pense|montant|r[ée]duction|augmentation/i.test(contextSignal)) {
    shortAnswer = shortAnswer.replace(/(-?\d+(?:[,.]\d+)?)\s*\?$/, "$1 €");
  }

  if (automatisme.domain === "trigonometrie" && !automatisme.tags.includes("dnb-officiel") && figure?.kind === "right-triangle") {
    const useSegmentNames = (text: string) => text
      .replace(/\\text\{(?:côté\s+)?opposé\}/gi, "AB")
      .replace(/\\text\{(?:côté\s+)?adjacent\}/gi, "AC")
      .replace(/\\text\{hypoténuse\}/gi, "BC")
      .replace(/côté opposé/gi, "segment AB")
      .replace(/côté adjacent/gi, "segment AC")
      .replace(/l['’]opposé/gi, "AB")
      .replace(/l['’]adjacent/gi, "AC")
      .replace(/l['’]hypoténuse/gi, "BC")
      // `\b` does not see an accented final letter as a JavaScript word
      // character, so use the exact accented token here.
      .replace(/opposé/gi, "AB")
      .replace(/\badjacent\b/gi, "AC")
      .replace(/\bhypoténuse\b/gi, "BC")
      .replace(/côté\\\s*(AB|AC)/gi, "$1");
    statement = useSegmentNames(statement);
    correction = useSegmentNames(correction);
    shortAnswer = useSegmentNames(shortAnswer);
    title = useSegmentNames(title);
    const scale = randomInt(1, 4, rng);
    const oppositeLength = `${3 * scale} cm`;
    const adjacentLength = `${4 * scale} cm`;
    const hypotenuseLength = `${5 * scale} cm`;
    const isCosine = automatisme.tags.includes("cosinus");
    const isSine = automatisme.tags.includes("sinus");
    const isTangent = automatisme.tags.includes("tangente");
    const hasNamedRatio = isCosine || isSine || isTangent;
    const asksToWriteRatio = /écris le rapport|rapport du|rapport de la|\\dfrac\{\\ldots\}/i.test(statement);
    const hasExplicitMeasurements = [figure.legALabel, figure.legBLabel, figure.hypotenuseLabel ?? ""]
      .some((label) => /\d|\?/.test(label));
    figure = hasExplicitMeasurements
      ? { ...figure, vertexLabels: ["A", "B", "C"], angleLabel: "α" }
      : {
          ...figure,
          legALabel: asksToWriteRatio || isSine || isTangent || !hasNamedRatio ? oppositeLength : "",
          legBLabel: asksToWriteRatio || isCosine || isTangent || !hasNamedRatio ? adjacentLength : "",
          hypotenuseLabel: asksToWriteRatio || isCosine || isSine ? hypotenuseLength : "",
          vertexLabels: ["A", "B", "C"],
          angleLabel: "α"
        };
  }

  if (figure?.kind === "right-triangle") {
    if (automatisme.tags.includes("dnb-officiel")) {
      figure = { ...figure, variant: 0 };
    } else {
    const variant = randomInt(0, 5, rng);
    let rightTriangle = { ...figure, variant };
      const sourceLabels = `${figure.legALabel} ${figure.legBLabel} ${figure.hypotenuseLabel ?? ""}`;
      const sourceVertices = [...new Set((sourceLabels.match(/[A-Z]/g) ?? []))];
      const letterSets = [
        ["D", "E", "F"], ["R", "S", "T"], ["K", "L", "M"],
        ["P", "Q", "R"], ["U", "V", "W"], ["G", "H", "J"]
      ];
      const targets = letterSets[variant % letterSets.length];

      if (sourceVertices.length >= 3) {
        const mapping = new Map(sourceVertices.slice(0, 3).map((letter, index) => [letter, targets[index]]));
        const replaceLetters = (text: string) => text.replace(/\b[A-Z]{1,3}\b(?!['’][a-zà-ÿ]|-(?:t-)?[a-zà-ÿ])/g, (token) =>
          [...token].every((letter) => mapping.has(letter))
            ? [...token].map((letter) => mapping.get(letter)).join("")
            : token
        );
        statement = replaceLetters(statement);
        correction = replaceLetters(correction);
        shortAnswer = replaceLetters(shortAnswer);
        title = replaceLetters(title);
        rightTriangle = {
          ...rightTriangle,
          legALabel: replaceLetters(figure.legALabel),
          legBLabel: replaceLetters(figure.legBLabel),
          hypotenuseLabel: figure.hypotenuseLabel ? replaceLetters(figure.hypotenuseLabel) : undefined
        };
      } else {
        if (rightTriangle.angleLabel) {
          const mapping = new Map([["A", targets[0]], ["B", targets[1]], ["C", targets[2]]]);
          const replaceLetters = (text: string) => text.replace(/\b[A-C]{1,3}\b(?!['’][a-zà-ÿ]|-(?:t-)?[a-zà-ÿ])/g, (token) =>
            [...token].map((letter) => mapping.get(letter) ?? letter).join("")
          );
          statement = replaceLetters(statement);
          correction = replaceLetters(correction);
          shortAnswer = replaceLetters(shortAnswer);
          title = replaceLetters(title);
        }
        rightTriangle = { ...rightTriangle, vertexLabels: targets as [string, string, string] };
      }
    figure = rightTriangle;
    }
  } else if (figure?.kind === "triangle") {
    figure = { ...figure, variant: randomInt(0, 5, rng) };
  } else if (figure?.kind === "thales") {
      const variant = randomInt(0, 5, rng);
      let thales = { ...figure, variant };

      const allLabels = [
        figure.smallLeftLabel, figure.bigLeftLabel, figure.smallRightLabel,
        figure.bigRightLabel, figure.parallelLabel ?? ""
      ].join(" ");
      const sourceVertices = [...new Set(allLabels.match(/[A-Z]/g) ?? [])];
      const letterSets = [
        ["R", "S", "T", "U", "V", "W"], ["E", "F", "G", "H", "I", "J"],
        ["K", "L", "M", "N", "P", "Q"], ["P", "R", "S", "T", "U", "V"],
        ["G", "H", "J", "K", "L", "M"], ["S", "T", "U", "V", "W", "X"]
      ];
      const targets = letterSets[variant % letterSets.length];
      const mapping = new Map(sourceVertices.map((letter, index) => [letter, targets[index] ?? targets[index % targets.length]]));
      const replaceLetters = (text: string) => text.replace(/\b[A-Z]{1,3}\b(?!['’][a-zà-ÿ]|-(?:t-)?[a-zà-ÿ])/g, (token) =>
        [...token].every((letter) => mapping.has(letter))
          ? [...token].map((letter) => mapping.get(letter)).join("")
          : token
      );
      statement = replaceLetters(statement);
      correction = replaceLetters(correction);
      shortAnswer = replaceLetters(shortAnswer);
      title = replaceLetters(title);
      thales = {
        ...thales,
        smallLeftLabel: replaceLetters(figure.smallLeftLabel),
        bigLeftLabel: replaceLetters(figure.bigLeftLabel),
        smallRightLabel: replaceLetters(figure.smallRightLabel),
        bigRightLabel: replaceLetters(figure.bigRightLabel),
        parallelLabel: figure.parallelLabel ? replaceLetters(figure.parallelLabel) : undefined
      };
      figure = thales;
  } else if (figure?.kind === "solid" && figure.solid === "pyramide") {
    figure = { ...figure, variant: randomInt(0, 5, rng) };
  }

  return {
    id: `${automatisme.id}:${seed}`,
    automatismeId: automatisme.id,
    title,
    level: forcedLevel ?? automatisme.levels[0],
    progressionStep: automatisme.progressionStep,
    chapterId: automatisme.chapterId,
    chapterRank: automatisme.chapterRank,
    chapterTitle: automatisme.chapterTitle,
    domain: automatisme.domain,
    subdomain: automatisme.subdomain,
    difficulty: automatisme.difficulty,
    statement,
    correction,
    shortAnswer,
    durationSeconds: durationSeconds ?? automatisme.defaultDurationSeconds,
    variables,
    figure
  };
}
