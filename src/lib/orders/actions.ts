"use server";

import { z } from "zod";
import type Stripe from "stripe";
import { createOrder } from "@/lib/pp/client";
import { priceCart } from "@/lib/orders/pricing";
import { SHIPPABLE_COUNTRY_CODES } from "@/lib/shipping";
import { stripe, siteUrl } from "@/lib/stripe";
import { flavoursLabel, flavoursOfSku } from "@/lib/content/flavours";

const schema = z.object({
  countryCode: z.string().refine((c) => SHIPPABLE_COUNTRY_CODES.includes(c), "Pays non livré."),
  items: z.array(z.object({ sku: z.string().min(1).max(64), quantity: z.number().int().min(1).max(20) })).min(1).max(20),
  promoCode: z.string().max(40).optional(),
});

export type StartCheckoutResult = { ok: true; url: string } | { ok: false; error: string };

/** Le nom de la ligne sur la page de paiement : le produit et, s'il y en a, le ou les goûts lus dans le SKU. */
function lineName(name: string, sku: string): string {
  const flavours = flavoursOfSku(sku);
  return flavours ? `${name} · ${flavoursLabel(flavours)}` : name;
}

/**
 * Produit classique → Stripe Checkout hébergé. Les montants viennent du
 * socle, jamais du client. La commande est déposée sur /api/orders par le
 * webhook une fois le paiement confirmé (app/api/stripe/webhook).
 */
export async function startCheckoutAction(input: unknown): Promise<StartCheckoutResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Panier invalide. Rechargez la page." };
  const { countryCode, items, promoCode } = parsed.data;
  // Avant la sortie, rien ne se vend, même avec un panier resté dans le navigateur.
  if (!(await (await import("@/lib/launch")).getLaunch()).open) return { ok: false, error: "La boutique n'est pas encore ouverte. Inscrivez-vous sur la fiche du produit pour être prévenu à la sortie." };

  const priced = await priceCart(items, countryCode, promoCode);
  if ("error" in priced) return { ok: false, error: priced.error };
  // Le « passage en caisse » de l'entonnoir de l'admin : compté ici, une fois le panier accepté.
  if (process.env.DATABASE_URL) await (await import("@/lib/store/events")).recordEvent({ type: "checkout_start", sessionId: `caisse-${crypto.randomUUID()}` });

  try {
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      locale: "fr",
      line_items: priced.lines.map((l) => ({
        quantity: l.quantity,
        price_data: { currency: "eur", unit_amount: l.unitPriceCents, product_data: { name: lineName(l.name, l.sku), metadata: { sku: l.sku } } },
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

export type CheckPromoResult = { ok: true; code: string; discountCents: number; shippingCents: number; totalCents: number } | { ok: false; error: string };

/**
 * Vérifie un code promo avant le paiement : le client voit sa remise, ou la
 * raison du refus, sans quitter la page. Le même calcul que celui du paiement.
 */
export async function checkPromoAction(input: unknown): Promise<CheckPromoResult> {
  const parsed = schema.safeParse(input);
  if (!parsed.success || !parsed.data.promoCode?.trim()) return { ok: false, error: "Saisissez un code promo." };
  const { countryCode, items, promoCode } = parsed.data;
  try {
    const priced = await priceCart(items, countryCode, promoCode);
    if ("error" in priced) return { ok: false, error: priced.error };
    if (priced.discountCents === 0) return { ok: false, error: "Ce code promo n'apporte pas de remise sur ce panier." };
    return { ok: true, code: priced.promoCode ?? promoCode.trim().toUpperCase(), discountCents: priced.discountCents, shippingCents: priced.shippingCents, totalCents: priced.totalCents };
  } catch (e) {
    console.error("[promo]", e);
    return { ok: false, error: "Impossible de vérifier ce code pour l'instant. Réessayez." };
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
