import { getCatalogue, type PpProduct, type PpVariant } from "@/lib/pp/client";

/** Forme que les pages attendent — dérivée du catalogue, jamais stockée. */
export type Product = {
  slug: string;
  name: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  categorySlug: string | null;
  images: PpProduct["images"];
  /** Première variante vendable. Le site est mono-variante par produit. */
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

export async function getBundleFor(slug: string): Promise<Product | null> {
  const bundleSlug = BUNDLE_OF[slug];
  if (!bundleSlug) return null;
  const cat = await getCatalogue();
  const found = cat.products.find((p) => p.slug === bundleSlug);
  return found ? toProduct(found) : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const all = await getProducts();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getVatRate(): Promise<number> {
  const cat = await getCatalogue();
  return Number(cat.vatRate);
}
