import type { MetadataRoute } from "next";
import { getCatalogue } from "@/lib/pp/client";
import { getProducts } from "@/lib/catalog/queries";
import { GUIDE, INGREDIENTS, UPDATED } from "@/lib/content/guides";
import { siteOrigin } from "@/lib/seo";

/**
 * Le plan du site. Deux choix, conformes à ce que Google en dit :
 *  - `lastmod` n'est donné que s'il est vrai : la date du catalogue pour
 *    l'accueil et les fiches produit, celle du contenu pour le guide et les
 *    ingrédients. Les pages dont on ne connaît pas la date de dernière
 *    modification n'en portent pas — une date fausse fait ignorer toutes les autres ;
 *  - ni `priority` ni `changefreq` : Google et Bing les ignorent.
 * Les photos de chaque produit sont déclarées avec sa fiche (sitemap d'images).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const [products, catalogue] = await Promise.all([getProducts(), getCatalogue()]);
  const catalogueDate = new Date(catalogue.updatedAt);
  const abs = (url: string) => (url.startsWith("http") ? url : `${origin}${url}`);
  return [
    { url: `${origin}/`, lastModified: catalogueDate },
    ...products.map((p) => ({ url: `${origin}/produits/${p.slug}`, lastModified: catalogueDate, images: p.images.map((i) => abs(i.url)) })),
    { url: `${origin}${GUIDE.path}`, lastModified: UPDATED },
    ...INGREDIENTS.map((i) => ({ url: `${origin}/ingredients/${i.slug}`, lastModified: UPDATED })),
    ...["/methode", "/faq", "/livraison-retours", "/cgv", "/mentions-legales", "/confidentialite"].map((path) => ({ url: `${origin}${path}` })),
  ];
}
