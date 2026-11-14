import type { PpImage } from "@/lib/pp/client";

/**
 * Les goûts de CRI. Même pot, même formule : seuls changent la pastille de
 * goût sur la face et, au dos, la ligne « Saveur … » et la liste
 * d'ingrédients (arôme et colorant).
 *
 * Ce fichier dit comment chaque goût se présente (nom, visuels, ingrédients).
 * Ce qui se vend — prix, stock, SKU — vient du catalogue du socle : une
 * variante par goût sur le produit, reconnue à son SKU (`code`).
 *
 * Les visuels sont produits par scripts/3d/gouts.mjs (étiquettes) et
 * scripts/3d/gouts-visuels.mjs (photos du site).
 *
 * ⚠ Listes d'ingrédients estimées (voir ASSUMPTIONS.md) : elles se remplacent
 * par celles du fabricant, ici et dans scripts/3d/gouts.mjs.
 */
export type FlavourId = "fruits-rouges" | "cassis-framboise" | "ice-tea-peche";

export type Flavour = {
  id: FlavourId;
  /** Le code du goût dans les SKU : SCULT-CRI-690-<code>. */
  code: string;
  label: string;
  /** Le nom sur deux lignes, comme sur la pastille du pot. */
  lines: [string, string];
  /** La photo de la pastille (carrée, 160 px). */
  swatch: string;
  /** Le pot détouré : image fixe de la visionneuse 3D. */
  still: string;
  /** Le petit pot des vignettes et de l'animation d'ajout au panier. */
  mini: string;
  /** L'étiquette à enrouler sur le modèle 3D. */
  texture: string;
  /** La galerie de la fiche produit. */
  images: PpImage[];
  ingredients: string;
};

const INGREDIENTS =
  "L-citrulline, bêta-alanine, créatine monohydrate, L-tyrosine, taurine, citrate de sodium, acidifiant : acide citrique, {AROME}, citrate de potassium, L-théanine, édulcorant : glycosides de stéviol, caféine anhydre, anti-agglomérant : dioxyde de silicium, colorant : {COLORANT}, D-pantothénate de calcium, chlorhydrate de pyridoxine.";
const ingredients = (arome: string, colorant: string) => INGREDIENTS.replace("{AROME}", arome).replace("{COLORANT}", colorant);

function gallery(suffix: string, label: string): PpImage[] {
  return [
    { url: `/products/cri${suffix}-01.webp`, alt: `Pot SCULT CRI ${label} vu de face : le nom CRI en bleu imprimé sur le visage d'une statue qui hurle, strap rouge autour du couvercle`, width: 1344, height: 1680 },
    { url: `/products/cri${suffix}-02.webp`, alt: `Dos du pot SCULT CRI ${label} : tableau nutritionnel, liste d'ingrédients, conseils d'utilisation et précautions d'emploi`, width: 1656, height: 2208 },
    { url: `/lifestyle/cri${suffix}-01.webp`, alt: `Une statue de marbre qui hurle tend le pot SCULT CRI ${label} vers l'objectif, devant un mur bleu`, width: 1792, height: 2240 },
  ];
}

export const FLAVOURS: Flavour[] = [
  {
    id: "fruits-rouges",
    code: "FR",
    label: "Fruits rouges",
    lines: ["Fruits", "rouges"],
    swatch: "/gouts/fruits-rouges.webp",
    still: "/home/pot-detoure.webp",
    mini: "/home/pot-mini.webp",
    texture: "/models/etiquette-fruits-rouges.jpg",
    images: gallery("", "fruits rouges"),
    ingredients: ingredients("arôme naturel", "rouge de betterave"),
  },
  {
    id: "cassis-framboise",
    code: "CF",
    label: "Cassis framboise",
    lines: ["Cassis", "framboise"],
    swatch: "/gouts/cassis-framboise.webp",
    still: "/home/pot-detoure-cassis-framboise.webp",
    mini: "/home/pot-mini-cassis-framboise.webp",
    texture: "/models/etiquette-cassis-framboise.jpg",
    images: gallery("-cassis-framboise", "cassis framboise"),
    ingredients: ingredients("arômes naturels de cassis et de framboise", "rouge de betterave"),
  },
  {
    id: "ice-tea-peche",
    code: "ITP",
    label: "Ice tea pêche",
    lines: ["Ice tea", "pêche"],
    swatch: "/gouts/ice-tea-peche.webp",
    still: "/home/pot-detoure-ice-tea-peche.webp",
    mini: "/home/pot-mini-ice-tea-peche.webp",
    texture: "/models/etiquette-ice-tea-peche.jpg",
    images: gallery("-ice-tea-peche", "ice tea pêche"),
    ingredients: ingredients("arômes naturels de thé et de pêche", "caramel ordinaire"),
  },
];

/** Le goût d'origine : celui des visuels de l'accueil, et celui affiché avant tout choix. */
export const DEFAULT_FLAVOUR: FlavourId = "fruits-rouges";

const BY_ID = new Map(FLAVOURS.map((f) => [f.id, f]));
const BY_CODE = new Map(FLAVOURS.map((f) => [f.code, f.id]));

export function getFlavour(id: string | null | undefined): Flavour {
  return BY_ID.get(id as FlavourId) ?? BY_ID.get(DEFAULT_FLAVOUR)!;
}

export function isFlavourId(id: string | null | undefined): id is FlavourId {
  return BY_ID.has(id as FlavourId);
}

/**
 * Les goûts que désigne un SKU, pot par pot : « SCULT-CRI-690-CF » → un pot
 * cassis framboise ; « …-CF-X2 » → deux ; « …-FR-ITP-X2 » → un fruits rouges
 * et un ice tea pêche. `null` si le SKU ne suit pas cette convention.
 */
export function flavoursOfSku(sku: string): FlavourId[] | null {
  const tokens = sku.split("-");
  const ids = tokens.flatMap((t) => (BY_CODE.has(t) ? [BY_CODE.get(t)!] : []));
  if (ids.length === 0) return null;
  if (!tokens.includes("X2")) return ids.length === 1 ? ids : null;
  if (ids.length === 1) return [ids[0], ids[0]];
  return ids.length === 2 ? ids : null;
}

/** La clé d'un pack de deux pots, indépendante de l'ordre : « cassis-framboise+ice-tea-peche ». */
export function packKey(a: string, b: string): string {
  return [a, b].sort().join("+");
}

/** « Fruits rouges » pour un pot, « 2 × Fruits rouges » ou « Cassis framboise + Ice tea pêche » pour un pack. */
export function flavoursLabel(ids: string[]): string {
  if (ids.length === 2 && ids[0] === ids[1]) return `2 × ${getFlavour(ids[0]).label}`;
  return ids.map((id) => getFlavour(id).label).join(" + ");
}
