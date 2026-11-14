/** Une seule liste : la page /faq et son JSON-LD FAQPage lisent la même source. */
export type FaqItem = { question: string; answer: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Qu'est-ce qu'il y a dans CRI ?",
    answer:
      "Par dose de 23 g : L-citrulline 8 g, bêta-alanine 4 g, créatine 3 g, L-tyrosine 2 g, taurine 1 g, L-théanine 200 mg, caféine 150 mg, sodium 500 mg, potassium 300 mg, vitamines B5 et B6 à 100 % des apports de référence. Avec édulcorant. Le pot fait 690 g, soit 30 doses.",
  },
  {
    question: "Quels goûts existent pour CRI ?",
    answer:
      "Trois goûts : fruits rouges, cassis framboise et ice tea pêche. La formule et les dosages sont les mêmes ; seuls l'arôme et le colorant changent. Le pack de 2 se compose librement : deux pots du même goût ou deux goûts différents, au même prix.",
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
    question: "Qu'est-ce que CRI apporte à l'entraînement ?",
    answer:
      "CRI apporte 3 g de créatine par dose : la créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée. Le potassium contribue à une fonction musculaire normale, l'acide pantothénique à un métabolisme énergétique normal, et la vitamine B6 contribue à réduire la fatigue. Le détail, actif par actif, est sur la page Performance.",
  },
  {
    question: "Quels sont les délais et tarifs de livraison ?",
    answer:
      "France : 5,90 € (2–4 jours ouvrés). Belgique, Luxembourg, Allemagne, Pays-Bas, Italie, Espagne, Autriche : 8,90 € (3–6 jours ouvrés). Reste de l'Europe : 12,90 € (4–8 jours ouvrés). La livraison est offerte dès 60 € d'achat.",
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
];
