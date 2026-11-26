import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PochonsGallery } from "@/components/site/PochonsGallery";
import { REASSURANCE_ITEMS } from "@/components/site/Reassurance";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ToggleArrow } from "@/components/ui/ToggleArrow";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { POCHONS, pochonsImage } from "@/lib/content/pochons";

/**
 * La fiche des pochons de caféine. Elle reprend la mise en page de la fiche
 * du pré-workout (components/site/ProductPage.tsx) — galerie à gauche, bloc
 * d'achat à droite, volets, bande noire — mais elle est écrite à la main : le
 * produit n'est pas au catalogue du socle, il n'a ni prix ni référence. Le
 * bloc d'achat est donc en attente (« Me prévenir »), sans panier.
 *
 * Tant que c'est le cas : pas indexée, absente du sitemap, pas de données
 * structurées « produit ». Le jour où les pochons entrent au catalogue avec
 * le slug `pochons`, supprimer ce dossier : la route `[slug]` prend le relais.
 */
export const metadata: Metadata = {
  title: POCHONS.seo.title,
  description: POCHONS.seo.description,
  alternates: { canonical: POCHONS.path },
  robots: { index: false, follow: true },
};

const SUMMARY = "flex cursor-pointer list-none items-center justify-between font-bold [&::-webkit-details-marker]:hidden";
const BODY = "mt-4 text-[0.95rem] leading-relaxed text-doux";

/** Un texte qui manque : affiché tel quel, en pointillés roses, pour qu'on ne le prenne pas pour du contenu. */
function Todo({ children, className = "" }: { children: string; className?: string }) {
  return <span className={`label inline-block rounded-chip border border-dashed border-rose px-2.5 py-1 text-texte ${className}`}>{children}</span>;
}

