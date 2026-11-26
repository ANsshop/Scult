import "server-only";
import { randomInt } from "node:crypto";
import { db, tx, type Db } from "@/lib/db";
import { PpError, type PpCartLine, type PpOrder, type PpOrderInput, type PpQuote } from "@/lib/pp/client";
import { findPromo, promoDiscount, promoProblem } from "./promos";

/**
 * Les commandes de SCULT : chiffrer un panier, écrire une commande payée, la
 * faire avancer (préparée, expédiée, livrée), l'annuler, la rembourser.
 *
 * Trois règles tiennent tout :
 *  - une commande n'existe que payée : Stripe confirme, puis elle est écrite
 *    ici (une session Stripe = une commande, `external_ref`) ;
 *  - le stock et son journal bougent dans la même transaction que la commande ;
 *  - un statut n'avance que depuis les statuts qui le permettent (NEXT), et la
 *    vérification se fait sur la ligne verrouillée, jamais sur ce que l'écran affichait.
 */

export type OrderStatus = "paid" | "preparing" | "shipped" | "delivered" | "cancelled" | "refunded";

export const STATUS_LABEL: Record<OrderStatus, string> = {
  paid: "À préparer", preparing: "En préparation", shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée", refunded: "Remboursée",
};

/** Depuis quels statuts on peut passer à chacun. */
const FROM: Record<"preparing" | "shipped" | "delivered" | "cancelled", OrderStatus[]> = {
  preparing: ["paid"],
  shipped: ["paid", "preparing"],
  delivered: ["shipped"],
  cancelled: ["paid", "preparing"],
};
const REFUNDABLE: OrderStatus[] = ["paid", "preparing", "shipped", "delivered"];

type VariantRow = { id: string; sku: string; product_name: string; price_cents: number; unit_cost: number | null; unit_count: number; holder_id: string };

const VARIANTS = `
  select v.id, v.sku, p.name as product_name, v.price_cents, v.unit_count,
         coalesce(v.cost_cents, s.cost_cents * v.unit_count) as unit_cost,
         coalesce(v.stock_variant_id, v.id) as holder_id
    from variants v
    join products p on p.id = v.product_id
    left join variants s on s.id = v.stock_variant_id
   where v.sku = any($1::text[])`;

/** Regroupe les lignes d'un même SKU. */
function merge(lines: PpCartLine[]): PpCartLine[] {
  const bySku = new Map<string, number>();
  for (const l of lines) bySku.set(l.sku, (bySku.get(l.sku) ?? 0) + l.quantity);
  return [...bySku].map(([sku, quantity]) => ({ sku, quantity }));
}

async function priced(on: Db, lines: PpCartLine[], onlyOnSale: boolean) {
  const wanted = merge(lines);
  const rows = await on.query<VariantRow>(VARIANTS + (onlyOnSale ? " and v.is_active and p.is_active" : ""), [wanted.map((l) => l.sku)]);
  const bySku = new Map(rows.map((r) => [r.sku, r]));
  return wanted.map((l) => {
    const v = bySku.get(l.sku);
    if (!v) throw new PpError(404, "unknown_sku", `Article inconnu : ${l.sku}`);
    return { ...l, variant: v, lineCents: v.price_cents * l.quantity };
  });
}

/**
 * Le prix d'un panier : les lignes aux prix de la base, et la remise du code
 * s'il s'applique. Un code inconnu ou refusé ne bloque pas : il est ignoré
 * (`promoCode: null`, remise 0).
 */
export async function quoteFromDb(lines: PpCartLine[], promoCode?: string): Promise<PpQuote> {
  const items = await priced(db, lines, true);
  const subtotalCents = items.reduce((s, l) => s + l.lineCents, 0);
  const promo = promoCode ? await findPromo(promoCode) : null;
  const applies = promo && !promoProblem(promo, subtotalCents);
  return {
    currency: "EUR",
    lines: items.map((l) => ({ sku: l.sku, name: l.variant.product_name, unitPriceCents: l.variant.price_cents, quantity: l.quantity, lineCents: l.lineCents })),
    subtotalCents,
    discountCents: applies ? promoDiscount(promo, subtotalCents) : 0,
    promoCode: applies ? promo.code : null,
  };
}

