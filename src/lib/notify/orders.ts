import "server-only";
import { db } from "@/lib/db";
import { getOrder } from "@/lib/store/orders";
import { siteUrl } from "@/lib/stripe";
import { emailReady, sendEmail } from "./email";
import { orderEmail, shopAlert, type OrderEmailKind } from "./templates";

const LABEL: Record<OrderEmailKind, string> = { confirmation: "Confirmation de commande", shipped: "Avis d'expédition", cancelled: "Avis d'annulation", refunded: "Avis de remboursement" };

/**
 * Envoie au client l'e-mail qui correspond à une étape de sa commande, et le
 * note dans l'historique de la commande — envoyé ou non, avec la raison : on
 * voit dans l'admin ce que le client a reçu. Ne lève jamais d'erreur.
 */
export async function sendOrderEmail(orderId: string, kind: OrderEmailKind, opts: { actor?: string | null; refundCents?: number } = {}): Promise<{ ok: boolean; message: string }> {
  try {
    const data = await getOrder(orderId);
    if (!data) return { ok: false, message: "Commande introuvable." };
    const mail = orderEmail(kind, { order: data.order, lines: data.lines, site: siteUrl(), refundCents: opts.refundCents });
    const result = await sendEmail({ to: data.order.email, ...mail });
    const detail = result.ok ? `${LABEL[kind]} envoyé à ${data.order.email}` : `${LABEL[kind]} non envoyé : ${result.reason}`;
    await db.query("insert into order_events (order_id, type, detail, actor) values ($1, $2, $3, $4)", [orderId, result.ok ? "email" : "email_failed", detail, opts.actor ?? null]);
    return { ok: result.ok, message: detail };
  } catch (e) {
    console.error("[email commande]", e);
    return { ok: false, message: "E-mail non envoyé." };
  }
}

/** À la création d'une commande : la confirmation au client, et l'alerte à la boutique si ORDERS_NOTIFY_EMAIL est renseignée. */
export async function onOrderCreated(orderId: string) {
  await sendOrderEmail(orderId, "confirmation");
  const to = process.env.ORDERS_NOTIFY_EMAIL;
  if (!to || !emailReady()) return;
  try {
    const data = await getOrder(orderId);
    if (data) await sendEmail({ to, ...shopAlert({ order: data.order, lines: data.lines, site: siteUrl() }) });
  } catch (e) {
    console.error("[alerte commande]", e);
  }
}
