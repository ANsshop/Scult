import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import type { PpCatalogue, PpProduct, PpVariant } from "@/lib/pp/client";

/** L'étiquette de cache du catalogue : l'admin la périme dès qu'un prix, un stock ou un produit change. */
export const CATALOGUE_TAG = "catalogue";

type Row = {
  product_id: string; slug: string; product_name: string; description: string; category_slug: string | null; category_name: string | null;
  seo_title: string | null; seo_description: string | null; images: PpProduct["images"]; product_updated: Date;
  variant_id: string; sku: string; variant_name: string; price_cents: number; compare_at_cents: number | null; available_stock: number;
  preorder_allowed: boolean; preorder_eta: string | null; weight_grams: number | null; unit_count: number; variant_updated: Date;
};

/**
 * Le catalogue de la boutique, lu dans la base, sous la forme que le site
 * attend déjà (la même que celle du socle : lib/pp/client.ts).
 * Stock d'un pack : ce que le stock du pot permet d'en faire.
 * Jamais de prix de revient ni de seuil d'alerte ici : ce catalogue est public.
 */
async function read(): Promise<PpCatalogue> {
  const rows = await db.query<Row>(
    `select p.id as product_id, p.slug, p.name as product_name, p.description, p.category_slug, p.category_name,
            p.seo_title, p.seo_description, p.images, p.updated_at as product_updated,
            v.id as variant_id, v.sku, v.name as variant_name, v.price_cents, v.compare_at_cents,
            case when s.id is null then v.stock else floor(s.stock::numeric / v.unit_count)::int end as available_stock,
            v.preorder_allowed, v.preorder_eta, v.weight_grams, v.unit_count, v.updated_at as variant_updated
       from products p
       join variants v on v.product_id = p.id and v.is_active
       left join variants s on s.id = v.stock_variant_id
      where p.is_active
      order by p.position, p.name, v.position, v.name`,
  );
  const products = new Map<string, PpProduct>();
  const categories = new Map<string, string>();
  let updatedAt = new Date(0);
  for (const r of rows) {
    if (!products.has(r.product_id)) {
      products.set(r.product_id, {
        id: r.product_id, name: r.product_name, slug: r.slug, description: r.description, imageUrl: r.images[0]?.url ?? null,
        category: r.category_slug ? { slug: r.category_slug, name: r.category_name ?? r.category_slug } : null,
        seo: { title: r.seo_title, description: r.seo_description }, images: r.images, faqs: [], variants: [],
      });
      if (r.category_slug) categories.set(r.category_slug, r.category_name ?? r.category_slug);
    }
    const stock = Math.max(0, r.available_stock);
    const variant: PpVariant = {
      id: r.variant_id, sku: r.sku, name: r.variant_name, priceCents: r.price_cents, compareAtCents: r.compare_at_cents, stock,
      available: stock > 0, preorder: { allowed: r.preorder_allowed, eta: r.preorder_eta }, weightGrams: r.weight_grams, unitCount: r.unit_count,
    };
    products.get(r.product_id)!.variants.push(variant);
    for (const d of [r.product_updated, r.variant_updated]) if (d > updatedAt) updatedAt = d;
  }
  return {
    currency: "EUR",
    vatRate: "0.00", // la boutique vend TTC
    researchDisclaimer: null,
    updatedAt: updatedAt.toISOString(),
    categories: [...categories].map(([slug, name], position) => ({ id: slug, slug, name, description: null, position })),
    products: [...products.values()],
  };
}

/** Mis en cache une minute, comme l'était l'appel au socle : les fiches restent prégénérées. */
export const catalogueFromDb = unstable_cache(read, ["catalogue-db"], { revalidate: 60, tags: [CATALOGUE_TAG] });
