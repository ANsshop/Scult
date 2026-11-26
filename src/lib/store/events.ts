import "server-only";
import { db } from "@/lib/db";

export type EventType = "visit" | "product_view" | "add_to_cart" | "checkout_start";

/**
 * Note ce que fait un visiteur (voir la table `events`). Ne fait jamais échouer
 * l'appelant : une mesure d'audience perdue ne doit rien casser.
 */
export async function recordEvent(e: { type: EventType; sessionId: string; path?: string | null; sku?: string | null; source?: string | null; device?: "mobile" | "desktop" | null }) {
  try {
    await db.query("insert into events (type, session_id, path, sku, source, device) values ($1, $2, $3, $4, $5, $6)", [
      e.type, e.sessionId.slice(0, 64), e.path?.slice(0, 200) ?? null, e.sku?.slice(0, 64) ?? null, e.source?.slice(0, 80) ?? null, e.device ?? null,
    ]);
  } catch (error) {
    console.error("[suivi]", error instanceof Error ? error.message : error);
  }
}
