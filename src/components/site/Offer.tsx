import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { AddToCart } from "@/components/cart/AddToCart";
import { Container } from "@/components/ui/Container";
import type { Product } from "@/lib/catalog/queries";
import { CRI_DOSES, getFormula } from "@/lib/content/formula";
import { formatPrice } from "@/lib/utils";
import { REASSURANCE_ITEMS } from "./Reassurance";

const LID = "Rien ne se sculpte en silence.";

/**
 * Section 2 de l'accueil — « l'affiche de la dose ».
 *
 * L'idée : la formule composée comme une affiche, avec les codes du pot.
 * Chaque quantité est écrite à la taille de son poids dans la dose (8 g est
 * huit fois plus gros que 1 g), en bleu, griffée de trois coups de ciseau
 * comme le mot CRI. Le pot détouré est posé en travers de la grille à filets,
 * penché, avec l'ombre dure du flash ; le prix est sa pastille rouge.
 *
 * Ordinateur : trois colonnes à filets — les chiffres, le pot (collé, avec le
 * bouton d'achat), les noms. Mobile : le pot et l'achat d'abord, l'affiche
 * ensuite, sur deux colonnes.
 */
export function Offer({ product }: { product: Product }) {
  const formula = getFormula(product.slug);
  if (!formula) return null;
  const perDose = formatPrice(Math.round(product.priceCents / CRI_DOSES));
  // --k : la taille d'un gramme. Réglée pour que « 8G » remplisse sa colonne.
  const scale = { "--k": "3.55vw", "--k-md": "calc((min(100vw, 1360px) - 5rem) / 3 / 11.9)" } as CSSProperties;

  return (
    <section id="formule" className="scroll-mt-14 border-b">
      {/* Le bord du couvercle */}
      <div aria-hidden className="overflow-hidden bg-ink text-marble">
        <p className="lid-line label flex w-max whitespace-nowrap py-3">
          {Array.from({ length: 16 }, (_, i) => <span key={i} className="px-4">{LID} ·</span>)}
        </p>
      </div>

      <Container>
        <div className="relative md:border-x" style={scale}>
          {/* Les deux filets verticaux de l'affiche */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-1/3 hidden border-l md:block" />
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-2/3 hidden border-l md:block" />

          {/* Ligne de métadonnées */}
          <div className="label grid grid-cols-2 border-b py-4 text-stone md:grid-cols-3 md:px-5">
            <p>La dose · 23 g</p>
            <p className="hidden md:block md:pl-5">CRI · pré-workout · fruits rouges</p>
            <p className="text-right md:pl-5 md:text-left"><span className="hidden md:inline">Fabriqué dans l&apos;UE · </span>Lot 001</p>
          </div>

          {/* Titre : il passe par-dessus le filet */}
          <div className="grid gap-6 border-b py-10 md:grid-cols-3 md:gap-0 md:py-14">
            <h2 className="display relative text-[clamp(2.5rem,5.4vw,5.25rem)] md:col-span-2 md:pl-5">
              Plus c&apos;est dosé, plus c&apos;est gros.
            </h2>
            <p className="max-w-md self-end leading-relaxed text-stone md:pl-8 md:pr-5">
              Chaque quantité est écrite à la taille de son poids dans la dose. Rien n&apos;est fondu dans un « mélange » dont on tairait les proportions : c&apos;est ce qui est imprimé sur le pot.
            </p>
          </div>

          <div className="relative">
            {/* Le pot et l'achat : dans le flux sur mobile, collés dans la colonne du milieu sur ordinateur */}
            <div className="relative z-10 border-b py-10 md:pointer-events-none md:absolute md:inset-y-0 md:left-1/3 md:w-1/3 md:border-b-0 md:py-0">
              <div className="md:pointer-events-auto md:sticky md:top-16 md:px-6 md:pb-8 md:pt-8">
                <div className="relative mx-auto w-[64%] md:ml-[-9%] md:w-[84%]">
                  <Link href={`/produits/${product.slug}`} aria-label={`${product.name} — voir la fiche produit`} className="block">
                    <Image
                      src="/home/pot-detoure.webp"
                      alt="Le pot SCULT CRI de face : le mot CRI en bleu sur le visage d'une statue qui hurle, strap rouge autour du couvercle"
                      width={900}
                      height={1096}
                      sizes="(min-width: 768px) 28vw, 64vw"
                      className="flash-shadow h-auto w-full -rotate-[5deg] md:max-h-[50svh] md:w-auto"
                    />
                  </Link>
                  {/* La pastille : le seul rouge, et c'est le prix */}
                  <p className="absolute -right-[16%] top-[7%] flex h-[6.25rem] w-[6.25rem] rotate-[9deg] flex-col items-center justify-center rounded-full bg-ruby text-white outline outline-1 -outline-offset-[5px] outline-white/45 md:-right-[10%]">
                    <span className="display text-[1.9rem] tabular-nums">{formatPrice(product.priceCents)}</span>
                    <span className="label mt-1 !text-[0.6rem]">{CRI_DOSES} doses</span>
                  </p>
                </div>
                {/* Le ticket : fond plein, pour que les filets de l'affiche ne traversent pas le texte */}
                <div className="mt-8 border border-ink bg-marble">
                  <AddToCart product={product} className="w-full" />
                  <p className="label flex justify-between border-b px-4 py-3 text-stone">
                    <span>690 g · {CRI_DOSES} doses</span>
                    <span className="text-ink">{perDose} la dose</span>
                  </p>
                  {formula.caffeineWarning && <p className="px-4 pt-3 text-[0.8rem] leading-snug text-stone">{formula.caffeineWarning}</p>}
                  <Link href={`/produits/${product.slug}`} className="label inline-block px-4 pb-4 pt-3 underline underline-offset-4 hover:text-klein">
                    La fiche complète : ingrédients, précautions →
                  </Link>
                </div>
              </div>
            </div>

            {/* L'affiche : une ligne par actif, le chiffre à l'échelle */}
            <ol>
              {formula.main.map((line) => {
                const grams = line.unit === "g" ? Number(line.value.replace(",", ".")) : 0;
                const size = grams
                  ? { fontSize: `max(calc(var(--kk) * ${grams}), 1.5rem)` }
                  : { fontSize: "clamp(1.1rem, 1.7vw, 1.5rem)" };
                return (
                  <li key={line.name} className="grid grid-cols-[45vw_1fr] items-start gap-x-3 border-b py-4 [--kk:var(--k)] md:grid-cols-3 md:gap-x-0 md:py-5 md:[--kk:var(--k-md)]">
                    <p className="md:pl-5">
                      <span className={`display text-klein ${grams >= 8 ? "chisel" : ""}`} style={size}>
                        {line.value}{line.unit}
                      </span>
                    </p>
                    <div className="md:col-start-3 md:pl-8 md:pr-5">
                      <p className="display text-[clamp(1.05rem,1.9vw,1.75rem)] leading-none">{line.name}</p>
                      {line.claim && <p className="label mt-2 text-ruby">Allégation autorisée · UE 432/2012</p>}
                      {line.note && <p className="mt-2 max-w-sm text-[0.95rem] leading-relaxed text-stone">{line.note}</p>}
                    </div>
                  </li>
                );
              })}
              <li className="grid gap-y-2 border-b py-5 md:grid-cols-3">
                <p className="label text-stone md:pl-5">Et aussi, par dose</p>
                <p className="label leading-relaxed md:col-start-3 md:pl-8 md:pr-5">
                  {formula.rest.map((l) => `${l.name} ${l.amount}${l.nrv ? ` (${l.nrv} VNR)` : ""}`).join(" · ")}
                </p>
              </li>
            </ol>
          </div>

          {/* Pied d'affiche : les garanties, en labels dans la grille */}
          <ul aria-label="Garanties" className="grid md:grid-cols-3">
            {REASSURANCE_ITEMS.map(([title, text], i) => (
              <li key={title} className={`py-5 md:py-6 ${i ? "border-t md:border-t-0 md:pl-8" : "md:pl-5"} md:pr-5`}>
                <p className="label flex items-center gap-2"><span aria-hidden className="h-1.5 w-1.5 bg-ruby" />{title}</p>
                <p className="mt-2 text-sm leading-snug text-stone">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <Container className="pb-8 pt-4">
        <p className="text-[0.8rem] leading-relaxed text-stone">
          VNR : valeurs nutritionnelles de référence. Sans mention « allégation autorisée », l&apos;Europe n&apos;autorise aucune allégation santé pour l&apos;ingrédient dans un complément alimentaire : on donne sa quantité, rien d&apos;autre.{" "}
          <Link href="/methode" className="underline underline-offset-2 hover:text-klein">Lire la méthode</Link>
        </p>
      </Container>
    </section>
  );
}
