import { country, eur } from "@/lib/admin/format";
import type { OrderDetail, OrderLine } from "@/lib/store/orders";
import { trackingUrl } from "./tracking";

/**
 * Les e-mails envoyés aux clients. Chacun existe en HTML (tableaux et styles
 * en ligne : c'est ce que les messageries affichent correctement) et en texte
 * brut. Ton de la marque, mais factuel : aucune promesse d'effet, comme le
 * reste du site (scripts/gate.sh passe aussi sur ce fichier).
 */

export type OrderEmailKind = "confirmation" | "shipped" | "cancelled" | "refunded";
export type Mail = { subject: string; html: string; text: string };

const ROSE = "#ff2e93", NOIR = "#070707", DOUX = "#52514e", LIGNE = "#e6e4de";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const first = (name: string) => name.trim().split(/\s+/)[0] || "";

function layout(site: string, preheader: string, title: string, body: string): string {
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f3f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${NOIR};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3f0;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:${NOIR};padding:22px 32px;border-bottom:6px solid ${ROSE};"><a href="${site}" style="color:#f2f0ea;text-decoration:none;font-size:22px;font-weight:900;letter-spacing:0.14em;">SCULT</a></td></tr>
<tr><td style="padding:32px;">
<h1 style="margin:0 0 16px;font-size:26px;line-height:1.15;font-weight:800;">${title}</h1>
${body}
</td></tr>
<tr><td style="padding:20px 32px 28px;border-top:1px solid ${LIGNE};font-size:12px;line-height:1.6;color:${DOUX};">
Une question ? Répondez à cet e-mail, ou écrivez à <a href="mailto:hello@scult.eu" style="color:${NOIR};">hello@scult.eu</a>.<br>
SCULT · <a href="${site}" style="color:${NOIR};">${site.replace(/^https?:\/\//, "")}</a>
</td></tr>
</table></td></tr></table></body></html>`;
}

const p = (html: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${NOIR};">${html}</p>`;
const button = (href: string, label: string) => `<p style="margin:8px 0 24px;"><a href="${href}" style="display:inline-block;background:${ROSE};color:${NOIR};text-decoration:none;font-weight:700;font-size:14px;padding:14px 26px;border-radius:999px;">${esc(label)}</a></p>`;

function summary(order: OrderDetail, lines: OrderLine[]): string {
  const row = (label: string, value: string, strong = false) => `<tr><td style="padding:6px 0;font-size:14px;color:${strong ? NOIR : DOUX};${strong ? "font-weight:700;" : ""}">${label}</td><td align="right" style="padding:6px 0;font-size:14px;${strong ? "font-weight:700;" : ""}">${value}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-top:1px solid ${LIGNE};border-bottom:1px solid ${LIGNE};">
${lines.map((l) => `<tr><td style="padding:12px 0;font-size:15px;border-bottom:1px solid ${LIGNE};"><strong>${esc(l.name)}</strong><br><span style="font-size:13px;color:${DOUX};">Quantité : ${l.quantity}</span></td><td align="right" style="padding:12px 0;font-size:15px;border-bottom:1px solid ${LIGNE};white-space:nowrap;">${eur(l.line_cents)}</td></tr>`).join("")}
${row("Articles", eur(order.subtotal_cents))}
${order.discount_cents > 0 ? row(`Remise${order.promo_code ? ` (${esc(order.promo_code)})` : ""}`, `−${eur(order.discount_cents)}`) : ""}
${row("Livraison", order.shipping_cents === 0 ? "Offerte" : eur(order.shipping_cents))}
${row("Total payé", eur(order.total_cents), true)}
</table>`;
}

const address = (o: OrderDetail) => [o.name, o.address_line1, o.address_line2, `${o.postal_code} ${o.city}`, country(o.country_code)].filter(Boolean) as string[];

function textSummary(order: OrderDetail, lines: OrderLine[]): string {
  return [
    ...lines.map((l) => `- ${l.name} × ${l.quantity} : ${eur(l.line_cents)}`),
    order.discount_cents > 0 ? `Remise : −${eur(order.discount_cents)}` : null,
    `Livraison : ${order.shipping_cents === 0 ? "offerte" : eur(order.shipping_cents)}`,
    `Total payé : ${eur(order.total_cents)}`,
  ].filter(Boolean).join("\n");
}

export function orderEmail(kind: OrderEmailKind, data: { order: OrderDetail; lines: OrderLine[]; site: string; refundCents?: number }): Mail {
  const { order: o, lines, site } = data;
  const hello = first(o.name) ? `Bonjour ${esc(first(o.name))},` : "Bonjour,";
  const helloText = first(o.name) ? `Bonjour ${first(o.name)},` : "Bonjour,";
  const footerText = `\n\nUne question ? Répondez à cet e-mail ou écrivez à hello@scult.eu.\nSCULT · ${site}`;

  if (kind === "confirmation") {
    const html = layout(site, `Commande ${o.reference} confirmée. On prépare votre colis.`, "Commande confirmée.", [
      p(hello),
      p(`Paiement reçu, merci. Votre commande <strong>${esc(o.reference)}</strong> est enregistrée et part en préparation. Expédition sous 24 h ouvrées ; vous recevrez un e-mail avec le numéro de suivi dès que le colis sera parti.`),
      summary(o, lines),
      `<p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${DOUX};">Livraison à</p>`,
      p(address(o).map(esc).join("<br>")),
      p(`<span style="font-size:13px;color:${DOUX};">Une erreur dans l'adresse ? Répondez tout de suite à cet e-mail, avant le départ du colis.</span>`),
    ].join("\n"));
    const text = `${helloText}\n\nPaiement reçu, merci. Votre commande ${o.reference} est enregistrée et part en préparation. Expédition sous 24 h ouvrées ; vous recevrez un e-mail avec le numéro de suivi dès que le colis sera parti.\n\n${textSummary(o, lines)}\n\nLivraison à :\n${address(o).join("\n")}\n\nUne erreur dans l'adresse ? Répondez tout de suite à cet e-mail, avant le départ du colis.${footerText}`;
    return { subject: `Commande ${o.reference} confirmée`, html, text };
  }

  if (kind === "shipped") {
    const url = o.tracking_url || trackingUrl(o.tracking_carrier, o.tracking_number);
    const carrier = o.tracking_carrier && o.tracking_carrier !== "Autre" ? o.tracking_carrier : null;
    const html = layout(site, `Votre commande ${o.reference} est partie.`, "C'est parti.", [
      p(hello),
      p(`Votre commande <strong>${esc(o.reference)}</strong> a quitté l'entrepôt${carrier ? `, confiée à ${esc(carrier)}` : ""}.`),
      o.tracking_number ? p(`Numéro de suivi : <strong style="font-family:ui-monospace,Menlo,monospace;">${esc(o.tracking_number)}</strong>`) : p("Ce colis part sans numéro de suivi."),
      url ? button(url, "Suivre mon colis") : "",
      o.tracking_number ? p(`<span style="font-size:13px;color:${DOUX};">Le suivi peut mettre quelques heures à s'activer chez le transporteur.</span>`) : "",
      `<p style="margin:0 0 6px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${DOUX};">Livraison à</p>`,
      p(address(o).map(esc).join("<br>")),
    ].join("\n"));
    const text = `${helloText}\n\nVotre commande ${o.reference} a quitté l'entrepôt${carrier ? `, confiée à ${carrier}` : ""}.\n${o.tracking_number ? `Numéro de suivi : ${o.tracking_number}${url ? `\nSuivre le colis : ${url}` : ""}\nLe suivi peut mettre quelques heures à s'activer chez le transporteur.` : "Ce colis part sans numéro de suivi."}\n\nLivraison à :\n${address(o).join("\n")}${footerText}`;
    return { subject: `Votre commande ${o.reference} est partie`, html, text };
  }

  if (kind === "cancelled") {
    const html = layout(site, `Votre commande ${o.reference} est annulée.`, "Commande annulée.", [
      p(hello),
      p(`Votre commande <strong>${esc(o.reference)}</strong> a été annulée et ne sera pas expédiée.`),
      p("Le remboursement est traité à part : vous recevrez un e-mail dès qu'il sera effectué."),
      summary(o, lines),
    ].join("\n"));
    const text = `${helloText}\n\nVotre commande ${o.reference} a été annulée et ne sera pas expédiée.\nLe remboursement est traité à part : vous recevrez un e-mail dès qu'il sera effectué.\n\n${textSummary(o, lines)}${footerText}`;
    return { subject: `Votre commande ${o.reference} est annulée`, html, text };
  }

  const amount = eur(data.refundCents ?? o.refund_cents);
  const html = layout(site, `Remboursement de ${amount} sur votre commande ${o.reference}.`, "Remboursement effectué.", [
    p(hello),
    p(`Nous avons remboursé <strong>${amount}</strong> sur votre commande <strong>${esc(o.reference)}</strong>, sur le moyen de paiement utilisé à l'achat.`),
    p("Selon votre banque, le montant apparaît sur votre compte sous 5 à 10 jours ouvrés."),
  ].join("\n"));
  const text = `${helloText}\n\nNous avons remboursé ${amount} sur votre commande ${o.reference}, sur le moyen de paiement utilisé à l'achat.\nSelon votre banque, le montant apparaît sur votre compte sous 5 à 10 jours ouvrés.${footerText}`;
  return { subject: `Remboursement de ${amount} · commande ${o.reference}`, html, text };
}

/** L'alerte envoyée à la boutique à chaque nouvelle commande. */
export function shopAlert(data: { order: OrderDetail; lines: OrderLine[]; site: string }): Mail {
  const { order: o, lines, site } = data;
  const units = lines.reduce((s, l) => s + l.units, 0);
  const link = `${site}/admin/commandes/${o.id}`;
  const html = layout(site, `${eur(o.total_cents)} · ${units} pot${units > 1 ? "s" : ""} · ${o.city}`, `Nouvelle commande ${esc(o.reference)}`, [
    p(`<strong>${eur(o.total_cents)}</strong> · ${units} pot${units > 1 ? "s" : ""} · ${esc(o.name || o.email)} · ${esc(o.city)}, ${esc(country(o.country_code))}`),
    summary(o, lines),
    button(link, "Ouvrir la commande"),
  ].join("\n"));
  return { subject: `Nouvelle commande ${o.reference} · ${eur(o.total_cents)}`, html, text: `Nouvelle commande ${o.reference}\n${eur(o.total_cents)} · ${units} pot(s) · ${o.name || o.email} · ${o.city}, ${country(o.country_code)}\n\n${textSummary(o, lines)}\n\n${link}` };
}
