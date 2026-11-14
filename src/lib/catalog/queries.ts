import { getCatalogue, type PpProduct, type PpVariant } from "@/lib/pp/client";
import { FLAVOURS, flavoursLabel, flavoursOfSku, packKey, type FlavourId } from "@/lib/content/flavours";
import type { CartLine } from "@/lib/types";

/** Forme que les pages attendent — dérivée du catalogue, jamais stockée. */
export type Product = {
  slug: string;
  name: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  categorySlug: string | null;
  images: PpProduct["images"];
  /** Première variante vendable : celle des prix affichés. Les goûts sont les autres variantes (getFlavourOffer). */
  variant: PpVariant;
  priceCents: number;
  compareAtCents: number | null;
  inStock: boolean;
  preorderEta: string | null;
};

function toProduct(p: PpProduct): Product | null {
  const variant = p.variants[0];
  if (!variant) return null; // produit sans variante : pas vendable, pas affiché
  return {
    slug: p.slug, // tel quel, jamais recalculé
    name: p.name,
    description: p.description,
    seoTitle: p.seo?.title ?? null,
    seoDescription: p.seo?.description ?? null,
    categorySlug: p.category?.slug ?? null,
    images: p.images,
    variant,
    priceCents: variant.priceCents,
    compareAtCents: variant.compareAtCents,
    inStock: variant.available || variant.preorder.allowed,
    preorderEta: !variant.available && variant.preorder.allowed ? variant.preorder.eta : null,
  };
}

/**
 * Boutique mono-produit : seuls ces slugs sont vendus, quel que soit le
 * catalogue de la marque dans le socle. Fiches, sitemap et panier en
 * découlent. Pour rouvrir une référence, ajouter son slug ici.
 */
const STOREFRONT_SLUGS = new Set(["cri"]);

export async function getProducts(): Promise<Product[]> {
  const cat = await getCatalogue();
  return cat.products
    .filter((p) => STOREFRONT_SLUGS.has(p.slug))
    .map(toProduct)
    .filter((p): p is Product => p !== null);
}

/**
 * Le pack proposé sur la fiche d'un produit (« pack de 2 »). C'est un produit
 * à part entière dans le socle — son prix vient de là, comme les autres — mais
 * il n'a pas de page à lui : il se choisit sur la fiche du produit d'origine.
 */
const BUNDLE_OF: Record<string, string> = { cri: "cri-duo" };

/** Un article à vendre, et s'il est disponible. */
export type Sellable = { item: CartLine; inStock: boolean; preorderEta: string | null };

/**
 * L'offre d'un produit décliné en goûts : un pot par goût, et les packs de
 * deux pots (même goût ou deux goûts différents). Tout vient du catalogue —
 * une variante par goût sur le produit, une variante par paire de goûts sur
 * son pack — et chaque variante est reconnue à son SKU (flavoursOfSku).
 * Un goût sans variante n'est pas proposé ; un pack sans variante non plus.
 */
export type FlavourOffer = {
  slug: string;
  name: string;
  /** Les goûts vendus, dans l'ordre de la gamme. */
  flavours: FlavourId[];
  singles: Partial<Record<FlavourId, Sellable>>;
  /** Les packs, par paire de goûts (packKey). */
  packs: Record<string, Sellable>;
  /** Pots par pack, prix du pack et prix des mêmes pots à l'unité ; null s'il n'y a pas de pack. */
  pack: { units: number; priceCents: number; fullPriceCents: number } | null;
  unitPriceCents: number;
};

function sellable(p: PpProduct, v: PpVariant, slug: string, flavours: FlavourId[]): Sellable {
  return {
    item: { sku: v.sku, slug, name: p.name, priceCents: v.priceCents, image: p.images[0]?.url ?? null, detail: flavoursLabel(flavours), flavours },
    inStock: v.available || v.preorder.allowed,
    preorderEta: !v.available && v.preorder.allowed ? v.preorder.eta : null,
  };
}

export async function getFlavourOffer(slug: string): Promise<FlavourOffer | null> {
  if (!STOREFRONT_SLUGS.has(slug)) return null;
  const cat = await getCatalogue();
  const product = cat.products.find((p) => p.slug === slug);
  if (!product) return null;
  const singles: FlavourOffer["singles"] = {};
  for (const v of product.variants) {
    const ids = flavoursOfSku(v.sku);
    if (ids?.length === 1 && !singles[ids[0]]) singles[ids[0]] = sellable(product, v, slug, ids);
  }
  const flavours = FLAVOURS.map((f) => f.id).filter((id) => singles[id]);
  if (flavours.length === 0) return null;
  const unitPriceCents = singles[flavours[0]]!.item.priceCents;

  const packs: FlavourOffer["packs"] = {};
  const bundle = cat.products.find((p) => p.slug === BUNDLE_OF[slug]);
  for (const v of bundle?.variants ?? []) {
    const ids = flavoursOfSku(v.sku);
    // le lien d'un pack ramène à la fiche du produit : il n'a pas de page à lui
    if (ids?.length === 2 && ids.every((id) => singles[id])) packs[packKey(ids[0], ids[1])] = sellable(bundle!, v, slug, [...ids].sort() as FlavourId[]);
  }
  const first = Object.values(packs)[0];
  return {
    slug,
    name: product.name,
    flavours,
    singles,
    packs,
    pack: first ? { units: 2, priceCents: first.item.priceCents, fullPriceCents: 2 * unitPriceCents } : null,
    unitPriceCents,
  };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getVatRate(): Promise<number> {
  const cat = await getCatalogue();
  return Number(cat.vatRate);
}
