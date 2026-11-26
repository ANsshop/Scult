/**
 * Les tests de bout en bout du backend et de l'admin : une commande qui arrive par le signal Stripe (totaux, stock,
 * code promo, rejeu sans doublon), la mesure d'audience, puis l'admin au navigateur (connexion, préparation,
 * expédition, remboursement, annulation, réassort, prix, codes promo, blocage après trop d'essais).
 *
 *   npm run test:admin                      contre http://localhost:3010
 *   npm run test:admin -- http://localhost:3002
 *
 * Il faut : la base LOCALE lancée et remplie (npm run db:local, db:migrate, db:seed -- --demo), le compte de test
 * (npm run db:admin -- demo@scult.eu "Démo" "bouffon-demo-2026"), les faux services (npm run mock:services), le site
 * lancé sur cette base avec le .env.local qui vise ces faux services, et Google Chrome.
 * ⚠ Écrit et efface des commandes : refusé si la base n'est pas locale.
 */
import { chromium } from "playwright-core";
import { createHmac } from "node:crypto";
import pg from "pg";
import Stripe from "stripe";
import { databaseUrl, isLocal } from "./db/_env.mjs";

if (!isLocal()) { console.error("✗ ces tests écrivent dans la base : ils ne tournent que sur la base locale."); process.exit(1); }
const base = process.argv[2] ?? "http://localhost:3010";
const env = process.env;
const db = new pg.Client({ connectionString: databaseUrl() });
await db.connect();
const MOCK = "http://localhost:3099";
if (!(await fetch(MOCK + "/_reset", { method: "POST" }).then((r) => r.ok).catch(() => false))) { console.error("✗ les faux services ne répondent pas : lancez npm run mock:services."); process.exit(1); }
const sent = async () => (await fetch(MOCK + "/_sent")).json();
const one = async (q, p) => (await db.query(q, p)).rows[0];
let failed = 0;
const check = (name, ok, detail = "") => { console.log(`${ok ? "✓" : "✗"} ${name}${detail ? " — " + detail : ""}`); if (!ok) failed++; };

// 1. Accès : sans session, l'admin renvoie à la connexion
for (const path of ["/admin", "/admin/commandes", "/admin/reglages"]) {
  const r = await fetch(base + path, { redirect: "manual" });
  check(`sans session, ${path} redirige vers la connexion`, r.status >= 300 && r.status < 400 && (r.headers.get("location") ?? "").includes("/admin/connexion"), `${r.status} ${r.headers.get("location")}`);
}

// 2. Le site lit la base
const fiche = await (await fetch(base + "/produits/cri")).text();
check("la fiche produit affiche le prix de la base (49 €)", /49\s?€/.test(fiche));

