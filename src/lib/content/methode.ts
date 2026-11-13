/**
 * Les bénéfices de CRI, tels qu'on les écrit sur le site. Chaque phrase est
 * une allégation de santé du registre européen (règlement (UE) n° 432/2012),
 * citée mot pour mot et rattachée à un actif et à sa dose — c'est ce qui
 * permet de parler de performance. On les présente comme des bénéfices, avec
 * la source en petit ; jamais comme « ce qu'on a le droit de dire ».
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
  {
    id: "potassium",
    slug: "cri",
    ingredient: "Potassium · 300 mg par dose",
    claim: "Le potassium contribue à une fonction musculaire normale.",
    condition: "300 mg de potassium par dose, soit 15 % des apports de référence.",
    source: "Règlement (UE) n° 432/2012, annexe — entrée « potassium ».",
    url: REG_432,
  },
  {
    id: "acide-pantothenique-energie",
    slug: "cri",
    ingredient: "Acide pantothénique (vitamine B5) · 6 mg par dose",
    claim: "L'acide pantothénique contribue à un métabolisme énergétique normal.",
    condition: "6 mg d'acide pantothénique par dose, soit 100 % des apports de référence.",
    source: "Règlement (UE) n° 432/2012, annexe — entrée « acide pantothénique ».",
    url: REG_432,
  },
  {
    id: "vitamine-b6",
    slug: "cri",
    ingredient: "Vitamine B6 · 1,4 mg par dose",
    claim: "La vitamine B6 contribue à réduire la fatigue.",
    condition: "1,4 mg de vitamine B6 par dose, soit 100 % des apports de référence.",
    source: "Règlement (UE) n° 432/2012, annexe — entrée « vitamine B6 ».",
    url: REG_432,
  },
  {
    id: "acide-pantothenique",
    slug: "cri",
    ingredient: "Acide pantothénique (vitamine B5) · 6 mg par dose",
    claim: "L'acide pantothénique contribue à des performances intellectuelles normales.",
    condition: "6 mg d'acide pantothénique par dose, soit 100 % des apports de référence.",
    source: "Règlement (UE) n° 432/2012, annexe — entrée « acide pantothénique ».",
    url: REG_432,
  },
];
