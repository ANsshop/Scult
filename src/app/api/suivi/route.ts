import { z } from "zod";
import { hasDb } from "@/lib/db";
import { recordEvent } from "@/lib/store/events";

/**
 * La mesure d'audience du site (voir components/site/Suivi.tsx) : une visite,
 * une fiche produit vue, un ajout au panier. Sert au taux de conversion de
 * l'admin. Rien de personnel n'est gardé : ni adresse IP, ni compte, ni cookie.
 * Répond toujours 204 : le site n'attend rien de cet appel.
 */
const schema = z.object({
  type: z.enum(["visit", "product_view", "add_to_cart"]),
  sid: z.string().min(8).max(64).regex(/^[a-zA-Z0-9-]+$/),
  path: z.string().max(200).startsWith("/").optional(),
  source: z.string().max(80).regex(/^[a-z0-9._-]+$/).optional(),
  device: z.enum(["mobile", "desktop"]).optional(),
});
const BOT = /bot|crawl|spider|slurp|preview|headless|lighthouse|pingdom|monitor/i;

export async function POST(req: Request) {
  const done = new Response(null, { status: 204 });
  if (!hasDb() || BOT.test(req.headers.get("user-agent") ?? "")) return done;
  let body: unknown;
  try { body = await req.json(); } catch { return done; }
  const parsed = schema.safeParse(body);
  if (!parsed.success || parsed.data.path?.startsWith("/admin")) return done;
  const { type, sid, path, source, device } = parsed.data;
  await recordEvent({ type, sessionId: sid, path, source: source ?? "direct", device });
  return done;
}
