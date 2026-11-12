/** Une seule liste : la page /faq et son JSON-LD FAQPage lisent la même source. */
export type FaqItem = { question: string; answer: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Qu'est-ce qu'il y a dans CRI ?",
    answer:
      "Par dose de 23 g : L-citrulline 8 g, bêta-alanine 4 g, créatine 3 g, L-tyrosine 2 g, taurine 1 g, L-théanine 200 mg, caféine 150 mg, sodium 500 mg, potassium 300 mg, vitamines B5 et B6 à 100 % des apports de référence. Saveur fruits rouges, avec édulcorant. Le pot fait 690 g, soit 30 doses.",
  },
  {
    question: "Combien de caféine dans CRI, et pour qui est-ce déconseillé ?",
    answer:
      "150 mg par dose, une dose par jour maximum. CRI contient de la caféine : il est déconseillé aux enfants, aux adolescents et aux femmes enceintes ou allaitantes. Ne l'associez pas à d'autres sources de caféine.",
  },
  {
    question: "Pourquoi ça picote après avoir pris CRI ?",
    answer:
      "La bêta-alanine peut provoquer des picotements passagers sur la peau. La première semaine, commencez par une demi-dose.",
  },
  {
    question: "Qu'est-ce qu'il y a dans la whey SCULT ?",
    answer:
      "Un isolat de protéines de lactosérum à 90 % de protéines sur matière sèche, nature : sans sucres ajoutés, sans édulcorant, sans arôme. Le pot fait 750 g, soit 30 doses de 25 g avec la cuillère incluse.",
  },
  {
    question: "Quelle créatine utilisez-vous ?",
    answer:
      "De la créatine monohydrate micronisée Creapure®, pureté 99,9 %, fabriquée en Allemagne. Le pot de 300 g correspond à 100 portions de 3 g, la quantité journalière visée par l'allégation autorisée en Europe.",
  },
  {
    question: "Le collagène est-il d'origine marine ?",
    answer:
      "Oui : peptides de collagène hydrolysé de type I, issus de peau de poisson sauvage. Il se dissout à froid, n'a pas de goût marqué et se mélange à un café, un yaourt ou de l'eau. 300 g = 30 portions de 10 g.",
  },
  {
    question: "Est-ce que vos produits font vraiment quelque chose ?",
    answer:
      "Nous n'écrivons que ce que l'Union européenne autorise. Pour la créatine (3 g/jour) et les protéines, des allégations existent et sont citées sur la page Méthode. Pour le collagène, aucune allégation santé n'est autorisée à ce jour : nous le vendons pour ce qu'il est, une source de protéines, sans promesse.",
  },
  {
    question: "Quels sont les délais et tarifs de livraison ?",
    answer:
      "France : 5,90 € (2–4 jours ouvrés). Belgique, Luxembourg, Allemagne, Pays-Bas, Italie, Espagne, Autriche : 8,90 € (3–6 jours ouvrés). Reste de l'Europe : 12,90 € (4–8 jours ouvrés). La livraison est offerte dès 60 € — c'est le cas avec le Trio Sculpt.",
  },
  {
    question: "Puis-je retourner un pot ?",
    answer:
      "Oui, sous 14 jours après réception, tant que le pot est scellé (pastille rouge intacte). Pour des raisons d'hygiène, un pot ouvert ne peut pas être repris. Écrivez-nous avec votre référence de commande.",
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer:
      "Carte bancaire, Apple Pay et Google Pay, via Stripe. Vos données bancaires ne transitent jamais par nos serveurs.",
  },
  {
    question: "Où sont fabriqués les produits ?",
    answer:
      "Dans l'Union européenne, en façonnage chez un fabricant certifié. Chaque lot est numéroté sur le pot (LOT 001 pour la première série) et le tableau nutritionnel est imprimé au dos.",
  },
  {
    question: "C'est quoi, le Trio Sculpt ?",
    answer:
      "Les trois poudres en un pack : whey isolate 750 g, créatine 300 g et collagène marin 300 g, pour 79 € au lieu de 92 €. Comme le pack dépasse 60 €, la livraison est offerte.",
  },
];
