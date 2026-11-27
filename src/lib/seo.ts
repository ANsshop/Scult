import type { Product } from "@/lib/catalog/queries";
import type { FaqItem } from "@/lib/content/faq";
import { FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_ZONES, SHIPPABLE_COUNTRY_CODES } from "@/lib/shipping";

/**
 * Le référencement technique du site : l'adresse de référence, le droit
 * d'être indexé, et les données structurées (schema.org) que lisent Google,
 * Bing et les moteurs de réponse.
 *
 * Deux règles, tirées de la documentation de Google (relue le 2026-11-26) :
 *  - une donnée structurée ne dit que ce que la page affiche ;
 *  - aucune note ni aucun avis tant qu'il n'y a pas de vrais avis clients.
 * Les tarifs de livraison et la politique de retour viennent de lib/shipping.ts
 * et de la page /livraison-retours : une seule source, pas de chiffre recopié.
 */

export const SITE_NAME = "SCULT";
export const CONTACT_EMAIL = "hello@scult.eu";
/** La clé IndexNow du site (publique : le fichier public/<clé>.txt la confirme aux moteurs). */
export const INDEXNOW_KEY = "c2c01d9a692a0381975e5fa8eece843a";

export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://scult.eu").replace(/\/$/, "");
}

/**
 * Le site peut-il être indexé ? Oui en production ; non sur une adresse de
 * démonstration. SITE_INDEXABLE (« 1 » ou « 0 ») tranche ; sans elle, tout
 * déploiement Vercel est considéré comme une démonstration.
 */
export function indexable(): boolean {
  const flag = process.env.SITE_INDEXABLE;
  return flag ? flag === "1" : !process.env.VERCEL;
}

const money = (cents: number) => Number((cents / 100).toFixed(2));
const days = (min: number, max: number) => ({ "@type": "ServicePeriod", duration: { "@type": "QuantitativeValue", minValue: min, maxValue: max, unitCode: "DAY" } });

/** La politique de retour : 14 jours, pot scellé, retour par la poste à la charge du client, remboursement intégral. */
function returnPolicy(origin: string) {
  return {
    "@type": "MerchantReturnPolicy",
    applicableCountry: SHIPPABLE_COUNTRY_CODES,
    returnPolicyCountry: "FR",
    returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: 14,
    itemCondition: "https://schema.org/NewCondition",
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    refundType: "https://schema.org/FullRefund",
    merchantReturnLink: `${origin}/livraison-retours`,
  };
}

/** La livraison : un tarif par zone sous le seuil, offerte au-dessus ; préparation sous un jour ouvré. */
function shippingService() {
  const threshold = money(FREE_SHIPPING_THRESHOLD_CENTS);
  return {
    "@type": "ShippingService",
    name: "Livraison à domicile en Europe",
    description: `Livraison offerte dès ${threshold} € d'achat.`,
    fulfillmentType: "https://schema.org/FulfillmentTypeDelivery",
    handlingTime: { "@type": "ServicePeriod", businessDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], duration: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" } },
    shippingConditions: SHIPPING_ZONES.flatMap((zone) => {
      const shippingDestination = zone.countries.map((c) => ({ "@type": "DefinedRegion", addressCountry: c }));
      const transitTime = days(zone.delayDays[0], zone.delayDays[1]);
      return [
        { "@type": "ShippingConditions", shippingDestination, orderValue: { "@type": "MonetaryAmount", minValue: 0, maxValue: Number((threshold - 0.01).toFixed(2)), currency: "EUR" }, shippingRate: { "@type": "MonetaryAmount", value: money(zone.rateCents), currency: "EUR" }, transitTime },
        { "@type": "ShippingConditions", shippingDestination, orderValue: { "@type": "MonetaryAmount", minValue: threshold, currency: "EUR" }, shippingRate: { "@type": "MonetaryAmount", value: 0, currency: "EUR" }, transitTime },
      ];
    }),
  };
}