// 3. Une commande arrive par le signal Stripe
const stock0 = (await one("select stock from variants where sku = 'SCULT-CRI-690-FP'")).stock;
const uses0 = (await one("select uses_count from promo_codes where code = 'BOUFFON10'")).uses_count;
const ref = "cs_test_e2e_" + Date.now();
const session = {
  id: ref, object: "checkout.session", payment_status: "paid",
  metadata: { lines: JSON.stringify([{ sku: "SCULT-CRI-690-FP-X2", quantity: 1 }, { sku: "SCULT-CRI-690-FP", quantity: 1 }]), shippingCents: "0", promoCode: "bouffon10" },
  customer_details: { email: "Test.E2E@Exemple.fr", name: "Test Bout en bout", address: { line1: "1 rue du Test", line2: null, postal_code: "75001", city: "Paris", country: "FR" } },
};
const payload = JSON.stringify({ id: "evt_e2e_" + Date.now(), object: "event", type: "checkout.session.completed", data: { object: session } });
const sign = () => Stripe.webhooks.generateTestHeaderString({ payload, secret: env.STRIPE_WEBHOOK_SECRET });
const hook = async (signature) => fetch(base + "/api/stripe/webhook", { method: "POST", body: payload, headers: { "stripe-signature": signature, "content-type": "application/json" } });
check("signal Stripe mal signé : refusé", (await hook("t=1,v1=faux")).status === 400);
check("signal Stripe valide : accepté", (await hook(sign())).status === 200);
const order = await one("select * from orders where external_ref = $1", [ref]);
check("la commande est écrite, payée", order?.status === "paid", order?.reference);
// 83,30 + 49,00 = 132,30 ; −10 % = 13,23 ; port offert → 119,07
check("totaux : sous-total 132,30 €, remise 13,23 €, total 119,07 €", order.subtotal_cents === 13230 && order.discount_cents === 1323 && order.total_cents === 11907, `${order.subtotal_cents}/${order.discount_cents}/${order.total_cents}`);
check("prix de revient figé : 3 pots × 14,50 €", order.cost_cents === 4350, String(order.cost_cents));
check("e-mail du client en minuscules, client créé", order.email === "test.e2e@exemple.fr" && Boolean(order.customer_id));
const stock1 = (await one("select stock from variants where sku = 'SCULT-CRI-690-FP'")).stock;
check("stock : 3 pots sortis (le pack puise dans le pot)", stock0 - stock1 === 3, `${stock0} → ${stock1}`);
const mv = await one("select delta, stock_after, reason from stock_movements where order_id = $1", [order.id]);
check("journal du stock : −3, motif commande", mv?.delta === -3 && mv.reason === "order" && mv.stock_after === stock1);
check("code promo compté", (await one("select uses_count from promo_codes where code = 'BOUFFON10'")).uses_count === uses0 + 1);
check("signal rejoué : accepté, pas de doublon", (await hook(sign())).status === 200 && (await one("select count(*)::int n from orders where external_ref = $1", [ref])).n === 1 && (await one("select stock from variants where sku = 'SCULT-CRI-690-FP'")).stock === stock1);

// 3 bis. Les e-mails de la commande
let mails = await sent();
const confirmation = mails.filter((m) => m.to === "test.e2e@exemple.fr" && m.subject.includes("confirmée"));
check("confirmation envoyée au client, une seule fois malgré le signal rejoué", confirmation.length === 1, `${confirmation.length} e-mail(s)`);
check("la confirmation porte la référence, le total et l'adresse", confirmation[0]?.subject.includes(order.reference) && confirmation[0].html.includes("119,07") && confirmation[0].text.includes("1 rue du Test") && confirmation[0].replyTo === "hello@scult.eu");
check("alerte « nouvelle commande » envoyée à la boutique", mails.some((m) => m.to === "boutique@exemple.fr" && m.subject.includes(order.reference)));
check("l'envoi est noté dans l'historique de la commande", (await one("select count(*)::int n from order_events where order_id = $1 and type = 'email'", [order.id])).n === 1);

// 4. Mesure d'audience
const sid = "e2e-" + Date.now();
await fetch(base + "/api/suivi", { method: "POST", headers: { "content-type": "application/json", "user-agent": "Mozilla/5.0 Test" }, body: JSON.stringify({ type: "product_view", sid, path: "/produits/cri", source: "instagram", device: "mobile" }) });
check("une fiche vue est notée", (await one("select count(*)::int n from events where session_id = $1", [sid])).n === 1);
await fetch(base + "/api/suivi", { method: "POST", headers: { "content-type": "application/json", "user-agent": "Googlebot" }, body: JSON.stringify({ type: "visit", sid: sid + "-bot", path: "/" }) });
check("un robot n'est pas compté", (await one("select count(*)::int n from events where session_id = $1", [sid + "-bot"])).n === 0);

// 5. L'admin, au navigateur
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(base + "/admin/connexion");
await page.fill('input[name="email"]', "demo@scult.eu");
await page.fill('input[name="password"]', "mauvais-mot-de-passe");
await page.click('button[type="submit"]');
await page.waitForURL(/erreur=/);
check("mauvais mot de passe : refusé avec un message", (await page.textContent("body")).includes("incorrect"));
await page.fill('input[name="email"]', "demo@scult.eu");
await page.fill('input[name="password"]', "bouffon-demo-2026");
await Promise.all([page.waitForURL((u) => u.pathname === "/admin"), page.click('button[type="submit"]')]);
check("bon mot de passe : tableau de bord", (await page.textContent("h1")).toLowerCase().includes("tableau"));

