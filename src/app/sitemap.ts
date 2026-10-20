import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/catalog/queries";
import { siteOrigin } from "@/lib/seo";

/** Généré depuis le catalogue : un produit retiré de l'API disparaît. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const now = new Date();
  const products = await getProducts();
  const e = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) => ({ url: `${origin}${path}`, lastModified: now, changeFrequency, priority });
  return [
    e("/", 1, "weekly"),
    ...products.map((p) => e(`/produits/${p.slug}`, 0.9, "weekly")),
    e("/methode", 0.7, "monthly"),
    e("/faq", 0.6, "monthly"),
    e("/livraison-retours", 0.4, "monthly"),
    e("/cgv", 0.1, "yearly"),
    e("/mentions-legales", 0.1, "yearly"),
    e("/confidentialite", 0.1, "yearly"),
  ];
}
