/**
 * Le guide du pré-workout (/guide/pre-workout) et les fiches d'ingrédients
 * (/ingredients/…). Le contenu que les gens cherchent — « pré-workout c'est
 * quoi », « citrulline », « bêta-alanine »… — écrit pour être lu, cité et
 * vérifié.
 *
 * Trois règles d'écriture, non négociables :
 *  1. Des faits, avec leur source. Aucune promesse d'effet : la seule phrase de
 *     bénéfice du site est l'allégation autorisée sur la créatine, citée telle
 *     quelle (règlement (UE) n° 432/2012). scripts/gate.sh passe sur ce fichier.
 *  2. Les doses de CRI viennent de cri-formule.json, jamais recopiées à la main.
 *  3. Pas de faux expert : l'auteur est la marque. Une relecture par un
 *     professionnel (diététicien, pharmacien) reste à faire — ASSUMPTIONS.md.
 *
 * `UPDATED` : la date de la dernière vraie modification du contenu. Elle
 * s'affiche sur les pages et part dans le sitemap : ne la changer que si le
 * texte change.
 */
import FORMULE from "./cri-formule.json";
import { shortAmount } from "./formula";

export const PUBLISHED = "2026-11-26";
export const UPDATED = "2026-11-26";

const dose = (nom: string) => shortAmount(FORMULE.actifs.find((a) => a.nom === nom)?.quantite ?? "TODO");

export type Source = { label: string; url: string };
export type Section = { heading: string; paragraphs: string[] };
export type Qa = { question: string; answer: string };

const S = {
  reg432: { label: "Règlement (UE) n° 432/2012 : la liste des allégations de santé autorisées", url: "https://eur-lex.europa.eu/eli/reg/2012/432/oj" },
  reg1924: { label: "Règlement (CE) n° 1924/2006 sur les allégations nutritionnelles et de santé", url: "https://eur-lex.europa.eu/eli/reg/2006/1924/oj" },
  registre: { label: "Registre de l'Union européenne des allégations de santé (Commission européenne)", url: "https://ec.europa.eu/food/food-feed-portal/screen/health-claims/eu-register" },
  efsaCafeine: { label: "EFSA, avis scientifique sur la sécurité de la caféine, EFSA Journal 2015;13(5):4102", url: "https://www.efsa.europa.eu/en/efsajournal/pub/4102" },
  reg1169: { label: "Règlement (UE) n° 1169/2011 sur l'information des consommateurs (annexe III : mention caféine)", url: "https://eur-lex.europa.eu/eli/reg/2011/1169/oj" },
  dir2002: { label: "Directive 2002/46/CE relative aux compléments alimentaires", url: "https://eur-lex.europa.eu/eli/dir/2002/46/oj" },
  ama: { label: "Agence mondiale antidopage : la Liste des interdictions", url: "https://www.wada-ama.org/fr/liste-des-interdictions" },
} satisfies Record<string, Source>;

const AUCUNE = (nom: string) =>
  `Aucune allégation de santé n'est autorisée pour ${nom} dans l'Union européenne : elle ne figure pas dans la liste du règlement (UE) n° 432/2012. Un fabricant n'a donc pas le droit d'écrire ce qu'elle « fait ». SCULT ne l'écrit pas : on donne la dose, et ce que la molécule est.`;

// — Les fiches d'ingrédients —

export type Ingredient = {
  slug: string;
  name: string;
  /** Le titre de la page (h1) et son titre pour les moteurs. */
  title: string;
  seoTitle: string;
  description: string;
  intro: string;
  /** « En bref » : les faits en deux colonnes. */
  facts: [string, string][];
  sections: Section[];
  questions: Qa[];
  sources: Source[];
};

