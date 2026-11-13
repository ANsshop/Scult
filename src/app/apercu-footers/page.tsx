import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { FooterFruits } from "@/components/site/footers/FooterFruits";
import { FooterPot } from "@/components/site/footers/FooterPot";
import { FooterPoudre } from "@/components/site/footers/FooterPoudre";

/**
 * Page de travail, à supprimer une fois le footer choisi : les propositions
 * l'une sous l'autre, chacune précédée d'un bout de page pour voir le raccord.
 * Non indexée, absente du sitemap et du menu.
 */
export const metadata: Metadata = { title: "Aperçu des footers", robots: { index: false, follow: false } };

const PROPOSALS = [
  { n: "1", name: "La poudre", note: "Mur bleu lumineux, nuage de poudre rose, la signature en grand.", el: <FooterPoudre /> },
  { n: "2", name: "Les fruits rouges", note: "Un panneau arrondi : framboises, groseilles et poudre, SCULT en géant.", el: <FooterFruits /> },
  { n: "3", name: "La peinture et le pot", note: "Matière de peinture bleue, et le pot qui dépasse du haut du footer.", el: <FooterPot /> },
  { n: "0", name: "L'actuel", note: "Pour comparer : le footer en ligne aujourd'hui.", el: <Footer /> },
];

export default function Page() {
  return (
    <main>
      {PROPOSALS.map((p) => (
        <section key={p.n}>
          <div className="bg-ink px-5 py-4 text-marble md:px-10">
            <p className="label">Proposition {p.n} — {p.name}</p>
            <p className="mt-1 text-sm text-marble/70">{p.note}</p>
          </div>
          <div className="flex h-48 items-end px-5 pb-6 md:px-10">
            <p className="label text-stone">… fin de la page</p>
          </div>
          {p.el}
        </section>
      ))}
    </main>
  );
}
