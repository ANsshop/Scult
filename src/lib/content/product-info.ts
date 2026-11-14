/**
 * Informations à afficher avant l'achat : composition par dose, ingrédients,
 * mode d'emploi, précautions. Même texte que le dos du pot : les deux lisent
 * `cri-formule.json` (le site ici, l'étiquette dans scripts/3d/gouts.mjs) —
 * on ne ressaisit rien.
 *
 * La liste d'ingrédients change avec le goût (arôme, colorant) : la fiche
 * affiche celle du goût choisi (lib/content/flavours.ts) ; celle-ci est celle
 * du goût d'origine.
 *
 * ⚠ Formule « marché USA » du 2026-11-14 (voir ASSUMPTIONS.md) : la liste
 * d'ingrédients est une estimation, et les doses du complexe restent à
 * recevoir (`quantite: null` tant qu'elles ne sont pas connues).
 */
import FORMULE from "./cri-formule.json";
import { DEFAULT_FLAVOUR, getFlavour } from "./flavours";

export type ProductInfo = {
  denomination: string;
  serving: string;
  nutrition: { name: string; amount: string; nrv?: string }[];
  /** Un mélange d'actifs donné par son total ; chaque ingrédient a sa dose quand elle est connue. */
  blend?: { name: string; amount: string; items: { name: string; amount: string | null }[] };
  ingredients: string;
  usage: string;
  caffeineWarning?: string;
  warnings: string;
};

export const PRODUCT_INFO: Record<string, ProductInfo> = {
  cri: {
    denomination: FORMULE.denomination,
    serving: `Par dose journalière (1 dose = ${FORMULE.dose})`,
    nutrition: FORMULE.actifs.map((a) => ({ name: a.nom, amount: a.quantite })),
    blend: { name: FORMULE.complexe.nom, amount: FORMULE.complexe.quantite, items: FORMULE.complexe.ingredients.map((a) => ({ name: a.nom, amount: a.quantite })) },
    ingredients: getFlavour(DEFAULT_FLAVOUR).ingredients,
    usage: `${FORMULE.usage} ${FORMULE.usageFort} ${FORMULE.usageFin}`,
    caffeineWarning: FORMULE.avertissementCafeine,
    warnings: FORMULE.precautions,
  },
};
