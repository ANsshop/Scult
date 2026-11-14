import type { PpImage } from "@/lib/pp/client";
import FORMULE from "./cri-formule.json";
import { visuel } from "./visuels";

/**
 * Les goûts de CRI. Même pot, même formule : seuls changent le nom du goût,
 * écrit dans sa couleur sur la face, et, au dos, la ligne « Saveur … » et la
 * liste d'ingrédients (arôme et colorant). Nom, couleur, arôme et colorant de
 * chaque goût sont dans cri-formule.json, que l'étiquette lit aussi.
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
  /** Le nom sur deux lignes, comme sur le pot. */
  lines: [string, string];
  /** La couleur du goût : celle de son nom sur le pot, reprise par le site. */
  color: string;
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

/** Les visuels du goût, produits par scripts/3d/gouts-visuels.mjs. */
const visuelDe = (id: FlavourId, nom: string) => visuel(`${id}-${nom}`);

function flavour(id: FlavourId, code: string): Flavour {
  const { nom: label, lignes, couleur, arome, colorant } = FORMULE.gouts[id];
  const nom = label.toLowerCase();
  const lines: [string, string] = [lignes[0], lignes[1]];
  return {
    id,
    code,
    label,
    lines,
    color: couleur,
    still: visuelDe(id, "detoure"),
    mini: visuelDe(id, "mini"),
    texture: `/models/etiquette-${id}.jpg`,
    images: [
      { url: visuelDe(id, "face"), alt: `Pot SCULT CRI ${nom} vu de face : le nom CRI en bleu imprimé sur le visage d'une statue qui hurle, strap rouge autour du couvercle`, width: 1344, height: 1680 },
      { url: visuelDe(id, "dos"), alt: `Dos du pot SCULT CRI ${nom} : tableau nutritionnel, liste d'ingrédients, conseils d'utilisation et précautions d'emploi`, width: 1656, height: 2208 },
      { url: visuelDe(id, "ambiance"), alt: `Une statue de marbre qui hurle tend le pot SCULT CRI ${nom} vers l'objectif, devant un mur bleu`, width: 1792, height: 2240 },
    ],
    // La liste commune, avec l'arôme et le colorant du goût (cri-formule.json, partagé avec l'étiquette).
    ingredients: FORMULE.ingredients.replace("{AROME}", arome).replace("{COLORANT}", colorant),
  };
}

export const FLAVOURS: Flavour[] = [
  flavour("fruits-rouges", "FR"),
  flavour("cassis-framboise", "CF"),
  flavour("ice-tea-peche", "ITP"),
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