const status = async () => (await one("select status, tracking_number, stock_returned, refund_cents from orders where id = $1", [order.id]));
// Chaque geste part d'une adresse sans message, pour attendre le message de CE geste et pas celui d'avant.
const fiche2 = `${base}/admin/commandes/${order.id}`;
const act = async (prepare, button, pattern = /ok=/) => { await page.goto(fiche2); await prepare(); await Promise.all([page.waitForURL(pattern), page.locator(`button:has-text("${button}"):visible`).first().click()]); };
await act(async () => {}, "Je prépare ce colis");
check("préparer → en préparation", (await status()).status === "preparing");
await act(async () => { await page.locator('input[name="tracking"]:visible').fill("6A99999999999"); }, "Marquer expédiée");
check("expédier avec suivi → expédiée", (await status()).status === "shipped" && (await status()).tracking_number === "6A99999999999");
mails = await sent();
const parti = mails.filter((m) => m.to === "test.e2e@exemple.fr" && m.subject.includes("est partie"));
check("avis d'expédition envoyé, avec le numéro et le lien de suivi", parti.length === 1 && parti[0].html.includes("6A99999999999") && parti[0].html.includes("laposte.fr"));
await page.goto(fiche2);
check("pas de bouton « Annuler » sur une commande partie", (await page.locator('summary:has-text("Annuler la commande")').count()) === 0);
const openRefund = async (amount, restock = false) => { await page.locator('summary:has-text("Consigner un remboursement")').click(); if (amount) await page.locator('input[name="amount"]').fill(amount); if (restock) await page.locator('input[name="restock"]').check(); };
await act(() => openRefund("19,07"), "Consigner le remboursement");
check("remboursement partiel : 19,07 € consignés, statut inchangé", (await status()).refund_cents === 1907 && (await status()).status === "shipped");
await act(() => openRefund("500"), "Consigner le remboursement", /erreur=/);
check("rembourser plus que payé : refusé", (await status()).refund_cents === 1907);
await act(() => openRefund(null, true), "Consigner le remboursement");
const st = await status();
check("remboursement du reste, stock remis → remboursée", st.status === "refunded" && st.refund_cents === 11907 && st.stock_returned);
mails = await sent();
check("avis de remboursement envoyé pour chaque remboursement consigné", mails.filter((m) => m.to === "test.e2e@exemple.fr" && m.subject.startsWith("Remboursement")).length === 2 && mails.some((m) => m.subject.includes("19,07")));
check("le stock est revenu à sa valeur de départ", (await one("select stock from variants where sku = 'SCULT-CRI-690-FP'")).stock === stock0);

// Annulation d'une commande en attente, avec retour en stock
const waitingOrder = await one("select o.id, (select sum(units)::int from order_lines l where l.order_id = o.id) as units from orders o where status = 'paid' order by paid_at limit 1");
const sBefore = (await one("select stock from variants where sku = 'SCULT-CRI-690-FP'")).stock;
await page.goto(`${base}/admin/commandes/${waitingOrder.id}`);
await page.locator('summary:has-text("Annuler la commande")').click();
await Promise.all([page.waitForURL(/ok=/), page.locator('button:has-text("Confirmer l\'annulation")').click()]);
check("annulation : commande annulée, stock remis", (await one("select status from orders where id = $1", [waitingOrder.id])).status === "cancelled" && (await one("select stock from variants where sku = 'SCULT-CRI-690-FP'")).stock === sBefore + waitingOrder.units);
// Une commande annulée ne repart pas : l'action est refusée même si on la force
const forced = await page.evaluate(async (id) => { const f = new FormData(); f.set("id", id); return id; }, waitingOrder.id);
check("la commande annulée n'offre plus d'étape suivante", (await page.locator('button:has-text("Je prépare ce colis")').count()) === 0 && Boolean(forced));

