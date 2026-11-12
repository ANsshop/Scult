/**
 * Informations obligatoires à afficher avant l'achat pour les produits qui en
 * ont (règlement (UE) n° 1169/2011, vente à distance) : composition par dose,
 * ingrédients, mode d'emploi, précautions. Même texte que le dos du pot
 * (docs/da/05-pot-dos-a-plat.jpg) — si l'un change, l'autre aussi.
 *
 * ⚠ La liste d'ingrédients de CRI est une estimation tirée de la formule
 * cible : l'ordre, l'arôme, l'édulcorant et le colorant viendront du
 * fabricant (voir ASSUMPTIONS.md).
 */
export type ProductInfo = {
  denomination: string;
  serving: string;
  nutrition: { name: string; amount: string; nrv?: string }[];
  ingredients: string;
  usage: string;
  caffeineWarning?: string;
  warnings: string;
};

export const PRODUCT_INFO: Record<string, ProductInfo> = {
  cri: {
    denomination:
      "Complément alimentaire à base d'acides aminés, de créatine, de caféine et de vitamines B5 et B6. Avec édulcorant.",
    serving: "Par dose journalière (1 dose = 23 g)",
    nutrition: [
      { name: "L-citrulline", amount: "8 000 mg" },
      { name: "Bêta-alanine", amount: "4 000 mg" },
      { name: "Créatine", amount: "3 000 mg" },
      { name: "L-tyrosine", amount: "2 000 mg" },
      { name: "Taurine", amount: "1 000 mg" },
      { name: "L-théanine", amount: "200 mg" },
      { name: "Caféine", amount: "150 mg" },
      { name: "Sodium", amount: "500 mg" },
      { name: "Potassium", amount: "300 mg", nrv: "15 %" },
      { name: "Acide pantothénique (vitamine B5)", amount: "6 mg", nrv: "100 %" },
      { name: "Vitamine B6", amount: "1,4 mg", nrv: "100 %" },
    ],
    ingredients:
      "L-citrulline, bêta-alanine, créatine monohydrate, L-tyrosine, taurine, citrate de sodium, acidifiant : acide citrique, arôme naturel, citrate de potassium, L-théanine, édulcorant : glycosides de stéviol, caféine anhydre, anti-agglomérant : dioxyde de silicium, colorant : rouge de betterave, D-pantothénate de calcium, chlorhydrate de pyridoxine.",
    usage:
      "Mélanger 1 dose (23 g, une mesure rase) dans 400 ml d'eau fraîche. Boire 20 à 30 minutes avant l'entraînement. La première semaine, commencer par une demi-dose. Une dose par jour maximum.",
    caffeineWarning: "Contient de la caféine (150 mg par dose). Déconseillé aux enfants et aux femmes enceintes.",
    warnings:
      "Déconseillé aux adolescents et aux femmes allaitantes. Ne pas dépasser la dose journalière recommandée. Ne pas associer à d'autres sources de caféine. La bêta-alanine peut provoquer des picotements passagers. Demander l'avis d'un professionnel de santé en cas de traitement médical. Les compléments alimentaires ne doivent pas être utilisés comme substituts d'un régime alimentaire varié et équilibré et d'un mode de vie sain. Tenir hors de portée des jeunes enfants.",
  },
};
