import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { depositPaidSession } from "@/lib/orders/actions";

/**
 * Source de vérité du paiement. Événements : checkout.session.completed,
 * checkout.session.async_payment_succeeded. La commande n'est déposée sur le
 * socle qu'une fois payment_status === "paid" ; le socle déduplique sur
 * externalRef (= session.id), donc un retry Stripe est sans effet.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 500 });

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(payload, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    if (session.payment_status === "paid") {
      try {
        await depositPaidSession(session);
      } catch (e) {
        console.error("[webhook] dépôt socle impossible :", e);
        return new Response("Deposit failed", { status: 500 }); // Stripe réessaiera
      }
    }
  }
  return new Response(null, { status: 200 });
}
