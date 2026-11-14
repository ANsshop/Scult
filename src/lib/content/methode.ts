/**
 * Le bénéfice de CRI qu'on écrit sur le site, rattaché à un actif et à sa
 * dose, avec sa source en petit ; jamais comme « ce qu'on a le droit de dire ».
 * Avec la formule du 2026-11-14 (marché USA), il n'en reste qu'un : la
 * créatine. Le potassium et les vitamines B5 et B6 ne sont plus dans la
 * formule, leurs phrases ont donc été retirées.
 */
const REG_432 = "https://eur-lex.europa.eu/eli/reg/2012/432/oj";

export type Claim = {
  id: string;
  /** Produit concerné — la fiche produit affiche les allégations de son slug. */
  slug: string;
  ingredient: string;
  claim: string;
  condition: string;
  source: string;
  url: string;
};

export const CLAIMS: Claim[] = [
  {
    id: "creatine",
    slug: "cri",
    ingredient: "Créatine · 3 g par dose",
    claim:
      "La créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée.",
    condition: "3 g de créatine par dose : la quantité journalière associée à ce bénéfice.",
    source: "Règlement (UE) n° 432/2012, annexe — entrée « créatine ».",
    url: REG_432,
  },
];
