import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ProductPage } from "@/components/site/ProductPage";
import { JsonLd } from "@/components/site/JsonLd";
import { getProductBySlug, getProducts } from "@/lib/catalog/queries";
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
    openGraph: { title: `${p.name} — ${price}`, description: p.seoDescription ?? undefined, images: p.images[0] ? [{ url: p.images[0].url }] : undefined },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const upsell = product.slug === "trio" ? null : await getProductBySlug("trio");
  return (
    <>
      <JsonLd data={productJsonLd(product)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: product.name, path: `/produits/${product.slug}` }])} />
      <Header />
      <main><ProductPage product={product} upsell={upsell} /></main>
      <Footer />
    </>
  );
}
