import Image from "next/image";
import Link from "next/link";
import { AddToCart } from "@/components/cart/AddToCart";
import { Container } from "@/components/ui/Container";
import type { Product } from "@/lib/catalog/queries";
import { CRI_DOSES, getFormula } from "@/lib/content/formula";
import { formatPrice } from "@/lib/utils";
import { REASSURANCE_ITEMS } from "./Reassurance";

const LID = "Rien ne se sculpte en silence.";

/** Place de chaque dosage autour de la carte produit (ordinateur). */
const PLACE: Record<string, string> = {
  "L-citrulline": "md:col-start-1 md:row-start-1",
  "Bêta-alanine": "md:col-start-1 md:row-start-2",
  "Créatine": "md:col-start-1 md:row-start-3 md:row-span-2",
  "L-tyrosine": "md:col-start-3 md:row-start-1",
  "Taurine": "md:col-start-3 md:row-start-2",
  "L-théanine": "md:col-start-3 md:row-start-3",
  "Caféine": "md:col-start-3 md:row-start-4",
};

/**
 * Section 2 de l'accueil — le pot au centre, ce qu'il contient autour.
 *
 * La carte produit est la pièce maîtresse : le pot détouré, penché, avec
 * l'ombre dure du flash, le prix dans sa pastille rouge et le bouton d'achat.
 * Les sept dosages l'entourent, une carte arrondie par actif, la quantité
 * collée au nom. La créatine, seule à porter une allégation autorisée, est la
 * carte bleue. Mobile : la carte produit d'abord, les dosages en liste.
 */
export function Offer({ product }: { product: Product }) {
  const formula = getFormula(product.slug);
  if (!formula) return null;
  const perDose = formatPrice(Math.round(product.priceCents / CRI_DOSES));

  return (
    <section id="formule" className="scroll-mt-14 border-b">
      {/* Le bord du couvercle */}
      <div aria-hidden className="overflow-hidden bg-ink text-marble">
        <p className="lid-line label flex w-max whitespace-nowrap py-3">
          {Array.from({ length: 16 }, (_, i) => <span key={i} className="px-4">{LID} ·</span>)}
        </p>
      </div>

      <Container className="py-14 md:py-24">
        <div className="grid gap-6 md:grid-cols-[1.6fr_1fr] md:items-end md:gap-16">
          <div>
            <p className="label text-stone">La formule · par dose de 23 g</p>
            <h2 className="display mt-5 text-[clamp(2.4rem,5.2vw,5rem)]">Ce qu&apos;il y a dedans. Au gramme près.</h2>
          </div>
          <p className="max-w-md leading-relaxed text-stone md:pb-2">
            Sept actifs, sept quantités. Rien n&apos;est fondu dans un « mélange » dont on tairait les proportions : ce que vous lisez ici est imprimé sur le pot.
          </p>
        </div>

        <div className="mt-10 grid gap-3 md:mt-14 md:grid-cols-[1fr_1.3fr_1fr] md:grid-rows-[repeat(4,minmax(0,1fr))] md:gap-4">
          {/* La carte produit */}
          <div className="relative flex flex-col rounded-card bg-white p-5 md:col-start-2 md:row-span-4 md:row-start-1 md:p-7">
            <p className="label flex justify-between text-stone">
              <span>CRI · Lot 001</span>
              <span>690 g · {CRI_DOSES} doses</span>
            </p>
            <div className="flex flex-1 items-center justify-center py-8 md:py-6">
            <div className="relative w-[72%] md:w-[80%]">
              <Link href={`/produits/${product.slug}`} aria-label={`${product.name} — voir la fiche produit`} className="block">
                <Image
                  src="/home/pot-detoure.webp"
                  alt="Le pot SCULT CRI de face : le mot CRI en bleu sur le visage d'une statue qui hurle, strap rouge autour du couvercle"
                  width={900}
                  height={1096}
                  sizes="(min-width: 768px) 30vw, 70vw"
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
            <Link href={`/produits/${product.slug}`} className="label mt-3 inline-block self-start underline underline-offset-4 hover:text-klein">
              Voir la fiche complète →
            </Link>
          </div>

          {/* Les dosages, autour */}
          {formula.main.map((line) => (
            <div
              key={line.name}
              className={`flex items-center gap-4 rounded-card p-5 md:flex-col md:items-start md:justify-between md:gap-6 md:p-6 ${line.claim ? "grain bg-klein text-marble" : "bg-white"} ${PLACE[line.name] ?? ""}`}
            >
              <p className="flex w-[5.75rem] shrink-0 items-baseline gap-1.5 md:w-auto">
                <span className={`display text-[2.6rem] tabular-nums ${line.claim ? "md:text-[clamp(5.5rem,9vw,8.5rem)]" : "text-klein md:text-[clamp(2.75rem,4.2vw,4rem)]"}`}>{line.value}</span>
                <span className={`label !text-[0.8rem] ${line.claim ? "text-marble/80" : "text-stone"}`}>{line.unit}</span>
              </p>
              <div>
                {line.claim && <p className="label mb-2 inline-block rounded-full bg-marble px-2.5 py-1 text-ink">Allégation autorisée</p>}
                <p className="display text-[1.15rem] leading-none md:text-[1.35rem]">{line.name}</p>
                {line.note && <p className={`mt-2 text-[0.9rem] leading-snug ${line.claim ? "text-marble/90" : "text-stone"}`}>{line.note}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Le reste de la dose et les garanties */}
        <ul className="mt-3 grid gap-3 md:mt-4 md:grid-cols-4 md:gap-4">
          <li className="rounded-card bg-white p-5 md:p-6">
            <p className="label text-stone">Et aussi, par dose</p>
            <p className="mt-2 text-sm leading-snug">
              {formula.rest.map((l) => `${l.name.replace(/ \(vitamine B5\)/, "")} ${l.amount}`).join(" · ")}
            </p>
          </li>
          {REASSURANCE_ITEMS.map(([title, text]) => (
            <li key={title} className="rounded-card bg-white p-5 md:p-6">
              <p className="label flex items-center gap-2"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ruby" />{title}</p>
              <p className="mt-2 text-sm leading-snug text-stone">{text}</p>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-[0.8rem] leading-relaxed text-stone">
          Hors créatine, l&apos;Europe n&apos;autorise aucune allégation santé pour ces actifs dans un complément alimentaire : on donne leur quantité, rien d&apos;autre.{" "}
          <Link href="/methode" className="underline underline-offset-2 hover:text-klein">Lire la méthode</Link>
        </p>
      </Container>
    </section>
  );
}
