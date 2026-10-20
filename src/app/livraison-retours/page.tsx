import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { LegalPage } from "@/components/site/LegalPage";
import { SHIPPING_ZONES, FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = { title: "Livraison & retours", description: "Zones, tarifs et délais de livraison en Europe, conditions de retour des pots SCULT.", alternates: { canonical: "/livraison-retours" } };

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <LegalPage eyebrow="Aide" title="Livraison & retours" updated="octobre 2026">
          <section>
            <h2>Zones et tarifs</h2>
            <table className="mt-4 w-full text-sm">
              <thead><tr className="label text-left"><th className="py-2">Zone</th><th>Pays</th><th>Tarif</th><th>Délai</th></tr></thead>
              <tbody className="divide-y">
                {SHIPPING_ZONES.map((z) => <tr key={z.id}><td className="py-2 text-ink">{z.label}</td><td>{z.countries.join(", ")}</td><td className="tabular-nums">{formatPrice(z.rateCents)}</td><td>{z.delayDays[0]}–{z.delayDays[1]} j ouvrés</td></tr>)}
              </tbody>
            </table>
            <p>Livraison offerte dès {formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)} d&apos;achat. Colis expédiés sous 24 h ouvrées, numéro de suivi envoyé par e-mail.</p>
          </section>
          <section>
            <h2>Retours</h2>
            <p>14 jours après réception pour changer d&apos;avis, tant que le pot est scellé (pastille rouge intacte). Un pot ouvert ne peut pas être repris pour des raisons d&apos;hygiène. Frais de retour à votre charge ; remboursement sous 14 jours après réception.</p>
          </section>
        </LegalPage>
      </main>
      <Footer />
    </>
  );
}
