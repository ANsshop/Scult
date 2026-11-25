/**
 * Tous les textes de la DA « bouffon » : l'intro rose, le hero dark, la
 * navigation, le bandeau de la fiche produit, le slider de l'accueil, la 404,
 * la page de confirmation. Un seul fichier : on change un texte ici,
 * sans ouvrir un composant.
 *
 * ⚠ Tout est provisoire (voir ASSUMPTIONS.md). Les textes passent par
 * scripts/gate.sh comme le reste du site : aucune promesse d'effet.
 * `TODO` = texte à fournir ; il s'afficherait tel quel sur le site, exprès.
 */
import FORMULE from "./cri-formule.json";
import { shortAmount } from "./formula";

/** La dose d'un actif telle qu'elle s'écrit sur le site : « 8 000 mg » → « 8 g ». */
const dose = (nom: string) => shortAmount(FORMULE.actifs.find((a) => a.nom === nom)?.quantite ?? "TODO");

/**
 * La ligne de dosages du hero. Une seule source de vérité : cri-formule.json,
 * la même que la fiche produit, la FAQ et l'avertissement caféine. Quand la
 * formule change là-bas, cette ligne suit.
 */
const DOSAGES = `Citrulline ${dose("L-citrulline")}. Bêta-alanine ${dose("Bêta-alanine")}. Caféine ${FORMULE.cafeineTotale}.`;

/** Phase rose : le faux site. Décor pur — jamais lu par un lecteur d'écran, jamais indexé. */
export const INTRO = {
  nav: ["Scult", "Boutique", "Nos saveurs", "Notre histoire", "Panier"],
  badge: "Nouveau · saveur fraise bonbon",
  // TODO titre à valider : le brief disait « Ton boost tout doux », que scripts/gate.sh refuse (« boost »).
  title: "Ton pré-workout tout doux",
  text: "Le pré-workout tout mignon qui te met de bonne humeur avant ta séance.",
  button: "Je craque",
  line: "100 % douceur · 0 % prise de tête",
};

/**
 * La bande qui défile au-dessus de la navigation, sur toutes les pages.
 * ⚠ Le chiffre n'est pas calculé : il correspond au prix actuel du pack de 2
 * (83,30 € au lieu de 98 €, soit 14,70 € de moins sur un deuxième pot à 49 €).
 * Si le prix du pack change dans le catalogue, changer ce texte.
 */
export const ANNONCE = { text: "−30 % sur le deuxième pot", href: "/produits/cri" };

/** Navigation du vrai site. Le panier est le bouton du tiroir, à droite. */
export const NAV = [
  { label: "Pre-workout", href: "/produits/cri" },
  { label: "La formule", href: "/#formule" },
  { label: "Le bouffon", href: "/#bouffon" },
];

/** Hero dark de l'accueil. */
export const HERO = {
  eyebrow: "N°001 — PRE-WORKOUT",
  /** Le H1 : `accent` est la partie en rose. */
  title: { main: "T'as cru", accent: "quoi ?" },
  text: `${DOSAGES} Zéro paillettes.`,
  cta: { label: "Prends ta dose", href: "/produits/cri" },
  secondary: { label: "Voir la formule", href: "/#formule" },
  legal: "Complément alimentaire · Réservé aux adultes · Contient de la caféine",
  alt: "Un bouffon musclé au masque blanc fendu d'un sourire tend un pot SCULT noir et rose vers l'objectif, dans une salle de sport en sous-sol",
};

/**
 * La deuxième slide du hero : l'annonce du prochain produit, les pochons de
 * caféine. Fournis le 2026-11-25 : 80 mg de caféine par pochon, 30 pochons par
 * boîte, goût fraise piquante. ⚠ Toujours manquants, donc pas affichés : le
 * nom du produit, le prix, la date de sortie (ASSUMPTIONS.md). Le bouton ouvre
 * un e-mail ; il pointera vers la fiche quand le produit sera au catalogue.
 */