/** SCT- et six caractères sans ambiguïté (ni 0/O, ni 1/I). */
function newReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "SCT-" + Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("");
}

async function logEvent(on: Db, orderId: string, type: string, detail: string | null, actor: string | null) {
  await on.query("insert into order_events (order_id, type, detail, actor) values ($1, $2, $3, $4)", [orderId, type, detail, actor]);
}

/** Ajoute `delta` au stock d'une variante et l'écrit au journal, dans la transaction en cours. */
export async function moveStock(on: Db, variantId: string, delta: number, reason: "order" | "return" | "restock" | "adjust" | "seed", opts: { orderId?: string | null; note?: string | null; actor?: string | null } = {}) {
  const row = await on.one<{ stock: number }>("update variants set stock = stock + $1, updated_at = now() where id = $2 returning stock", [delta, variantId]);
  if (!row) throw new Error("Variante introuvable.");
  await on.query("insert into stock_movements (variant_id, order_id, delta, stock_after, reason, note, actor) values ($1, $2, $3, $4, $5, $6, $7)", [
    variantId, opts.orderId ?? null, delta, row.stock, reason, opts.note ?? null, opts.actor ?? null,
  ]);
  return row.stock;
}

/**
 * Écrit une commande payée. Rejouer le même `externalRef` rend la commande
 * déjà écrite : Stripe peut renvoyer son signal sans créer de doublon.
 * Le stock sort ici, même s'il passe sous zéro : le client a payé, la commande
 * ne se refuse pas (la rupture se voit dans l'admin).
 */
export async function createOrderInDb(input: PpOrderInput): Promise<PpOrder> {
  return tx(async (on) => {
    const existing = input.externalRef ? await on.one<{ id: string; reference: string; total_cents: number }>("select id, reference, total_cents from orders where external_ref = $1", [input.externalRef]) : null;
    if (existing) return { id: existing.id, reference: existing.reference, totalCents: existing.total_cents };

    const items = await priced(on, input.lines, false);
    if (items.length === 0) throw new PpError(422, "empty", "Commande sans article.");
    // Les lignes de stock, verrouillées dans un ordre fixe : deux commandes simultanées ne se bloquent pas l'une l'autre.
    const holders = [...new Set(items.map((l) => l.variant.holder_id))].sort();
    await on.query("select id from variants where id = any($1::uuid[]) order by id for update", [holders]);

    const subtotal = items.reduce((s, l) => s + l.lineCents, 0);
    // Le client a déjà payé le montant remisé : on applique le code tel qu'il a été accepté au paiement, sans le revérifier.
    const promo = input.promoCode ? await findPromo(input.promoCode, on) : null;
    const discount = promo ? promoDiscount(promo, subtotal) : 0;
    const total = subtotal - discount + input.shippingCents;
    const costKnown = items.every((l) => l.variant.unit_cost !== null);
    const cost = costKnown ? items.reduce((s, l) => s + l.variant.unit_cost! * l.quantity, 0) : null;

    const email = input.customer.email.trim().toLowerCase();
    const customer = await on.one<{ id: string }>(
      `insert into customers (email, name, first_order_at) values ($1, $2, now())
       on conflict (email) do update set name = case when excluded.name <> '' then excluded.name else customers.name end
       returning id`,
      [email, input.customer.name.trim()],
    );

    let order: { id: string; reference: string } | null = null;
    for (let attempt = 0; attempt < 6 && !order; attempt++) {
      order = await on.one<{ id: string; reference: string }>(
        `insert into orders (reference, customer_id, email, name, address_line1, address_line2, postal_code, city, country_code,
                             subtotal_cents, discount_cents, shipping_cents, total_cents, cost_cents, promo_code, payment_method, external_ref)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         on conflict (reference) do nothing returning id, reference`,
        [newReference(), customer!.id, email, input.customer.name.trim(), input.shippingAddress.line1, input.shippingAddress.line2 ?? null, input.shippingAddress.postalCode,
          input.shippingAddress.city, input.shippingAddress.countryCode.toUpperCase(), subtotal, discount, input.shippingCents, total, cost, promo?.code ?? null, input.paymentMethod, input.externalRef ?? null],
      );
    }
    if (!order) throw new Error("Impossible de numéroter la commande.");

    const out = new Map<string, number>();
    for (const l of items) {
      const units = l.quantity * l.variant.unit_count;
      await on.query(
        "insert into order_lines (order_id, variant_id, sku, name, unit_price_cents, unit_cost_cents, quantity, units, line_cents) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
        [order.id, l.variant.id, l.sku, l.variant.product_name, l.variant.price_cents, l.variant.unit_cost, l.quantity, units, l.lineCents],
      );
      out.set(l.variant.holder_id, (out.get(l.variant.holder_id) ?? 0) + units);
    }
    for (const id of holders) await moveStock(on, id, -out.get(id)!, "order", { orderId: order.id });
    if (promo) await on.query("update promo_codes set uses_count = uses_count + 1, updated_at = now() where id = $1", [promo.id]);
    await logEvent(on, order.id, "paid", input.paymentMethod === "stripe" ? "Paiement confirmé par Stripe" : "Paiement enregistré", null);
    return { id: order.id, reference: order.reference, totalCents: total };
  });
}