export default function PochonsPage() {
  const { offer, composition, ingredients, usage, delivery, making, band, other } = POCHONS;
  const livraison = FAQ_ITEMS.find((i) => i.question === "Quels sont les délais et tarifs de livraison ?")?.answer ?? "";
  // La garantie « pot scellé » est celle du pré-workout : elle ne vaut pas pour une boîte de pochons
  const garanties = REASSURANCE_ITEMS.filter(([t]) => t !== "Pot scellé");
  return (
    <>
      <Header />
      <main>
        <Container className="grid gap-10 pb-20 pt-8 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] md:gap-16 md:pb-28 md:pt-14">
          {/* La colonne de droite est la plus longue : c'est la galerie qui reste à l'écran pendant qu'on la lit */}
          <div className="min-w-0 md:sticky md:top-28 md:self-start"><PochonsGallery /></div>
          <div id="commander" className="min-w-0 scroll-mt-28">
            <p className="flex flex-wrap items-center gap-3">
              <span className="label text-discret">{POCHONS.eyebrow}</span>
              <span className="label rounded-full bg-rose px-2.5 py-0.5 font-bold text-noir">{POCHONS.badge}</span>
            </p>
            <h1 className="display mt-4 text-[clamp(2.2rem,4.4vw,4.4rem)]">
              {POCHONS.name.main}<br /><span className="text-rose">{POCHONS.name.accent}</span>
            </h1>
            <p className="mt-6"><Todo className="!text-[0.8rem]">{POCHONS.price}</Todo></p>
            <p className="mt-6 max-w-md leading-relaxed text-doux">{POCHONS.text}</p>
            <p className="mt-6 rounded-chip border border-rose px-4 py-3 text-sm">{POCHONS.warning}</p>

            {/* Le bloc d'achat, en attente : la boîte, son contenu, et le bouton pour être prévenu */}
            <div className="mt-8 overflow-hidden rounded-card shadow-[0_0_0_2px_var(--color-rose)]">
              <div className="flex items-center gap-4 p-4">
                <span className="sombre relative h-20 w-20 shrink-0 overflow-hidden rounded-chip bg-fond">
                  <Image src={pochonsImage("face", 600)} alt="" fill sizes="80px" className="object-contain p-2" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="display whitespace-nowrap text-[1.35rem] leading-none">{offer.title}</span>
                    <span className="label rounded-full border border-texte/30 px-2.5 py-0.5">{offer.state}</span>
                  </span>
                  <span className="mt-2 block text-[0.82rem] leading-snug text-doux">{offer.detail}</span>
                </span>
              </div>
              <div className="border-t p-4">
                <ButtonLink href={offer.cta.href} className="!h-14 w-full">{offer.cta.label}</ButtonLink>
                <p className="mt-3 text-[0.85rem] leading-snug text-doux">{offer.note}</p>
                <p className="mt-3"><Todo>{offer.date}</Todo></p>
              </div>
            </div>

            <ul aria-label="Garanties" className="mt-8 space-y-3">
              {garanties.map(([t, b]) => (
                <li key={t} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose" />
                  <p><strong className="font-medium">{t}.</strong> <span className="text-doux">{b}</span></p>
                </li>
              ))}
            </ul>

            <div className="mt-10 divide-y border-y">
              <details className="group py-5" open>
                <summary className={SUMMARY}>{composition.title}<ToggleArrow /></summary>
                <div className={BODY}>
                  <table className="w-full text-left tabular-nums">
                    <thead>
                      <tr className="label border-b border-texte text-texte"><th className="py-2 font-normal">{composition.head}</th><th className="py-2 text-right font-normal">Quantité</th></tr>
                    </thead>
                    <tbody>
                      {composition.rows.map((r) => (
                        <tr key={r.name} className="border-b"><td className="py-2 text-texte">{r.name}</td><td className="py-2 text-right">{r.amount}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-4"><Todo>{composition.todo}</Todo></p>
                </div>
              </details>
              <details className="group py-5">
                <summary className={SUMMARY}>{ingredients.title}<ToggleArrow /></summary>
                <div className={BODY}><Todo>{ingredients.todo}</Todo></div>
              </details>
              <details className="group py-5">
                <summary className={SUMMARY}>{usage.title}<ToggleArrow /></summary>
                <div className={BODY}>
                  <p>{usage.text}</p>
                  <p className="mt-3"><Todo>{usage.todo}</Todo></p>
                  <p className="mt-3">{POCHONS.warning} {usage.warnings}</p>
                </div>
              </details>
              <details className="group py-5">
                <summary className={SUMMARY}>{delivery.title}<ToggleArrow /></summary>
                <div className={BODY}><p>{livraison}</p></div>
              </details>
              <details className="group py-5">
                <summary className={SUMMARY}>{making.title}<ToggleArrow /></summary>
                <div className={BODY}><Todo>{making.todo}</Todo></div>
              </details>
            </div>
          </div>
        </Container>

        {/* La bande noire : le produit en quatre chiffres, et son goût en rose */}
        <section aria-labelledby="pochons-titre" className="sombre bg-fond text-texte">
          <Container className="py-20 md:py-28">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-16">
              <div>
                <p className="label text-discret">{band.eyebrow}</p>
                <h2 id="pochons-titre" className="display mt-4 text-[clamp(2.6rem,7.4vw,6.25rem)]">
                  {band.title.main}<br /><span className="text-rose">{band.title.accent}</span>
                </h2>
              </div>
              <p className="max-w-md text-[1.02rem] leading-relaxed text-doux md:pb-3 md:text-right">{band.text}</p>
            </div>
            {/* Cinq cases en ligne à partir de 1024 px seulement : plus étroit, « piquante » sortirait de la sienne */}
            <ul className="mt-10 grid grid-cols-2 gap-3 md:mt-14 md:gap-4 lg:grid-cols-5">
              {band.figures.map((f) => (
                <li key={f.label} className="carte-reflet flex min-h-[9.5rem] flex-col rounded-card border bg-surface p-4 md:p-6 lg:min-h-[12.5rem]">
                  <span className="display mt-auto text-[2.6rem] leading-[0.9] tabular-nums md:text-[3.6rem] lg:text-[clamp(2.4rem,3.6vw,3.6rem)]">
                    {f.value}{f.unit && <span className="ml-1.5 text-[0.4em]">{f.unit}</span>}
                  </span>
                  <span className="label mt-3 text-doux">{f.label}</span>
                </li>
              ))}
              <li className="col-span-2 flex min-h-[7.5rem] flex-col rounded-card bg-rose p-4 text-noir md:p-6 lg:col-span-1 lg:min-h-[12.5rem]">
                <span className="label font-bold">{band.flavour.label}</span>
                <span className="display mt-auto pt-4 text-[1.7rem] leading-[0.9] md:text-[2.2rem] lg:text-[clamp(1.2rem,1.9vw,1.9rem)]">{band.flavour.value}</span>
              </li>
            </ul>
          </Container>
        </section>

        {/* Le renvoi vers l'autre produit de la marque */}
        <section aria-labelledby="autre-titre" className="border-t">
          <Container className="grid items-center gap-8 py-16 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-16 md:py-24">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[18rem] overflow-hidden rounded-card border bg-white md:max-w-none">
              <Image src={other.image.src} alt={other.image.alt} fill sizes="(min-width: 768px) 22rem, 18rem" className="object-contain" />
            </div>
            <div>
              <p className="label text-discret">{other.eyebrow}</p>
              <h2 id="autre-titre" className="display mt-4 text-[clamp(2.6rem,6vw,5rem)]">{other.title}</h2>
              <p className="mt-5 max-w-md leading-relaxed text-doux">{other.text}</p>
              <ButtonLink href={other.cta.href} className="mt-7 h-14 w-full md:w-auto md:px-10">{other.cta.label}</ButtonLink>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
