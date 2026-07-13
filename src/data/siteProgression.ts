import type {
  ChapterInfo,
  ChapterLevelOverrides,
  ChapterOrderByLevel,
  ChapterSelectionByLevel,
  Level,
  MathDomain,
  ProgressionStep
} from "../types";

function chapter(
  level: Level,
  rank: number,
  title: string,
  domain: MathDomain,
  sourcePath: string,
  savoirs: string[],
  competences: string[]
): ChapterInfo {
  return {
    id: `${level}-chap-${rank.toString().padStart(2, "0")}`,
    level,
    rank,
    title,
    domain,
    sourcePath,
    savoirs,
    competences
  };
}

export const siteProgressionChapters: Record<Level, ChapterInfo[]> = {
  "6e": [
    chapter("6e", 1, "Nombres entiers : décomposition, comparaison et opérations", "nombres-calculs", "6eme/progression-6eme-v2/chap-01", ["Numération décimale de position", "Décomposition et comparaison des entiers", "Addition et soustraction"], ["Lire, écrire et décomposer un entier", "Comparer et ranger des entiers", "Calculer une somme ou une différence"]),
    chapter("6e", 2, "Éléments de géométrie : notations, distances et cercles", "geometrie", "6eme/progression-6eme-v2/chap-02", ["Point, droite, segment et demi-droite", "Distance, milieu, cercle, rayon et diamètre", "Notations géométriques"], ["Nommer et noter les objets géométriques", "Calculer ou reporter une distance", "Reconnaître les éléments d'un cercle"]),
    chapter("6e", 3, "Nombres entiers : multiples, diviseurs, multiplication et division euclidienne", "nombres-calculs", "6eme/progression-6eme-v2/chap-03", ["Multiplication d'entiers", "Multiples et diviseurs", "Division euclidienne"], ["Calculer un produit", "Reconnaître un multiple ou un diviseur", "Effectuer et vérifier une division euclidienne"]),
    chapter("6e", 4, "Perpendiculaires, parallèles et médiatrices", "geometrie", "6eme/progression-6eme-v2/chap-04", ["Droites perpendiculaires et parallèles", "Médiatrice d'un segment", "Équidistance"], ["Tracer une perpendiculaire ou une parallèle", "Construire une médiatrice", "Utiliser l'équidistance"]),
    chapter("6e", 5, "Fractions 1 : partage, comparaison et encadrement", "fractions", "6eme/progression-6eme-v2/chap-05", ["Fraction comme partage et comme nombre", "Comparaison à 1", "Encadrement entre deux entiers"], ["Lire et représenter une fraction", "Comparer une fraction à 1", "Encadrer une fraction simple"]),
    chapter("6e", 6, "Angles : notions et rapporteur", "geometrie", "6eme/progression-6eme-v2/chap-06", ["Sommet et côtés d'un angle", "Angles aigu, droit, obtus et plat", "Mesure en degrés"], ["Nommer et classer un angle", "Mesurer un angle au rapporteur", "Construire un angle donné"]),
    chapter("6e", 7, "Nombres décimaux : définition et demi-droite graduée", "decimaux", "6eme/progression-6eme-v2/chap-07", ["Partie entière et partie décimale", "Dixièmes, centièmes et millièmes", "Repérage sur une demi-droite graduée"], ["Lire, écrire et décomposer un décimal", "Associer fractions décimales et écritures décimales", "Placer un décimal sur une demi-droite graduée"]),
    chapter("6e", 8, "Symétrie axiale", "geometrie", "6eme/progression-6eme-v2/chap-08", ["Axe de symétrie", "Point et figure symétriques", "Conservation des longueurs et des angles"], ["Construire l'image d'un point ou d'une figure", "Identifier un axe de symétrie", "Utiliser les propriétés de conservation"]),
    chapter("6e", 9, "Opérations avec les nombres décimaux", "decimaux", "6eme/progression-6eme-v2/chap-09", ["Addition et soustraction de décimaux", "Multiplication d'un décimal", "Division décimale simple"], ["Poser une opération décimale", "Contrôler par un ordre de grandeur", "Résoudre un problème avec des décimaux"]),
    chapter("6e", 10, "Fractions 2 : fraction quotient et égalités de fractions", "fractions", "6eme/progression-6eme-v2/chap-10", ["Fraction comme quotient", "Fractions égales", "Simplification guidée"], ["Interpréter une fraction comme une division", "Compléter une égalité de fractions", "Produire une fraction égale"]),
    chapter("6e", 11, "Triangles : constructions et somme des angles", "geometrie", "6eme/progression-6eme-v2/chap-11", ["Triangles particuliers", "Construction à partir de longueurs ou d'angles", "Somme des angles d'un triangle"], ["Construire un triangle", "Reconnaître un triangle particulier", "Calculer un angle manquant"]),
    chapter("6e", 12, "Proportionnalité et échelles", "proportionnalite", "6eme/progression-6eme-v2/chap-12", ["Situations de proportionnalité", "Passage à l'unité", "Échelles"], ["Reconnaître une situation proportionnelle", "Compléter un tableau simple", "Utiliser une échelle"]),
    chapter("6e", 13, "Fractions 3 : comparaison, addition et soustraction", "fractions", "6eme/progression-6eme-v2/chap-13", ["Comparaison de fractions", "Addition de fractions de même dénominateur", "Soustraction de fractions de même dénominateur"], ["Comparer deux fractions simples", "Additionner des fractions de même dénominateur", "Soustraire des fractions de même dénominateur"]),
    chapter("6e", 14, "Aires et périmètres : carrés, rectangles et disques", "grandeurs-mesures", "6eme/progression-6eme-v2/chap-14", ["Périmètre du carré, du rectangle et du cercle", "Aire du carré, du rectangle et du disque", "Unités de longueur et d'aire"], ["Choisir une formule adaptée", "Calculer une aire ou un périmètre", "Distinguer longueur et surface"]),
    chapter("6e", 15, "Fractions 4 : fraction d'un nombre et pourcentages", "fractions", "6eme/progression-6eme-v2/chap-15", ["Fraction d'une quantité", "Pourcentages usuels", "Liens entre fraction, décimal et pourcentage"], ["Prendre une fraction d'un nombre", "Calculer 10 %, 25 %, 50 % ou 75 %", "Passer d'une écriture à une autre"]),
    chapter("6e", 16, "Espace", "geometrie", "6eme/progression-6eme-v2/chap-16", ["Solides usuels", "Faces, arêtes et sommets", "Patrons et représentations en perspective"], ["Reconnaître et décrire un solide", "Associer un solide à son patron", "Lire une représentation en perspective"]),
    chapter("6e", 17, "Durées", "grandeurs-mesures", "6eme/progression-6eme-v2/chap-17", ["Heures, minutes et secondes", "Conversions de durées", "Calcul d'un instant ou d'une durée"], ["Convertir une durée", "Additionner ou soustraire des durées", "Résoudre un problème horaire"]),
    chapter("6e", 18, "Algèbre", "calcul-litteral", "6eme/progression-6eme-v2/chap-18", ["Nombre inconnu et égalité", "Expression littérale simple", "Programme de calcul"], ["Traduire une phrase par une expression", "Substituer une valeur positive", "Trouver un nombre manquant simple"]),
    chapter("6e", 19, "Probabilités", "probabilites", "6eme/progression-6eme-v2/chap-19", ["Expérience aléatoire", "Issues et événements", "Probabilité dans une situation d'équiprobabilité"], ["Lister les issues", "Repérer les issues favorables", "Calculer une probabilité simple"]),
    chapter("6e", 20, "Scratch 6e", "algorithmique", "6eme/progression-6eme-v2/scratch", ["Instructions et déplacements", "Boucles de répétition", "Coordonnées simples et figures programmées"], ["Écrire un programme simple", "Décomposer une figure en étapes", "Tester et corriger un script"])
  ],
  "5e": [
    chapter("5e", 1, "Enchaînements d’opérations", "nombres-calculs", "5eme/chap-01-enchainements-operations", ["Priorités opératoires", "Calculs avec parenthèses", "Calculs sans parenthèses"], ["Respecter les priorités opératoires", "Organiser les étapes d’un calcul", "Vérifier la cohérence d’un résultat"]),
    chapter("5e", 2, "Solides", "grandeurs-mesures", "5eme/chap-02-solides", ["Prismes et cylindres", "Faces, arêtes, sommets et bases", "Représentations et patrons"], ["Reconnaître et décrire un solide", "Lire une représentation en perspective", "Associer un solide à son patron"]),
    chapter("5e", 3, "Proportionnalité", "proportionnalite", "5eme/chap-03-proportionnalite", ["Coefficient de proportionnalité", "Tableaux de proportionnalité", "Applications"], ["Reconnaître une situation de proportionnalité", "Déterminer et utiliser un coefficient", "Résoudre un problème de proportionnalité"]),
    chapter("5e", 4, "Divisibilité", "nombres-calculs", "5eme/chap-04-divisibilite", ["Division euclidienne", "Diviseurs et multiples", "Critères de divisibilité par 3 et par 9"], ["Effectuer une division euclidienne", "Lister des diviseurs et des multiples", "Tester la divisibilité par 3 ou par 9"]),
    chapter("5e", 5, "Fractions", "fractions", "5eme/chap-05-fractions", ["Fractions égales", "Comparaison", "Addition, soustraction et simplification"], ["Produire des fractions égales", "Comparer des fractions", "Additionner, soustraire et simplifier"]),
    chapter("5e", 6, "Triangles", "geometrie", "5eme/chap-06-triangles", ["Somme des angles d’un triangle", "Médiatrices et médianes", "Droites remarquables"], ["Calculer un angle manquant", "Identifier et construire une droite remarquable", "Raisonner sur une figure codée"]),
    chapter("5e", 7, "Nombres relatifs", "nombres-calculs", "5eme/chap-07-nombres-relatifs", ["Nombres relatifs et opposés", "Repérage sur une droite", "Repérage dans le plan"], ["Lire et placer un nombre relatif", "Comparer des nombres relatifs", "Lire et placer un point dans un repère"]),
    chapter("5e", 8, "Symétrie centrale", "geometrie", "5eme/chap-08-symetrie-centrale", ["Construction par symétrie centrale", "Propriétés de conservation", "Axes et centres de symétrie"], ["Construire l’image d’un point ou d’une figure", "Utiliser les propriétés de conservation", "Identifier un centre ou un axe de symétrie"]),
    chapter("5e", 9, "Calcul littéral : expressions", "calcul-litteral", "5eme/chap-09-calcul-litteral-expressions", ["Expressions littérales", "Substitution", "Simplification"], ["Traduire une situation par une expression", "Calculer la valeur d’une expression", "Simplifier une expression simple"]),
    chapter("5e", 10, "Angles et parallélisme", "geometrie", "5eme/chap-10-angles-parallelisme", ["Angles alternes-internes", "Angles correspondants", "Droites parallèles"], ["Reconnaître une configuration", "Calculer un angle", "Utiliser les propriétés des droites parallèles"]),
    chapter("5e", 11, "Nombres relatifs : addition et soustraction", "nombres-calculs", "5eme/chap-11-relatifs-addition-soustraction", ["Addition de relatifs", "Soustraction de relatifs", "Opposé d’un nombre"], ["Additionner des nombres relatifs", "Transformer une soustraction", "Résoudre un problème avec des relatifs"]),
    chapter("5e", 12, "Parallélogrammes", "geometrie", "5eme/chap-12-parallelogrammes", ["Définition et propriétés", "Constructions", "Parallélogrammes particuliers"], ["Reconnaître un parallélogramme", "Construire un parallélogramme", "Utiliser ses propriétés"]),
    chapter("5e", 13, "Puissances", "puissances", "5eme/chap-13-puissances", ["Notation puissance", "Carrés et cubes", "Puissances de 10"], ["Lire et écrire une puissance", "Calculer une puissance simple", "Utiliser les puissances de 10"]),
    chapter("5e", 14, "Calcul littéral : distributivité", "calcul-litteral", "5eme/chap-14-calcul-litteral-distributivite", ["Distributivité simple", "Développement", "Factorisation simple"], ["Développer une expression", "Factoriser une expression simple", "Vérifier une égalité par substitution"]),
    chapter("5e", 15, "Pourcentages et graphiques", "proportionnalite", "5eme/chap-15-pourcentages-graphiques", ["Appliquer un pourcentage", "Trouver un pourcentage", "Lecture et interprétation de graphiques"], ["Calculer une part ou un taux", "Lire un graphique", "Interpréter des données représentées"]),
    chapter("5e", 16, "Aires", "grandeurs-mesures", "5eme/chap-16-aires", ["Aire du triangle", "Aire du disque", "Formules usuelles"], ["Choisir une formule d’aire", "Calculer l’aire d’une figure", "Résoudre un problème d’aire"]),
    chapter("5e", 17, "Équations", "equations", "5eme/chap-17-equations", ["Égalité et inconnue", "Résolution", "Vérification d’une solution"], ["Résoudre une équation simple", "Tester une valeur", "Vérifier et présenter une solution"]),
    chapter("5e", 18, "Statistiques", "statistiques", "5eme/chap-18-statistiques", ["Effectif", "Fréquence", "Moyenne"], ["Calculer un effectif ou une fréquence", "Calculer une moyenne", "Interpréter une série statistique"]),
    chapter("5e", 19, "Volumes", "grandeurs-mesures", "5eme/chap-19-volumes", ["Conversions de volumes", "Prisme et pavé droit", "Cylindre"], ["Convertir des unités de volume", "Calculer le volume d’un prisme ou d’un pavé", "Calculer le volume d’un cylindre"]),
    chapter("5e", 20, "Probabilités", "probabilites", "5eme/chap-20-probabilites", ["Vocabulaire des probabilités", "Issues et événements", "Probabilités simples"], ["Décrire une expérience aléatoire", "Lister les issues", "Calculer une probabilité simple"]),
    chapter("5e", 21, "Algorithmique", "algorithmique", "5eme/chap-21-algorithmique", ["Instructions et variables", "Boucles et conditions", "Scripts Scratch"], ["Lire un programme Scratch", "Prévoir le résultat d’un script", "Modifier ou compléter un algorithme"])
  ],
  "4e": [
    chapter("4e", 1, "Produit en croix", "proportionnalite", "4eme/chap-1-le-produit-en-croix", ["Égalité de fractions", "Quatrième proportionnelle", "Produit en croix"], ["Calculer une valeur manquante", "Justifier une égalité de rapports", "Choisir entre passage à l'unité et produit en croix"]),
    chapter("4e", 2, "Opérations sur les relatifs", "nombres-calculs", "4eme/chap-2-x-de-nombres-relatifs", ["Addition, soustraction et multiplication de relatifs", "Règles de signes", "Calculs numériques avec parenthèses"], ["Calculer avec des relatifs", "Appliquer les règles de signes", "Contrôler la cohérence du signe obtenu"]),
    chapter("4e", 3, "Calcul littéral : réduire, substituer", "calcul-litteral", "4eme/chap-3-calcul-litteral-reduire-substituer", ["Expression littérale et variable", "Terme et coefficient", "Réduction et substitution"], ["Réduire une expression", "Calculer la valeur d'une expression", "Modéliser une situation par une expression"]),
    chapter("4e", 4, "Vitesse et grandeurs composées", "grandeurs-mesures", "4eme/chap-4-vitesse-et-grandeurs-composees", ["Vitesse moyenne", "Formules v = d/t, d = vt et t = d/v", "Unités km/h, m/s et conversions"], ["Calculer une vitesse, une distance ou une durée", "Convertir des unités", "Interpréter une unité composée"]),
    chapter("4e", 5, "Puissances et notation scientifique", "puissances", "4eme/chap-5-puissances-notation-scientifique", ["Puissances d'exposant positif ou négatif", "Puissances de 10", "Écriture scientifique et ordre de grandeur"], ["Écrire un nombre sous forme scientifique", "Utiliser les puissances de 10", "Comparer des ordres de grandeur"]),
    chapter("4e", 6, "Théorème de Pythagore", "pythagore", "4eme/chap-6-theoreme-de-pythagore", ["Triangle rectangle et hypoténuse", "Égalité de Pythagore", "Carré et racine carrée"], ["Identifier l'hypoténuse", "Écrire l'égalité de Pythagore", "Calculer une longueur et rédiger la démonstration"]),
    chapter("4e", 7, "Développer, factoriser", "calcul-litteral", "4eme/chap-7-developper-factoriser", ["Distributivité simple", "Développement", "Factorisation par facteur commun"], ["Développer une expression", "Factoriser une expression simple", "Vérifier par substitution"]),
    chapter("4e", 8, "Divisibilité, multiples, nombres premiers", "nombres-calculs", "4eme/chap-8-divisibilite-multiples-nombres-premiers", ["Multiples et diviseurs", "Nombres premiers", "Décomposition en facteurs premiers"], ["Décomposer un entier", "Simplifier une fraction", "Justifier qu'un nombre est premier ou non"]),
    chapter("4e", 9, "Triangle rectangle ou non", "pythagore", "4eme/chap-9-triangle-rectangle-ou-non", ["Réciproque de Pythagore", "Contraposée éventuelle", "Comparaison des carrés des longueurs"], ["Déterminer si un triangle est rectangle", "Comparer deux résultats", "Rédiger une preuve ou une réfutation"]),
    chapter("4e", 10, "Fractions : égalités, comparaison, addition, soustraction", "fractions", "4eme/chap-10-fractions-egalites-comparaison-et", ["Fractions égales et simplification", "Dénominateur commun", "Comparaison, addition et soustraction"], ["Simplifier une fraction", "Comparer deux fractions", "Additionner ou soustraire en détaillant les étapes"]),
    chapter("4e", 11, "Thalès dans le triangle", "thales", "4eme/chap-11-thales-dans-le-triangle", ["Configuration de Thalès", "Droites parallèles", "Rapports de longueurs"], ["Identifier une configuration", "Écrire les rapports égaux", "Calculer une longueur avec Thalès"]),
    chapter("4e", 12, "Statistiques : moyenne, médiane, étendue", "statistiques", "4eme/chap-12-statistiques-moyenne-mediane-etendue", ["Moyenne", "Médiane", "Étendue, effectifs et fréquences"], ["Calculer les indicateurs", "Interpréter les résultats", "Comparer deux séries simples"]),
    chapter("4e", 13, "Multiplication et division de fractions", "fractions", "4eme/chap-13-fractions-x-et-div", ["Produit de fractions", "Inverse", "Quotient de fractions"], ["Multiplier des fractions", "Diviser par une fraction", "Simplifier avant ou après le calcul"]),
    chapter("4e", 14, "Pyramides et cônes", "grandeurs-mesures", "4eme/chap-14-pyramides-et-cones", ["Pyramide et cône de révolution", "Base, hauteur et génératrice", "Patrons et volumes avec formule"], ["Reconnaître un solide", "Identifier base et hauteur", "Calculer un volume si la formule est disponible"]),
    chapter("4e", 15, "Équations", "equations", "4eme/chap-15-equations", ["Équation du premier degré", "Inconnue, solution et opérations inverses", "Mise en équation simple"], ["Résoudre une équation simple", "Vérifier une solution", "Modéliser un problème par une équation"]),
    chapter("4e", 16, "Réciproque de Thalès", "thales", "4eme/chap-16-thales-reciproques", ["Réciproque du théorème de Thalès", "Parallélisme", "Rapports égaux"], ["Prouver que deux droites sont parallèles", "Comparer deux quotients", "Distinguer Thalès direct et réciproque"]),
    chapter("4e", 17, "Probabilités", "probabilites", "4eme/chap-17-probabilite-equiprobabilite-non-equiprobabilite", ["Expérience aléatoire, issue et événement", "Équiprobabilité et non-équiprobabilité", "Probabilité entre 0 et 1"], ["Lister les issues", "Calculer une probabilité simple", "Modéliser avec un arbre ou un tableau"]),
    chapter("4e", 18, "Translations avec vecteur", "geometrie", "4eme/chap-18-translations-avec-vecteur", ["Translation", "Vecteur comme déplacement", "Direction, sens, longueur et parallélogramme associé"], ["Construire l'image d'un point ou d'une figure", "Utiliser un vecteur de déplacement", "Argumenter avec les propriétés de conservation"]),
    chapter("4e", 19, "Aires et volumes", "grandeurs-mesures", "4eme/chap-19-aires-volumes", ["Formulaire d'aires et volumes", "Figures planes et solides usuels", "Unités et conversions"], ["Choisir une formule", "Calculer aire ou volume", "Contrôler l'unité du résultat"]),
    chapter("4e", 20, "Algorithmique", "algorithmique", "4eme/chap-20-algorithmique", ["Variables", "Conditions et boucles", "Programmes Scratch ou pseudo-code"], ["Lire un programme", "Prévoir une sortie", "Modifier, tester et corriger un algorithme"])
  ],
  "3e": [
    chapter("3e", 1, "Statistiques", "statistiques", "3eme/chap-1-statistiques", ["Moyenne, médiane et étendue", "Quartiles éventuels", "Effectifs, fréquences et diagrammes"], ["Calculer les indicateurs", "Lire et comparer des graphiques", "Rédiger une conclusion argumentée"]),
    chapter("3e", 2, "Théorème de Thalès", "thales", "3eme/chap-2-chap-2-le-theoreme-de-thales", ["Configurations de Thalès", "Triangles emboîtés ou en papillon", "Rapports de longueurs et triangles semblables"], ["Identifier la configuration", "Écrire les rapports dans le bon ordre", "Calculer une longueur et justifier les conditions"]),
    chapter("3e", 3, "Révisions calculatoires", "nombres-calculs", "3eme/chap-3-revisions-calculatoires", ["Priorités, fractions et relatifs", "Puissances et racines carrées", "Calcul littéral et ordre de grandeur"], ["Automatiser les calculs", "Enchaîner plusieurs règles", "Vérifier un résultat pour le DNB"]),
    chapter("3e", 4, "Arithmétique", "nombres-calculs", "3eme/chap-4-arithmetique", ["Divisibilité et nombres premiers", "Décomposition en facteurs premiers", "PGCD, fractions irréductibles et partages"], ["Décomposer un nombre", "Rendre une fraction irréductible", "Résoudre un problème de partage"]),
    chapter("3e", 5, "Réciproque de Thalès", "thales", "3eme/chap-05-reciproque-du-theoreme-de-thales", ["Réciproque de Thalès", "Parallélisme", "Égalité ou non-égalité de quotients"], ["Démontrer que deux droites sont parallèles ou non", "Calculer et comparer des rapports", "Rédiger une preuve claire"]),
    chapter("3e", 6, "Équations", "equations", "3eme/chap-06-equations", ["Équations du premier degré", "Développement, réduction et transposition", "Test d'une solution"], ["Résoudre une équation", "Vérifier une solution", "Mettre un problème en équation"]),
    chapter("3e", 7, "Double distributivité", "calcul-litteral", "3eme/chap-07-la-double-distributivite", ["Produit de deux binômes", "Développement (a+b)(c+d)", "Réduction et signes"], ["Développer une double distributivité", "Réduire l'expression obtenue", "Vérifier par substitution"]),
    chapter("3e", 8, "Notion de fonctions", "fonctions", "3eme/chap-08-notion-de-fonctions", ["Fonction, image et antécédent", "Notation f(x)", "Tableau, graphique et programme de calcul"], ["Calculer une image", "Rechercher un antécédent", "Passer d'un programme à une expression"]),
    chapter("3e", 9, "Identités remarquables", "calcul-litteral", "3eme/chap-09-identites-remarquables", ["(a+b)^2", "(a-b)^2", "(a+b)(a-b)"], ["Développer avec une identité remarquable", "Factoriser une forme remarquable", "Contrôler les signes"]),
    chapter("3e", 10, "Trigonométrie", "trigonometrie", "3eme/chap-10-trigonometrie", ["Sinus, cosinus et tangente", "Côté opposé, adjacent et hypoténuse", "Calcul de longueur ou d'angle"], ["Choisir le bon rapport trigonométrique", "Calculer une longueur ou un angle", "Arrondir et rédiger correctement"]),
    chapter("3e", 11, "Fonctions linéaires et affines", "fonctions", "3eme/chap-11-fonctions-lineaires-et-affines", ["Fonction linéaire f(x)=ax", "Fonction affine f(x)=ax+b", "Coefficient directeur et ordonnée à l'origine"], ["Reconnaître une fonction linéaire ou affine", "Déterminer une expression", "Tracer ou lire une droite"]),
    chapter("3e", 12, "Sphères et boules", "grandeurs-mesures", "3eme/chap-12-spheres-et-boules", ["Sphère, boule, rayon et diamètre", "Aire de la sphère", "Volume de la boule"], ["Identifier sphère et boule", "Utiliser une formule", "Calculer, arrondir et choisir l'unité"]),
    chapter("3e", 13, "Probabilités", "probabilites", "3eme/chap-13-probabilites", ["Issues et événements", "Événement contraire", "Arbres, tableaux et événements composés simples"], ["Modéliser une expérience", "Calculer une probabilité", "Utiliser l'événement contraire"]),
    chapter("3e", 14, "Homothéties", "geometrie", "3eme/chap-14-homotheties", ["Centre et rapport d'homothétie", "Agrandissement et réduction", "Effet sur longueurs, aires et volumes"], ["Construire une image par homothétie", "Reconnaître le rapport", "Relier homothétie et triangles semblables"]),
    chapter("3e", 15, "Repérage dans l'espace", "geometrie", "3eme/chap-15-reperage-dans-lespace", ["Repère dans un pavé droit", "Coordonnées (x ; y ; z)", "Abscisse, ordonnée et cote"], ["Lire les coordonnées d'un point", "Placer un point dans l'espace", "Communiquer avec une notation correcte"]),
    chapter("3e", 16, "Algorithmique", "algorithmique", "3eme/chap-16-algorithmique", ["Variables, boucles et conditions", "Fonctions ou blocs Scratch", "Simulation et programmes de calcul"], ["Lire un algorithme", "Écrire ou modifier un programme", "Tester, corriger et expliquer le fonctionnement"]),
    chapter("3e", 20, "DNB officiel", "nombres-calculs", "3eme/dnb", ["Automatismes issus des sujets officiels", "Calculs, fonctions, géométrie et données", "Réinvestissement global"], ["Mobiliser les acquis du collège", "Choisir une méthode efficace", "Se préparer aux automatismes du DNB"])
  ]
};