// — Faire avancer une commande —

export type ActionResult = { ok: true } | { ok: false; error: string };

type Locked = { id: string; status: OrderStatus; total_cents: number; refund_cents: number; stock_returned: boolean };
const lock = (on: Db, id: string) => on.one<Locked>("select id, status, total_cents, refund_cents, stock_returned from orders where id = $1 for update", [id]);

/** Remet en rayon ce que la commande avait sorti. Une seule fois par commande. */
async function returnStock(on: Db, order: Locked, actor: string) {
  if (order.stock_returned) return;
  const rows = await on.query<{ holder_id: string; units: number }>(
    `select coalesce(v.stock_variant_id, v.id) as holder_id, sum(l.units)::int as units
       from order_lines l join variants v on v.id = l.variant_id
      where l.order_id = $1 group by 1 order by 1`,
    [order.id],
  );
  for (const r of rows) await moveStock(on, r.holder_id, r.units, "return", { orderId: order.id, actor });
  await on.query("update orders set stock_returned = true where id = $1", [order.id]);
}

export async function advanceOrder(id: string, to: "preparing" | "shipped" | "delivered", actor: string, tracking?: { carrier: string | null; number: string | null }): Promise<ActionResult> {
  return tx(async (on) => {
    const order = await lock(on, id);
    if (!order) return { ok: false, error: "Commande introuvable." };
    if (!FROM[to].includes(order.status)) return { ok: false, error: `Impossible : la commande est « ${STATUS_LABEL[order.status]} ».` };
    if (to === "preparing") await on.query("update orders set status = 'preparing', prepared_at = now(), updated_at = now() where id = $1", [id]);
    if (to === "shipped") {
      await on.query(
        "update orders set status = 'shipped', shipped_at = now(), prepared_at = coalesce(prepared_at, now()), tracking_carrier = $2, tracking_number = $3, updated_at = now() where id = $1",
        [id, tracking?.carrier || null, tracking?.number || null],
      );
    }
    if (to === "delivered") await on.query("update orders set status = 'delivered', delivered_at = now(), updated_at = now() where id = $1", [id]);
    const detail = to === "shipped" && tracking?.number ? `${tracking.carrier ? tracking.carrier + " · " : ""}${tracking.number}` : null;
    await logEvent(on, id, to, detail, actor);
    return { ok: true };
  });
}

/** Corrige le suivi d'une commande déjà expédiée. */
export async function setTracking(id: string, actor: string, tracking: { carrier: string | null; number: string | null }): Promise<ActionResult> {
  return tx(async (on) => {
    const order = await lock(on, id);
    if (!order) return { ok: false, error: "Commande introuvable." };
    if (order.status !== "shipped" && order.status !== "delivered") return { ok: false, error: "Le suivi se renseigne à l'expédition." };
    await on.query("update orders set tracking_carrier = $2, tracking_number = $3, updated_at = now() where id = $1", [id, tracking.carrier || null, tracking.number || null]);
    await logEvent(on, id, "tracking", `${tracking.carrier ? tracking.carrier + " · " : ""}${tracking.number ?? "retiré"}`, actor);
    return { ok: true };
  });
}

