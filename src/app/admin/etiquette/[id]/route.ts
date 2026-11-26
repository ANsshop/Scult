import { currentAdmin } from "@/lib/admin/auth";
import { db } from "@/lib/db";
import { labelPdf } from "@/lib/sendcloud";

/**
 * Le PDF de l'étiquette d'une commande, servi à l'admin connecté (la clé
 * Sendcloud ne quitte pas le serveur). Si le PDF n'est pas prêt ou n'existe
 * plus, une petite page le dit au lieu d'une erreur brute.
 */
const page = (title: string, text: string, status: number) =>
  new Response(`<!doctype html><html lang="fr"><meta charset="utf-8"><title>${title}</title><body style="font-family:system-ui;padding:3rem;max-width:36rem;margin:auto"><h1 style="font-size:1.4rem">${title}</h1><p style="color:#52514e;line-height:1.6">${text}</p></body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await currentAdmin())) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return page("Commande introuvable", "", 404);
  const order = await db.one<{ reference: string; sendcloud_parcel_id: string | null }>("select reference, sendcloud_parcel_id from orders where id = $1", [id]);
  if (!order?.sendcloud_parcel_id) return page("Pas d'étiquette", "Cette commande n'a pas d'étiquette Sendcloud.", 404);
  const result = await labelPdf(Number(order.sendcloud_parcel_id));
  if (!result.ok) return page(result.status === 404 ? "Étiquette pas encore prête" : "Étiquette indisponible", result.status === 404 ? "Sendcloud la fabrique en quelques secondes : rechargez cette page." : result.message, result.status === 404 ? 425 : 409);
  return new Response(result.pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="etiquette-${order.reference}.pdf"`, "Cache-Control": "private, no-store" } });
}
