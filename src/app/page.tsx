import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { IntroRose } from "@/components/site/intro/IntroRose";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { Slider } from "@/components/site/Slider";
import { FaqPreview } from "@/components/site/FaqPreview";
import { JsonLd } from "@/components/site/JsonLd";
import { organizationJsonLd } from "@/lib/seo";

export const revalidate = 60;
export const metadata = { alternates: { canonical: "/" } };

/**
 * Boutique mono-produit : toute la page d'accueil mène à la fiche de CRI
 * (le hero, puis le pot 3D du slider). La section « formule », avec son pot
 * qui tournait au défilement, a été retirée le 2026-11-26 : elle doublait le
 * slider ; la formule se lit sur la fiche (`/produits/cri#formule`).
 * Le vrai site est le site dark ; `IntroRose` est la couche décorative qui le
 * recouvre une seconde, une seule fois par visiteur, avant de glitcher.
 */
export default function Home() {
  return (
    <>
      {/* La boutique, sa livraison, ses retours, le nom du site : Google les lit sur la page d'accueil */}
      <JsonLd data={organizationJsonLd()} />
      <IntroRose />
      <Header overlay />
      <main>
        <Hero />
        <Marquee />
        <Slider />
        <FaqPreview />
      </main>
      <Footer />
    </>
  );
}
