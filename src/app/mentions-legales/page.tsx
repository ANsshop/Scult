import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { LegalPage } from "@/components/site/LegalPage";

export const metadata: Metadata = { title: "Mentions légales", alternates: { canonical: "/mentions-legales" }, robots: { index: false } };

/* ⚠️ BLOQUANT AVANT VENTE — voir ASSUMPTIONS.md */
export default function Page() {
  return (
    <>
      <Header />
      <main>
        <LegalPage eyebrow="Légal" title="Mentions légales" updated="octobre 2026">
          <section><h2>Éditeur</h2><p>SCULT — [Raison sociale à compléter]<br />[Forme juridique] au capital de [montant] €<br />SIREN : [à compléter] — RCS [ville]<br />Siège : [adresse]<br />E-mail : hello@scult.eu<br />Directeur de la publication : [nom]</p></section>
          <section><h2>Compléments alimentaires</h2><p>Les produits vendus sont des compléments alimentaires déclarés auprès de la DGCCRF (téléprocédure Teleicare) — [numéro de déclaration à compléter]. Personne responsable dans l&apos;Union européenne : [à compléter].</p></section>
          <section><h2>Hébergement</h2><p>[AlexHost / adresse à compléter] — proxy Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, États-Unis.</p></section>
          <section><h2>Propriété intellectuelle</h2><p>Les contenus du site (textes, visuels, marque SCULT) sont protégés. Toute reproduction sans autorisation écrite est interdite.</p></section>
        </LegalPage>
      </main>
      <Footer />
    </>
  );
}
