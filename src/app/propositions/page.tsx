import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { visuel } from "@/lib/content/visuels";

export const metadata: Metadata = {
  title: "Propositions — autres tons pour la statue",
  robots: { index: false, follow: false },
};

/**
 * Page de travail, hors navigation : trois propositions d'images de la statue
 * dans d'autres tons que le mur bleu au flash, montées comme elles le seraient
 * sur le site. À supprimer une fois le choix fait (docs/DA.md).
 */
const PROPOSITIONS = [
  {
    n: 1,
    nom: "Nuit",
    // Retenue le 2026-11-14, avec le pot dans la main droite et le regard baissé vers lui, sans le mot « FOCUS ».
    image: visuel("nuit-16x9"),
    alt: "La statue de marbre vue de dos sur fond noir, le regard baissé vers le pot SCULT CRI qu'elle tient dans la main droite",
    position: "100% 30%",
    dark: true,
    label: "CRI · le pré-workout SCULT",
    titre: "La tête d'abord.",
    ou: "Version retenue : de dos, le pot dans la main droite, le regard vers le pot. Reste à choisir sa place : hero, slider du bas, ou en-tête de la page Performance.",
  },
  {
    n: 2,
    nom: "Regard",
    image: "/propositions/regard-2.webp",
    alt: "Très gros plan en noir et blanc du visage de la statue, coupé par le bord, une pastille rouge à la tempe",
    position: "10% 40%",
    dark: false,
    droite: true,
    label: "CRI · le pré-workout SCULT",
    titre: "Rien ne se sculpte en silence.",
    ou: "Refaite en vraie photo argentique noir et blanc (pierre mate, grain). Une troisième slide du hero, ou l'ouverture de la FAQ.",
  },
  {
    n: 3,
    nom: "Par-dessus le bras",
    image: "/propositions/bras-2.webp",
    alt: "La statue fixe l'objectif par-dessus son avant-bras, strap rouge au poignet, drapé bleu derrière",
    position: "30% 40%",
    dark: true,
    bas: true,
    label: "20 à 30 minutes avant la séance",
    titre: "Avant la barre.",
    ou: "Refaite en vraie photo, pierre érodée et lumière de fin de journée. La slide « mode d'emploi » du slider du bas, ou une bannière entre deux sections.",
  },
];

export default function PropositionsPage() {
  return (
    <>
      <Header />
      <main>
        <section className="px-5 pb-10 pt-10 md:px-10 md:pt-14">
          <p className="label text-stone">Propositions · 14 novembre 2026</p>
          <h1 className="display mt-4 max-w-4xl text-[clamp(2.2rem,6vw,5rem)]">Trois autres tons pour la statue.</h1>
          <p className="mt-5 max-w-2xl leading-relaxed text-stone">
            Même personnage, mais plus seulement le mur bleu au flash : une image de nuit, un très gros plan en noir et blanc, un regard par-dessus le bras. Chacune est montée comme elle le serait sur le site.
          </p>
        </section>

        {PROPOSITIONS.map((p) => (
          <section key={p.n} className="border-t">
            <div className={`relative aspect-[4/5] overflow-hidden md:aspect-auto md:h-[86svh] ${p.dark ? "bg-ink text-marble" : "bg-white text-ink"}`}>
              <Image src={p.image} alt={p.alt} fill sizes="100vw" style={{ objectPosition: p.position }} className="object-cover" />
              <div
                className={`absolute flex-col p-5 md:p-10 ${p.droite ? "hidden md:flex" : "flex"} ${p.bas ? "inset-x-0 bottom-0 [text-shadow:0_1px_2px_rgb(11_11_15/0.6),0_0_24px_rgb(11_11_15/0.5)] md:max-w-[52%]" : p.droite ? "inset-x-0 bottom-0 md:inset-y-0 md:left-auto md:right-0 md:w-[40%] md:justify-center" : "inset-x-0 bottom-0 md:max-w-[40%]"}`}
              >
                <p className={`label ${p.dark ? "text-marble" : "text-stone"}`}>{p.label}</p>
                <p className="display mt-3 text-[clamp(1.7rem,4.2vw,4rem)]">{p.titre}</p>
              </div>
            </div>
            {/* Téléphone : le visage remplit l'image, le texte passe dessous, sur blanc */}
            {p.droite && (
              <div className="bg-white px-5 pb-2 pt-6 text-ink md:hidden">
                <p className="label text-stone">{p.label}</p>
                <p className="display mt-3 text-[1.9rem]">{p.titre}</p>
              </div>
            )}
            <div className="grid gap-2 px-5 py-6 md:grid-cols-[14rem_1fr] md:gap-10 md:px-10">
              <p className="display text-xl">Proposition {p.n} · {p.nom}</p>
              <p className="max-w-2xl leading-relaxed text-stone">{p.ou}</p>
            </div>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
