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
        <LegalPage eyebrow="Légal" title="Confidentialité" updated="novembre 2026">
          <section><h2>Données collectées</h2><p>Pour traiter une commande : nom, e-mail, adresse de livraison, collectés par Stripe au moment du paiement et transmis à notre outil de gestion des commandes. Aucune donnée bancaire ne transite par nos serveurs.</p></section>
          <section><h2>Liste d&apos;attente</h2><p>Si vous demandez à être prévenu de la sortie d&apos;un produit, nous gardons votre adresse e-mail, la date de votre inscription et la provenance de votre visite (par exemple le nom du site ou du réseau d&apos;où vous arrivez). Elle sert à vous envoyer un seul e-mail, le jour de la sortie, et à rien d&apos;autre : elle n&apos;est ni vendue ni transmise. Elle est effacée sur simple demande. Durée de conservation : [à compléter].</p></section>
          <section><h2>Cookies</h2><p>Le site n&apos;utilise aucun cookie de suivi publicitaire. Le panier est conservé dans le stockage local de votre navigateur.</p></section>
          <section><h2>Vos droits</h2><p>Accès, rectification, effacement, portabilité : écrivez à hello@scult.eu. Responsable de traitement : [à compléter].</p></section>
        </LegalPage>
      </main>
      <Footer />
    </>
  );
}
