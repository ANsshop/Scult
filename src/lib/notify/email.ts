import "server-only";

/**
 * L'envoi des e-mails, par Resend (le service déjà utilisé par le socle et
 * par Limitless) : un simple appel HTTP, aucune dépendance.
 *
 * Trois variables : RESEND_API_KEY, EMAIL_FROM (« SCULT <commandes@scult.eu> »,
 * sur un domaine vérifié chez Resend) et, facultative, EMAIL_REPLY_TO.
 * Sans clé, rien ne part et l'appelant le sait (`ok: false`) : une commande
 * ne doit jamais échouer parce qu'un e-mail n'a pas pu être envoyé.
 */

export const emailReady = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
export const emailFrom = () => process.env.EMAIL_FROM ?? null;

export type SendResult = { ok: true; id: string | null } | { ok: false; reason: string };

export async function sendEmail(message: { to: string; subject: string; html: string; text: string }): Promise<SendResult> {
  if (!emailReady()) return { ok: false, reason: "e-mails non configurés" };
  try {
    // RESEND_API_URL : seulement pour viser le faux service en local (scripts/mock-services.mjs).
    const res = await fetch(`${(process.env.RESEND_API_URL ?? "https://api.resend.com").replace(/\/$/, "")}/emails`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [message.to],
        reply_to: process.env.EMAIL_REPLY_TO || "hello@scult.eu",
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[email]", res.status, body.slice(0, 300));
      return { ok: false, reason: `refusé par le service d'envoi (${res.status})` };
    }
    const data = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: data.id ?? null };
  } catch (e) {
    console.error("[email]", e instanceof Error ? e.message : e);
    return { ok: false, reason: "service d'envoi injoignable" };
  }
}
