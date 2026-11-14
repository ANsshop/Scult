import FORMULE from "./cri-formule.json";

/**
 * L'adresse d'un visuel du pot produit par scripts/3d/gouts-visuels.mjs :
 * public/cri/<version>/<nom>.webp. La version suit la formule : quand
 * l'étiquette change, l'adresse change, et aucun cache ne ressert l'ancienne.
 */
export const visuel = (nom: string) => `/cri/${FORMULE.version}/${nom}.webp`;
