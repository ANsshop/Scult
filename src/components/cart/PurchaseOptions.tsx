"use client";

import { useState } from "react";
import type { FlavourOffer } from "@/lib/catalog/queries";
import { packKey, type FlavourId } from "@/lib/content/flavours";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";
import { FlavourPicker } from "@/components/site/FlavourPicker";
import { useFlavour } from "@/components/site/FlavourContext";
import { AddToCart } from "./AddToCart";
import { PotStack } from "./PotStack";

/** Doses par pot : sert seulement à afficher le prix par dose. */
const DOSES_PER_UNIT = 30;

/**
 * Le choix d'achat sur la fiche produit : le goût, puis un pot ou le pack de
 * deux (moins cher à l'unité). Dans le pack, le deuxième pot peut être d'un
 * autre goût. Tout ce qui se vend vient du catalogue (FlavourOffer) : un
 * article par goût, un article par paire de goûts ; chacun part dans le
 * panier avec son propre SKU, et son lien ramène à cette fiche.
 */
export function PurchaseOptions({ offer }: { offer: FlavourOffer }) {
  const { flavour, setFlavour } = useFlavour();
  const [choice, setChoice] = useState<"single" | "bundle">("single");
  // Le 2ᵉ pot suit le 1ᵉʳ tant qu'on ne l'a pas choisi soi-même.
  const [picked, setPicked] = useState<FlavourId | null>(null);

  const first = offer.singles[flavour] ? flavour : offer.flavours[0];
  const single = offer.singles[first]!;
  const soldOut = offer.flavours.filter((id) => !offer.singles[id]?.inStock);
  // Les goûts possibles pour le 2ᵉ pot : ceux dont le pack avec le 1ᵉʳ existe.
  const seconds = offer.flavours.filter((id) => offer.packs[packKey(first, id)]);
  const second = picked && seconds.includes(picked) ? picked : seconds.includes(first) ? first : seconds[0];
  const bundle = second ? offer.packs[packKey(first, second)] : undefined;
  const pack = bundle && offer.pack ? offer.pack : null;
  const isBundle = choice === "bundle" && Boolean(bundle);
  const selected = isBundle ? bundle! : single;

  const picker = offer.flavours.length > 1 && (
    <FlavourPicker name="gout" legend="Goût" flavours={offer.flavours} value={first} onChange={setFlavour} disabled={soldOut} />
  );
  if (!pack || !bundle) {
    return (
      <div className="mt-8">
        {picker}
        <AddToCart key={selected.item.sku} item={selected.item} inStock={selected.inStock} preorderEta={selected.preorderEta} className="mt-4 !h-14 w-full" />
      </div>
    );
  }

  const options = [
    { key: "single" as const, title: "1 pot", priceCents: single.item.priceCents, fullCents: 0, units: 1, flavours: [first] },
    { key: "bundle" as const, title: `Pack de ${pack.units}`, priceCents: bundle.item.priceCents, fullCents: pack.fullPriceCents, units: pack.units, flavours: [first, second] },
  ];

  return (
    <div className="mt-8">
      {picker}
      <fieldset className={picker ? "mt-6" : ""}>
        <legend className="label text-stone">Quantité</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {options.map(({ key, title, priceCents, fullCents, units, flavours }) => {
            const on = (isBundle ? "bundle" : "single") === key;
            const off = fullCents > priceCents ? Math.round((1 - priceCents / fullCents) * 100) : 0;
            const perDose = formatPrice(Math.round(priceCents / (DOSES_PER_UNIT * units)));
            const freeShipping = priceCents >= FREE_SHIPPING_THRESHOLD_CENTS;
            return (
              <label
                key={key}
                className={`group relative flex cursor-pointer flex-col overflow-hidden rounded-card transition-all duration-300 ${on ? "bg-white shadow-[0_0_0_2px_var(--color-klein),0_14px_30px_-12px_rgb(18_56_199/0.55)]" : "bg-white/60 shadow-[0_0_0_1px_rgb(11_11_15/0.12)] hover:bg-white"}`}
              >
                <input type="radio" name="quantite" value={key} checked={on} onChange={() => setChoice(key)} className="sr-only" />
                {/* La vignette : le ou les pots du goût choisi sur le mur bleu, avec l'ombre dure du flash */}
                <span className="relative flex h-36 items-center justify-center overflow-hidden bg-klein md:h-40">
                  <PotStack flavours={flavours} className={units > 1 ? "h-[82%] w-[70%]" : "h-[78%]"} />
                  {off > 0 && <span className="label absolute right-3 top-3 z-10 whitespace-nowrap rounded-full bg-ruby px-2.5 py-1 text-white">−{off} %</span>}
                  <span aria-hidden className={`absolute left-3 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-[0_0_0_2px_var(--color-marble)] transition-colors ${on ? "bg-marble" : "bg-transparent"}`}>
                    <span className={`h-2.5 w-2.5 rounded-full bg-klein transition-transform ${on ? "scale-100" : "scale-0"}`} />
                  </span>
                </span>
                <span className="flex flex-1 flex-col p-4">
                  <span className="display text-[1.35rem] leading-none">{title}</span>
                  <span className="mt-2 flex items-baseline gap-2 tabular-nums">
                    <span className="text-xl font-medium">{formatPrice(priceCents)}</span>
                    {off > 0 && <span className="text-sm text-stone line-through">{formatPrice(fullCents)}</span>}
                  </span>
                  <span className="mt-2 text-[0.82rem] leading-snug text-stone">
                    {DOSES_PER_UNIT * units} doses · {perDose} la dose
                    {freeShipping && <span className="mt-0.5 block font-medium text-klein">Livraison offerte</span>}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {/* Le pack se compose : le 2ᵉ pot peut être d'un autre goût */}
      {isBundle && seconds.length > 1 && (
        <FlavourPicker name="gout-2" legend="Goût du 2ᵉ pot" flavours={seconds} value={second!} onChange={setPicked} disabled={soldOut} compact className="mt-5" />
      )}
      <AddToCart key={selected.item.sku} item={selected.item} inStock={selected.inStock} preorderEta={selected.preorderEta} className="mt-5 !h-14 w-full" />
    </div>
  );
}
