"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "./CartProvider";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";

export function CartDrawer() {
  const { items, subtotalCents, isOpen, closeCart, setQuantity, remove } = useCart();
  const missing = FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents;
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
                  <div className="relative h-20 w-16 shrink-0 bg-klein">
                    {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="flex-1">
                    <Link href={`/produits/${i.slug}`} onClick={closeCart} className="font-medium hover:underline">{i.name}</Link>
                    <p className="mt-1 text-sm text-stone">{formatPrice(i.priceCents)}</p>
                    <div className="mt-2 flex items-center gap-3 text-sm">
                      <button type="button" onClick={() => setQuantity(i.sku, i.quantity - 1)} className="h-7 w-7 border">−</button>
                      <span className="tabular-nums">{i.quantity}</span>
                      <button type="button" onClick={() => setQuantity(i.sku, i.quantity + 1)} className="h-7 w-7 border">+</button>
                      <button type="button" onClick={() => remove(i.sku)} className="ml-auto label hover:text-ruby">Retirer</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t px-6 py-5">
          <div className="flex justify-between"><span>Sous-total</span><span className="tabular-nums">{formatPrice(subtotalCents)}</span></div>
          <p className="mt-1 text-sm text-stone">{missing > 0 ? `Plus que ${formatPrice(missing)} pour la livraison offerte.` : "Livraison offerte."}</p>
          <ButtonLink href="/checkout" className="mt-5 w-full">Commander</ButtonLink>
        </div>
      </aside>
    </div>
  );
}