export const progressionLevels: Level[] = ["6e", "5e", "4e", "3e"];

export const allSiteProgressionChapters: ChapterInfo[] = progressionLevels.flatMap(
  (level) => siteProgressionChapters[level]
);

export const allSiteProgressionChapterIds = new Set(allSiteProgressionChapters.map((chapterItem) => chapterItem.id));

export function createDefaultChapterSelectionByLevel(): ChapterSelectionByLevel {
  return {
    "6e": [],
    "5e": [],
    "4e": [],
    "3e": []
  };
}

export function createDefaultChapterOrderByLevel(): ChapterOrderByLevel {
  return {
    "6e": siteProgressionChapters["6e"].map((chapterItem) => chapterItem.id),
    "5e": siteProgressionChapters["5e"].map((chapterItem) => chapterItem.id),
    "4e": siteProgressionChapters["4e"].map((chapterItem) => chapterItem.id),
    "3e": siteProgressionChapters["3e"].map((chapterItem) => chapterItem.id)
  };
}

export function getChapterById(chapterId: string): ChapterInfo | undefined {
  return allSiteProgressionChapters.find((chapterItem) => chapterItem.id === chapterId);
}

export function getEffectiveChapterLevel(
  chapter: ChapterInfo,
  overrides: ChapterLevelOverrides = {}
): Level {
  return overrides[chapter.id] ?? chapter.level;
}

