"use client";

import { useState, useTransition } from "react";
import { useCart } from "./CartProvider";
import { Button } from "@/components/ui/Button";
import { startCheckoutAction } from "@/lib/orders/actions";
import { SHIPPING_ZONES, shippingCentsFor } from "@/lib/shipping";
import { formatPrice, vatCents } from "@/lib/utils";

const COUNTRY_NAMES: Record<string, string> = { FR: "France", BE: "Belgique", LU: "Luxembourg", DE: "Allemagne", NL: "Pays-Bas", IT: "Italie", ES: "Espagne", AT: "Autriche", PT: "Portugal", IE: "Irlande", SE: "Suède", DK: "Danemark", FI: "Finlande", PL: "Pologne", GR: "Grèce", CZ: "Tchéquie" };

/** Estimation côté client avec les mêmes chiffres que le serveur ; le montant facturé vient du socle. */
export function CheckoutForm({ vatRate }: { vatRate: number }) {
  const { items, subtotalCents } = useCart();
  const [country, setCountry] = useState("FR");
  const [promo, setPromo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const ship = shippingCentsFor(country, subtotalCents);
  const base = subtotalCents + (ship?.cents ?? 0);
  const vat = vatCents(base, vatRate);

  if (items.length === 0) return <p className="mt-8 text-stone">Votre panier est vide.</p>;

  return (
    <form
      className="mt-10 space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await startCheckoutAction({ countryCode: country, items: items.map((i) => ({ sku: i.sku, quantity: i.quantity })), promoCode: promo || undefined });
          if (r.ok) window.location.href = r.url;
          else setError(r.error);
        });
      }}
    >
      <ul className="divide-y border-y">
        {items.map((i) => <li key={i.sku} className="flex justify-between py-3 text-sm"><span>{i.name} × {i.quantity}</span><span className="tabular-nums">{formatPrice(i.priceCents * i.quantity)}</span></li>)}
      </ul>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm"><span className="label text-stone">Pays de livraison</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="input mt-2">
            {SHIPPING_ZONES.flatMap((z) => z.countries).map((c) => <option key={c} value={c}>{COUNTRY_NAMES[c] ?? c}</option>)}
          </select>
        </label>
        <label className="block text-sm"><span className="label text-stone">Code promo</span>
          <input value={promo} onChange={(e) => setPromo(e.target.value.toUpperCase())} className="input mt-2" placeholder="Optionnel" />
        </label>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt>Sous-total</dt><dd className="tabular-nums">{formatPrice(subtotalCents)}</dd></div>
        <div className="flex justify-between"><dt>Livraison {ship ? `· ${ship.zone.label}` : ""}</dt><dd className="tabular-nums">{ship ? (ship.cents === 0 ? "Offerte" : formatPrice(ship.cents)) : "—"}</dd></div>
        {vat > 0 && <div className="flex justify-between"><dt>TVA {vatRate} %</dt><dd className="tabular-nums">{formatPrice(vat)}</dd></div>}
        <div className="flex justify-between border-t pt-2 text-base font-medium"><dt>Total</dt><dd className="tabular-nums">{formatPrice(base + vat)}</dd></div>
      </dl>
      {error && <p role="alert" className="text-sm text-ruby">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Redirection…" : "Payer avec Stripe"}</Button>
      <p className="text-xs text-stone">Adresse et paiement sont saisis sur la page sécurisée Stripe. CB, Apple Pay, Google Pay.</p>
    </form>
  );
}
