import type { Product } from "@/lib/catalog/queries";
import type { FaqItem } from "@/lib/content/faq";

export const SITE_NAME = "SCULT";

export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://scult.eu").replace(/\/$/, "");
}

export function organizationJsonLd() {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: SITE_NAME,
        url: origin,
        logo: `${origin}/brand/logo-black.png`,
        description: "SCULT fabrique trois poudres nature dans l'Union européenne : whey isolate, créatine monohydrate et collagène marin.",
        email: "hello@scult.eu",
      },
      { "@type": "WebSite", "@id": `${origin}/#website`, name: SITE_NAME, url: origin, inLanguage: "fr-FR", publisher: { "@id": `${origin}/#organization` } },
    ],
  };
}

export function productJsonLd(p: Product) {
  const origin = siteOrigin();
  const url = `${origin}/produits/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    url,
    image: p.images.map((i) => `${origin}${i.url}`),
    sku: p.variant.sku,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: "Compléments alimentaires > Poudres",
    offers: {
      "@type": "Offer",
      url,
      price: (p.priceCents / 100).toFixed(2),
      priceCurrency: "EUR",
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": `${origin}/#organization` },
    },
  };
}

export function faqPageJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({ "@type": "Question", name: i.question, acceptedAnswer: { "@type": "Answer", text: i.answer } })),
  };
}

export function breadcrumbJsonLd(crumbs: { name: string; path: string }[]) {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: `${origin}${c.path}` })),
  };
}