export function getChapterOrderIndex(
  chapterId: string,
  level: Level,
  orderByLevel: Partial<ChapterOrderByLevel> = {}
): number {
  const order = orderByLevel[level] ?? createDefaultChapterOrderByLevel()[level];
  const index = order.indexOf(chapterId);
  return index >= 0 ? index + 1 : 999;
}

export function getOrderedChaptersForLevel(
  level: Level,
  orderByLevel: Partial<ChapterOrderByLevel> = {},
  overrides: ChapterLevelOverrides = {}
): ChapterInfo[] {
  return allSiteProgressionChapters
    .filter((chapterItem) => getEffectiveChapterLevel(chapterItem, overrides) === level)
    .sort((left, right) => {
      const leftIndex = getChapterOrderIndex(left.id, level, orderByLevel);
      const rightIndex = getChapterOrderIndex(right.id, level, orderByLevel);
      if (leftIndex !== rightIndex) {
        return leftIndex - rightIndex;
      }
      if (left.level !== right.level) {
        return progressionLevels.indexOf(left.level) - progressionLevels.indexOf(right.level);
      }
      return left.rank - right.rank;
    });
}

export function getChapterLimitFromProgression(level: Level, step: ProgressionStep): number {
  const max = siteProgressionChapters[level].length;
  if (step === "start") {
    return Math.max(1, Math.ceil(max * 0.18));
  }
  if (step === "trimester1") {
    return Math.ceil(max * 0.35);
  }
  if (step === "trimester2") {
    return Math.ceil(max * 0.68);
  }
  return max;
}

export function getChapter(level: Level, rank: number): ChapterInfo {
  return siteProgressionChapters[level].find((chapterItem) => chapterItem.rank === rank) ?? siteProgressionChapters[level][0];
}

export function getChapterLabel(level: Level, rank: number): string {
  const current = getChapter(level, rank);
  return `Chap ${current.rank} : ${current.title}`;
}
