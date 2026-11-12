import Image from "next/image";
import Link from "next/link";
import { AddToCart } from "@/components/cart/AddToCart";
import { Container } from "@/components/ui/Container";
import type { Product } from "@/lib/catalog/queries";
import { CRI_DOSES, getFormula } from "@/lib/content/formula";
import { formatPrice } from "@/lib/utils";
import { REASSURANCE_STRIP } from "./Reassurance";
import { Reveal } from "./Reveal";

/**
 * Section 2 de l'accueil — l'offre. Boutique mono-produit : le prix et le
 * bouton d'achat arrivent dès le deuxième écran, à côté de la preuve (la
 * formule, quantité par quantité).
 *
 * Ordinateur : la carte d'achat reste collée à gauche pendant que la formule
 * défile à droite — le bouton ne quitte jamais l'écran. Mobile : visuel, prix
 * et bouton d'abord, la formule ensuite.
 */
export function Offer({ product }: { product: Product }) {
  const formula = getFormula(product.slug);
  if (!formula) return null;
  const perDose = formatPrice(Math.round(product.priceCents / CRI_DOSES));

  return (
    <section id="formule" className="scroll-mt-14 border-b">
      {/* Bande de réassurance : quatre cases à filets, juste sous le hero */}
      <div className="border-b">
        <Container>
          <ul aria-label="Garanties" className="grid grid-cols-2 lg:grid-cols-4">
            {REASSURANCE_STRIP.map(([title, text], i) => (
              <li key={title} className={`py-5 pr-4 lg:py-6 ${i % 2 ? "border-l pl-4" : ""} ${i > 1 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:border-l lg:pl-6" : ""} ${i % 2 ? "lg:pl-6" : ""}`}>
                <p className="label flex items-center gap-2"><span aria-hidden className="h-1.5 w-1.5 bg-ruby" />{title}</p>
                <p className="mt-2 text-sm leading-snug text-stone">{text}</p>
              </li>
            ))}
          </ul>
        </Container>
      </div>

      <Container className="grid gap-12 py-14 md:grid-cols-12 md:gap-x-6 md:py-24">
        {/* Carte d'achat */}
        <div className="md:col-span-4">
          <div className="md:sticky md:top-20">
            <Link href={`/produits/${product.slug}`} aria-label={`${product.name} — voir la fiche produit`} className="group relative block aspect-square overflow-hidden bg-klein md:aspect-auto md:h-[min(52svh,32rem)]">
              <Image
                src="/home/pot-4x5.webp"
                alt="Le pot SCULT CRI de face, posé sur un bloc de marbre devant un mur bleu"
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover object-[50%_40%] transition-transform duration-700 ease-(--ease-scult) group-hover:scale-[1.03]"
              />
              <span className="label absolute left-4 top-4 text-marble">CRI · Lot 001</span>
              <span className="label absolute right-4 top-4 text-marble">690 g · {CRI_DOSES} doses</span>
            </Link>
            <p className="label mt-6 text-stone">Pré-workout · fruits rouges</p>
            <div className="mt-2 flex items-end justify-between gap-6">
              <p className="display text-[clamp(3rem,5vw,4.25rem)] tabular-nums">{formatPrice(product.priceCents)}</p>
              <p className="label whitespace-nowrap pb-1.5 text-right leading-relaxed text-stone">
                {CRI_DOSES} doses<br />
                <span className="text-ink">{perDose} la dose</span>
              </p>
            </div>
            <AddToCart product={product} className="mt-5 w-full" />
            {formula.caffeineWarning && <p className="mt-3 text-[0.8rem] leading-snug text-stone">{formula.caffeineWarning}</p>}
            <Link href={`/produits/${product.slug}`} className="label mt-5 inline-block underline underline-offset-4 hover:text-klein">
              Ingrédients, mode d&apos;emploi, précautions →
            </Link>
          </div>
        </div>

        {/* La formule */}
        <div className="md:col-span-7 md:col-start-6">
          <Reveal>
            <p className="label text-stone">La formule · par dose de 23 g</p>
            <h2 className="display mt-5 text-[clamp(2.3rem,5vw,4.5rem)]">Ce qu&apos;il y a dedans. Au gramme près.</h2>
            <p className="mt-6 max-w-xl leading-relaxed text-stone">
              Sept actifs, sept quantités. Aucune n&apos;est fondue dans un « mélange » dont on tairait les proportions : ce que vous lisez ici est imprimé sur le pot.
            </p>
          </Reveal>

          <ol className="mt-10 border-t border-ink">
            {formula.main.map((line, i) => (
              <li key={line.name} className="border-b">
                <Reveal delay={i * 0.04} className="grid grid-cols-[6.5rem_1fr] items-baseline gap-x-4 py-5 md:grid-cols-[9.5rem_1fr] md:gap-x-6 md:py-6">
                  <p className="flex items-baseline gap-1.5">
                    <span className="display text-[clamp(2.6rem,4.4vw,4rem)] tabular-nums">{line.value}</span>
                    <span className="label !text-[0.8rem] text-stone">{line.unit}</span>
                  </p>
                  <div>
                    <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <span className="text-lg font-medium">{line.name}</span>
                      <span className={`label ${line.claim ? "text-ruby" : "text-stone/80"}`}>{line.claim ? "Allégation autorisée" : "Sans allégation"}</span>
                    </p>
                    {line.note && <p className="mt-1.5 max-w-lg text-[0.95rem] leading-relaxed text-stone">{line.note}</p>}
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>

          <dl className="mt-6 grid gap-x-10 sm:grid-cols-2">
            {formula.rest.map((line) => (
              <div key={line.name} className="flex items-baseline justify-between gap-4 border-b py-3 text-sm">
                <dt>{line.name}</dt>
                <dd className="shrink-0 tabular-nums text-stone">{line.amount}{line.nrv ? ` · ${line.nrv} VNR` : ""}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[0.8rem] leading-relaxed text-stone">
            VNR : valeurs nutritionnelles de référence. « Sans allégation » : l&apos;Europe n&apos;autorise aucune allégation santé pour cet ingrédient dans un complément alimentaire, donc on donne sa quantité et rien d&apos;autre.{" "}
            <Link href="/methode" className="underline underline-offset-2 hover:text-klein">Lire la méthode</Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
