import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { Marquee } from "@/components/site/Marquee";
import { Offer } from "@/components/site/Offer";
import { Performance } from "@/components/site/Performance";
import { Statue } from "@/components/site/Statue";
import { FaqPreview } from "@/components/site/FaqPreview";
import { getProductBySlug } from "@/lib/catalog/queries";

export const revalidate = 60;
export const metadata = { alternates: { canonical: "/" } };

/** Boutique mono-produit : toute la page d'accueil vend CRI. */
export default async function Home() {
  const cri = await getProductBySlug("cri");
  return (
    <>
      <Header onBlue />
      <main>
        <Hero />
        <Marquee />
        {cri && <Offer product={cri} />}
        <Performance />
        <Statue />
        <FaqPreview />
      </main>
      <Footer />
    </>
  );
}
