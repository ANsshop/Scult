/**
 * Les slides du hero d'accueil. Une slide = une scène CRI (DA « Cri »,
 * docs/DA.md) en deux cadrages : 16:9 pour l'ordinateur, sujet à droite et
 * mur bleu vide à gauche pour le titre ; 9:16 pour le mobile, où l'image
 * passe au-dessus du texte. `position` règle le recadrage (object-position)
 * de chaque visuel. Les textes passent par scripts/gate.sh comme le reste.
 */
import { visuel } from "./visuels";

export type HeroSlide = {
  id: string;
  label: string;
  title: string;
  text: string;
  cta: { label: string; href: string };
  secondary?: { label: string; href: string };
  image: { desktop: string; mobile: string; alt: string };
  position?: { desktop?: string; mobile?: string };
  /** Slide de nuit : le voile de lisibilité passe du bleu à l'encre. */
  dark?: boolean;
  /** Slide absente sur téléphone (moins de 768 px de large). */
  desktopOnly?: boolean;
};

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "cri",
    label: "CRI · le pré-workout SCULT",
    title: "Rien ne se sculpte en silence.",
    text: "3 g de créatine par dose : la créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée. Avec citrulline 8 g, bêta-alanine 3,2 g et 390 mg de caféine.",
    cta: { label: "Découvrir CRI · 49 €", href: "/produits/cri" },
    secondary: { label: "Voir la formule", href: "/#formule" },
    image: {
      desktop: visuel("hero-16x9"),
      mobile: visuel("hero-9x16"),
      alt: "Une statue de marbre qui hurle tend un pot SCULT CRI vers l'objectif, devant un mur bleu",
    },
    position: { mobile: "50% 100%" },
  },
  {
    id: "formule",
    label: "La formule · dose de 23 g",
    title: "Les dosages sont sur le pot.",
    text: "Citrulline 8 g, bêta-alanine 3,2 g, créatine 3 g, théanine 400 mg, 390 mg de caféine en deux formes, et un complexe Focus de 5,5 g.",
    cta: { label: "Voir la formule", href: "/produits/cri" },
    secondary: { label: "Questions fréquentes", href: "/faq" },
    image: {
      desktop: visuel("hero-2-16x9"),
      mobile: visuel("hero-2-9x16"),
      alt: "Le poing de marbre de la statue, strap rouge au poignet, serre une barre rouillée couverte de craie à côté d'un pot SCULT CRI posé sur un bloc de marbre",
    },
    position: { mobile: "50% 100%" },
  },
];
