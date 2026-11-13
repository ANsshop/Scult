import Image from "next/image";
import Link from "next/link";
import { AddToCart } from "@/components/cart/AddToCart";
import { Container } from "@/components/ui/Container";
import type { Product } from "@/lib/catalog/queries";
import { CRI_DOSES, getFormula } from "@/lib/content/formula";
import { formatPrice } from "@/lib/utils";
import { Reassurance } from "./Reassurance";

/**
 * Section 2 de l'accueil — simple : la carte produit d'un côté, la formule
 * en liste de l'autre.
 *
 * La carte produit est la seule pièce « dessinée » : le pot détouré, penché,
 * avec l'ombre dure du flash, le prix dans sa pastille rouge et le bouton
 * d'achat. Le reste est du texte. Mobile : la carte d'abord, la liste ensuite.
 */
export function Offer({ product }: { product: Product }) {
  const formula = getFormula(product.slug);
  if (!formula) return null;
  const perDose = formatPrice(Math.round(product.priceCents / CRI_DOSES));

  return (
    <section id="formule" className="scroll-mt-14 border-b">
      <Container className="grid gap-12 py-14 md:grid-cols-2 md:items-center md:gap-20 md:py-24">
        {/* La carte produit */}
        <div className="relative flex flex-col rounded-card bg-white p-5 md:p-8">
          <p className="label flex justify-between text-stone">
            <span>CRI · Lot 001</span>
            <span>690 g · {CRI_DOSES} doses</span>
          </p>
          <div className="flex items-center justify-center py-8 md:py-10">
            <div className="relative w-[72%] md:w-[68%]">
              <Link href={`/produits/${product.slug}`} aria-label={`${product.name} — voir la fiche produit`} className="block">
                <Image
                  src="/home/pot-detoure.webp"
                  alt="Le pot SCULT CRI de face : le mot CRI en bleu sur le visage d'une statue qui hurle, strap rouge autour du couvercle"
                  width={900}
                  height={1096}
                  sizes="(min-width: 768px) 32vw, 70vw"
                  className="flash-shadow h-auto w-full -rotate-[5deg] transition-transform duration-500 ease-(--ease-scult) hover:-rotate-[2deg]"
                />
              </Link>
              {/* La pastille : le seul rouge, et c'est le prix */}
              <p className="absolute -right-[17%] top-[6%] flex h-[6.5rem] w-[6.5rem] rotate-[9deg] flex-col items-center justify-center rounded-full bg-ruby text-white outline outline-1 -outline-offset-[5px] outline-white/45 md:h-[7.5rem] md:w-[7.5rem]">
                <span className="display text-[2rem] tabular-nums md:text-[2.3rem]">{formatPrice(product.priceCents)}</span>
                <span className="label mt-1 !text-[0.6rem]">{CRI_DOSES} doses</span>
              </p>
            </div>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="display text-[2.25rem] leading-none">{product.name}</p>
              <p className="label mt-2 text-stone">Pré-workout · fruits rouges</p>
            </div>
            <p className="label text-right text-stone">{perDose}<br />la dose</p>
          </div>
          <AddToCart product={product} className="mt-5 !h-14 w-full" />
          {formula.caffeineWarning && <p className="mt-4 text-[0.8rem] leading-snug text-stone">{formula.caffeineWarning}</p>}
        </div>

        {/* La formule, en liste */}
        <div>
          <p className="label text-stone">La formule · par dose de 23 g</p>
          <h2 className="display mt-4 text-[clamp(2rem,3.6vw,3.25rem)]">Ce qu&apos;il y a dedans.</h2>
          <dl className="mt-8 border-t">
            {formula.main.map((line) => (
              <div key={line.name} className="flex items-baseline justify-between gap-6 border-b py-3.5">
                <dt>{line.name}</dt>
                <dd className="font-medium tabular-nums">{line.amount}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-stone">
            Et aussi : {formula.rest.map((l) => `${l.name.toLowerCase().replace("vitamine b", "vitamine B")} ${l.amount}`).join(", ")}.
          </p>
          <Link href={`/produits/${product.slug}`} className="label mt-6 inline-block underline underline-offset-4 hover:text-klein">
            Voir la fiche complète →
          </Link>
          <Reassurance className="mt-10" />
        </div>
      </Container>
    </section>
  );
}
