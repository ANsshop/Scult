import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/site/JsonLd";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { breadcrumbJsonLd, faqPageJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Questions fréquentes",
  description: "Composition de la whey, de la créatine et du collagène SCULT, délais et tarifs de livraison en Europe, retours, paiement, fabrication.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FAQ_ITEMS)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "FAQ", path: "/faq" }])} />
      <Header />
      <main>
        <Container className="py-16 md:py-24">
          <p className="label text-stone">FAQ</p>
          <h1 className="display mt-4 text-[clamp(2.4rem,7vw,6rem)]">Questions fréquentes.</h1>
          <dl className="mt-12 max-w-3xl divide-y border-y">
            {FAQ_ITEMS.map((i) => (
              <div key={i.question} className="py-6">
                <dt className="text-lg font-medium">{i.question}</dt>
                <dd className="mt-2 leading-relaxed text-stone">{i.answer}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </main>
      <Footer />
    </>
  );
}