export const INGREDIENTS: Ingredient[] = [
  {
    slug: "citrulline",
    name: "Citrulline",
    title: "Citrulline : ce que c'est, comment lire la dose",
    seoTitle: "Citrulline : définition, L-citrulline ou citrulline malate, dosage",
    description: `La citrulline expliquée sans promesse : ce que c'est, la différence entre L-citrulline et citrulline malate, comment comparer deux étiquettes. Dans CRI : ${dose("L-citrulline")} par dose.`,
    intro: "La citrulline est un acide aminé. Elle doit son nom à la pastèque (Citrullus lanatus), où elle a été isolée ; le corps humain en fabrique aussi. C'est l'ingrédient le plus dosé de la plupart des pré-workouts, et celui dont l'étiquette se lit le plus mal.",
    facts: [
      ["Nature", "Acide aminé, non utilisé pour construire les protéines"],
      ["Où on en trouve", "La pastèque, surtout ; le corps en produit"],
      ["Formes vendues", "L-citrulline (pure) ou citrulline malate (liée à l'acide malique)"],
      ["Dans CRI", `${dose("L-citrulline")} de L-citrulline par dose`],
      ["Allégation autorisée dans l'UE", "Aucune"],
    ],
    sections: [
      {
        heading: "L-citrulline ou citrulline malate : la même chose ?",
        paragraphs: [
          "Non, et c'est là que deux étiquettes cessent d'être comparables. La L-citrulline est la molécule seule. La citrulline malate est un mélange de L-citrulline et d'acide malique, dans une proportion que le fabricant doit indiquer : le plus souvent 2:1, parfois 1:1.",
          "Dans une citrulline malate 2:1, deux tiers du poids sont de la L-citrulline. Six grammes de citrulline malate 2:1 apportent donc quatre grammes de L-citrulline. En 1:1, la moitié seulement : six grammes en apportent trois. Quand une étiquette écrit « citrulline 6 g » sans préciser la forme ni la proportion, on ne sait pas ce qu'il y a dans la dose.",
          `CRI contient de la L-citrulline, pas de la citrulline malate : les ${dose("L-citrulline")} écrits sur le pot sont ${dose("L-citrulline")} de L-citrulline.`,
        ],
      },
      {
        heading: "Ce que la réglementation permet d'en dire",
        paragraphs: [AUCUNE("la citrulline")],
      },
    ],
    questions: [
      { question: "Quelle est la dose de citrulline dans CRI ?", answer: `${dose("L-citrulline")} de L-citrulline par dose de ${FORMULE.dose}, soit une mesure rase.` },
      { question: "Comment comparer la citrulline de deux pré-workouts ?", answer: "Regardez la forme. En L-citrulline, le chiffre se lit tel quel. En citrulline malate, multipliez par deux tiers si la proportion est 2:1, par un demi si elle est 1:1 : c'est la quantité de L-citrulline réellement apportée." },
    ],
    sources: [S.registre, S.reg432, S.reg1924],
  },
  {
    slug: "beta-alanine",
    name: "Bêta-alanine",
    title: "Bêta-alanine : ce que c'est, pourquoi ça picote",
    seoTitle: "Bêta-alanine : définition, dosage, picotements",
    description: `La bêta-alanine expliquée sans promesse : ce que c'est, d'où viennent les picotements, ce que la réglementation permet d'en dire. Dans CRI : ${dose("Bêta-alanine")} par dose.`,
    intro: "La bêta-alanine est un acide aminé que le corps fabrique lui-même. Avec un autre acide aminé, l'histidine, elle compose la carnosine, une molécule présente dans les muscles. On la reconnaît surtout à un signe : elle picote.",
    facts: [
      ["Nature", "Acide aminé, non utilisé pour construire les protéines"],
      ["Où on en trouve", "La viande et le poisson, par la carnosine ; le corps en produit"],
      ["Signe distinctif", "Des picotements passagers sur la peau"],
      ["Dans CRI", `${dose("Bêta-alanine")} par dose`],
      ["Allégation autorisée dans l'UE", "Aucune"],
    ],
    sections: [
      {
        heading: "Pourquoi ça picote",
        paragraphs: [
          "Dans le quart d'heure qui suit la prise, la bêta-alanine peut provoquer des picotements sur la peau, souvent au visage, au cou et aux mains. Ce phénomène porte un nom, la paresthésie. Il est passager et dépend de la dose prise d'un coup.",
          "C'est pour cela que l'étiquette de CRI conseille une demi-dose les premières prises : on voit comment on réagit avant de prendre la dose entière. La mention figure aussi dans les précautions d'emploi du pot.",
        ],
      },
      {
        heading: "Ce que la réglementation permet d'en dire",
        paragraphs: [AUCUNE("la bêta-alanine")],
      },
    ],
    questions: [
      { question: "Combien de bêta-alanine dans CRI ?", answer: `${dose("Bêta-alanine")} par dose de ${FORMULE.dose}.` },
      { question: "Les picotements de la bêta-alanine sont-ils normaux ?", answer: "Oui : c'est un effet connu de la bêta-alanine, passager. Commencez par une demi-dose. S'ils vous gênent ou s'accompagnent d'autre chose, arrêtez et demandez l'avis d'un professionnel de santé." },
    ],
    sources: [S.registre, S.reg432, S.reg1924],
  },
  {
    slug: "creatine",
    name: "Créatine",
    title: "Créatine : la seule dont on a le droit de dire ce qu'elle fait",
    seoTitle: "Créatine : définition, dose de 3 g, ce que dit la réglementation",
    description: `La créatine est le seul ingrédient de CRI qui porte une allégation de santé autorisée dans l'Union européenne, pour 3 g par jour. Ce que c'est, et la phrase exacte du règlement.`,
    intro: "La créatine est un composé que le corps fabrique à partir de trois acides aminés et qu'il stocke surtout dans les muscles. La viande et le poisson en apportent aussi. C'est, de tous les ingrédients d'un pré-workout, celui que la réglementation européenne traite à part.",
    facts: [
      ["Nature", "Composé azoté, fabriqué par le corps à partir d'arginine, de glycine et de méthionine"],
      ["Où on en trouve", "La viande et le poisson ; le corps en produit"],
      ["Forme dans CRI", "Créatine monohydrate"],
      ["Dans CRI", `${dose("Créatine")} par dose`],
      ["Allégation autorisée dans l'UE", "Oui, pour 3 g par jour"],
    ],
    sections: [
      {
        heading: "La phrase que le règlement autorise",
        paragraphs: [
          "Le règlement (UE) n° 432/2012 dresse la liste des allégations de santé qu'un fabricant peut écrire. Pour la créatine, il en autorise une, mot pour mot : « La créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée. »",
          "Cette phrase a une condition : le produit doit apporter 3 g de créatine par jour, et le consommateur doit en être informé. Elle vaut pour des adultes qui pratiquent un exercice physique intense.",
          `CRI apporte ${dose("Créatine")} de créatine par dose, une dose par jour : exactement la quantité à laquelle le règlement attache cette phrase. C'est le seul bénéfice que SCULT écrit sur son site.`,
        ],
      },
      {
        heading: "Monohydrate : pourquoi cette forme",
        paragraphs: ["La créatine monohydrate est une molécule de créatine liée à une molécule d'eau. C'est la forme la plus répandue, et celle que l'on retrouve dans la liste d'ingrédients de CRI."],
      },
    ],
    questions: [
      { question: "Combien de créatine dans CRI ?", answer: `${dose("Créatine")} de créatine monohydrate par dose de ${FORMULE.dose}, une dose par jour.` },
      { question: "Que peut-on dire de la créatine, légalement ?", answer: "Une seule phrase, celle du règlement (UE) n° 432/2012 : « La créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée », pour 3 g par jour." },
    ],
    sources: [S.reg432, S.registre, S.reg1924],
  },
  {
    slug: "cafeine",
    name: "Caféine",
    title: "Caféine : combien il y en a, et les repères à connaître",
    seoTitle: "Caféine dans un pré-workout : dose, repères de l'EFSA, précautions",
    description: `La caféine d'un pré-workout expliquée en chiffres : les repères de l'EFSA (200 mg en une prise, 400 mg par jour), la mention obligatoire, et la dose de CRI : ${FORMULE.cafeineTotale} par dose.`,
    intro: `La caféine est un alcaloïde présent dans le café, le thé, le guarana et le cacao. C'est l'ingrédient d'un pré-workout pour lequel il existe des repères chiffrés officiels, et celui qu'il faut regarder en premier sur une étiquette. Dans CRI, il y en a ${FORMULE.cafeineTotale} par dose : c'est une dose forte.`,
    facts: [
      ["Nature", "Alcaloïde présent dans le café, le thé, le guarana, le cacao"],
      ["Un expresso", "Environ 80 mg de caféine"],
      ["Repère EFSA, une prise", "Jusqu'à 200 mg pour un adulte en bonne santé"],
      ["Repère EFSA, par jour", "Jusqu'à 400 mg toutes sources confondues ; 200 mg pendant la grossesse"],
      ["Dans CRI", `Environ ${FORMULE.cafeineTotale} par dose, en deux formes`],
      ["Allégation autorisée dans l'UE", "Aucune"],
    ],
    sections: [
      {
        heading: "Les repères de l'EFSA",
        paragraphs: [
          "En 2015, l'Autorité européenne de sécurité des aliments (EFSA) a publié un avis sur la sécurité de la caféine. Pour un adulte en bonne santé, elle estime qu'une prise unique allant jusqu'à 200 mg ne pose pas de problème de sécurité, et qu'une consommation habituelle allant jusqu'à 400 mg par jour, toutes sources confondues, n'en pose pas non plus. Pour une femme enceinte ou allaitante, le repère est de 200 mg par jour.",
          `Une dose de CRI apporte environ ${FORMULE.cafeineTotale} de caféine : près du double du repère pour une prise unique, et presque tout le repère de la journée. C'est écrit sur le pot, et c'est la raison des consignes qui l'accompagnent : une demi-dose les premières prises, une dose par jour au plus, aucune autre source de caféine ou de stimulant le même jour.`,
        ],
      },
      {
        heading: "Deux formes de caféine dans CRI",
        paragraphs: [
          `CRI contient ${dose("Caféine anhydre")} de caféine anhydre, c'est-à-dire de la caféine sans eau, et ${dose("Dicaféine malate")} de dicaféine malate, un sel de caféine et d'acide malique. Le dicaféine malate n'est pas de la caféine pure : ses ${dose("Dicaféine malate")} en apportent environ 220 mg. Les deux réunis font les ${FORMULE.cafeineTotale} annoncés.`,
          "Sur une étiquette, c'est toujours le total de caféine qui compte, pas le poids de chaque forme. La réglementation européenne impose d'ailleurs de l'écrire : tout aliment auquel de la caféine a été ajoutée qui n'est pas une boisson doit porter la mention « Contient de la caféine. Déconseillé aux enfants et aux femmes enceintes », suivie de la teneur.",
        ],
      },
      {
        heading: "Pour qui c'est déconseillé",
        paragraphs: [FORMULE.precautions.split(" Les compléments alimentaires")[0], "Ne prenez pas CRI dans les six heures qui précèdent le coucher."],
      },
      {
        heading: "Ce que la réglementation permet d'en dire",
        paragraphs: [AUCUNE("la caféine")],
      },
    ],
    questions: [
      { question: "Combien de caféine dans une dose de CRI ?", answer: `Environ ${FORMULE.cafeineTotale}, l'équivalent de quatre à cinq expressos, en deux formes : caféine anhydre et dicaféine malate.` },
      { question: "Quelle quantité de caféine par jour l'EFSA juge-t-elle sans risque ?", answer: "Pour un adulte en bonne santé : jusqu'à 200 mg en une prise et jusqu'à 400 mg par jour, toutes sources confondues. Pour une femme enceinte ou allaitante : 200 mg par jour (avis de 2015)." },
    ],
    sources: [S.efsaCafeine, S.reg1169, S.registre],
  },
  {
    slug: "l-theanine",
    name: "L-théanine",
    title: "L-théanine : l'acide aminé du thé",
    seoTitle: "L-théanine : définition, origine, dosage",
    description: `La L-théanine expliquée sans promesse : ce que c'est, d'où elle vient, ce que la réglementation permet d'en dire. Dans CRI : ${dose("L-théanine")} par dose.`,
    intro: "La L-théanine est un acide aminé que l'on ne trouve presque que dans une plante : le théier (Camellia sinensis). C'est l'un des composés qui donnent au thé vert son goût. Dans un pré-workout, on la rencontre souvent à côté de la caféine.",
    facts: [
      ["Nature", "Acide aminé, non utilisé pour construire les protéines"],
      ["Où on en trouve", "Les feuilles de thé, presque exclusivement"],
      ["Dans CRI", `${dose("L-théanine")} par dose`],
      ["Allégation autorisée dans l'UE", "Aucune"],
    ],
    sections: [
      {
        heading: "Ce que la réglementation permet d'en dire",
        paragraphs: [AUCUNE("la L-théanine"), "Beaucoup de marques lui prêtent pourtant des vertus dans leurs fiches produit. Ces phrases ne figurent dans aucune liste autorisée ; c'est une des raisons pour lesquelles SCULT préfère donner une dose plutôt qu'une promesse."],
      },
    ],
    questions: [{ question: "Combien de L-théanine dans CRI ?", answer: `${dose("L-théanine")} par dose de ${FORMULE.dose}.` }],
    sources: [S.registre, S.reg432, S.reg1924],
  },
];

