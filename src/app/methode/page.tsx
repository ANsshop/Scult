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
  title: "Méthode — ce que l'Europe autorise à dire sur la whey, la créatine et le collagène",
  description: "Les allégations santé autorisées (règlement UE 432/2012) pour la créatine et les protéines, et pourquoi il n'y en a aucune pour le collagène. Sources citées.",
  alternates: { canonical: "/methode" },
};

export default function MethodePage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Accueil", path: "/" }, { name: "Méthode", path: "/methode" }])} />
      <Header onBlue />
      <main>
        <section className="grain relative bg-klein text-marble">
          <Corners tl="Méthode" tr="Règlement (CE) 1924/2006" bl="Sources en bas de page" br="Mis à jour 10/2026" />
          <Container className="py-24 md:py-36">
            <h1 className="display max-w-5xl text-[clamp(2.8rem,9vw,8.5rem)]">Ce qu&apos;on peut dire. Et pas.</h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-marble/90">
              En Europe, une marque de compléments ne peut écrire sur ses produits que les allégations santé évaluées par l&apos;EFSA et inscrites au registre. Tout le reste — les verbes qu&apos;on lit partout ailleurs — est interdit. On s&apos;en tient à la liste, et on la met sous vos yeux.
            </p>
          </Container>
        </section>

        <section className="border-b">
          <Container className="py-20 md:py-28">
            <div className="grid gap-px border bg-ink/15 lg:grid-cols-3">
              {CLAIMS.map((c) => (
                <article key={c.slug} className="flex flex-col bg-marble p-6 md:p-8">
                  <p className="label text-ruby">{c.product}</p>
                  <p className="display mt-5 text-[1.6rem] leading-[1.05]">« {c.claim} »</p>
                  <p className="mt-5 text-[0.95rem] leading-relaxed text-stone">{c.condition}</p>
                  <p className="label mt-auto pt-8 normal-case tracking-normal text-stone">
                    Source : <a href={c.url} target="_blank" rel="noopener" className="underline">{c.source}</a>
                  </p>
                  <ButtonLink href={`/produits/${c.slug}`} variant="outline" className="mt-6 self-start">Voir le produit</ButtonLink>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <section className="border-b">
          <Container className="grid gap-10 py-20 md:grid-cols-2 md:gap-16 md:py-28">
            <div className="relative aspect-[4/5] bg-klein">
              <Image src="/products/scult-15.webp" alt="Dos d'un pot SCULT : le tableau nutritionnel imprimé en noir et le numéro de lot" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="md:py-10">
              <p className="label text-stone">Ce qu&apos;on fait à la place</p>
              <h2 className="display mt-4 text-[clamp(2rem,5vw,4rem)]">Le tableau au dos. Le lot sur le pot.</h2>
              <dl className="mt-10 divide-y border-y">
                {[
                  ["Composition", "Un ingrédient par pot. Pas d'arôme, pas d'édulcorant, pas d'anti-agglomérant."],
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
