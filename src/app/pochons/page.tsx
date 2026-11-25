import type { Metadata } from "next";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { Pot3D } from "@/components/site/Pot3D";
import { BOITE_POCHONS } from "@/lib/content/modeles-3d";
import { HERO_POCHES, POCHONS } from "@/lib/content/site";

/**
 * L'annonce des pochons de caféine : la boîte en 3D, qu'on fait tourner, et ce
 * qu'on sait du produit. Pas une fiche produit — il n'est pas au catalogue, on
 * ne peut pas l'acheter — donc pas indexée et absente du sitemap.
 */
export const metadata: Metadata = {
  title: "Pochons de caféine — bientôt",
  description: "Les pochons de caféine SCULT : 200 mg par pochon, 30 pochons par boîte, goût fraise piquante. Bientôt disponible.",
  alternates: { canonical: "/pochons" },
  robots: { index: false, follow: true },
};

export default function PochonsPage() {
  return (
    <>
      <Header />
      <main>
        <Container className="grid items-center gap-8 py-10 md:grid-cols-2 md:gap-16 md:py-20">
          {/* Sur noir : la boîte est blanche, elle disparaîtrait sur le blanc de la page */}
          <div className="sombre rounded-card bg-fond p-6 md:p-12">
            <Pot3D model={BOITE_POCHONS} alt={POCHONS.alt3d} still="/models/boite-pochons-poster.webp" sizes="(min-width: 768px) 40vw, 90vw" orbit="-18deg 82deg 135%" className="mx-auto w-full max-w-[30rem]" />
            <p className="label mt-4 text-center text-discret">{POCHONS.hint}</p>
          </div>
          <div>
            <p className="label inline-block rounded-full bg-rose px-3 py-1 font-bold text-noir">{HERO_POCHES.badge}</p>
            <h1 className="display mt-5 text-[clamp(2.6rem,6.4vw,5.5rem)]">
              {HERO_POCHES.title.main}<br /><span className="text-rose">{HERO_POCHES.title.accent}</span>
            </h1>
            <p className="mt-6 max-w-md text-[1.02rem] leading-relaxed text-doux">{HERO_POCHES.text}</p>
            <dl className="mt-8 divide-y border-y">
              {POCHONS.facts.map((f) => (
                <div key={f.label} className="flex items-baseline justify-between gap-6 py-3.5">
                  <dt className="label text-discret">{f.label}</dt>
                  <dd className="font-bold">{f.value}</dd>
                </div>
              ))}
            </dl>
            <ButtonLink href={HERO_POCHES.cta.href} className="mt-8 h-14 w-full md:w-auto md:px-10">{HERO_POCHES.cta.label}</ButtonLink>
            <p className="mt-5 text-[0.9rem] text-doux">{POCHONS.status}</p>
            <p className="label mt-6 !text-[0.5625rem] leading-relaxed text-discret">{POCHONS.legal}</p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
