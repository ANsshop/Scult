"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog/queries";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";
import { AddToCart } from "./AddToCart";

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
        <div className="mt-3 grid gap-2.5">
          {options.map(({ key, product, title, detail }) => {
            const on = choice === key;
            const units = product.variant.unitCount || 1;
            const off = product.compareAtCents && product.compareAtCents > product.priceCents ? Math.round((1 - product.priceCents / product.compareAtCents) * 100) : 0;
            const perDose = formatPrice(Math.round(product.priceCents / (DOSES_PER_UNIT * units)));
            const freeShipping = product.priceCents >= FREE_SHIPPING_THRESHOLD_CENTS;
            return (
              <label key={key} className={`flex cursor-pointer items-center gap-4 rounded-card border p-4 transition-colors ${on ? "border-ink bg-white" : "hover:border-ink/45"}`}>
                <input type="radio" name="quantite" value={key} checked={on} onChange={() => setChoice(key)} className="sr-only" />
                <span aria-hidden className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? "border-klein" : "border-ink/35"}`}>
                  <span className={`h-2.5 w-2.5 rounded-full bg-klein transition-transform ${on ? "scale-100" : "scale-0"}`} />
                </span>
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    {title}
                    {off > 0 && <span className="label rounded-full bg-ruby px-2.5 py-0.5 text-white">−{off} %</span>}
                  </span>
                  <span className="mt-0.5 block text-sm text-stone">
                    {detail} · {perDose} la dose{freeShipping ? " · livraison offerte" : ""}
                  </span>
                </span>
                <span className="text-right tabular-nums">
                  <span className="block text-lg">{formatPrice(product.priceCents)}</span>
                  {off > 0 && product.compareAtCents && <span className="block text-sm text-stone line-through">{formatPrice(product.compareAtCents)}</span>}
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
