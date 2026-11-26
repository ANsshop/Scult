import { hasDb } from "@/lib/db";
import { verifyWebhook } from "@/lib/sendcloud";
import { applyTracking } from "@/lib/store/shipping";

/**
 * Les signaux de suivi de Sendcloud : « le colis est parti », « il est livré ».
 * La commande avance toute seule et le client reçoit son avis d'expédition.
 *
 * Sur le compte partagé de Peptide Partners, Sendcloud n'appelle qu'une
 * adresse (celle du socle) : c'est le socle qui relaie ici le corps et la
 * signature d'origine pour les colis de SCULT. Un colis inconnu est accepté
 * sans rien faire (200), sinon Sendcloud réessaierait dix fois pour rien.
 */
export async function POST(req: Request) {
  if (!hasDb()) return new Response("Not configured", { status: 500 });
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get("sendcloud-signature"))) return new Response("Invalid signature", { status: 401 });
  let event: { action?: string; parcel?: { id?: number; tracking_number?: string | null; tracking_url?: string | null; status?: { id?: number; message?: string }; carrier?: { code?: string; name?: string } } };
  try { event = JSON.parse(raw); } catch { return new Response("Bad payload", { status: 400 }); }
  const parcel = event.parcel;
  if (event.action !== "parcel_status_changed" || !parcel?.id) return new Response(null, { status: 200 });
  try {
    await applyTracking(parcel.id, { statusCode: parcel.status?.id ?? null, status: parcel.status?.message ?? null, trackingNumber: parcel.tracking_number ?? null, trackingUrl: parcel.tracking_url ?? null, carrier: parcel.carrier?.name ?? parcel.carrier?.code ?? null });
  } catch (e) {
    console.error("[webhook sendcloud]", e);
    return new Response("Failed", { status: 500 }); // Sendcloud réessaiera
  }
  return new Response(null, { status: 200 });
}
