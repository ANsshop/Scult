/**
 * De faux services, pour développer et tester sans rien envoyer de vrai : Resend (e-mails) et Sendcloud (étiquettes).
 *   npm run mock:services         écoute sur http://localhost:3099 (à laisser tourner)
 *
 * Le site les vise quand .env.local contient RESEND_API_URL=http://localhost:3099/resend et
 * SENDCLOUD_API_URL=http://localhost:3099/sendcloud. Ce qui a été « envoyé » se lit sur /_sent (e-mails) et
 * /_shipments (étiquettes) ; POST /_parcels/<id>/status change l'état d'un colis ; POST /_reset vide tout.
 */
import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 3099);
let sent = [], shipments = [], parcels = new Map(), nextParcel = 700001;
const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 288 432]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");

const json = (res, status, body) => { res.writeHead(status, { "Content-Type": "application/json" }); res.end(JSON.stringify(body)); };
const read = (req) => new Promise((resolve) => { let data = ""; req.on("data", (c) => (data += c)); req.on("end", () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } }); });
const view = (p) => ({ id: p.id, tracking_number: p.tracking, tracking_url: p.tracking ? `https://suivi.exemple/${p.tracking}` : null, status: { id: p.statusId, message: p.statusMessage }, carrier: { code: "colissimo", name: "Colissimo" } });

createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;
  const body = req.method === "POST" ? await read(req) : {};

  // — contrôle —
  if (path === "/_sent") return json(res, 200, sent);
  if (path === "/_shipments") return json(res, 200, shipments);
  if (path === "/_reset") { sent = []; shipments = []; parcels = new Map(); return json(res, 200, { ok: true }); }
  let m = path.match(/^\/_parcels\/(\d+)\/status$/);
  if (m) { const p = parcels.get(Number(m[1])); if (!p) return json(res, 404, {}); p.statusId = body.id; p.statusMessage = body.message; return json(res, 200, view(p)); }

  // — Resend —
  if (path === "/resend/emails" && req.method === "POST") {
    if (!req.headers.authorization) return json(res, 401, { message: "Missing API key" });
    sent.push({ to: body.to?.[0], from: body.from, replyTo: body.reply_to, subject: body.subject, html: body.html, text: body.text, at: new Date().toISOString() });
    return json(res, 200, { id: `mock-${sent.length}` });
  }

  // — Sendcloud —
  if (path.startsWith("/sendcloud/") && !String(req.headers.authorization ?? "").startsWith("Basic ")) return json(res, 401, { errors: [{ detail: "Authentication required" }] });
  if (path === "/sendcloud/v3/fetch-shipping-options") {
    const option = (code, name, carrier, price, extra = {}) => ({ code, name, carrier: { code: carrier.toLowerCase(), name: carrier }, contract: { id: 4242, name: "PP" }, functionalities: { last_mile: "home_delivery", signature: false }, quotes: [{ price: { breakdown: [{ price: { value: String(price - 0.4), currency: "EUR" } }, { price: { value: "0.40", currency: "EUR" } }] } }], ...extra });
    return json(res, 200, { data: [
      option("chronopost:13", "Chronopost 13", "Chronopost", 11.9, { functionalities: { last_mile: "home_delivery", signature: true } }),
      option("colissimo:home", "Colissimo Domicile", "Colissimo", 6.5),
      option("mondial_relay:pointrelais", "Mondial Relay Point Relais", "Mondial Relay", 3.9, { functionalities: { last_mile: "service_point" } }),
      option("lettre:nonaffranchie", "Unstamped letter", "Sendcloud", 0.1, { contract: null }),
    ] });
  }
  if (path === "/sendcloud/v3/shipments" && req.method === "POST") {
    shipments.push(body);
    if (!body.brand_id || !body.from_address?.sender_address_id) return json(res, 400, { errors: [{ detail: "brand_id and sender_address_id are required", source: { pointer: "/from_address" } }] });
    if (!body.to_address?.email) return json(res, 400, { errors: [{ detail: "email is required", source: { pointer: "/to_address/email" } }] });
    const p = { id: nextParcel++, tracking: null, statusId: 1000, statusMessage: "Prêt à envoyer", pdfAsked: 0 };
    parcels.set(p.id, p);
    return json(res, 201, { data: { id: `ship-${p.id}`, parcels: [view(p)] } });
  }
  m = path.match(/^\/sendcloud\/v2\/parcels\/(\d+)$/);
  if (m) { const p = parcels.get(Number(m[1])); if (!p) return json(res, 404, { error: { message: "No Parcel matches the given query." } }); p.tracking ??= "6A" + String(p.id).padStart(11, "0"); return json(res, 200, { parcel: view(p) }); }
  m = path.match(/^\/sendcloud\/v2\/parcels\/(\d+)\/cancel$/);
  if (m) { const p = parcels.get(Number(m[1])); if (!p) return json(res, 404, {}); p.statusId = 2000; p.statusMessage = "Annulé"; return json(res, 200, { status: "cancelled" }); }
  m = path.match(/^\/sendcloud\/v3\/parcels\/(\d+)\/documents\/label$/);
  if (m) {
    const p = parcels.get(Number(m[1]));
    // Comme le vrai : le PDF n'est pas prêt au premier appel.
    if (!p || p.pdfAsked++ === 0) return json(res, 404, { errors: [{ detail: "Document not ready" }] });
    res.writeHead(200, { "Content-Type": "application/pdf" });
    return res.end(PDF);
  }
  json(res, 404, { error: "inconnu : " + path });
}).listen(PORT, () => console.log(`✓ faux services (Resend, Sendcloud) sur http://localhost:${PORT}`));
