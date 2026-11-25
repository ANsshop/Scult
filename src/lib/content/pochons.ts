/**
 * La fiche des pochons de caféine (/produits/pochons) : tous ses textes et
 * ses images.
 *
 * Fournis le 2026-11-25 : 200 mg de caféine par pochon (d'abord 80, puis
 * aligné sur la concurrence), 30 pochons par boîte, goût fraise piquante,
 * sans nicotine ni tabac, à glisser contre la gencive.
 *
 * ⚠ Le produit n'est pas au catalogue : on ne peut pas l'acheter, le bouton
 * ouvre un e-mail. Tout ce qui manque est marqué `TODO` et s'affiche tel quel
 * sur la page, exprès : le prix, la date, la composition complète, la liste
 * d'ingrédients, le mode d'emploi, le lieu de fabrication (ASSUMPTIONS.md).
 * Aucune promesse d'effet : les textes passent par scripts/gate.sh.
 */
import { HERO } from "./site";

const DOSE = "200 mg";
const BOITE = 30;

export const POCHONS = {
  path: "/produits/pochons",
  /** Ce que dit le couvercle de la boîte. `accent` : la partie en rose. */
  eyebrow: "Pochons · N°002",
  name: { main: "Pochons", accent: "de caféine" },
  badge: "Nouveau · bientôt",
  price: "TODO prix",
  text: `${BOITE} pochons de caféine, à glisser contre la gencive. ${DOSE} par pochon, goût fraise piquante. Sans nicotine, sans tabac.`,
  warning: `Contient de la caféine (${DOSE} par pochon). Déconseillé aux enfants et aux femmes enceintes ou allaitantes.`,

  /** Le bloc d'achat, tant que le produit n'est pas en vente. */
  offer: {
    title: "1 boîte",
    detail: `${BOITE} pochons · ${DOSE} de caféine par pochon`,
    state: "Bientôt",
    cta: { label: "Me prévenir", href: "mailto:hello@scult.eu?subject=Pochons%20de%20caf%C3%A9ine%20%3A%20pr%C3%A9venez-moi" },
    note: "Pas encore en vente. Laissez-nous un e-mail, on vous écrit le jour de la sortie.",
    date: "TODO date de sortie",
  },

  /** Les volets sous le bloc d'achat. */
  composition: {
    title: "Dans un pochon",
    head: "Par pochon",
    rows: [
      { name: "Caféine", amount: DOSE },
      { name: "Nicotine", amount: "0 mg" },
      { name: "Tabac", amount: "Aucun" },
    ],
    todo: "TODO reste de la composition (support, arôme, édulcorant)",
  },
  ingredients: { title: "Ingrédients", todo: "TODO liste d'ingrédients" },
  usage: {
    title: "Conseils d'utilisation et précautions",
    text: "Un pochon se glisse entre la gencive et la lèvre.",
    todo: "TODO durée d'utilisation et nombre de pochons par jour",
    warnings: "Réservé à l'adulte. Tenir hors de portée des enfants.",
  },
  delivery: { title: "Livraison" },
  making: { title: "Fabrication", todo: "TODO lieu de fabrication" },

  /** La galerie : la boîte en 3D d'abord, puis les vues fixes. */
  gallery: {
    hint: "Faites tourner la boîte",
    label3d: "3D",
    alt3d: "La boîte de pochons de caféine SCULT en 3D : ronde, blanche, le bouffon sur le couvercle, une bande rose sur la tranche",
    views: [
      { id: "ouverte", alt: "La boîte de pochons SCULT ouverte : des pochons blancs serrés à l'intérieur, le couvercle au bouffon posé contre le bord" },
      { id: "face", alt: "Le couvercle de la boîte de face : le bouffon, « Caféine 200 mg », « 30 pochons », « Sans nicotine », « Fraise piquante »" },
      { id: "a-plat", alt: "La boîte posée à plat, vue de trois quarts : le couvercle blanc illustré et la bande rose métallisée" },
      { id: "tranche", alt: "La boîte vue de côté : la bande rose métallisée, « 200 mg caféine · Sans nicotine »" },
      { id: "dos", alt: "Le dessous de la boîte : un sourire rose métallisé sur fond blanc" },
      { id: "pochon", alt: "La boîte fermée et un pochon blanc posé devant elle" },
    ],
  },

  /** La bande noire sous la fiche : le produit en quatre chiffres et son goût. */
  band: {
    eyebrow: "Dans chaque boîte",
    title: { main: "La caféine", accent: "en poche." },
    text: "Pas de poudre, pas de shaker, pas d'eau. Une boîte dans la poche, un pochon contre la gencive.",
    figures: [
      { value: "200", unit: "mg", label: "de caféine par pochon" },
      { value: String(BOITE), unit: "", label: "pochons par boîte" },
      { value: "0", unit: "", label: "nicotine" },
      { value: "0", unit: "", label: "tabac" },
    ],
    flavour: { label: "Le goût", value: "Fraise piquante" },
  },

  /** Le renvoi vers le pré-workout, en bas de page. */
  other: {
    eyebrow: HERO.eyebrow,
    title: "CRI",
    text: `Le pré-workout en poudre, goût fraise piquante. ${HERO.text}`,
    cta: { label: "Voir le pré-workout", href: "/produits/cri" },
    image: { src: "/bouffon/pot-blanc-face-1200.webp", alt: "Pot SCULT pré-workout vu de face : pot noir, nom SCULT en rose métallisé, le bouffon masqué sur l'étiquette", width: 1200, height: 1500 },
  },

  seo: {
    title: "Pochons de caféine — 200 mg, 30 pochons, fraise piquante",
    description: `Les pochons de caféine SCULT : ${DOSE} par pochon, ${BOITE} pochons par boîte, goût fraise piquante. Sans nicotine, sans tabac. Bientôt disponible.`,
  },
};

/** L'adresse d'une vue de la boîte (public/pochons/), à la largeur voulue. */
export const pochonsImage = (id: string, width: 600 | 1100) => `/pochons/boite-${id}-${width}.webp`;
