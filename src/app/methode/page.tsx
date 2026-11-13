import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/ui/Container";
import { Corners } from "@/components/site/Corners";
import { JsonLd } from "@/components/site/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { CLAIMS } from "@/lib/content/methode";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Performance — ce que la formule de CRI apporte à l'entraînement",
  description: "Créatine 3 g, potassium, vitamines B5 et B6 : les bénéfices de la formule CRI, actif par actif, avec la dose et la source.",
  alternates: { canonical: "/methode" },
};

export default function MethodePage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "Performance", path: "/methode" }])} />
      <Header onBlue />
      <main>
        <section className="grain relative bg-klein text-marble">
          <Corners className="top-14" tl="Performance" tr="Par dose de 23 g" bl="Source sous chaque bénéfice" br="Lot 001" />
          <Container className="py-24 md:py-36">
            <h1 className="display max-w-5xl text-[clamp(2.8rem,9vw,8.5rem)]">Pour les séries qui comptent.</h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-marble/90">
              Ce que la formule de CRI apporte à l&apos;entraînement, actif par actif : capacités physiques, muscle, énergie, fatigue. Chaque bénéfice est rattaché à sa dose et à sa source.
            </p>
          </Container>
        </section>

        <section className="border-b">
          <Container className="py-20 md:py-28">
            <div className="grid gap-4 lg:grid-cols-2">
              {CLAIMS.map((c) => (
                <article key={c.id} className="flex flex-col rounded-card border p-6 md:p-8">
                  <p className="label text-ruby">{c.ingredient}</p>
                  <p className="display mt-5 text-[1.6rem] leading-[1.05]">{c.claim}</p>
                  <p className="mt-5 text-[0.95rem] leading-relaxed text-stone">{c.condition}</p>
                  <p className="label mt-auto pt-8 normal-case tracking-normal text-stone">
                    Source : <a href={c.url} target="_blank" rel="noopener" className="underline">{c.source}</a>
                  </p>
                </article>
              ))}
            </div>
            <ButtonLink href="/produits/cri" variant="ink" className="mt-10">Voir CRI · la fiche complète</ButtonLink>
          </Container>
        </section>

        <section className="border-b">
          <Container className="grid gap-10 py-20 md:grid-cols-2 md:gap-16 md:py-28">
            <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-klein">
              <Image src="/products/cri-02.webp" alt="Dos du pot SCULT CRI : tableau nutritionnel, liste d'ingrédients, conseils d'utilisation et précautions d'emploi" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="md:py-10">
              <p className="label text-stone">Transparence</p>
              <h2 className="display mt-4 text-[clamp(2rem,5vw,4rem)]">Le tableau au dos. Le lot sur le pot.</h2>
              <dl className="mt-10 divide-y border-y">
                {[
                  ["Composition", "Onze lignes dans le tableau, chacune avec sa quantité par dose. Aucun mélange dont on tairait les proportions."],
                  ["Traçabilité", "Numéro de lot imprimé sur chaque pot. Sur demande, la fiche d'analyse du lot."],
                  ["Fabrication", "Façonnage dans l'Union européenne chez un fabricant certifié. Déclaration DGCCRF avant mise sur le marché."],
                  ["Mention", "Les compléments alimentaires ne remplacent pas une alimentation variée et équilibrée ni un mode de vie sain."],
                ].map(([t, b]) => (
                  <div key={t} className="grid gap-1.5 py-5 sm:grid-cols-[9rem_1fr] sm:gap-8">
                    <dt className="display text-lg">{t}</dt>
                    <dd className="leading-relaxed text-stone">{b}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
