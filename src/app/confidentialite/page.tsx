import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Confidentialité", alternates: { canonical: "/confidentialite" }, robots: { index: false } };

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <LegalPage eyebrow="Légal" title="Confidentialité" updated="octobre 2026">
          <section><h2>Données collectées</h2><p>Pour traiter une commande : nom, e-mail, adresse de livraison, collectés par Stripe au moment du paiement et transmis à notre outil de gestion des commandes. Aucune donnée bancaire ne transite par nos serveurs.</p></section>
          <section><h2>Cookies</h2><p>Le site n&apos;utilise aucun cookie de suivi publicitaire. Le panier est conservé dans le stockage local de votre navigateur.</p></section>
          <section><h2>Vos droits</h2><p>Accès, rectification, effacement, portabilité : écrivez à hello@scult.eu. Responsable de traitement : [à compléter].</p></section>
        </LegalPage>
      </main>
      <Footer />
    </>
  );
}
