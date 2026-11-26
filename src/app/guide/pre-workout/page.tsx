import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Article, IngredientLinks } from "@/components/site/Article";
import { JsonLd } from "@/components/site/JsonLd";
import { GUIDE, INGREDIENTS, PUBLISHED, UPDATED } from "@/lib/content/guides";
import { articleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo";

const CRUMBS = [{ name: "Accueil", path: "/" }, { name: "Guide du pré-workout", path: GUIDE.path }];

export const metadata: Metadata = {
  title: GUIDE.seoTitle,
  description: GUIDE.description,
  alternates: { canonical: GUIDE.path },
  openGraph: { type: "article", url: GUIDE.path, title: GUIDE.seoTitle, description: GUIDE.description, publishedTime: PUBLISHED, modifiedTime: UPDATED, images: [{ url: "/opengraph-image.jpg", width: 1200, height: 630 }] },
};

/** Le guide du pré-workout : la page de fond du site, celle qui répond aux questions qu'on pose avant d'acheter. */
export default function GuidePage() {
  return (
    <>
      <JsonLd data={articleJsonLd({ path: GUIDE.path, title: GUIDE.title, description: GUIDE.description, published: PUBLISHED, modified: UPDATED, image: "/opengraph-image.jpg" })} />
      <JsonLd data={faqPageJsonLd(GUIDE.questions)} />
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <Header />
      <main>
        <Article crumbs={CRUMBS} eyebrow={GUIDE.eyebrow} title={GUIDE.title} intro={GUIDE.intro} summaryTitle="L'essentiel" summary={GUIDE.summary} sections={GUIDE.sections} questions={GUIDE.questions} sources={GUIDE.sources} updated={UPDATED}>
          <IngredientLinks title="Les ingrédients, un par un" items={INGREDIENTS.map((i) => ({ slug: i.slug, name: i.name, note: i.facts.find(([k]) => k === "Dans CRI")?.[1] ?? "" }))} />
        </Article>
      </main>
      <Footer />
    </>
  );
}
