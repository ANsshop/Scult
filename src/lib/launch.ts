import "server-only";
import { unstable_cache } from "next/cache";
import { hasDb } from "@/lib/db";

/**
 * L'état du lancement : la boutique vend-elle, et sinon, quand sort le produit.
 *
 * Avant la sortie (décidé le 2026-11-27 : sortie en janvier, site en ligne
 * avant pour être indexé), le site ne vend pas : les boutons d'achat laissent
 * la place à une liste d'attente, et le paiement est refusé côté serveur.
 *
 * Avec une base : deux réglages de l'admin (`shopOpen`, `launchLabel`, page
 * Réglages). Sans base : fermé par défaut ; `SHOP_OPEN=1` ouvre, `LAUNCH_LABEL`
 * change la date. `waitlist` : peut-on inscrire quelqu'un (il faut la base).
 */
export type Launch = { open: boolean; when: string; waitlist: boolean };
export const LAUNCH_TAG = "launch";

const fromDb = unstable_cache(
  async () => {
    const { getSettings } = await import("@/lib/store/settings");
    const s = await getSettings();
    return { open: s.shopOpen, when: s.launchLabel };
  },
  ["launch"],
  { tags: [LAUNCH_TAG], revalidate: 60 },
);

export async function getLaunch(): Promise<Launch> {
  if (!hasDb()) return { open: process.env.SHOP_OPEN === "1", when: process.env.LAUNCH_LABEL || "janvier 2027", waitlist: false };
  try {
    return { ...(await fromDb()), waitlist: true };
  } catch (error) {
    // Base injoignable : on ne vend pas à l'aveugle, et on n'inscrit personne.
    console.error("[lancement]", error instanceof Error ? error.message : error);
    return { open: false, when: process.env.LAUNCH_LABEL || "janvier 2027", waitlist: false };
  }
}
