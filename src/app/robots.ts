import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  // Sur Vercel (aperçus à partager, jamais la prod) : rien n'est indexable.
  if (process.env.VERCEL) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/api", "/checkout", "/panier"] }], sitemap: `${siteOrigin()}/sitemap.xml` };
}
