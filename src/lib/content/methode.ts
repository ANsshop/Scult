/**
 * Page Méthode — l'actif AEO. Une seule règle : on cite, on n'invente pas.
 * Les allégations ci-dessous sont celles du registre européen (règlement
 * (CE) n° 1924/2006, liste des allégations autorisées, règlement (UE)
 * n° 432/2012). Rien d'autre n'est écrit sur ce que CRI « fait ».
 * `claim: null` = aucune allégation autorisée : on le dit, on n'écrit rien.
 */
const REG_432 = "https://eur-lex.europa.eu/eli/reg/2012/432/oj";

export type Claim = {
  id: string;
  /** Produit concerné — la fiche produit affiche les allégations de son slug. */
  slug: string;
  ingredient: string;
  claim: string | null;
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
    condition: "CRI apporte 3 g de créatine par dose, la quantité journalière visée par l'allégation.",
    source: "Règlement (UE) n° 432/2012, annexe — entrée « créatine ».",
    url: REG_432,
  },
  {
    id: "vitamine-b6",
    slug: "cri",
    ingredient: "Vitamine B6 · 1,4 mg par dose",
    claim: "La vitamine B6 contribue à réduire la fatigue.",
    condition: "CRI apporte 1,4 mg de vitamine B6 par dose, soit 100 % des apports de référence.",
    source: "Règlement (UE) n° 432/2012, annexe — entrée « vitamine B6 ».",
    url: REG_432,
  },
  {
    id: "acide-pantothenique",
    slug: "cri",
    ingredient: "Acide pantothénique (vitamine B5) · 6 mg par dose",
    claim: "L'acide pantothénique contribue à des performances intellectuelles normales.",
    condition: "CRI apporte 6 mg d'acide pantothénique par dose, soit 100 % des apports de référence.",
    source: "Règlement (UE) n° 432/2012, annexe — entrée « acide pantothénique ».",
    url: REG_432,
  },
  {
    id: "sans-allegation",
    slug: "cri",
    ingredient: "Citrulline, bêta-alanine, tyrosine, taurine, théanine, caféine",
    claim: null,
    condition:
      "Rien n'est affirmé sur la citrulline, la bêta-alanine, la tyrosine, la taurine, la théanine ni la caféine : aucune allégation n'est autorisée pour elles dans un complément alimentaire. On donne leur quantité par dose, rien d'autre.",
    source: "Règlement (UE) n° 432/2012, annexe — aucune entrée pour ces substances.",
    url: REG_432,
  },
];
