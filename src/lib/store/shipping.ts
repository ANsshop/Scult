import "server-only";
import { sendOrderEmail } from "@/lib/notify/orders";
import { orderStatusFor, readParcel } from "@/lib/sendcloud";
import { applyParcelState, parcelsToSync } from "./orders";

/**
 * Le suivi d'un colis, appliqué à sa commande : par le signal de Sendcloud
 * (webhook), par le bouton « Actualiser le suivi » ou par la passe de
 * rattrapage. Dans tous les cas le même chemin, et un seul e-mail au client :
 * au moment où la commande passe réellement à « expédiée ».
 */
export async function applyTracking(parcelId: number | string, state: { statusCode: number | null; status: string | null; trackingNumber: string | null; trackingUrl: string | null; carrier: string | null }) {
  const result = await applyParcelState(parcelId, { status: state.status, trackingNumber: state.trackingNumber, trackingUrl: state.trackingUrl, carrier: state.carrier, orderStatus: orderStatusFor(state.statusCode) });
  if (result?.became === "shipped") await sendOrderEmail(result.orderId, "shipped", { actor: "Sendcloud" });
  return result;
}

/** Réinterroge Sendcloud pour un colis. */
export async function syncParcel(parcelId: number | string) {
  return applyTracking(parcelId, await readParcel(Number(parcelId)));
}

/** La passe de rattrapage : tous les colis encore en route. Un colis en erreur n'arrête pas les autres. */
export async function syncAllParcels() {
  const parcels = await parcelsToSync();
  let changed = 0, failed = 0;
  for (const p of parcels) {
    try { if ((await syncParcel(p.sendcloud_parcel_id))?.became) changed++; } catch (e) { failed++; console.error("[suivi]", p.sendcloud_parcel_id, e instanceof Error ? e.message : e); }
  }
  return { checked: parcels.length, changed, failed };
}