export async function cancelOrder(id: string, actor: string, opts: { restock: boolean; reason: string | null }): Promise<ActionResult> {
  return tx(async (on) => {
    const order = await lock(on, id);
    if (!order) return { ok: false, error: "Commande introuvable." };
    if (!FROM.cancelled.includes(order.status)) return { ok: false, error: `Impossible : la commande est « ${STATUS_LABEL[order.status]} ». Une commande partie se rembourse.` };
    if (opts.restock) await returnStock(on, order, actor);
    await on.query("update orders set status = 'cancelled', cancelled_at = now(), updated_at = now() where id = $1", [id]);
    await logEvent(on, id, "cancelled", [opts.reason, opts.restock ? "stock remis en rayon" : "stock non remis"].filter(Boolean).join(" · "), actor);
    return { ok: true };
  });
}

/**
 * Enregistre un remboursement, total ou partiel. ⚠ N'envoie pas l'argent :
 * le remboursement lui-même se fait dans Stripe ; ici on le consigne pour que
 * le chiffre d'affaires et la marge restent justes.
 */
export async function refundOrder(id: string, actor: string, opts: { amountCents: number; restock: boolean; reason: string | null }): Promise<ActionResult> {
  return tx(async (on) => {
    const order = await lock(on, id);
    if (!order) return { ok: false, error: "Commande introuvable." };
    if (!REFUNDABLE.includes(order.status)) return { ok: false, error: `Impossible : la commande est « ${STATUS_LABEL[order.status]} ».` };
    const left = order.total_cents - order.refund_cents;
    if (opts.amountCents <= 0 || opts.amountCents > left) return { ok: false, error: `Montant invalide : il reste ${(left / 100).toFixed(2)} € remboursables.` };
    const full = opts.amountCents === left;
    if (opts.restock) await returnStock(on, order, actor);
    await on.query(
      `update orders set refund_cents = refund_cents + $2, updated_at = now(),
              status = case when $3 then 'refunded' else status end,
              refunded_at = case when $3 then now() else refunded_at end
        where id = $1`,
      [id, opts.amountCents, full],
    );
    await logEvent(on, id, full ? "refunded" : "partial_refund", [`${(opts.amountCents / 100).toFixed(2)} €`, opts.reason, opts.restock ? "stock remis en rayon" : null].filter(Boolean).join(" · "), actor);
    return { ok: true };
  });
}

export async function noteOrder(id: string, actor: string, note: string): Promise<ActionResult> {
  const text = note.trim();
  if (!text) return { ok: false, error: "Note vide." };
  await tx(async (on) => {
    await on.query("update orders set admin_note = $2, updated_at = now() where id = $1", [id, text]);
    await logEvent(on, id, "note", text, actor);
  });
  return { ok: true };
}

// — Lire les commandes —

export type OrderRow = {
  id: string; reference: string; status: OrderStatus; email: string; name: string; city: string; country_code: string;
  total_cents: number; refund_cents: number; discount_cents: number; promo_code: string | null; units: number;
  paid_at: Date; shipped_at: Date | null; tracking_number: string | null; customer_id: string | null; customer_orders: number;
};

/** Les onglets de la liste : un intitulé, les statuts qu'il réunit. */
export const ORDER_TABS = [
  { id: "a-traiter", label: "À traiter", statuses: ["paid", "preparing"] },
  { id: "expediees", label: "Expédiées", statuses: ["shipped"] },
  { id: "livrees", label: "Livrées", statuses: ["delivered"] },
  { id: "annulees", label: "Annulées et remboursées", statuses: ["cancelled", "refunded"] },
  { id: "toutes", label: "Toutes", statuses: [] },
] as const satisfies readonly { id: string; label: string; statuses: readonly OrderStatus[] }[];
export type OrderTab = (typeof ORDER_TABS)[number]["id"];

export const PAGE_SIZE = 30;

