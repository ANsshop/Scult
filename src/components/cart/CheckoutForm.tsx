"use client";

import { useState, useTransition } from "react";
import { useCart } from "./CartProvider";
import { Button } from "@/components/ui/Button";
import { checkPromoAction, startCheckoutAction } from "@/lib/orders/actions";
import { SHIPPING_ZONES, shippingCentsFor } from "@/lib/shipping";
import { formatPrice, vatCents } from "@/lib/utils";

const COUNTRY_NAMES: Record<string, string> = { FR: "France", BE: "Belgique", LU: "Luxembourg", DE: "Allemagne", NL: "Pays-Bas", IT: "Italie", ES: "Espagne", AT: "Autriche", PT: "Portugal", IE: "Irlande", SE: "Suède", DK: "Danemark", FI: "Finlande", PL: "Pologne", GR: "Grèce", CZ: "Tchéquie" };

/** Estimation côté client avec les mêmes chiffres que le serveur ; le montant facturé vient du socle. */
export function CheckoutForm({ vatRate }: { vatRate: number }) {
  const { items, subtotalCents, savingCents } = useCart();
  const [country, setCountry] = useState("FR");
  const [promo, setPromo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Le code vérifié par le serveur et sa remise ; remis à zéro dès que le code, le pays ou le panier change.
  const [applied, setApplied] = useState<{ key: string; code: string; discountCents: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [checking, check] = useTransition();
  const cartKey = `${country}|${promo.trim()}|${items.map((i) => `${i.sku}x${i.quantity}`).join(",")}`;
  const discount = applied?.key === cartKey ? applied.discountCents : 0;
  const lines = () => items.map((i) => ({ sku: i.sku, quantity: i.quantity }));
  const applyPromo = () => {
    setPromoError(null);
    check(async () => {
      const r = await checkPromoAction({ countryCode: country, items: lines(), promoCode: promo.trim() });
      if (r.ok) setApplied({ key: cartKey, code: r.code, discountCents: r.discountCents });
      else { setApplied(null); setPromoError(r.error); }
    });
  };

  const ship = shippingCentsFor(country, subtotalCents - discount);
  const base = subtotalCents - discount + (ship?.cents ?? 0);
  const vat = vatCents(base, vatRate);

  if (items.length === 0) return <p className="mt-8 text-stone">Votre panier est vide.</p>;

  return (
    <form
      className="mt-10 space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const r = await startCheckoutAction({ countryCode: country, items: lines(), promoCode: promo.trim() || undefined });
          if (r.ok) window.location.href = r.url;
          else setError(r.error);
        });
      }}
    >
      <ul className="divide-y border-y">
        {items.map((i) => <li key={i.sku} className="flex justify-between py-3 text-sm"><span>{i.name}{i.detail ? ` · ${i.detail}` : ""} × {i.quantity}</span><span className="tabular-nums">{formatPrice(i.priceCents * i.quantity)}</span></li>)}
      </ul>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm"><span className="label text-stone">Pays de livraison</span>
          <select value={country} onChange={(e) => setCountry(e.target.value)} className="input mt-2">
            {SHIPPING_ZONES.flatMap((z) => z.countries).map((c) => <option key={c} value={c}>{COUNTRY_NAMES[c] ?? c}</option>)}
          </select>
        </label>
        <div className="block text-sm">
          <label htmlFor="code-promo" className="label text-stone">Code promo</label>
          <div className="mt-2 flex gap-2">
            <input
              id="code-promo"
              value={promo}
              onChange={(e) => { setPromo(e.target.value.toUpperCase()); setPromoError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter" && promo.trim()) { e.preventDefault(); applyPromo(); } }}
              className="input"
              placeholder="Optionnel"
              autoComplete="off"
              aria-invalid={promoError ? true : undefined}
              aria-describedby="code-promo-etat"
            />
            <button type="button" onClick={applyPromo} disabled={!promo.trim() || checking} className="label shrink-0 rounded-chip border border-ink/30 px-4 transition-colors hover:border-ink disabled:opacity-40">{checking ? "…" : "Appliquer"}</button>
          </div>
          <p id="code-promo-etat" aria-live="polite" className="mt-2 min-h-5 text-sm">
            {promoError ? <span className="text-ruby">{promoError}</span> : discount > 0 ? <span className="font-medium">Code {applied!.code} appliqué : −{formatPrice(discount)}</span> : null}
          </p>
        </div>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between"><dt>Sous-total</dt><dd className="tabular-nums">{formatPrice(subtotalCents)}</dd></div>
        {discount > 0 && <div className="flex justify-between font-medium text-ruby"><dt>Code {applied!.code}</dt><dd className="tabular-nums">−{formatPrice(discount)}</dd></div>}
        {savingCents > 0 && <div className="flex justify-between font-medium text-ruby"><dt>Vous économisez</dt><dd className="tabular-nums">{formatPrice(savingCents)}</dd></div>}
        <div className={`flex justify-between ${ship?.cents === 0 ? "font-medium text-ruby" : ""}`}><dt>Livraison {ship ? `· ${ship.zone.label}` : ""}</dt><dd className="tabular-nums">{ship ? (ship.cents === 0 ? "Offerte" : formatPrice(ship.cents)) : "—"}</dd></div>
        {vat > 0 && <div className="flex justify-between"><dt>TVA {vatRate} %</dt><dd className="tabular-nums">{formatPrice(vat)}</dd></div>}
        <div className="flex justify-between border-t pt-2 text-base font-medium"><dt>Total</dt><dd className="tabular-nums">{formatPrice(base + vat)}</dd></div>
      </dl>
      {error && <p role="alert" className="text-sm text-ruby">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">{pending ? "Redirection…" : "Payer avec Stripe"}</Button>
      <p className="text-xs text-stone">Adresse et paiement sont saisis sur la page sécurisée Stripe. CB, Apple Pay, Google Pay.</p>
    </form>
  );
}
