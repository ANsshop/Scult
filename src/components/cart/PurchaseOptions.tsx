"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog/queries";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";
import { AddToCart } from "./AddToCart";
import { PotStack } from "./PotStack";

/** Doses par pot : sert seulement à afficher le prix par dose. */
const DOSES_PER_UNIT = 30;

/**
 * Le choix d'achat sur la fiche produit : un pot, ou le pack (le même produit
 * en plusieurs pots, moins cher à l'unité). Les deux sont des produits du
 * socle : prix, prix barré et nombre de pots viennent du catalogue. Le pack
 * part dans le panier avec son propre SKU, et son lien ramène à cette fiche.
 */
export function PurchaseOptions({ single, bundle }: { single: Product; bundle: Product | null }) {
  const [choice, setChoice] = useState<"single" | "bundle">("single");
  if (!bundle) return <AddToCart product={single} className="mt-8 w-full" />;

  const options = [
    { key: "single" as const, product: single, title: "1 pot", detail: `${DOSES_PER_UNIT} doses` },
    { key: "bundle" as const, product: bundle, title: `Pack de ${bundle.variant.unitCount}`, detail: `${DOSES_PER_UNIT * bundle.variant.unitCount} doses` },
  ];
  const selected = choice === "bundle" ? { ...bundle, slug: single.slug } : single;

  return (
    <div className="mt-8">
      <fieldset>
        <legend className="label text-stone">Choisir la quantité</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {options.map(({ key, product, title, detail }) => {
            const on = choice === key;
            const units = product.variant.unitCount || 1;
            const off = product.compareAtCents && product.compareAtCents > product.priceCents ? Math.round((1 - product.priceCents / product.compareAtCents) * 100) : 0;
            const perDose = formatPrice(Math.round(product.priceCents / (DOSES_PER_UNIT * units)));
            const freeShipping = product.priceCents >= FREE_SHIPPING_THRESHOLD_CENTS;
            return (
              <label
                key={key}
                className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-card transition-all duration-300 ${on ? "bg-white shadow-[0_0_0_2px_var(--color-klein),0_14px_30px_-12px_rgb(18_56_199/0.55)]" : "bg-white/60 shadow-[0_0_0_1px_rgb(11_11_15/0.12)] hover:bg-white"}`}
              >
                <input type="radio" name="quantite" value={key} checked={on} onChange={() => setChoice(key)} className="sr-only" />
                {/* La vignette : le ou les pots sur le mur bleu, avec l'ombre dure du flash */}
                <span className="relative flex h-36 items-center justify-center overflow-hidden bg-klein md:h-40">
                  <PotStack count={units} className={units > 1 ? "h-[82%] w-[70%]" : "h-[78%]"} />
                  {off > 0 && <span className="label absolute right-3 top-3 z-10 whitespace-nowrap rounded-full bg-ruby px-2.5 py-1 text-white">−{off} %</span>}
                  <span aria-hidden className={`absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-[0_0_0_2px_var(--color-marble)] transition-colors ${on ? "bg-marble" : "bg-transparent"}`}>
                    <span className={`h-2.5 w-2.5 rounded-full bg-klein transition-transform ${on ? "scale-100" : "scale-0"}`} />
                  </span>
                </span>
                <span className="flex flex-1 flex-col p-4">
                  <span className="display text-[1.35rem] leading-none">{title}</span>
                  <span className="mt-2 flex items-baseline gap-2 tabular-nums">
                    <span className="text-xl font-medium">{formatPrice(product.priceCents)}</span>
                    {off > 0 && product.compareAtCents && <span className="text-sm text-stone line-through">{formatPrice(product.compareAtCents)}</span>}
                  </span>
                  <span className="mt-2 text-[0.82rem] leading-snug text-stone">
                    {detail} · {perDose} la dose
                    {freeShipping && <span className="mt-0.5 block font-medium text-klein">Livraison offerte</span>}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <AddToCart key={choice} product={selected} className="mt-4 !h-14 w-full" />
    </div>
  );
}
