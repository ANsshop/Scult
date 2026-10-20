import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Conditions générales de vente", alternates: { canonical: "/cgv" }, robots: { index: false } };

/* ⚠️ BLOQUANT AVANT VENTE : raison sociale, SIREN, siège, médiateur — voir ASSUMPTIONS.md */
export default function Page() {
  return (
    <>
      <Header />
      <main>
        <LegalPage eyebrow="Légal" title="Conditions générales de vente" updated="octobre 2026">
          <section><h2>1. Objet</h2><p>Les présentes conditions régissent les ventes conclues sur scult.eu entre l&apos;acheteur et [Raison sociale — à compléter], [forme juridique], immatriculée sous le n° [SIREN], dont le siège est situé [adresse].</p></section>
          <section><h2>2. Produits et prix</h2><p>Les produits sont des compléments alimentaires au sens de la directive 2002/46/CE. Les prix sont indiqués en euros toutes taxes comprises, hors frais de livraison précisés avant validation.</p></section>
          <section><h2>3. Commande et paiement</h2><p>Paiement en ligne par carte bancaire, Apple Pay ou Google Pay via Stripe. La commande est ferme à réception de la confirmation de paiement.</p></section>
          <section><h2>4. Livraison</h2><p>Zones, tarifs et délais sont détaillés sur la page Livraison &amp; retours. Au-delà de 30 jours de retard, l&apos;acheteur peut annuler et être remboursé.</p></section>
          <section><h2>5. Rétractation</h2><p>14 jours à compter de la réception, sans justification, pour tout pot scellé. Conformément à l&apos;article L.221-28 du Code de la consommation, un pot descellé ne peut être repris pour des raisons d&apos;hygiène.</p></section>
          <section><h2>6. Garanties</h2><p>Garantie légale de conformité (art. L.217-3 et s. du Code de la consommation) et garantie des vices cachés (art. 1641 et s. du Code civil).</p></section>
          <section><h2>7. Litiges</h2><p>Droit français. Médiateur de la consommation : [médiateur — à compléter] (art. L.616-1 du Code de la consommation). Plateforme européenne de règlement en ligne des litiges : ec.europa.eu/consumers/odr.</p></section>
        </LegalPage>
      </main>
      <Footer />
    </>
  );
}
