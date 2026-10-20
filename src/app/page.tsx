import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Hero } from "@/components/site/Hero";
import { Manifesto } from "@/components/site/Manifesto";
import { ProductGrid } from "@/components/site/ProductGrid";
import { Statue } from "@/components/site/Statue";
import { FaqPreview } from "@/components/site/FaqPreview";
import { getProducts } from "@/lib/catalog/queries";

export const revalidate = 60;
export const metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const products = await getProducts();
  return (
    <>
      <Header onBlue />
      <main>
        <Hero />
        <Manifesto />
        <ProductGrid products={products} />
        <Statue />
        <FaqPreview />
      </main>
      <Footer />
    </>
  );
}
