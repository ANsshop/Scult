/**
 * Les modèles 3D du site, montrés par la visionneuse (components/site/Pot3D.tsx).
 * Dans un fichier à part, sans « use client » : une page rendue par le serveur
 * peut ainsi choisir le modèle à passer à la visionneuse.
 */

/**
 * Un modèle 3D du site : son fichier, ses cartes « métal » par matière, les
 * proportions de son cadre (largeur ÷ hauteur) et l'image fixe par défaut.
 */
export type Modele3D = { src: string; metal: Record<string, string>; width: number; height: number };

/** Le pot de pré-workout (scripts/3d/build-bouffon.sh). */
export const POT: Modele3D = {
  src: "/models/pot-scult.glb",
  metal: { POT_etiquette: "/models/pot-scult-metal-etiquette.jpg", POT_dessus: "/models/pot-scult-metal-dessus.jpg" },
  width: 900,
  height: 1096,
};

/** La boîte de pochons de caféine, dressée sur la tranche, le couvercle de face (scripts/3d/build-pochons.sh). */
export const BOITE_POCHONS: Modele3D = {
  src: "/models/boite-pochons.glb",
  metal: {
    BOITE_couvercle: "/models/boite-pochons-metal-couvercle.jpg",
    BOITE_bande: "/models/boite-pochons-metal-bande.jpg",
    BOITE_dessous: "/models/boite-pochons-metal-dessous.jpg",
  },
  width: 900,
  height: 900,
};
