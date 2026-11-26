import type { PpImage } from "@/lib/pp/client";
import FORMULE from "./cri-formule.json";
import { imageAt, imageUrl } from "./images";

/**
 * Les goûts de CRI. Un seul pour l'instant : fraise piquante. Nom, couleur,
 * arôme et colorant sont dans cri-formule.json ; le reste du site lit ce
 * fichier, si bien qu'ajouter un goût revient à l'ajouter là-bas et ici.
 *
 * Ce fichier dit comment chaque goût se présente (nom, visuels, ingrédients).
 * Ce qui se vend — prix, stock, SKU — vient du catalogue du socle : une
 * variante par goût sur le produit, reconnue à son SKU (`code`).
 *
 * Le pot est le même quel que soit le goût (visuels de la DA « bouffon »,
 * public/bouffon/, produits par scripts/bouffon-images.mjs).
 *
 * ⚠ Liste d'ingrédients estimée (voir ASSUMPTIONS.md) : elle se remplace par
 * celle du fabricant.
 */
export type FlavourId = "fraise-piquante";

export type Flavour = {
  id: FlavourId;
  /** Le code du goût dans les SKU : SCULT-CRI-690-<code>. */
  code: string;
  label: string;
  /** Le nom sur deux lignes. */
  lines: [string, string];
  /** La couleur du goût : le rose de la marque, seule couleur du site. */
  color: string;
  /** Le pot de face, en grand. */
  still: string;
  /** Le petit pot détouré (sans fond) des vignettes et de l'animation d'ajout au panier. */
  mini: string;
  /** La galerie de la fiche produit. */
  images: PpImage[];
  ingredients: string;
};

/**
 * La galerie : les photos du pot sur fond blanc, toutes au format 4:5 et à la
 * même échelle (scripts/bouffon-images.mjs, BLANC), puis le gros plan.
 */
const GALLERY: PpImage[] = [
  imageAt("pre-workout-scult-cri-face", 1200, "Pot SCULT pré-workout vu de face : pot noir, nom SCULT en rose métallisé, le bouffon masqué en noir et blanc sur l'étiquette"),
  imageAt("pre-workout-scult-cri-trois-quarts", 880, "Le pot SCULT tourné d'un quart vers la gauche"),
  imageAt("pre-workout-scult-cri-profil", 880, "Le pot SCULT de trois quarts, le bord gauche de l'étiquette visible"),
  imageAt("pre-workout-scult-cri-dos", 880, "Le dos du pot SCULT : noir mat, traits roses, bandeau rose en bas"),
  imageAt("pre-workout-scult-cri-couvercle", 880, "Le couvercle du pot SCULT vu de dessus : un sourire rose métallisé"),
  imageAt("pre-workout-scult-cri-etiquette", 588, "Gros plan sur le cœur N°001 et le nom SCULT en rose métallisé de l'étiquette"),
  imageAt("pre-workout-scult-cri-ouvert", 880, "Le pot SCULT ouvert, opercule en place, couvercle posé à côté"),
];

function flavour(id: FlavourId, code: string): Flavour {
  const { nom: label, lignes, couleur, arome, colorant } = FORMULE.gouts[id];
  return {
    id,
    code,
    label,
    lines: [lignes[0], lignes[1]],
    color: couleur,
    still: imageUrl("pre-workout-scult-cri-face", 1200),
    mini: imageUrl("pre-workout-scult-cri-detoure", 400),
    images: GALLERY,
    // La liste commune, avec l'arôme et le colorant du goût (cri-formule.json).
    ingredients: FORMULE.ingredients.replace("{AROME}", arome).replace("{COLORANT}", colorant),
  };
}

export const FLAVOURS: Flavour[] = [flavour("fraise-piquante", "FP")];

/** Le goût affiché avant tout choix. */
export const DEFAULT_FLAVOUR: FlavourId = "fraise-piquante";

const BY_ID = new Map(FLAVOURS.map((f) => [f.id, f]));
const BY_CODE = new Map(FLAVOURS.map((f) => [f.code, f.id]));

export function getFlavour(id: string | null | undefined): Flavour {
  return BY_ID.get(id as FlavourId) ?? BY_ID.get(DEFAULT_FLAVOUR)!;
}

export function isFlavourId(id: string | null | undefined): id is FlavourId {
  return BY_ID.has(id as FlavourId);
}

/**
 * Les goûts que désigne un SKU, pot par pot : « SCULT-CRI-690-FP » → un pot
 * fraise piquante ; « …-FP-X2 » → deux. Avec plusieurs goûts, « …-AA-BB-X2 »
 * désigne un pot de chaque. `null` si le SKU ne suit pas cette convention.
 */
export function flavoursOfSku(sku: string): FlavourId[] | null {
  const tokens = sku.split("-");
  const ids = tokens.flatMap((t) => (BY_CODE.has(t) ? [BY_CODE.get(t)!] : []));
  if (ids.length === 0) return null;
  if (!tokens.includes("X2")) return ids.length === 1 ? ids : null;
  if (ids.length === 1) return [ids[0], ids[0]];
  return ids.length === 2 ? ids : null;
}

/** La clé d'un pack de deux pots, indépendante de l'ordre. */
export function packKey(a: string, b: string): string {
  return [a, b].sort().join("+");
}

/** « Fraise piquante » pour un pot, « 2 × Fraise piquante » pour un pack du même goût. */
export function flavoursLabel(ids: string[]): string {
  if (ids.length === 2 && ids[0] === ids[1]) return `2 × ${getFlavour(ids[0]).label}`;
  return ids.map((id) => getFlavour(id).label).join(" + ");
}
