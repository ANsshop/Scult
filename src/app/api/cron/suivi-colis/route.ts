import { hasDb } from "@/lib/db";
import { sendcloudReady } from "@/lib/sendcloud";
import { syncAllParcels } from "@/lib/store/shipping";

/**
 * Le rattrapage du suivi : réinterroge Sendcloud pour chaque colis encore en
 * route, au cas où un signal se serait perdu. À appeler toutes les heures par
 * une tâche planifiée, avec `Authorization: Bearer <CRON_SECRET>`.
 * Sans CRON_SECRET, la route est fermée : elle ne reste jamais ouverte par oubli.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  if (!hasDb() || !sendcloudReady()) return Response.json({ skipped: true });
  return Response.json(await syncAllParcels());
}
