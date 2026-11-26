/**
 * Remplit la base.
 *   npm run db:seed                     le catalogue : CRI et son pack de 2, depuis docs/mock/catalogue.json ; stock à 0
 *   npm run db:seed -- --stock=300      le même, avec 300 pots en stock (une entrée « réassort » au journal)
 *   npm run db:seed -- --demo           + 90 jours de commandes, de clients et de visites INVENTÉS, pour voir l'admin vivre
 *
 * Le catalogue se rejoue sans risque : un produit déjà présent garde son prix, son stock et son prix de revient.
 * ⚠ --demo écrit de fausses commandes : refusé sur une base en ligne. Les clients de démonstration sont en @exemple.fr.
 */
import { readFileSync } from "node:fs";
import pg from "pg";
import { isLocal, pgOptions } from "./_env.mjs";

const args = process.argv.slice(2);
const demo = args.includes("--demo");
const stockArg = Number((args.find((a) => a.startsWith("--stock=")) ?? "").split("=")[1] ?? 0);
if (demo && !isLocal()) {
  console.error("✗ --demo sur une base en ligne : refusé (ce sont de fausses commandes).");
  process.exit(1);
}

/** Les produits vendus par la boutique, et lequel est le pack de l'autre. */
const SOLD = ["cri", "cri-duo"];
const PACK_OF = { "cri-duo": "cri" };

const catalogue = JSON.parse(readFileSync("docs/mock/catalogue.json", "utf8"));
const client = new pg.Client(pgOptions());
await client.connect();
const q = (text, params) => client.query(text, params).then((r) => r.rows);

try {
  await client.query("begin");
  const variantIds = {};
  for (const [position, slug] of SOLD.entries()) {
    const p = catalogue.products.find((x) => x.slug === slug);
    if (!p) throw new Error(`Produit absent du catalogue de test : ${slug}`);
    const [product] = await q(
      `insert into products (slug, name, description, category_slug, category_name, seo_title, seo_description, images, position)
       values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
       on conflict (slug) do update set images = excluded.images, position = excluded.position
       returning id`,
      [p.slug, p.name, p.description, p.category?.slug ?? null, p.category?.name ?? null, p.seo?.title ?? null, p.seo?.description ?? null, JSON.stringify(p.images), position],
    );
    for (const [k, v] of p.variants.entries()) {
      const [variant] = await q(
        `insert into variants (product_id, sku, name, price_cents, compare_at_cents, unit_count, weight_grams, position)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (sku) do update set name = excluded.name
         returning id`,
        [product.id, v.sku, v.name, v.priceCents, v.compareAtCents, v.unitCount, v.weightGrams, k],
      );
      variantIds[slug] = variant.id;
    }
  }
  // Le pack puise dans le stock du pot.
  for (const [pack, single] of Object.entries(PACK_OF)) await q("update variants set stock_variant_id = $1 where id = $2", [variantIds[single], variantIds[pack]]);
  if (stockArg > 0) {
    const [v] = await q("update variants set stock = stock + $1 where id = $2 returning stock", [stockArg, variantIds.cri]);
    await q("insert into stock_movements (variant_id, delta, stock_after, reason, note, actor) values ($1, $2, $3, 'seed', 'Stock de départ', 'script')", [variantIds.cri, stockArg, v.stock]);
  }
  await client.query("commit");
  console.log(`✓ catalogue : ${SOLD.join(", ")}${stockArg > 0 ? ` · ${stockArg} pots en stock` : ""}`);

  if (demo) await seedDemo(variantIds);
} catch (e) {
  await client.query("rollback").catch(() => {});
  throw e;
} finally {
  await client.end();
}

