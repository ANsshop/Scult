"use server";

import { z } from "zod";
import type Stripe from "stripe";
import { createOrder } from "@/lib/pp/client";
import { priceCart } from "@/lib/orders/pricing";
import { SHIPPABLE_COUNTRY_CODES } from "@/lib/shipping";
import { stripe, siteUrl } from "@/lib/stripe";

const schema = z.object({
  countryCode: z.string().refine((c) => SHIPPABLE_COUNTRY_CODES.includes(c), "Pays non livré."),
  items: z.array(z.object({ sku: z.string().min(1).max(64), quantity: z.number().int().min(1).max(20) })).min(1).max(20),
  promoCode: z.string().max(40).optional(),
});

export type StartCheckoutResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Produit classique → Stripe Checkout hébergé. Les montants viennent du
 * socle, jamais du client. La commande est déposée sur /api/orders par le
 * webhook une fois le paiement confirmé (app/api/stripe/webhook).
 */
export async function startCheckoutAction(input: unknown): Promise<StartCheckoutResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Panier invalide. Rechargez la page." };
  const { countryCode, items, promoCode } = parsed.data;

  const priced = await priceCart(items, countryCode, promoCode);
  if ("error" in priced) return { ok: false, error: priced.error };

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      locale: "fr",
      line_items: priced.lines.map((l) => ({
        quantity: l.quantity,
        price_data: { currency: "eur", unit_amount: l.unitPriceCents, product_data: { name: l.name, metadata: { sku: l.sku } } },
      })),
      discounts: priced.discountCents > 0
        ? [{ coupon: (await stripe().coupons.create({ amount_off: priced.discountCents, currency: "eur", duration: "once", name: `Code ${promoCode}` })).id }]
        : undefined,
      shipping_address_collection: { allowed_countries: priced.allowedCountries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] },
      shipping_options: [{
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: priced.shippingLabel,
          fixed_amount: { amount: priced.shippingCents, currency: "eur" },
          delivery_estimate: {
            minimum: { unit: "business_day", value: priced.delayDays[0] },
            maximum: { unit: "business_day", value: priced.delayDays[1] },
          },
        },
      }],
      // Le webhook relit ce JSON pour déposer la commande sur le socle.
      metadata: {
        lines: JSON.stringify(items),
        shippingCents: String(priced.shippingCents),
        promoCode: promoCode ?? "",
      },
      success_url: `${siteUrl()}/checkout/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl()}/checkout?annule=1`,
    });
    if (!session.url) return { ok: false, error: "Impossible d'ouvrir le paiement." };
    return { ok: true, url: session.url };
  } catch (e) {
    console.error("[checkout]", e);
    return { ok: false, error: "Une erreur est survenue. Réessayez." };
  }
}

/** Dépose la commande sur le socle une fois Stripe payé. Idempotent côté socle via externalRef. */
export async function depositPaidSession(session: Stripe.Checkout.Session) {
  const lines = JSON.parse(session.metadata?.lines ?? "[]") as { sku: string; quantity: number }[];
  const addr = session.collected_information?.shipping_details?.address ?? session.customer_details?.address;
  return createOrder({
    lines,
    shippingCents: Number(session.metadata?.shippingCents ?? 0),
    promoCode: session.metadata?.promoCode || undefined,
    paymentMethod: "stripe",
    customer: { email: session.customer_details?.email ?? "", name: session.customer_details?.name ?? "" },
    shippingAddress: {
      line1: addr?.line1 ?? "",
      line2: addr?.line2 ?? undefined,
      postalCode: addr?.postal_code ?? "",
      city: addr?.city ?? "",
      countryCode: addr?.country ?? "",
    },
    externalRef: session.id,
  });
}
