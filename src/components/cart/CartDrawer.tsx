"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "./CartProvider";
import { PotStack } from "./PotStack";
import { ButtonLink } from "@/components/ui/Button";
import type { FlavourOffer } from "@/lib/catalog/queries";
import { getFlavour, isFlavourId, packKey, type FlavourId } from "@/lib/content/flavours";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";

/**
 * Le tiroir du panier. `offer` (préparée côté serveur, dans le layout) sert à
 * proposer le pack : s'il reste un pot seul dans le panier, on propose d'en
 * ajouter un deuxième, du goût de son choix, au prix du pack. Deux pots
 * ajoutés à l'unité sont déjà regroupés en pack par le panier lui-même.
 */
export function CartDrawer({ offer }: { offer?: FlavourOffer | null }) {
  const { items, subtotalCents, savingCents, isOpen, closeCart, setQuantity, add, remove } = useCart();
  const [picked, setPicked] = useState<FlavourId | null>(null);
  const missing = FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;

  // Le pot seul du panier, s'il y en a un, et le pack qu'il formerait avec un 2ᵉ pot.
  const lone = offer?.pack ? items.find((i) => i.flavours?.length === 1 && isFlavourId(i.flavours[0]) && offer.singles[i.flavours[0]]?.item.sku === i.sku) : undefined;
  const upsell = (() => {
    if (!offer?.pack || !lone) return null;
    const base = lone.flavours![0] as FlavourId;
    const seconds = offer.flavours.filter((id) => offer.packs[packKey(base, id)]?.inStock && offer.singles[id]?.inStock);
    if (seconds.length === 0) return null;
    const second = picked && seconds.includes(picked) ? picked : seconds.includes(base) ? base : seconds[0];
    const pack = offer.packs[packKey(base, second)].item;
    const delta = pack.priceCents - lone.priceCents;
    return {
      base,
      seconds,
      second,
      pack,
      delta,
      units: offer.pack.units,
      full: offer.pack.fullPriceCents,
      saving: offer.pack.fullPriceCents - pack.priceCents,
      percent: Math.round((1 - pack.priceCents / offer.pack.fullPriceCents) * 100),
      freeShipping: subtotalCents + delta >= FREE_SHIPPING_THRESHOLD_CENTS,
    };
  })();

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
              {items.map((i) => {
                const pots = i.flavours?.length ? i.flavours : [undefined];
                // Un pack : son prix, et barré celui des mêmes pots à l'unité.
                const full = offer?.pack && pots.length === offer.pack.units && offer.pack.fullPriceCents > i.priceCents ? offer.pack.fullPriceCents : null;
                return (
                  <li key={i.sku} className="flex gap-4 py-5">
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-chip bg-klein">
                      {/* Le pot sur le mur bleu, à l'étiquette de son goût ; deux pots pour le pack */}
                      <PotStack flavours={pots} className={pots.length > 1 ? "h-[76%] w-[84%]" : "h-[80%]"} />
                    </div>
                    <div className="flex-1">
                      <Link href={`/produits/${i.slug}`} onClick={closeCart} className="font-medium hover:underline">{i.name}</Link>
                      {i.detail && <p className="label mt-1 !text-[0.625rem] font-bold" style={{ color: i.flavours?.length === 1 ? getFlavour(i.flavours[0]).color : undefined }}>{i.detail}</p>}
                      <p className="mt-1 text-sm text-stone">{formatPrice(i.priceCents)}{full && <s className="ml-2 opacity-70">{formatPrice(full)}</s>}</p>
                      <div className="mt-2 flex items-center gap-3 text-sm">
                        <button type="button" onClick={() => setQuantity(i.sku, i.quantity - 1)} className="h-7 w-7 rounded-full border">−</button>
                        <span className="tabular-nums">{i.quantity}</span>
                        <button type="button" onClick={() => setQuantity(i.sku, i.quantity + 1)} className="h-7 w-7 rounded-full border">+</button>
                        <button type="button" onClick={() => remove(i.sku)} className="ml-auto label hover:text-ruby">Retirer</button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {upsell && (
          <div className="card-shine group mx-6 mb-5 rounded-card bg-klein p-5 text-marble">
            {/* Les deux pots du pack, à droite de l'encart : celui du panier et celui qu'on ajoute */}
            <PotStack flavours={[upsell.base, upsell.second]} className="pointer-events-none !absolute -right-2 top-4 h-32 w-40" />
            <div className="relative max-w-[62%]">
              <p className="label flex items-center gap-2 whitespace-nowrap"><span className="rounded-full bg-ruby px-2.5 py-0.5 text-white">−{upsell.percent} %</span>Pack de {upsell.units}</p>
              <p className="display mt-3 text-[1.35rem] leading-[0.95]">Ajoutez un {upsell.units === 2 ? "2ᵉ" : "autre"} pot.</p>
            </div>
            <p className="relative mt-3 max-w-[62%] text-sm leading-snug text-marble/90">
              {formatPrice(upsell.pack.priceCents)} au lieu de {formatPrice(upsell.full)} : vous économisez {formatPrice(upsell.saving)}{upsell.freeShipping ? ", et la livraison est offerte" : ""}.
            </p>
            {upsell.seconds.length > 1 && (
              <div className="relative mt-4 flex items-center gap-2.5" role="radiogroup" aria-label="Goût du 2ᵉ pot">
                {upsell.seconds.map((id) => {
                  const f = getFlavour(id);
                  const on = id === upsell.second;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      aria-label={f.label}
                      title={f.label}
                      onClick={() => setPicked(id)}
                      style={{ backgroundColor: f.color }}
                      className={`h-8 w-8 shrink-0 rounded-full transition-all duration-300 ${on ? "shadow-[0_0_0_2px_var(--color-klein),0_0_0_4px_var(--color-marble)]" : "opacity-80 shadow-[0_0_0_1.5px_rgb(242_240_234/0.55)] hover:opacity-100"}`}
                    />
                  );
                })}
                <span className="label ml-1 !text-[0.625rem] leading-tight">2ᵉ pot<br /><span className="text-white">{getFlavour(upsell.second).label}</span></span>
              </div>
            )}
            <button
              type="button"
              onClick={() => add(offer!.singles[upsell.second]!.item, 1, { open: false })}
              className="btn-shine label relative mt-4 flex h-11 w-full items-center justify-center rounded-btn bg-marble !text-[0.75rem] font-medium text-ink transition-colors hover:bg-white [--btn-reflet:rgb(18_56_199/0.26)]"
            >
              {upsell.delta > 0 ? `Passer au pack · +${formatPrice(upsell.delta)}` : `Passer au pack · −${formatPrice(-upsell.delta)}`}
            </button>
          </div>
        )}
        <div className="border-t px-6 py-5">
          <div className="flex justify-between"><span>Sous-total</span><span className="tabular-nums">{formatPrice(subtotalCents)}</span></div>
          {savingCents > 0 && <div className="mt-1.5 flex justify-between font-medium text-ruby"><span>Vous économisez</span><span className="tabular-nums">{formatPrice(savingCents)}</span></div>}
          {items.length > 0 && missing <= 0
            ? <div className="mt-1.5 flex justify-between font-medium text-ruby"><span>Livraison</span><span>Offerte</span></div>
            : <p className="mt-1.5 text-sm text-stone">Plus que {formatPrice(missing)} pour la livraison offerte.</p>}
          <ButtonLink href="/checkout" className="mt-5 w-full">Commander</ButtonLink>
        </div>
      </aside>
    </div>
  );
}
