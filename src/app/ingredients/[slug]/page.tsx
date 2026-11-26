import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Article, IngredientLinks } from "@/components/site/Article";
import { JsonLd } from "@/components/site/JsonLd";
import { GUIDE, INGREDIENTS, PUBLISHED, UPDATED, getIngredient } from "@/lib/content/guides";
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo";

/** Une page par ingrédient, toutes prégénérées ; une adresse inconnue rend une vraie 404. */
export const dynamicParams = false;
export function generateStaticParams() {
  return INGREDIENTS.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const i = getIngredient((await params).slug);
  if (!i) return {};
  const path = `/ingredients/${i.slug}`;
  return {
    title: i.seoTitle,
    description: i.description,
    alternates: { canonical: path },
    openGraph: { type: "article", url: path, title: i.seoTitle, description: i.description, publishedTime: PUBLISHED, modifiedTime: UPDATED, images: [{ url: "/opengraph-image.jpg", width: 1200, height: 630 }] },
  };
}

export default async function IngredientPage({ params }: { params: Promise<{ slug: string }> }) {
  const i = getIngredient((await params).slug);
  if (!i) notFound();
  const path = `/ingredients/${i.slug}`;
  const crumbs = [{ name: "Accueil", path: "/" }, { name: "Guide du pré-workout", path: GUIDE.path }, { name: i.name, path }];
  return (
    <>
      <JsonLd data={articleJsonLd({ path, title: i.title, description: i.description, published: PUBLISHED, modified: UPDATED })} />
      <JsonLd data={faqPageJsonLd(i.questions)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <Header />
      <main>
        <Article crumbs={crumbs} eyebrow="Ingrédient" title={i.title} intro={i.intro} facts={i.facts} sections={i.sections} questions={i.questions} sources={i.sources} updated={UPDATED}>
          <IngredientLinks title="Les autres ingrédients" items={INGREDIENTS.filter((o) => o.slug !== i.slug).map((o) => ({ slug: o.slug, name: o.name, note: o.facts.find(([k]) => k === "Dans CRI")?.[1] ?? "" }))} />
        </Article>
      </main>
      <Footer />
    </>
  );
}
