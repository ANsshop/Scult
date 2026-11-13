"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartProvider";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";

/** Le pack à proposer quand le panier contient le produit à l'unité. Préparé côté serveur (layout). */
export type CartUpsell = {
  fromSku: string;
  unitPriceCents: number;
  units: number;
  item: { sku: string; slug: string; name: string; priceCents: number; image: string | null };
};

export function CartDrawer({ upsell }: { upsell?: CartUpsell | null }) {
  const { items, subtotalCents, isOpen, closeCart, setQuantity, swap, remove } = useCart();
  const missing = FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;
  // Un pot dans le panier → on propose d'en ajouter un pour passer au pack ;
  // deux pots ou plus → on propose de les regrouper en pack, au même nombre de pots.
  const single = upsell ? items.find((i) => i.sku === upsell.fromSku) : undefined;
  const offer = upsell && single
    ? (() => {
        const taken = Math.min(single.quantity, upsell.units);
        const delta = upsell.item.priceCents - taken * upsell.unitPriceCents;
        const full = upsell.units * upsell.unitPriceCents;
        return {
          taken,
          delta,
          saving: full - upsell.item.priceCents,
          percent: Math.round((1 - upsell.item.priceCents / full) * 100),
          freeShipping: subtotalCents + delta >= FREE_SHIPPING_THRESHOLD_CENTS,
        };
      })()
    : null;
  return (
    <div aria-hidden={!isOpen} className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}>
      <button type="button" aria-label="Fermer le panier" onClick={closeCart} className={`absolute inset-0 bg-ink/50 transition-opacity ${isOpen ? "opacity-100" : "opacity-0"}`} />
      <aside role="dialog" aria-label="Panier" className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-marble text-ink transition-transform duration-500 [transition-timing-function:var(--ease-scult)] ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b px-6 py-5">
          <span className="label">Panier · {items.length} ligne(s)</span>
          <button type="button" onClick={closeCart} className="label hover:text-ruby">Fermer</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <p className="py-10 text-stone">Votre panier est vide.</p>
          ) : (
            <ul className="divide-y">
              {items.map((i) => (
                <li key={i.sku} className="flex gap-4 py-5">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-chip bg-klein">
                    {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="flex-1">
                    <Link href={`/produits/${i.slug}`} onClick={closeCart} className="font-medium hover:underline">{i.name}</Link>
                    <p className="mt-1 text-sm text-stone">{formatPrice(i.priceCents)}</p>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <button type="button" onClick={() => setQuantity(i.sku, i.quantity - 1)} className="h-7 w-7 rounded-full border">−</button>
                      <span className="tabular-nums">{i.quantity}</span>
                      <button type="button" onClick={() => setQuantity(i.sku, i.quantity + 1)} className="h-7 w-7 rounded-full border">+</button>
                      <button type="button" onClick={() => remove(i.sku)} className="ml-auto label hover:text-ruby">Retirer</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {offer && upsell && (
          <div className="mx-6 mb-5 rounded-card bg-klein p-5 text-marble">
            <p className="label flex items-center gap-2"><span className="rounded-full bg-ruby px-2.5 py-0.5 text-white">−{offer.percent} %</span>Pack de {upsell.units}</p>
            <p className="display mt-3 text-[1.35rem] leading-[0.95]">
              {offer.taken < upsell.units ? `Ajoutez un ${upsell.units === 2 ? "2ᵉ" : "autre"} pot.` : `Passez au pack de ${upsell.units}.`}
            </p>
            <p className="mt-2 text-sm leading-snug text-marble/90">
              {formatPrice(upsell.item.priceCents)} au lieu de {formatPrice(upsell.units * upsell.unitPriceCents)} : vous économisez {formatPrice(offer.saving)}{offer.freeShipping ? ", et la livraison est offerte" : ""}.
            </p>
            <button
              type="button"
              onClick={() => swap(upsell.fromSku, offer.taken, upsell.item)}
              className="btn-shine label mt-4 flex h-11 w-full items-center justify-center rounded-btn bg-marble !text-[0.75rem] font-medium text-ink transition-colors hover:bg-white [--btn-reflet:rgb(18_56_199/0.26)]"
            >
              {offer.delta > 0 ? `Passer au pack · +${formatPrice(offer.delta)}` : `Passer au pack · −${formatPrice(-offer.delta)}`}
            </button>
          </div>
        )}
        <div className="border-t px-6 py-5">
          <div className="flex justify-between"><span>Sous-total</span><span className="tabular-nums">{formatPrice(subtotalCents)}</span></div>
          <p className="mt-1 text-sm text-stone">{missing > 0 ? `Plus que ${formatPrice(missing)} pour la livraison offerte.` : "Livraison offerte."}</p>
          <ButtonLink href="/checkout" className="mt-5 w-full">Commander</ButtonLink>
        </div>
      </aside>
    </div>
  );
}
