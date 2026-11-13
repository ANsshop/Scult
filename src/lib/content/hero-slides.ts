/**
 * Les slides du hero d'accueil. Une slide = une scène CRI (DA « Cri »,
 * docs/DA.md) en deux cadrages : 16:9 pour l'ordinateur, sujet à droite et
 * mur bleu vide à gauche pour le titre ; 9:16 pour le mobile, où l'image
 * passe au-dessus du texte. `position` règle le recadrage (object-position)
 * de chaque visuel. Les textes passent par scripts/gate.sh comme le reste.
 */
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
    text: "3 g de créatine par dose : la créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée. Avec citrulline 8 g, bêta-alanine 4 g et caféine 150 mg.",
    cta: { label: "Découvrir CRI · 49 €", href: "/produits/cri" },
    secondary: { label: "Ce qu'on peut dire, et pas", href: "/methode" },
    image: {
      desktop: "/home/hero-16x9.webp",
      mobile: "/home/hero-9x16.webp",
      alt: "Une statue de marbre qui hurle tend un pot SCULT CRI vers l'objectif, devant un mur bleu",
    },
    position: { mobile: "50% 100%" },
  },
  {
    id: "formule",
    label: "La formule · dose de 23 g",
    title: "Les dosages sont sur le pot.",
    text: "Citrulline 8 g, bêta-alanine 4 g, créatine 3 g, tyrosine 2 g, taurine 1 g, caféine 150 mg. Chaque quantité est écrite, aucune n'est cachée dans un mélange.",
    cta: { label: "Voir la formule", href: "/produits/cri" },
    secondary: { label: "Questions fréquentes", href: "/faq" },
    image: {
      desktop: "/home/hero-2-16x9.webp",
      mobile: "/home/hero-2-9x16.webp",
      alt: "Le poing de marbre de la statue, strap rouge au poignet, serre une barre rouillée couverte de craie à côté d'un pot SCULT CRI posé sur un bloc de marbre",
    },
    position: { mobile: "50% 100%" },
  },
  {
    id: "pot",
    desktopOnly: true,
    label: "30 doses · 690 g · fruits rouges",
    title: "Un pot. Trente séances.",
    text: "Une dose de 23 g dans 400 ml d'eau fraîche, 20 à 30 minutes avant l'entraînement. Une seule saveur, une dose par jour maximum.",
    cta: { label: "Commander CRI · 49 €", href: "/produits/cri" },
    secondary: { label: "Livraison & retours", href: "/livraison-retours" },
    image: {
      desktop: "/home/hero-3-16x9.webp",
      mobile: "/home/hero-3-9x16.webp",
      alt: "La statue de marbre debout, poings serrés, vue d'en bas, un pot SCULT CRI posé à ses pieds sur un socle de pierre",
    },
    position: { mobile: "50% 45%" },
  },
];
