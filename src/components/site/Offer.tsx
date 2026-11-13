import Image from "next/image";
import Link from "next/link";
import { AddToCart } from "@/components/cart/AddToCart";
import { Container } from "@/components/ui/Container";
import type { Product } from "@/lib/catalog/queries";
import { CRI_DOSES, getFormula } from "@/lib/content/formula";
import { formatPrice } from "@/lib/utils";

/**
 * Section 2 de l'accueil — simple : la grande carte produit, et à côté la
 * formule réduite à une petite liste.
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
      <Container className="grid gap-10 py-14 md:grid-cols-[1.55fr_1fr] md:items-center md:gap-16 md:py-24">
        {/* La carte produit */}
        <div className="relative flex flex-col rounded-card bg-white p-5 md:p-10">
          <p className="label flex justify-between text-stone">
            <span>CRI · Lot 001</span>
            <span>690 g · {CRI_DOSES} doses</span>
          </p>
          <div className="flex items-center justify-center py-8 md:py-12">
            <div className="relative w-[76%] md:w-[58%]">
              <Link href={`/produits/${product.slug}`} aria-label={`${product.name} — voir la fiche produit`} className="block">
                <Image
                  src="/home/pot-detoure.webp"
                  alt="Le pot SCULT CRI de face : le mot CRI en bleu sur le visage d'une statue qui hurle, strap rouge autour du couvercle"
                  width={900}
                  height={1096}
                  sizes="(min-width: 768px) 36vw, 76vw"
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
              <p className="display text-[2.25rem] leading-none md:text-[3.25rem]">{product.name}</p>
              <p className="label mt-2 text-stone">Pré-workout · fruits rouges</p>
            </div>
            <p className="label text-right text-stone">{perDose}<br />la dose</p>
          </div>
          <AddToCart product={product} className="mt-5 !h-14 w-full" />
          <p className="label mt-4 text-center leading-relaxed text-stone">Livraison Europe 2–8 jours · Retour 14 jours · Paiement Stripe</p>
          {formula.caffeineWarning && <p className="mt-3 text-center text-[0.8rem] leading-snug text-stone">{formula.caffeineWarning}</p>}
        </div>

        {/* La formule : une petite liste, rien d'autre */}
        <div>
          <p className="label text-stone">La formule · par dose de 23 g</p>
          <dl className="mt-5 border-t">
            {formula.main.map((line) => (
              <div key={line.name} className="flex items-baseline justify-between gap-6 border-b py-2.5 text-[0.95rem]">
                <dt>{line.name}</dt>
                <dd className="font-medium tabular-nums">{line.amount}</dd>
              </div>
            ))}
          </dl>
          <Link href={`/produits/${product.slug}`} className="label mt-5 inline-block underline underline-offset-4 hover:text-klein">
            Voir la fiche complète →
          </Link>
        </div>
      </Container>
    </section>
  );
}
