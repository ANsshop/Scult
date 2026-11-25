import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { IntroRose } from "@/components/site/intro/IntroRose";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { Offer } from "@/components/site/Offer";
import { FocusComplex } from "@/components/site/FocusComplex";
import { Slider } from "@/components/site/Slider";
import { FOCUS } from "@/lib/content/site";
import { FaqPreview } from "@/components/site/FaqPreview";
import { getFlavourOffer, getProductBySlug } from "@/lib/catalog/queries";

export const revalidate = 60;
export const metadata = { alternates: { canonical: "/" } };

/**
 * Boutique mono-produit : toute la page d'accueil vend CRI.
 * Le vrai site est le site dark ; `IntroRose` est la couche décorative qui le
 * recouvre une seconde, une seule fois par visiteur, avant de glitcher.
 */
export default async function Home() {
  const [cri, offer] = await Promise.all([getProductBySlug("cri"), getFlavourOffer("cri")]);
  return (
    <>
      <IntroRose />
      <Header overlay />
      <main>
        <Hero offer={offer} />
        <Marquee />
        {cri && <Offer product={cri} offer={offer} />}
        <FocusComplex cta={FOCUS.cta} />
        <Slider />
        <FaqPreview />
      </main>
      <Footer />
    </>
  );
}