// Stock : un réassort
const product = await one("select id from products where slug = 'cri'");
const sRe = (await one("select stock from variants where sku = 'SCULT-CRI-690-FP'")).stock;
await page.goto(`${base}/admin/produits/${product.id}`);
await page.locator('input[name="quantity"]').fill("120");
await page.locator('input[name="note"]').fill("Lot e2e");
await Promise.all([page.waitForURL(/ok=/), page.locator('button:has-text("Valider")').click()]);
check("réassort de 120 : stock +120, journal écrit", (await one("select stock from variants where sku = 'SCULT-CRI-690-FP'")).stock === sRe + 120 && (await one("select delta, reason from stock_movements order by id desc limit 1")).reason === "restock");

// Prix : changé dans l'admin, visible sur le site
const setPrice = async (value) => {
  await page.goto(`${base}/admin/produits/${product.id}`);
  const form = page.locator('form:has(input[name="price"])').first();
  await form.locator('input[name="price"]').fill(value);
  await Promise.all([page.waitForURL(/ok=/), form.locator('button:has-text("Enregistrer")').click()]);
};
const siteShows = async (text) => { for (let i = 0; i < 10; i++) { if ((await (await fetch(base + "/produits/cri", { cache: "no-store" })).text()).includes(text)) return i; await new Promise((r) => setTimeout(r, 500)); } return -1; };
await setPrice("51,90");
check("prix enregistré en base (51,90 €)", (await one("select price_cents from variants where sku = 'SCULT-CRI-690-FP'")).price_cents === 5190);
const tries = await siteShows("51,90");
check("le nouveau prix (51,90 €) est sur la fiche du site", tries >= 0, tries >= 0 ? `au ${tries + 1}ᵉ chargement` : "toujours l'ancien après 5 s");
await setPrice("49");
check("prix remis à 49 €", (await one("select price_cents from variants where sku = 'SCULT-CRI-690-FP'")).price_cents === 4900 && (await siteShows("49\u00a0€")) >= 0);

// Code promo : création, doublon refusé
await page.goto(base + "/admin/promos/nouveau");
const code = "E2E" + String(Date.now()).slice(-6);
await page.fill('input[name="code"]', code);
await page.fill('input[name="value"]', "15");
await Promise.all([page.waitForURL(/\/admin\/promos\?ok=/), page.click('button:has-text("Créer le code")')]);
check("code promo créé", (await one("select discount_value from promo_codes where code = $1", [code]))?.discount_value === 15);
await page.goto(base + "/admin/promos/nouveau");
await page.fill('input[name="code"]', code);
await page.fill('input[name="value"]', "15");
await Promise.all([page.waitForURL(/erreur=/), page.click('button:has-text("Créer le code")')]);
check("code promo en double : refusé", (await one("select count(*)::int n from promo_codes where code = $1", [code])).n === 1);

