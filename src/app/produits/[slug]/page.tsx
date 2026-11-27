import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductPage } from "@/components/site/ProductPage";
import { JsonLd } from "@/components/site/JsonLd";
import { getFlavourOffer, getProductBySlug, getProducts } from "@/lib/catalog/queries";
import { PRODUCT_INFO } from "@/lib/content/product-info";
import { getLaunch } from "@/lib/launch";
import { breadcrumbJsonLd, productJsonLd } from "@/lib/seo";
import { formatPrice } from "@/lib/utils";

export const revalidate = 60;

/** Fiches prégénérées depuis le catalogue ; un slug absent de l'API → 404. */
export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return {};
  const price = formatPrice(p.priceCents);
  return {
    title: p.seoTitle ?? `${p.name} ${price}`,
    description: p.seoDescription ?? p.description.slice(0, 155),
    alternates: { canonical: `/produits/${p.slug}` },
    // Un openGraph défini ici remplace celui du layout, image comprise : on redonne le visuel de partage du site.
    // L'image de partage : la photo du produit (assez grande pour un grand aperçu), sinon celle du site.
    openGraph: {
      type: "website", url: `/produits/${p.slug}`, title: p.seoTitle ?? `${p.name} — ${price}`, description: p.seoDescription ?? undefined,
      images: p.images[0] ? [{ url: p.images[0].url, width: p.images[0].width, height: p.images[0].height, alt: p.images[0].alt }] : [{ url: "/opengraph-image.jpg", width: 1200, height: 630 }],
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const launch = await getLaunch();
  return (
    <>
      <JsonLd data={productJsonLd(product, { label: PRODUCT_INFO[product.slug]?.label, netGrams: PRODUCT_INFO[product.slug]?.netGrams, sold: launch.open })} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: product.name, path: `/produits/${product.slug}` }])} />
      <Header />
      <main><ProductPage product={product} offer={await getFlavourOffer(product.slug)} launch={launch} /></main>
      <Footer />
      {/* La place de la barre collée en bas de l'écran (BuyButton, ou WaitlistBar avant la sortie) : elle ne cache pas la fin du pied de page */}
      <div aria-hidden className="sombre h-[4.75rem] bg-fond" />
    </>
  );
}
