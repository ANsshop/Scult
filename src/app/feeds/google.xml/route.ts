import { getCatalogue } from "@/lib/pp/client";
import { PRODUCT_INFO } from "@/lib/content/product-info";
import { SITE_NAME, siteOrigin } from "@/lib/seo";
import { FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_ZONES } from "@/lib/shipping";

export const revalidate = 3600;

/**
 * Le flux de produits pour Google Merchant Center (fiches gratuites de
 * l'onglet Shopping, produits dans Gemini et le mode IA) : à déclarer dans
 * Merchant Center comme flux planifié, à l'adresse /feeds/google.xml.
 * Bing Merchant Center lit le même format.
 *
 * Ce qui s'y trouve vient du catalogue et de lib/shipping.ts ; rien n'est
 * recopié. Points propres à ce produit :
 *  - pas de GTIN (on n'en invente pas) : la marque et la référence (`mpn`) le remplacent ;
 *  - prix au kilo obligatoire dans l'Union pour une denrée vendue au poids ;
 *  - les images sont en WebP : Merchant Center refuse l'AVIF ;
 *  - le pack de deux est un « multipack » du fabricant, déclaré comme tel.
 * ⚠ Merchant Center refuse certains ingrédients de compléments alimentaires :
 * la formule est à vérifier avec ses règles avant d'envoyer le flux (ASSUMPTIONS.md).
 */
const SOLD: Record<string, { parent: string; units: number }> = { cri: { parent: "cri", units: 1 }, "cri-duo": { parent: "cri", units: 2 } };
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const eur = (cents: number) => `${(cents / 100).toFixed(2)} EUR`;

export async function GET() {
  const origin = siteOrigin();
  const catalogue = await getCatalogue();
  const abs = (url: string) => (url.startsWith("http") ? url : `${origin}${url}`);
  const items = catalogue.products.filter((p) => SOLD[p.slug]).flatMap((p) => {
    const { parent, units } = SOLD[p.slug];
    const info = PRODUCT_INFO[parent];
    return p.variants.map((v) => {
      const sale = v.compareAtCents !== null && v.compareAtCents > v.priceCents;
      const shipping = SHIPPING_ZONES.flatMap((z) => z.countries.map((c) => `<g:shipping><g:country>${c}</g:country><g:price>${eur(v.priceCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : z.rateCents)}</g:price></g:shipping>`)).join("");
      return `<item>
<g:id>${esc(v.sku)}</g:id>
<title>${esc(units > 1 ? `${p.name.replace(/ — pack de \d+$/, "")}, ${info?.label ?? "pré-workout"} ${SITE_NAME} — pack de ${units}` : `${p.name}, ${info?.label ?? "pré-workout"} ${SITE_NAME} — ${info?.netGrams ?? ""} g`)}</title>
<description>${esc(p.description)}</description>
<link>${origin}/produits/${parent}</link>
<g:image_link>${esc(abs(p.images[0]?.url ?? ""))}</g:image_link>
${p.images.slice(1, 10).map((i) => `<g:additional_image_link>${esc(abs(i.url))}</g:additional_image_link>`).join("\n")}
<g:availability>${v.available ? "in_stock" : v.preorder.allowed ? "preorder" : "out_of_stock"}</g:availability>
<g:price>${eur(sale ? v.compareAtCents! : v.priceCents)}</g:price>
${sale ? `<g:sale_price>${eur(v.priceCents)}</g:sale_price>` : ""}
<g:brand>${SITE_NAME}</g:brand>
<g:mpn>${esc(v.sku)}</g:mpn>
<g:condition>new</g:condition>
<g:google_product_category>525</g:google_product_category>
<g:product_type>Compléments alimentaires &gt; Nutrition sportive &gt; Pré-workout</g:product_type>
${units > 1 ? `<g:multipack>${units}</g:multipack>` : ""}
${info ? `<g:unit_pricing_measure>${info.netGrams * units} g</g:unit_pricing_measure><g:unit_pricing_base_measure>1 kg</g:unit_pricing_base_measure>` : ""}
${v.weightGrams ? `<g:shipping_weight>${v.weightGrams} g</g:shipping_weight>` : ""}
${shipping}
</item>`;
    });
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>
<title>${SITE_NAME}</title><link>${origin}</link><description>Les produits de la boutique ${SITE_NAME}</description>
${items.join("\n")}
</channel></rss>`;
  return new Response(xml.replace(/\n{2,}/g, "\n"), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