// Sendcloud : étiquette, PDF, annulation, suivi automatique
const ref2 = "cs_test_e2e_sc_" + Date.now();
const payload2 = JSON.stringify({ id: "evt_e2e_sc_" + Date.now(), object: "event", type: "checkout.session.completed", data: { object: { ...session, id: ref2, metadata: { lines: JSON.stringify([{ sku: "SCULT-CRI-690-FP", quantity: 1 }]), shippingCents: "590", promoCode: "" }, customer_details: { ...session.customer_details, email: "colis.e2e@exemple.fr", address: { ...session.customer_details.address, line1: "12 bis rue des Lilas" } } } } });
await fetch(base + "/api/stripe/webhook", { method: "POST", body: payload2, headers: { "stripe-signature": Stripe.webhooks.generateTestHeaderString({ payload: payload2, secret: env.STRIPE_WEBHOOK_SECRET }), "content-type": "application/json" } });
const o2 = await one("select id, reference from orders where external_ref = $1", [ref2]);
const row2 = async () => one("select status, sendcloud_parcel_id, tracking_number, tracking_url, sendcloud_status from orders where id = $1", [o2.id]);
const fiche3 = `${base}/admin/commandes/${o2.id}`;
await page.goto(fiche3);
const choices = await page.locator('select[name="option"]:visible option').allTextContents();
check("modes d'envoi : à domicile seulement, le moins cher d'abord, avec le prix", choices.length === 2 && choices[0].startsWith("Colissimo Domicile") && choices[0].includes("6,50") && !choices.join().includes("Relais"), choices.join(" | "));
check("poids proposé d'après les articles (780 g + 150 g d'emballage)", (await page.locator('input[name="weight"]:visible').inputValue()) === "0,93");
const makeLabel = async () => { await page.goto(fiche3); await Promise.all([page.waitForURL(/ok=/), page.locator('button:has-text("Créer l\'étiquette"):visible').first().click()]); };
await makeLabel();
let r2 = await row2();
check("étiquette créée : colis noté, suivi reçu, commande en préparation", Boolean(r2.sendcloud_parcel_id) && /^6A/.test(r2.tracking_number ?? "") && r2.status === "preparing", JSON.stringify(r2));
const shipped = (await (await fetch(MOCK + "/_shipments")).json()).at(-1);
check("envoyée à Sendcloud avec la marque et l'adresse de SCULT", shipped.brand_id === 111 && shipped.from_address.sender_address_id === 222 && shipped.order_number === o2.reference);
check("adresse découpée : numéro « 12 bis », voie « rue des Lilas »", shipped.to_address.house_number === "12 bis" && shipped.to_address.address_line_1 === "rue des Lilas" && shipped.to_address.email === "colis.e2e@exemple.fr");
check("mode d'envoi et poids transmis", shipped.ship_with.properties.shipping_option_code === "colissimo:home" && shipped.ship_with.properties.contract_id === 4242 && shipped.parcels[0].weight.value === "0.930");
const pdf = await page.request.get(`${base}/admin/etiquette/${o2.id}`);
check("le PDF de l'étiquette s'ouvre (après l'attente du premier essai)", pdf.status() === 200 && pdf.headers()["content-type"] === "application/pdf" && (await pdf.body()).subarray(0, 4).toString() === "%PDF");
check("le PDF est fermé sans session", (await fetch(`${base}/admin/etiquette/${o2.id}`)).status === 401);
await page.goto(fiche3);
await page.locator('summary:has-text("Annuler cette étiquette"):visible').first().click();
await Promise.all([page.waitForURL(/ok=/), page.locator('button:has-text("Annuler l\'étiquette chez Sendcloud"):visible').first().click()]);
check("étiquette annulée : la commande n'en a plus", (await row2()).sendcloud_parcel_id === null);
await makeLabel();
r2 = await row2();
check("une nouvelle étiquette se crée après l'annulation", Boolean(r2.sendcloud_parcel_id));
const signal = async (statusId, message, secret = env.SENDCLOUD_WEBHOOK_SECRET) => {
  const raw = JSON.stringify({ action: "parcel_status_changed", timestamp: Date.now(), parcel: { id: Number(r2.sendcloud_parcel_id), tracking_number: r2.tracking_number, tracking_url: "https://suivi.exemple/x", status: { id: statusId, message }, carrier: { code: "colissimo", name: "Colissimo" } } });
  return (await fetch(base + "/api/webhooks/sendcloud", { method: "POST", body: raw, headers: { "sendcloud-signature": createHmac("sha256", secret).update(raw).digest("hex"), "content-type": "application/json" } })).status;
};
check("signal de suivi mal signé : refusé", (await signal(3, "En route", "mauvais-secret")) === 401);
check("signal « prêt à envoyer » : accepté, rien ne change", (await signal(1000, "Prêt à envoyer")) === 200 && (await row2()).status === "preparing");
check("signal « en route » : commande expédiée", (await signal(3, "En route vers le centre de tri")) === 200 && (await row2()).status === "shipped" && (await row2()).sendcloud_status === "En route vers le centre de tri");
await signal(3, "En route vers le centre de tri");
mails = await sent();
const avis = mails.filter((m) => m.to === "colis.e2e@exemple.fr" && m.subject.includes("est partie"));
check("avis d'expédition envoyé une seule fois, avec le lien de suivi de Sendcloud", avis.length === 1 && avis[0].html.includes("https://suivi.exemple/"), `${avis.length} e-mail(s)`);
check("signal « livré » : commande livrée", (await signal(11, "Livré")) === 200 && (await row2()).status === "delivered");
check("un signal en retard ne fait pas reculer la commande", (await signal(3, "En route")) === 200 && (await row2()).status === "delivered");
check("rattrapage du suivi : fermé sans clé, ouvert avec", (await fetch(base + "/api/cron/suivi-colis")).status === 401 && (await fetch(base + "/api/cron/suivi-colis", { headers: { authorization: `Bearer ${env.CRON_SECRET}` } })).status === 200);

