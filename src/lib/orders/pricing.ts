import "server-only";
import { quoteCart, type PpCartLine } from "@/lib/pp/client";
import { getVatRate } from "@/lib/catalog/queries";
import { shippingCentsFor } from "@/lib/shipping";
import { vatCents } from "@/lib/utils";

export type PricedCart = {
  lines: { sku: string; name: string; unitPriceCents: number; quantity: number }[];
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  shippingLabel: string;
  delayDays: [number, number];
  vatCents: number;
  totalCents: number;
  allowedCountries: string[];
};

/**
 * Chiffre le panier : le socle donne lignes + remise (/api/panier), la
 * boutique ajoute le port, puis la TVA exactement comme le socle (assiette =
 * lignes + port − remise, même arrondi). En TTC + taux 0, vatCents = 0.
 */
export async function priceCart(lines: PpCartLine[], countryCode: string, promoCode?: string): Promise<PricedCart | { error: string }> {
  if (lines.length === 0) return { error: "Panier vide." };
  const quote = await quoteCart(lines, promoCode);
  const shipping = shippingCentsFor(countryCode, quote.subtotalCents - quote.discountCents);
  if (!shipping) return { error: "Nous ne livrons pas encore ce pays." };
  const base = quote.subtotalCents + shipping.cents - quote.discountCents;
  const vat = vatCents(base, await getVatRate());
  return {
    lines: quote.lines.map((l) => ({ sku: l.sku, name: l.name, unitPriceCents: l.unitPriceCents, quantity: l.quantity })),
    subtotalCents: quote.subtotalCents,
    discountCents: quote.discountCents,
    shippingCents: shipping.cents,
    shippingLabel: shipping.cents === 0 ? "Livraison offerte" : `Livraison ${shipping.zone.label}`,
    delayDays: shipping.zone.delayDays,
    vatCents: vat,
    totalCents: base + vat,
    allowedCountries: shipping.zone.countries,
  };
}
