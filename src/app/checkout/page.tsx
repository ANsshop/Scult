import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/ui/Container";
import { CheckoutForm } from "@/components/cart/CheckoutForm";
import { getVatRate } from "@/lib/catalog/queries";

export const metadata: Metadata = { title: "Commander", robots: { index: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ annule?: string }> }) {
  const { annule } = await searchParams;
  const vatRate = await getVatRate();
  return (
    <>
      <Header />
      <main>
        <Container className="max-w-2xl py-16 md:py-24">
          <p className="label text-stone">Commande</p>
          <h1 className="display mt-4 text-[clamp(2.4rem,7vw,5rem)]">Presque fini.</h1>
          {annule && <p className="mt-6 border border-ruby p-4 text-sm">Paiement annulé. Votre panier est conservé.</p>}
          <CheckoutForm vatRate={vatRate} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