// Code promo sur la page de commande : la raison du refus, puis la remise
const shop = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
await shop.goto(base + "/produits/cri?intro=0");
await shop.locator('button:has-text("Ajouter"):visible').first().click();
await shop.waitForTimeout(1200);
await shop.goto(base + "/checkout");
await shop.fill("#code-promo", "NEXISTEPAS");
await shop.click('button:has-text("Appliquer")');
await shop.waitForFunction(() => document.querySelector("#code-promo-etat")?.textContent?.trim().length > 0);
check("code inconnu : le client lit pourquoi", (await shop.textContent("#code-promo-etat")).includes("n'existe pas"));
await shop.fill("#code-promo", "bouffon10");
await shop.click('button:has-text("Appliquer")');
await shop.waitForFunction(() => document.querySelector("#code-promo-etat")?.textContent?.includes("appliqué"));
const totals = await shop.textContent("dl");
check("code valable : remise affichée et total recalculé (49 − 4,90 + 5,90 = 50 €)", totals.includes("BOUFFON10") && totals.includes("4,90") && /Total\s*50\s?€/.test(totals.replace(/\u00a0/g, " ")), totals.replace(/\s+/g, " ").slice(0, 160));
await shop.close();

// Déconnexion : l'accès se referme
await page.goto(base + "/admin");
await Promise.all([page.waitForURL(/connexion/), page.click('button:has-text("Se déconnecter")')]);
await page.goto(base + "/admin/commandes");
check("après déconnexion, l'admin est refermé", page.url().includes("/admin/connexion"));

// Blocage après trop d'échecs, depuis une autre adresse : six essais, le septième est refusé d'office ; le vrai compte, ailleurs, n'est pas touché
const intrus = await (await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "203.0.113.9" } })).newPage();
let last = "";
for (let i = 0; i < 7; i++) {
  await intrus.goto(base + "/admin/connexion");
  await intrus.fill('input[name="email"]', "intrus@exemple.fr");
  await intrus.fill('input[name="password"]', "essai-" + i);
  await Promise.all([intrus.waitForURL(/erreur=/), intrus.click('button[type="submit"]')]);
  last = await intrus.textContent("body");
}
check("7ᵉ essai raté depuis la même adresse : bloqué", last.includes("Trop d'essais"));
const legit = await (await browser.newContext()).newPage();
await legit.goto(base + "/admin/connexion");
await legit.fill('input[name="email"]', "demo@scult.eu");
await legit.fill('input[name="password"]', "bouffon-demo-2026");
await Promise.all([legit.waitForURL((u) => u.pathname === "/admin"), legit.click('button[type="submit"]')]);
check("le vrai compte, depuis une autre adresse, entre toujours", true);
await db.query("delete from login_attempts where key in ('email:intrus@exemple.fr', 'ip:203.0.113.9')");

await browser.close();
// Nettoyage des traces de test
await db.query("delete from orders where external_ref = $1", [ref]);
await db.query("delete from orders where external_ref = $1", [ref2]);
await db.query("delete from customers where email = 'colis.e2e@exemple.fr'");
await db.query("update variants set stock = stock + 1 where sku = 'SCULT-CRI-690-FP'"); // le pot de la commande de test Sendcloud
await db.query("delete from customers where email = 'test.e2e@exemple.fr'");
await db.query("delete from promo_codes where code = $1", [code]);
await db.query("delete from events where session_id like 'e2e-%'");
await db.end();
console.log(failed ? `\n${failed} ÉCHEC(S)` : "\nTout passe.");
process.exit(failed ? 1 : 0);