/** La boutique et le site : sur la page d'accueil seulement (c'est là que Google les lit). */
export function organizationJsonLd() {
  const origin = siteOrigin();
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "OnlineStore",
        "@id": `${origin}/#organization`,
        name: SITE_NAME,
        url: origin,
        logo: `${origin}/brand/logo-black.png`,
        description: "SCULT est une marque européenne de compléments alimentaires en poudre. Son produit : CRI, un pré-workout goût fraise piquante dont chaque dosage est écrit sur le pot. Fabriqué dans l'Union européenne, lots numérotés.",
        email: CONTACT_EMAIL,
        contactPoint: { "@type": "ContactPoint", contactType: "customer service", email: CONTACT_EMAIL, availableLanguage: "French" },
        hasMerchantReturnPolicy: returnPolicy(origin),
        hasShippingService: shippingService(),
      },
      { "@type": "WebSite", "@id": `${origin}/#website`, name: SITE_NAME, url: origin, inLanguage: "fr-FR", publisher: { "@id": `${origin}/#organization` } },
    ],
  };
}

/** Le prix au kilo d'un produit vendu au poids, en euros. */
export const pricePerKg = (priceCents: number, netGrams: number) => (priceCents / 100 / netGrams) * 1000;

/**
 * La fiche d'un produit qu'on peut acheter ici (« merchant listing »).
 * `label` : ce qu'est le produit, tel que la page l'écrit sous son nom.
 * `netGrams` : le poids net, pour le prix au kilo — affiché aussi sur la page.
 * Pas de GTIN (le produit n'en a pas : on n'en invente pas) ; la référence sert de `sku` et de `mpn`.
 */
export function productJsonLd(p: Product, extra: { label?: string; netGrams?: number; sold?: boolean } = {}) {
  const origin = siteOrigin();
  const url = `${origin}/produits/${p.slug}`;
  const price = money(p.priceCents);
  const onSale = p.compareAtCents !== null && p.compareAtCents > p.priceCents;
  const specs: Record<string, unknown>[] = [];
  if (extra.netGrams) {
    specs.push({
      "@type": "UnitPriceSpecification", price, priceCurrency: "EUR",
      referenceQuantity: { "@type": "QuantitativeValue", value: String(extra.netGrams / 1000), unitCode: "KGM", valueReference: { "@type": "QuantitativeValue", value: "1", unitCode: "KGM" } },
    });
  }
  if (onSale) specs.push({ "@type": "UnitPriceSpecification", priceType: "https://schema.org/StrikethroughPrice", price: money(p.compareAtCents!), priceCurrency: "EUR" });
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: extra.label ? `${p.name}, ${extra.label}` : p.name,
    description: p.description,
    url,
    image: p.images.map((i) => (i.url.startsWith("http") ? i.url : `${origin}${i.url}`)),
    sku: p.variant.sku,
    mpn: p.variant.sku,
    brand: { "@type": "Brand", name: SITE_NAME },
    category: "Compléments alimentaires > Nutrition sportive > Pré-workout",
    ...(extra.netGrams ? { weight: { "@type": "QuantitativeValue", value: extra.netGrams, unitCode: "GRM" } } : {}),
    offers: {
      "@type": "Offer",
      url,
      price,
      priceCurrency: "EUR",
      ...(specs.length ? { priceSpecification: specs.length === 1 ? specs[0] : specs } : {}),
      // Avant la sortie (`sold: false`), on ne peut pas l'acheter : l'annoncer en stock tromperait le moteur comme le client.
      availability: extra.sold === false ? "https://schema.org/OutOfStock" : p.inStock ? (p.preorderEta ? "https://schema.org/PreOrder" : "https://schema.org/InStock") : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: SITE_NAME, url: origin },
    },
  };
}

/** Un article du site (guide, fiche d'ingrédient). L'auteur est la marque : pas de faux expert. */
export function articleJsonLd(a: { path: string; title: string; description: string; published: string; modified: string; image?: string }) {
  const origin = siteOrigin();
  const publisher = { "@type": "Organization", name: SITE_NAME, url: origin, logo: { "@type": "ImageObject", url: `${origin}/brand/logo-black.png` } };
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.description,
    inLanguage: "fr-FR",
    datePublished: a.published,
    dateModified: a.modified,
    mainEntityOfPage: `${origin}${a.path}`,
    ...(a.image ? { image: [`${origin}${a.image}`] } : {}),
    author: publisher,
    publisher,
  };
}

/** Les questions d'une page. Google n'en fait plus de résultat enrichi (retiré en 2026) ; d'autres moteurs le lisent encore. */
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
