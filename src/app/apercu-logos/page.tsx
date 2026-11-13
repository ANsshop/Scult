import type { Metadata } from "next";
import Image from "next/image";
import { Wordmark } from "@/components/site/Wordmark";

/**
 * Page de travail, à supprimer une fois le logo choisi : les pistes de logo en
 * volume (rendues en 3D par scripts/3d/render_logo.py), chacune sur clair, sur
 * bleu et dans une barre de navigation. Non indexée, absente du sitemap.
 */
export const metadata: Metadata = { title: "Aperçu des logos", robots: { index: false, follow: false } };

const IMG = {
  marbre: { src: "/logo-apercu/marbre.webp", w: 1400, h: 351, alt: "SCULT en lettres de marbre" },
  laque: { src: "/logo-apercu/laque.webp", w: 1400, h: 343, alt: "SCULT en lettres bleues laquées, avec un point de cire rouge" },
  sceau: { src: "/logo-apercu/sceau.webp", w: 700, h: 720, alt: "Cachet de cire rouge frappé d'un S" },
};
type Key = keyof typeof IMG;

function Pic({ k, className }: { k: Key; className: string }) {
  const i = IMG[k];
  return <Image src={i.src} alt={i.alt} width={i.w} height={i.h} className={className} />;
}

const PROPOSALS: { n: string; name: string; note: string; word: Key; seal?: boolean }[] = [
  { n: "1", name: "Le marbre", note: "Le mot taillé dans le marbre de la statue : veines, piqûres, arêtes adoucies.", word: "marbre" },
  { n: "2", name: "Le marbre et le sceau", note: "Le même mot, signé d'un cachet de cire rouge frappé d'un S — la pastille du pot devient l'emblème.", word: "marbre", seal: true },
  { n: "3", name: "La laque", note: "Le mot en bleu laqué, brillant, fermé par un point de cire rouge.", word: "laque" },
];

export default function Page() {
  return (
    <main>
      {PROPOSALS.map((p) => (
        <section key={p.n} className="border-b border-ink">
          <div className="bg-ink px-5 py-4 text-marble md:px-10">
            <p className="label">Piste {p.n} — {p.name}</p>
            <p className="mt-1 text-sm text-marble/70">{p.note}</p>
          </div>
          <div className="grid md:grid-cols-3">
            {["bg-klein", "bg-marble", "bg-ink"].map((bg) => (
              <div key={bg} className={`flex min-h-64 items-center justify-center gap-5 px-8 py-12 ${bg}`}>
                {p.seal && <Pic k="sceau" className="flash-shadow h-auto w-[22%]" />}
                <Pic k={p.word} className={`flash-shadow h-auto ${p.seal ? "w-[68%]" : "w-[82%]"}`} />
              </div>
            ))}
          </div>
          {/* En situation : la barre de navigation, sur bleu et sur clair */}
          <div className="grid gap-4 bg-white px-5 py-6 md:grid-cols-2 md:px-10">
            {[["bg-klein text-marble", ""], ["bg-marble text-ink", ""]].map(([cls], i) => (
              <div key={i} className={`flex h-14 items-center justify-between rounded-full px-6 ${cls}`}>
                <span className="flex items-center gap-2">
                  {p.seal && <Pic k="sceau" className="h-8 w-8" />}
                  <Pic k={p.word} className="h-6 w-auto" />
                </span>
                <span className="label hidden gap-6 sm:flex"><span>CRI</span><span>La formule</span><span>Méthode</span></span>
                <span className="label">Panier</span>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="border-b border-ink">
        <div className="bg-ink px-5 py-4 text-marble md:px-10">
          <p className="label">Le sceau seul</p>
          <p className="mt-1 text-sm text-marble/70">En icône d&apos;onglet, en avatar, en pastille sur un visuel.</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-10 bg-marble px-8 py-12">
          <Pic k="sceau" className="flash-shadow h-48 w-48" />
          <span className="flex h-24 w-24 items-center justify-center rounded-[26px] bg-klein"><Pic k="sceau" className="h-[4.5rem] w-[4.5rem]" /></span>
          <Pic k="sceau" className="h-12 w-12" />
          <Pic k="sceau" className="h-6 w-6" />
        </div>
      </section>

      <section>
        <div className="bg-ink px-5 py-4 text-marble md:px-10">
          <p className="label">Piste 0 — L&apos;actuel</p>
          <p className="mt-1 text-sm text-marble/70">Pour comparer : le logo en blocs d&apos;aujourd&apos;hui.</p>
        </div>
        <div className="grid md:grid-cols-3">
          <div className="flex min-h-48 items-center justify-center bg-klein text-marble"><Wordmark className="h-14 w-auto" /></div>
          <div className="flex min-h-48 items-center justify-center bg-marble text-ink"><Wordmark className="h-14 w-auto" /></div>
          <div className="flex min-h-48 items-center justify-center bg-ink text-marble"><Wordmark className="h-14 w-auto" /></div>
        </div>
      </section>
    </main>
  );
}
