import type { Metadata } from "next";
import { Footer } from "@/components/site/Footer";
import { FooterDalle } from "@/components/site/footers/FooterDalle";
import { FooterMur } from "@/components/site/footers/FooterMur";
import { FooterPieds } from "@/components/site/footers/FooterPieds";

/**
 * Page de travail, à supprimer une fois le footer choisi : les propositions
 * l'une sous l'autre, chacune précédée d'un bout de page pour voir le raccord.
 * Non indexée, absente du sitemap et du menu.
 */
export const metadata: Metadata = { title: "Aperçu des footers", robots: { index: false, follow: false } };

const PROPOSALS = [
  { n: "1", name: "Le pied de page", note: "Les pieds de la statue sur son socle, la signature en grand.", el: <FooterPieds /> },
  { n: "2", name: "Le mur", note: "Un panneau arrondi : le mur peint, la craie, SCULT en géant.", el: <FooterMur /> },
  { n: "3", name: "La dalle", note: "Le footer clair : marbre, craie, strap rouge, SCULT imprimé en bleu.", el: <FooterDalle /> },
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
          <div className="flex h-40 items-end px-5 pb-6 md:px-10">
            <p className="label text-stone">… fin de la page</p>
          </div>
          {p.el}
        </section>
      ))}
    </main>
  );
}