export const getIngredient = (slug: string) => INGREDIENTS.find((i) => i.slug === slug) ?? null;

// — Le guide —

export const GUIDE = {
  path: "/guide/pre-workout",
  eyebrow: "Guide",
  title: "Pré-workout : ce que c'est, ce qu'il y a dedans, comment le lire",
  seoTitle: "Pré-workout : c'est quoi, composition, quand le prendre",
  description: "Le guide du pré-workout sans promesse : ce que c'est, ce qu'il contient, comment lire une étiquette, combien de caféine, quand le prendre, pour qui c'est déconseillé. Avec les sources.",
  intro: "Un pré-workout est un complément alimentaire, le plus souvent une poudre à diluer, que l'on prend avant une séance de sport. Ce guide dit ce qu'il y a dedans, comment lire l'étiquette et ce qu'un fabricant a le droit d'en dire. Il ne promet rien : on vous donne les chiffres et leurs sources.",
  summary: [
    "Un pré-workout est un complément alimentaire en poudre, pris avant l'entraînement.",
    "On y trouve surtout des acides aminés (citrulline, bêta-alanine), de la créatine et de la caféine.",
    "L'étiquette se compare dose par dose, en regardant la forme de chaque ingrédient et le total de caféine.",
    `Repères de l'EFSA pour la caféine : 200 mg en une prise, 400 mg par jour. CRI en apporte ${FORMULE.cafeineTotale} par dose.`,
    "Dans l'Union européenne, seule la créatine porte une allégation de santé autorisée, pour 3 g par jour.",
  ],
  sections: [
    {
      heading: "Un pré-workout, c'est quoi ?",
      paragraphs: [
        "Au sens de la loi, c'est un complément alimentaire : une denrée « dont le but est de compléter le régime alimentaire normal », vendue en doses (directive 2002/46/CE). Ce n'est ni un médicament ni un aliment de tous les jours. Il se présente presque toujours en poudre aromatisée, à mélanger dans de l'eau.",
        "Le mot vient de l'anglais pre-workout, « avant l'entraînement ». En français on dit aussi pré-entraînement. Derrière ces noms, les formules varient beaucoup : c'est pour cela qu'il faut lire l'étiquette plutôt que la face du pot.",
      ],
    },
    {
      heading: "Ce qu'il y a dedans",
      paragraphs: [
        "Quatre familles d'ingrédients reviennent dans presque toutes les formules. Des acides aminés, d'abord : la citrulline et la bêta-alanine, souvent les deux plus dosés. De la créatine, parfois. De la caféine, presque toujours, et parfois d'autres stimulants. Enfin des extraits de plantes, du sel, des arômes et un édulcorant.",
        `Dans CRI, par dose de ${FORMULE.dose} : ${dose("L-citrulline")} de L-citrulline, ${dose("Bêta-alanine")} de bêta-alanine, ${dose("Créatine")} de créatine, ${dose("L-théanine")} de L-théanine et ${FORMULE.cafeineTotale} de caféine, plus un complexe de sept ingrédients donné par son poids total (${shortAmount(FORMULE.complexe.quantite)}). Chaque ingrédient a sa fiche, liée plus bas.`,
      ],
    },
    {
      heading: "Lire une étiquette en quatre points",
      paragraphs: [
        "La dose, d'abord. Tous les chiffres d'une étiquette valent « par dose » : une dose de 10 g et une dose de 23 g ne se comparent pas ligne à ligne. Regardez aussi le nombre de doses par pot : c'est lui qui donne le vrai prix, celui d'une dose.",
        "La forme de chaque ingrédient, ensuite. Six grammes de citrulline malate 2:1 n'apportent que quatre grammes de L-citrulline. Trois cents milligrammes de dicaféine malate n'apportent pas trois cents milligrammes de caféine.",
        "Le total de caféine. Quand elle vient de plusieurs ingrédients, c'est la somme qui compte, et elle doit être écrite.",
        "Les mélanges, enfin. Un « complexe » ou une « matrice » donnés par leur seul poids total ne disent pas combien il y a de chaque ingrédient. CRI donne la dose de dix actifs un par un ; son complexe Focus, lui, est donné par son poids total.",
      ],
    },
    {
      heading: "Combien de caféine ?",
      paragraphs: [
        "C'est le chiffre à regarder en premier. L'Autorité européenne de sécurité des aliments (EFSA) retient deux repères pour un adulte en bonne santé : jusqu'à 200 mg en une prise, et jusqu'à 400 mg par jour toutes sources confondues, café et thé compris. Pour une femme enceinte ou allaitante : 200 mg par jour.",
        `Un expresso en apporte environ 80 mg. Une dose de CRI en apporte environ ${FORMULE.cafeineTotale} : c'est une dose forte, au-dessus du repère pour une prise unique. D'où les consignes écrites sur le pot : une demi-dose pour commencer, une dose par jour au plus, et rien d'autre de caféiné ce jour-là.`,
      ],
    },
    {
      heading: "Quand et comment le prendre",
      paragraphs: [`Suivez l'étiquette du produit que vous avez en main : les consignes changent d'une formule à l'autre. Pour CRI : ${FORMULE.usage.charAt(0).toLowerCase()}${FORMULE.usage.slice(1)} ${FORMULE.usageFort} ${FORMULE.usageFin}`],
    },
    {
      heading: "Pour qui c'est déconseillé",
      paragraphs: [
        "Un pré-workout caféiné est réservé à l'adulte. Il est déconseillé aux enfants, aux adolescents et aux femmes enceintes ou allaitantes. En cas d'hypertension, de trouble cardiaque ou de traitement médical, demandez l'avis d'un professionnel de santé avant d'en prendre.",
        "Si vous êtes soumis aux contrôles antidopage, vérifiez chaque ingrédient sur la Liste des interdictions de l'Agence mondiale antidopage. CRI contient des stimulants interdits en compétition : il n'est pas fait pour un sportif contrôlé.",
        "Un complément alimentaire ne remplace pas une alimentation variée et équilibrée ni un mode de vie sain.",
      ],
    },
    {
      heading: "Ce qu'un fabricant a le droit de dire",
      paragraphs: [
        "Dans l'Union européenne, une marque ne peut écrire sur un aliment qu'une allégation de santé inscrite sur une liste officielle (règlements n° 1924/2006 et n° 432/2012). Pour la citrulline, la bêta-alanine, la L-théanine et la caféine, cette liste ne contient rien.",
        "Pour la créatine, elle contient une phrase : « La créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée », à condition d'en apporter 3 g par jour. C'est la seule que SCULT écrit. Le reste du site donne des doses.",
      ],
    },
  ] satisfies Section[],
  questions: [
    { question: "Un pré-workout, c'est quoi ?", answer: "Un complément alimentaire, le plus souvent en poudre à diluer, pris avant une séance de sport. Il contient en général des acides aminés (citrulline, bêta-alanine), parfois de la créatine, et de la caféine." },
    { question: "Combien de temps avant l'entraînement faut-il le prendre ?", answer: `Suivez l'étiquette du produit. Pour CRI : 20 à 30 minutes avant, une dose de ${FORMULE.dose} dans 400 ml d'eau.` },
    { question: "Un pré-workout est-il dangereux ?", answer: `Le point à surveiller est la caféine. L'EFSA retient pour un adulte en bonne santé jusqu'à 200 mg en une prise et 400 mg par jour. Certaines formules dépassent le premier repère : CRI apporte ${FORMULE.cafeineTotale} par dose. Un pré-workout caféiné est déconseillé aux enfants, aux adolescents, aux femmes enceintes ou allaitantes, et demande un avis médical en cas d'hypertension, de trouble cardiaque ou de traitement.` },
    { question: "Que contient un pré-workout ?", answer: "Le plus souvent : citrulline, bêta-alanine, caféine, parfois créatine et extraits de plantes, avec des arômes et un édulcorant. Les doses varient beaucoup d'une marque à l'autre : comparez-les dose par dose." },
    { question: "Peut-on prendre un pré-workout tous les jours ?", answer: "Suivez l'étiquette : CRI se prend à raison d'une dose par jour au maximum, et pas dans les six heures avant le coucher. Comptez aussi la caféine du café et du thé de la journée." },
  ] satisfies Qa[],
  sources: [S.dir2002, S.efsaCafeine, S.reg432, S.reg1924, S.reg1169, S.registre, S.ama] satisfies Source[],
};
