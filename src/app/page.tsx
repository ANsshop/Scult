import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { IntroRose } from "@/components/site/intro/IntroRose";
import { Hero } from "@/components/site/Hero";
import { Slider } from "@/components/site/Slider";
import { FaqPreview } from "@/components/site/FaqPreview";
import { JsonLd } from "@/components/site/JsonLd";
import { organizationJsonLd } from "@/lib/seo";
import { getFlavourOffer, getProductBySlug } from "@/lib/catalog/queries";

export const revalidate = 60;
export const metadata = { alternates: { canonical: "/" } };

/**
 * Boutique mono-produit : toute la page d'accueil mène à la fiche de CRI
 * (le hero, puis le pot 3D du slider). La section « formule », avec son pot
 * qui tournait au défilement, a été retirée le 2026-11-26 : elle doublait le
 * slider ; la formule se lit sur la fiche (`/produits/cri#formule`). La bande de
 * texte qui glissait sous le hero a été retirée le même jour.
 * Le vrai site est le site dark ; `IntroRose` est la couche décorative qui le
 * recouvre une seconde, une seule fois par visiteur, avant de glitcher.
 */
export default async function Home() {
  // Ce que le bouton d'ajout du slider met au panier : le pot du premier goût vendu, sinon la première variante du catalogue.
  const [cri, offer] = await Promise.all([getProductBySlug("cri"), getFlavourOffer("cri")]);
  const single = offer ? offer.singles[offer.flavours[0]] : null;
  const buy = single
    ? single
    : cri
      ? { item: { sku: cri.variant.sku, slug: cri.slug, name: cri.name, priceCents: cri.priceCents, image: cri.images[0]?.url ?? null }, inStock: cri.inStock, preorderEta: cri.preorderEta }
      : null;
  return (
    <>
      {/* La boutique, sa livraison, ses retours, le nom du site : Google les lit sur la page d'accueil */}
      <JsonLd data={organizationJsonLd()} />
      <IntroRose />
      <Header overlay />
      <main>
        <Hero />
        <Slider buy={buy} />
        <FaqPreview />
      </main>
      <Footer />
    </>
  );
}