/** 90 jours d'activité inventée, toujours la même (tirage à graine fixe), qui finit aujourd'hui. */
async function seedDemo(variantIds) {
  let seed = 20261126;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const pick = (weighted) => { let r = rnd() * weighted.reduce((s, [, w]) => s + w, 0); for (const [v, w] of weighted) if ((r -= w) <= 0) return v; return weighted[0][0]; };
  const DAY = 86_400_000;
  const now = Date.now();
  const COST = 1450;            // prix de revient d'un pot, inventé pour la démonstration
  const PRICE = { cri: 4900, "cri-duo": 8330 };
  const SKU = { cri: "SCULT-CRI-690-FP", "cri-duo": "SCULT-CRI-690-FP-X2" };
  const NAME = { cri: "CRI", "cri-duo": "CRI — pack de 2" };
  const FIRST = ["Lucas", "Emma", "Hugo", "Léa", "Nathan", "Chloé", "Enzo", "Manon", "Louis", "Camille", "Yanis", "Inès", "Tom", "Sarah", "Adam", "Jade", "Rayan", "Lina", "Théo", "Zoé", "Mehdi", "Clara", "Maxime", "Anaïs"];
  const LAST = ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia", "David", "Bertrand", "Roux", "Vincent", "Fournier", "Benali", "Nguyen"];
  const PLACES = [["FR", "Paris", "75011", 30], ["FR", "Lyon", "69003", 12], ["FR", "Marseille", "13006", 10], ["FR", "Toulouse", "31000", 8], ["FR", "Lille", "59000", 7], ["FR", "Bordeaux", "33000", 6], ["FR", "Nantes", "44000", 5], ["BE", "Bruxelles", "1000", 7], ["DE", "Berlin", "10115", 4], ["ES", "Barcelone", "08001", 4], ["IT", "Milan", "20121", 3], ["NL", "Amsterdam", "1012", 2], ["PT", "Lisbonne", "1100", 2]];
  const SHIPPING = { FR: 590, BE: 890, DE: 890, ES: 890, IT: 890, NL: 890, PT: 1290 };
  const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  await client.query("begin");
  await q("delete from events; delete from order_events; delete from stock_movements; delete from order_lines; delete from orders; delete from customers; delete from promo_codes;");
  await q("update variants set stock = 0, cost_cents = null, low_stock_at = 40");
  await q("update variants set cost_cents = $1 where id = $2", [COST, variantIds.cri]);
  const promos = [["BOUFFON10", "Lancement", "percent", 10], ["TEAM5", "Partenaires salle", "fixed", 500]];
  for (const [code, label, type, value] of promos) await q("insert into promo_codes (code, label, discount_type, discount_value) values ($1, $2, $3, $4)", [code, label, type, value]);
  await q("insert into settings (key, value) values ('monthlyGoalCents', '2500000'::jsonb) on conflict (key) do update set value = excluded.value");

  let stock = 0;
  const move = async (delta, reason, at, orderId = null, note = null) => {
    stock += delta;
    await q("insert into stock_movements (variant_id, order_id, delta, stock_after, reason, note, actor, created_at) values ($1, $2, $3, $4, $5, $6, $7, $8)", [variantIds.cri, orderId, delta, stock, reason, note, reason === "order" ? null : "Démo", new Date(at)]);
  };
  await move(700, "seed", now - 90 * DAY, null, "Stock de départ");

  const customers = []; // { id, lastAt }
  const refs = new Set();
  const eventRows = [];
  let orders = 0;
  for (let d = 89; d >= 0; d--) {
    const dayStart = now - d * DAY - (now % DAY);
    if (d === 38) await move(600, "restock", dayStart + 9 * 3_600_000, null, "Réassort lot 002");
    const weekday = new Date(dayStart).getUTCDay();
    const trend = 2.2 + (89 - d) * 0.075;                    // l'activité monte doucement sur trois mois
    const lambda = trend * (weekday === 0 || weekday === 6 ? 1.25 : 1) * (0.75 + rnd() * 0.5);
    let n = Math.floor(lambda) + (rnd() < lambda % 1 ? 1 : 0);
    const todayLimit = d === 0 ? now : dayStart + DAY;
    const times = Array.from({ length: n }, () => dayStart + (8 + rnd() * 15) * 3_600_000).sort((a, b) => a - b); // entre 8 h et 23 h
    for (const at of times) {
      if (at >= todayLimit) continue;
      // Un client sur quatre revient, s'il a commandé il y a au moins 24 jours.
      const due = customers.filter((c) => at - c.lastAt > 24 * DAY);
      let customer;
      if (due.length && rnd() < 0.27) {
        customer = due[Math.floor(rnd() * due.length)];
      } else {
        const first = FIRST[Math.floor(rnd() * FIRST.length)], last = LAST[Math.floor(rnd() * LAST.length)];
        const place = pick(PLACES.map((p) => [p, p[3]]));
        const email = `${first}.${last}${customers.length}@exemple.fr`.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
        const [row] = await q("insert into customers (email, name, first_order_at, created_at) values ($1, $2, $3, $3) returning id", [email, `${first} ${last}`, new Date(at)]);
        customer = { id: row.id, email, name: `${first} ${last}`, place, lastAt: at };
        customers.push(customer);
      }
      customer.lastAt = at;
      const slug = rnd() < 0.36 ? "cri-duo" : "cri";
      const quantity = slug === "cri" && rnd() < 0.06 ? 2 : 1;
      const units = quantity * (slug === "cri-duo" ? 2 : 1);
      const subtotal = PRICE[slug] * quantity;
      const promo = rnd() < 0.14 ? promos[rnd() < 0.7 ? 0 : 1] : null;
      const discount = promo ? (promo[2] === "percent" ? Math.round((subtotal * promo[3]) / 100) : promo[3]) : 0;
      const [country, city, postal] = customer.place;
      const shipping = subtotal - discount >= 6000 ? 0 : SHIPPING[country];
      const total = subtotal - discount + shipping;
      const age = (now - at) / DAY;
      const fate = rnd();
      let status = age > 9 ? "delivered" : age > 1.6 ? "shipped" : age > 0.7 ? (rnd() < 0.6 ? "shipped" : "preparing") : rnd() < 0.3 ? "preparing" : "paid";
      if (fate < 0.015 && age > 1) status = "cancelled";
      else if (fate < 0.04 && age > 6) status = "refunded";
      const prepared = ["preparing", "shipped", "delivered", "refunded"].includes(status) ? at + (3 + rnd() * 20) * 3_600_000 : null;
      const shipped = ["shipped", "delivered", "refunded"].includes(status) ? prepared + (2 + rnd() * (rnd() < 0.12 ? 60 : 22)) * 3_600_000 : null;
      const delivered = ["delivered", "refunded"].includes(status) ? shipped + (2 + rnd() * 3) * DAY : null;
      let reference;
      do reference = "SCT-" + Array.from({ length: 6 }, () => ALPHA[Math.floor(rnd() * ALPHA.length)]).join(""); while (refs.has(reference));
      refs.add(reference);
      const [order] = await q(
        `insert into orders (reference, status, customer_id, email, name, address_line1, postal_code, city, country_code, subtotal_cents, discount_cents, shipping_cents,
                             total_cents, cost_cents, refund_cents, promo_code, tracking_carrier, tracking_number, stock_returned, created_at, paid_at, prepared_at, shipped_at,
                             delivered_at, cancelled_at, refunded_at, updated_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $20, $21, $22, $23, $24, $25, $20) returning id`,
        [reference, status, customer.id, customer.email, customer.name, `${1 + Math.floor(rnd() * 120)} rue de la Démonstration`, postal, city, country, subtotal, discount, shipping,
          total, COST * units, status === "refunded" ? total : 0, promo?.[0] ?? null, shipped ? "Colissimo" : null, shipped ? "6A" + String(Math.floor(rnd() * 1e11)).padStart(11, "0") : null,
          status === "cancelled", new Date(at), prepared && new Date(prepared), shipped && new Date(shipped), delivered && new Date(delivered),
          status === "cancelled" ? new Date(at + 5 * 3_600_000) : null, status === "refunded" ? new Date(delivered + 2 * DAY) : null],
      );
      await q("insert into order_lines (order_id, variant_id, sku, name, unit_price_cents, unit_cost_cents, quantity, units, line_cents) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)", [
        order.id, variantIds[slug], SKU[slug], NAME[slug], PRICE[slug], COST * (slug === "cri-duo" ? 2 : 1), quantity, units, subtotal,
      ]);
      const log = [["paid", "Paiement confirmé par Stripe", null, at]];
      if (prepared) log.push(["preparing", null, "Démo", prepared]);
      if (shipped) log.push(["shipped", "Colissimo", "Démo", shipped]);
      if (delivered) log.push(["delivered", null, "Démo", delivered]);
      if (status === "cancelled") log.push(["cancelled", "Demande du client · stock remis en rayon", "Démo", at + 5 * 3_600_000]);
      if (status === "refunded") log.push(["refunded", `${(total / 100).toFixed(2)} € · Colis abîmé`, "Démo", delivered + 2 * DAY]);
      for (const [type, detail, actor, t] of log) await q("insert into order_events (order_id, type, detail, actor, created_at) values ($1, $2, $3, $4, $5)", [order.id, type, detail, actor, new Date(t)]);
      await move(-units, "order", at, order.id);
      if (status === "cancelled") await move(units, "return", at + 5 * 3_600_000, order.id);
      if (promo) await q("update promo_codes set uses_count = uses_count + 1 where code = $1", [promo[0]]);
      orders++;
    }
    // Les visites du jour : une quarantaine par commande, dont une part voit la fiche, ajoute au panier, passe en caisse.
    const sessions = Math.round((n + 1) * (34 + rnd() * 16));
    for (let s = 0; s < sessions; s++) {
      const at = new Date(Math.min(dayStart + (7 + rnd() * 17) * 3_600_000, now - 60_000));
      if (at.getTime() < dayStart) continue;
      const id = `demo-${d}-${s}`;
      const source = pick([["instagram", 34], ["tiktok", 26], ["direct", 22], ["google", 12], ["youtube", 6]]);
      const device = rnd() < 0.78 ? "mobile" : "desktop";
      eventRows.push(["visit", id, "/", null, source, device, at]);
      if (rnd() < 0.52) {
        eventRows.push(["product_view", id, "/produits/cri", "SCULT-CRI-690-FP", source, device, at]);
        if (rnd() < (source === "direct" || source === "google" ? 0.2 : 0.12)) eventRows.push(["add_to_cart", id, "/produits/cri", null, source, device, at]);
      }
    }
    for (let c = 0; c < Math.round(n * (1.5 + rnd())); c++) eventRows.push(["checkout_start", `caisse-demo-${d}-${c}`, null, null, null, null, new Date(Math.min(dayStart + (9 + rnd() * 13) * 3_600_000, now - 60_000))]);
  }
  for (let i = 0; i < eventRows.length; i += 2000) {
    const chunk = eventRows.slice(i, i + 2000);
    const col = (k) => chunk.map((r) => r[k]);
    await q("insert into events (type, session_id, path, sku, source, device, created_at) select * from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::timestamptz[])", [col(0), col(1), col(2), col(3), col(4), col(5), col(6)]);
  }
  await q("update variants set stock = $1 where id = $2", [stock, variantIds.cri]);
  await client.query("commit");
  console.log(`✓ démonstration : ${orders} commandes, ${customers.length} clients, ${eventRows.length} événements d'audience, ${stock} pots en stock`);
}
