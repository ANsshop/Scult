/** Une seule liste : la page /faq et son JSON-LD FAQPage lisent la même source. */
export type FaqItem = { question: string; answer: string };

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Qu'est-ce qu'il y a dans CRI ?",
    answer:
      "Par dose de 23 g : L-citrulline 8 g, bêta-alanine 3,2 g, créatine 3 g, L-théanine 400 mg, dicaféine malate 300 mg, caféine anhydre 170 mg, théacrine 100 mg, sodium 300 mg, extrait de poivre noir 4,8 mg, capsaïcine 3 mg, et un complexe Focus de 5 523 mg (DMAE, lion's mane, genévrier, mucuna, N-phénéthyl diméthylamine, hordénine, huperzine). Avec édulcorant. Le pot fait 690 g, soit 30 doses.",
  },
  {
    question: "CRI est-il compatible avec la compétition ?",
    answer:
      "Non, pas pour un sportif soumis aux contrôles antidopage : la formule contient des stimulants (dont la N-phénéthyl diméthylamine) interdits en compétition par l'Agence mondiale antidopage. Vérifiez le règlement de votre fédération avant d'en prendre.",
  },
  {
    question: "Quels goûts existent pour CRI ?",
    answer:
      "Trois goûts : fruits rouges, cassis framboise et ice tea pêche. La formule et les dosages sont les mêmes ; seuls l'arôme et le colorant changent. Le pack de 2 se compose librement : deux pots du même goût ou deux goûts différents, au même prix.",
  },
  {
    question: "Combien de caféine dans CRI, et pour qui est-ce déconseillé ?",
    answer:
      "Environ 390 mg par dose, en deux formes (dicaféine malate et caféine anhydre) : c'est une dose forte, l'équivalent de quatre à cinq expressos. Une dose par jour maximum, et une demi-dose les premières prises. CRI est réservé à l'adulte et déconseillé aux enfants, aux adolescents et aux femmes enceintes ou allaitantes. Ne l'associez pas à d'autres sources de caféine ou de stimulants, et demandez l'avis d'un professionnel de santé en cas d'hypertension, de trouble cardiaque ou de traitement médical.",
  },
  {
    question: "Pourquoi ça picote après avoir pris CRI ?",
    answer:
      "La bêta-alanine peut provoquer des picotements passagers sur la peau, et la capsaïcine une sensation de chaleur. Les premières prises, commencez par une demi-dose.",
  },
  {
    question: "Qu'est-ce que CRI apporte à l'entraînement ?",
    answer:
      "CRI apporte 3 g de créatine par dose : la créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée. Autour : 8 g de citrulline, 3,2 g de bêta-alanine, 400 mg de théanine, 390 mg de caféine et un complexe Focus. Le détail, ligne par ligne, est sur la page Performance.",
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
