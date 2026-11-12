/**
 * Page Méthode — l'actif AEO. Une seule règle : on cite, on n'invente pas.
 * Les allégations ci-dessous sont celles du registre européen (règlement
 * (CE) n° 1924/2006, liste des allégations autorisées, règlement (UE)
 * n° 432/2012). Rien d'autre n'est écrit sur ce que les produits « font ».
 */
export const CLAIMS = [
  {
    product: "CRI (pré-workout)",
    slug: "cri",
    claim:
      "La créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée.",
    condition:
      "CRI apporte 3 g de créatine par dose, la quantité journalière visée par l'allégation. Deux autres allégations autorisées s'appliquent, à 100 % des apports de référence par dose : « La vitamine B6 contribue à réduire la fatigue » et « L'acide pantothénique contribue à des performances intellectuelles normales ». Rien n'est affirmé sur la citrulline, la bêta-alanine, la tyrosine, la taurine, la théanine ni la caféine : aucune allégation n'est autorisée pour elles dans un complément alimentaire.",
    source: "Règlement (UE) n° 432/2012, annexe — entrées « créatine », « vitamine B6 », « acide pantothénique ».",
    url: "https://eur-lex.europa.eu/eli/reg/2012/432/oj",
  },
  {
    product: "Créatine",
    slug: "creatine",
    claim:
      "La créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée.",
    condition: "Allégation applicable aux produits apportant 3 g de créatine par jour.",
    source: "Règlement (UE) n° 432/2012, annexe — entrée « créatine ».",
    url: "https://eur-lex.europa.eu/eli/reg/2012/432/oj",
  },
  {
    product: "Whey (protéines)",
    slug: "whey",
    claim: "Les protéines contribuent à augmenter la masse musculaire et au maintien de la masse musculaire.",
    condition: "Allégation applicable aux aliments « source de protéines » (≥ 12 % de l'énergie apportée par les protéines).",
    source: "Règlement (UE) n° 432/2012, annexe — entrées « protéines ».",
    url: "https://eur-lex.europa.eu/eli/reg/2012/432/oj",
  },
  {
    product: "Collagène",
    slug: "collagene",
    claim: "Aucune allégation santé autorisée à ce jour.",
    condition:
      "Les demandes évaluées par l'EFSA sur le collagène hydrolysé (peau, articulations) ont reçu un avis défavorable faute de preuves suffisantes. Nous le vendons comme source de protéines, sans promesse.",
    source: "EFSA Journal 2013;11(7):3302 — avis sur le collagène hydrolysé.",
    url: "https://doi.org/10.2903/j.efsa.2013.3302",
  },
] as const;