export const HERO_POCHES = {
  badge: "Nouveau · bientôt",
  title: { main: "La caféine", accent: "en poche." },
  text: "30 pochons de caféine, à glisser contre la gencive. 80 mg par pochon, goût fraise piquante. Sans poudre, sans shaker.",
  cta: { label: "Me prévenir", href: "mailto:hello@scult.eu?subject=Pochons%20de%20caf%C3%A9ine%20%3A%20pr%C3%A9venez-moi" },
  alt: "Le bouffon tend vers l'objectif une petite boîte ronde noire frappée du sourire rose ; de l'autre main, il montre un pochon blanc tenu entre deux doigts",
};

/**
 * La section « Complexe Focus », en bas de la fiche produit. Le nom du
 * complexe, son poids et ses ingrédients viennent de cri-formule.json ; ici,
 * seulement les textes autour.
 * `glosses` : ce qu'est chaque ingrédient, en clair — son identité, jamais un
 * effet (règlement 1924/2006, scripts/gate.sh). La clé est le nom exact de
 * l'étiquette ; un ingrédient sans entrée n'affiche que son nom.
 * ⚠ Provisoire, à faire relire avec l'étiquetage.
 */
export const FOCUS = {
  eyebrow: "Dans chaque dose",
  text: (count: number, amount: string) => `${count} ingrédients réunis en un seul complexe : ${amount} par dose. Les voici, un par un.`,
  total: "Le complexe",
  per: "par dose",
  glosses: {
    "DMAE bitartrate": "Diméthylaminoéthanol, sous forme de bitartrate.",
    "Hericium erinaceus (lion's mane)": "Un champignon, la « crinière de lion ».",
    "Extrait de genévrier 10:1": "Baies de genévrier, extrait concentré dix fois.",
    "Mucuna pruriens (L-DOPA 99 %)": "Le pois mascate, extrait titré en L-DOPA.",
    "Hordénine 98 %": "Hordénine pure à 98 %.",
    "Huperzia serrata (huperzine A 1 %)": "Un lycopode, extrait titré en huperzine A.",
  },
};

/** Bandeau en tête de la fiche produit. */
export const PRODUCT_BANNER = {
  title: "La blague est finie.",
  text: "Le pré-workout qui ne fait pas semblant.",
  cta: { label: "Commander", href: "#commander" },
  alt: "Le pot SCULT posé au sol au premier plan ; derrière lui, le bouffon accroupi, les mains à plat",
};

/**
 * Le slider de l'accueil (ancre #bouffon), sous la section « formule ». Une
 * slide = un visuel plein cadre, dont le titre est peint dans l'image (d'où
 * l'`alt`), et un bouton. `pot` place le pot 3D par-dessus le pot central du
 * visuel : centre et largeur en % de l'image, inclinaison, angle de vue.
 * Pour ajouter une slide : un visuel dans scripts/bouffon-images.mjs, une entrée ici.
 */
export const SLIDES = [
  {
    id: "pots",
    image: "slide-pots" as const,
    alt: "« T'as cru quoi ? » peint au pinceau, en noir et rose, à côté de pots SCULT qui volent devant des éclaboussures d'encre",
    cta: { label: "Prends ta dose", href: "/produits/cri" },
    pot: { x: 66, y: 51.9, width: 45.5, tilt: -8, orbit: "8deg 72deg 135%" },
  },
];

/** La mascotte de face (page 404). */
export const BOUFFON = {
  alt: "Le bouffon de face : bonnet à grelots, masque blanc craquelé au large sourire, débardeur noir, poings serrés",
};

/** Page 404. */
export const NOT_FOUND = {
  title: "T'as cru quoi ?",
  text: "Cette page n'existe pas.",
  link: "Retour à l'accueil",
  alt: BOUFFON.alt,
};

/** Page de confirmation de commande : la légende de l'image. */
export const MERCI = {
  alt: "Le bouffon applaudit, de la magnésie plein les mains, dans le sous-sol",
};

/** Pied de page. */
export const FOOTER = {
  signature: "Rien ne se sculpte en silence.",
  replay: "Rejouer la blague",
};
