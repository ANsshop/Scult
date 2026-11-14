import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/ui/Container";
import { Corners } from "@/components/site/Corners";
import { JsonLd } from "@/components/site/JsonLd";
import { ButtonLink } from "@/components/ui/Button";
import { CLAIMS } from "@/lib/content/methode";
import { PRODUCT_INFO } from "@/lib/content/product-info";
import { DEFAULT_FLAVOUR, getFlavour } from "@/lib/content/flavours";
import { breadcrumbJsonLd } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Performance — ce que la formule de CRI apporte à l'entraînement",
  description: "Créatine 3 g, citrulline 8 g, bêta-alanine 3,2 g, 390 mg de caféine : la formule de CRI, ligne par ligne, avec chaque dose.",
  alternates: { canonical: "/methode" },
};

export default function MethodePage() {
  const info = PRODUCT_INFO.cri;
  const dos = getFlavour(DEFAULT_FLAVOUR).images[1];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "Performance", path: "/methode" }])} />
      <Header onBlue />
      <main>
        <section className="grain relative bg-klein text-marble">
          <Corners className="top-14" tl="Performance" tr="Par dose de 23 g" bl="Dix actifs, un complexe" br="Lot 001" />
          <Container className="py-24 md:py-36">
            <h1 className="display max-w-5xl text-[clamp(2.8rem,9vw,8.5rem)]">Pour les séries qui comptent.</h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-marble/90">
              3 g de créatine pour les capacités physiques sur les séries intenses, 8 g de citrulline, 3,2 g de bêta-alanine, 390 mg de caféine. La formule de CRI, ligne par ligne, avec chaque dose.
            </p>
          </Container>
        </section>

        <section className="border-b">
          <Container className="py-20 md:py-28">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Le bénéfice : la créatine, à sa dose */}
              {CLAIMS.map((c) => (
                <article key={c.id} className="flex flex-col rounded-card border p-6 md:p-8">
                  <p className="label text-ruby">{c.ingredient}</p>
                  <p className="display mt-5 text-[clamp(1.6rem,2.6vw,2.4rem)] leading-[1.05]">{c.claim}</p>
                  <p className="mt-5 text-[0.95rem] leading-relaxed text-stone">{c.condition}</p>
                  <p className="label mt-auto pt-8 normal-case tracking-normal text-stone">
                    Source : <a href={c.url} target="_blank" rel="noopener" className="underline">{c.source}</a>
                  </p>
                </article>
              ))}
              {/* La formule, ligne par ligne : même tableau que la fiche produit et le dos du pot */}
              {info && (
                <article className="rounded-card border p-6 md:p-8">
                  <p className="label text-ruby">La formule · {info.serving.toLowerCase()}</p>
                  <ul className="mt-5 divide-y tabular-nums">
                    {info.nutrition.map((n) => (
                      <li key={n.name} className="flex items-baseline justify-between gap-4 py-2.5"><span>{n.name}</span><span className="display text-lg text-klein">{n.amount}</span></li>
                    ))}
                  </ul>
                  {info.blend && (
                    <div className="mt-5 rounded-chip bg-ink p-5 text-marble">
                      <p className="flex items-baseline justify-between gap-4"><span className="display text-lg">{info.blend.name}</span><span className="display text-lg tabular-nums">{info.blend.amount}</span></p>
                      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-[0.9rem] text-marble/85 sm:grid-cols-2">
                        {info.blend.items.map((i) => (
                          <li key={i.name} className="flex justify-between gap-3"><span>{i.name}</span>{i.amount && <span className="tabular-nums">{i.amount}</span>}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </article>
              )}
            </div>
            <ButtonLink href="/produits/cri" variant="ink" className="mt-10">Voir CRI · la fiche complète</ButtonLink>
          </Container>
        </section>

        <section className="border-b">
          <Container className="grid gap-10 py-20 md:grid-cols-2 md:gap-16 md:py-28">
            <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-klein">
              <Image src={dos.url} alt={dos.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="md:py-10">
              <p className="label text-stone">Transparence</p>
              <h2 className="display mt-4 text-[clamp(2rem,5vw,4rem)]">Le tableau au dos. Le lot sur le pot.</h2>
              <dl className="mt-10 divide-y border-y">
                {[
                  ["Composition", "Dix actifs dans le tableau, chacun avec sa quantité par dose, et un complexe Focus de sept ingrédients."],
                  ["Traçabilité", "Numéro de lot imprimé sur chaque pot. Sur demande, la fiche d'analyse du lot."],
                  ["Fabrication", "Façonnage chez un fabricant certifié, lots numérotés."],
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