export async function listOrders(opts: { tab: OrderTab; q?: string; page?: number }) {
  const tab = ORDER_TABS.find((t) => t.id === opts.tab) ?? ORDER_TABS[0];
  const where: string[] = [];
  const params: unknown[] = [];
  if (tab.statuses.length) { params.push(tab.statuses); where.push(`o.status = any($${params.length}::text[])`); }
  const q = opts.q?.trim();
  if (q) { params.push(`%${q.replace(/[%_\\]/g, "\\$&")}%`); where.push(`(o.reference ilike $${params.length} or o.email ilike $${params.length} or o.name ilike $${params.length} or o.tracking_number ilike $${params.length})`); }
  const clause = where.length ? `where ${where.join(" and ")}` : "";
  const page = Math.max(1, opts.page ?? 1);
  // Ce qui attend passe en premier, la plus ancienne d'abord : c'est l'ordre dans lequel on prépare. Le reste, la plus récente d'abord.
  const order = tab.id === "a-traiter" ? "o.paid_at asc" : "o.paid_at desc";
  const [rows, total] = await Promise.all([
    db.query<OrderRow>(
      `select o.id, o.reference, o.status, o.email, o.name, o.city, o.country_code, o.total_cents, o.refund_cents, o.discount_cents, o.promo_code,
              o.paid_at, o.shipped_at, o.tracking_number, o.customer_id,
              (select coalesce(sum(l.units), 0)::int from order_lines l where l.order_id = o.id) as units,
              (select count(*)::int from orders p where p.customer_id = o.customer_id and p.status <> 'cancelled' and p.paid_at <= o.paid_at) as customer_orders
         from orders o ${clause} order by ${order} limit ${PAGE_SIZE} offset ${(page - 1) * PAGE_SIZE}`,
      params,
    ),
    db.one<{ n: number }>(`select count(*)::int as n from orders o ${clause}`, params),
  ]);
  return { rows, total: total?.n ?? 0, page, pages: Math.max(1, Math.ceil((total?.n ?? 0) / PAGE_SIZE)) };
}

/** Combien de commandes dans chaque onglet (pour les pastilles). */
export async function orderCounts(): Promise<Record<OrderStatus, number>> {
  const rows = await db.query<{ status: OrderStatus; n: number }>("select status, count(*)::int as n from orders group by status");
  const out = { paid: 0, preparing: 0, shipped: 0, delivered: 0, cancelled: 0, refunded: 0 };
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export type OrderDetail = {
  id: string; reference: string; status: OrderStatus; customer_id: string | null; email: string; name: string;
  address_line1: string; address_line2: string | null; postal_code: string; city: string; country_code: string;
  subtotal_cents: number; discount_cents: number; shipping_cents: number; total_cents: number; cost_cents: number | null; refund_cents: number;
  promo_code: string | null; payment_method: string; external_ref: string | null; tracking_carrier: string | null; tracking_number: string | null;
  admin_note: string | null; stock_returned: boolean; paid_at: Date; prepared_at: Date | null; shipped_at: Date | null; delivered_at: Date | null;
  cancelled_at: Date | null; refunded_at: Date | null;
};
export type OrderLine = { id: string; sku: string; name: string; unit_price_cents: number; unit_cost_cents: number | null; quantity: number; units: number; line_cents: number; product_id: string | null };
export type OrderEvent = { id: string; type: string; detail: string | null; actor: string | null; created_at: Date };

export async function getOrder(id: string) {
  const order = await db.one<OrderDetail>("select * from orders where id = $1", [id]);
  if (!order) return null;
  const [lines, events, history] = await Promise.all([
    db.query<OrderLine>("select l.*, v.product_id from order_lines l left join variants v on v.id = l.variant_id where l.order_id = $1 order by l.name, l.sku", [id]),
    db.query<OrderEvent>("select id::text, type, detail, actor, created_at from order_events where order_id = $1 order by created_at, id", [id]),
    order.customer_id
      ? db.one<{ orders: number; revenue_cents: number; first_at: Date | null }>(
          "select count(*)::int as orders, coalesce(sum(total_cents - refund_cents), 0)::int as revenue_cents, min(paid_at) as first_at from orders where customer_id = $1 and status <> 'cancelled'",
          [order.customer_id],
        )
      : Promise.resolve(null),
  ]);
  return { order, lines, events, history };
}
