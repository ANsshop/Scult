import type { MetadataRoute } from "next";
import { indexable, siteOrigin } from "@/lib/seo";

/** Ce qu'aucun robot n'a à visiter : l'API, l'admin, le tunnel d'achat. */
const PRIVATE = ["/api", "/admin", "/checkout", "/panier"];

/**
 * Les robots des moteurs de recherche et des moteurs de réponse (ChatGPT,
 * Claude, Perplexity, Gemini, Copilot, Le Chat…), nommés un par un : un robot
 * nommé n'obéit qu'à son propre groupe, pas au groupe « * ». La boutique veut
 * être lue, citée et recommandée : ils sont tous les bienvenus, y compris ceux
 * qui servent à l'entraînement. Liste et rôles : documentation de chaque
 * éditeur, relue le 2026-11-26 (ASSUMPTIONS.md).
 */
const WELCOME = [
  "Googlebot", "Google-Extended", "bingbot", "Applebot", "Applebot-Extended", "DuckAssistBot",
  "OAI-SearchBot", "GPTBot", "ChatGPT-User", "OAI-AdsBot",
  "ClaudeBot", "Claude-SearchBot", "Claude-User",
  "PerplexityBot", "Perplexity-User",
  "MistralAI-Index", "MistralAI-User", "MistralAI-Training",
  "meta-webindexer", "meta-externalagent", "meta-externalfetcher",
  "Amazonbot", "Amzn-SearchBot", "Amzn-User", "YouBot", "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  // Une adresse de démonstration ne doit pas sortir dans les moteurs.
  if (!indexable()) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      { userAgent: WELCOME, allow: "/", disallow: PRIVATE },
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${siteOrigin()}/sitemap.xml`,
  };
}
