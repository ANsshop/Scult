/** Les transporteurs proposés dans l'admin. */
export const CARRIERS = ["Colissimo", "Chronopost", "Mondial Relay", "DHL", "UPS", "Autre"];

/** Le lien de suivi public d'un colis, pour les transporteurs dont l'adresse est stable ; `null` sinon. */
export function trackingUrl(carrier: string | null, number: string | null): string | null {
  if (!number) return null;
  const n = encodeURIComponent(number.trim());
  const c = (carrier ?? "").toLowerCase();
  if (c.includes("colissimo") || c.includes("la poste")) return `https://www.laposte.fr/outils/suivre-vos-envois?code=${n}`;
  if (c.includes("chronopost")) return `https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=${n}`;
  if (c.includes("mondial")) return `https://www.mondialrelay.fr/suivi-de-colis/?numeroExpedition=${n}`;
  if (c.includes("dhl")) return `https://www.dhl.com/fr-fr/home/tracking.html?tracking-id=${n}`;
  if (c.includes("ups")) return `https://www.ups.com/track?loc=fr_FR&tracknum=${n}`;
  return null;
}
