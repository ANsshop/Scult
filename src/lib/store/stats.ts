import "server-only";
import { db } from "@/lib/db";
import { listVariants, cover, type StockLevel } from "./products";
import { getSettings } from "./settings";
import type { OrderStatus } from "./orders";

/**
 * Les chiffres du tableau de bord. Les définitions, pour qu'un chiffre veuille
 * toujours dire la même chose :
 *
 *  - Une commande compte à la date de son PAIEMENT (pas de sa création), et
 *    compte sauf si elle est annulée.
 *  - Chiffre d'affaires = ce que les clients ont payé, port compris,
 *    remboursements déduits.
 *  - Marge brute = ventes d'articles après remise − prix de revient des
 *    articles. Port exclu. Calculée seulement sur les commandes dont le prix de
 *    revient est connu : s'il manque, on le dit plutôt que d'afficher une marge fausse.
 *  - Conversion = commandes ÷ visites (une visite = un onglet ouvert sur le site).
 *  - Toute comparaison se fait à durée égale : 30 jours contre les 30 jours
 *    d'avant, le mois en cours contre le mois précédent arrêté au même jour.
 *  - Les jours sont ceux de Paris.
 */

const TZ = "Europe/Paris";
const DAY = 86_400_000;

function parts(d: Date) {
  const f = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  const p = Object.fromEntries(f.formatToParts(d).map((x) => [x.type, Number(x.value)]));
  return { y: p.year, m: p.month, d: p.day, h: p.hour, min: p.minute, s: p.second };
}
/** Le décalage de Paris par rapport à UTC, à cet instant. */
function offset(d: Date) {
  const p = parts(d);
  return Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - Math.floor(d.getTime() / 1000) * 1000;
}
/** L'instant où Paris affiche cette date et cette heure. */
function parisTime(y: number, m: number, d: number, h = 0): Date {
  const wall = Date.UTC(y, m - 1, d, h);
  const first = wall - offset(new Date(wall));
  return new Date(wall - offset(new Date(first)));
}
/** Minuit à Paris, `shift` jours avant ou après le jour de `date`. */
export function parisMidnight(date: Date, shift = 0): Date {
  const p = parts(date);
  return parisTime(p.y, p.m, p.d + shift);
}

export const PERIODS = [
  { id: "jour", label: "Aujourd'hui", compare: "comparé à hier, à la même heure", previous: "Hier" },
  { id: "7j", label: "7 jours", compare: "comparés aux 7 jours d'avant", previous: "Les 7 jours d'avant" },
  { id: "30j", label: "30 jours", compare: "comparés aux 30 jours d'avant", previous: "Les 30 jours d'avant" },
  { id: "90j", label: "90 jours", compare: "comparés aux 90 jours d'avant", previous: "Les 90 jours d'avant" },
  { id: "mois", label: "Ce mois", compare: "comparé au mois dernier, arrêté au même jour", previous: "Le mois dernier" },
] as const;
export type PeriodId = (typeof PERIODS)[number]["id"];
export type Period = { id: PeriodId; label: string; compare: string; previous: string; from: Date; to: Date; prevFrom: Date; prevTo: Date; unit: "hour" | "day" };

export function resolvePeriod(id: string | undefined, now = new Date()): Period {
  const def = PERIODS.find((p) => p.id === id) ?? PERIODS[2];
  const base = { id: def.id, label: def.label, compare: def.compare, previous: def.previous, to: now };
  if (def.id === "jour") return { ...base, from: parisMidnight(now), prevFrom: parisMidnight(now, -1), prevTo: new Date(now.getTime() - DAY), unit: "hour" };
  if (def.id === "mois") {
    const p = parts(now);
    const from = parisTime(p.y, p.m, 1);
    const prevFrom = parisTime(p.y, p.m - 1, 1);
    // Le mois précédent, arrêté au même jour et à la même heure (sans déborder sur le mois en cours).
    const prevTo = new Date(Math.min(from.getTime(), parisTime(p.y, p.m - 1, p.d, p.h).getTime() + p.min * 60_000));
    return { ...base, from, prevFrom, prevTo, unit: "day" };
  }
  const n = def.id === "7j" ? 7 : def.id === "30j" ? 30 : 90;
  return { ...base, from: parisMidnight(now, -(n - 1)), prevFrom: parisMidnight(now, -(2 * n - 1)), prevTo: new Date(now.getTime() - n * DAY), unit: "day" };
}

/** L'évolution en pourcentage ; `null` quand il n'y a rien à quoi comparer. */
export const change = (current: number, previous: number): number | null => (previous > 0 ? ((current - previous) / previous) * 100 : null);

// — Totaux d'une période —

export type Totals = {
  orders: number; revenue: number; productRevenue: number; discounts: number; shipping: number; refunds: number; refundedOrders: number;
  margin: number; marginBase: number; missingCost: number; customers: number; units: number; packOrders: number;
};

async function totals(from: Date, to: Date): Promise<Totals> {
  const r = await db.one<Record<string, number>>(
    `select count(*)::int as orders,
            coalesce(sum(total_cents - refund_cents), 0)::int as revenue,
            coalesce(sum(subtotal_cents - discount_cents), 0)::int as product_revenue,
            coalesce(sum(discount_cents), 0)::int as discounts,
            coalesce(sum(shipping_cents), 0)::int as shipping,
            coalesce(sum(refund_cents), 0)::int as refunds,
            count(*) filter (where refund_cents > 0)::int as refunded_orders,
            coalesce(sum(subtotal_cents - discount_cents - cost_cents) filter (where cost_cents is not null and status <> 'refunded'), 0)::int as margin,
            coalesce(sum(subtotal_cents - discount_cents) filter (where cost_cents is not null and status <> 'refunded'), 0)::int as margin_base,
            count(*) filter (where cost_cents is null and status <> 'refunded')::int as missing_cost,
            count(distinct customer_id)::int as customers,
            coalesce(sum((select sum(l.units) from order_lines l where l.order_id = o.id)), 0)::int as units,
            count(*) filter (where exists (select 1 from order_lines l where l.order_id = o.id and l.units > l.quantity))::int as pack_orders
       from orders o
      where status <> 'cancelled' and paid_at >= $1 and paid_at < $2`,
    [from, to],
  );
  return {
    orders: r!.orders, revenue: r!.revenue, productRevenue: r!.product_revenue, discounts: r!.discounts, shipping: r!.shipping, refunds: r!.refunds,
    refundedOrders: r!.refunded_orders, margin: r!.margin, marginBase: r!.margin_base, missingCost: r!.missing_cost, customers: r!.customers, units: r!.units, packOrders: r!.pack_orders,
  };
}

// — Courbe des ventes —

export type Point = { key: string; label: string; revenue: number; orders: number };

function bucketKeys(from: Date, to: Date, unit: "hour" | "day"): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const pad = (n: number) => String(n).padStart(2, "0");
  if (unit === "hour") {
    const p = parts(from);
    const last = parts(to).h;
    for (let h = 0; h <= Math.max(last, 0); h++) out.push({ key: `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(h)}`, label: `${h} h` });
    return out;
  }
  for (let t = parisMidnight(from); t < to; t = parisMidnight(t, 1)) {
    const p = parts(t);
    out.push({ key: `${p.y}-${pad(p.m)}-${pad(p.d)}T00`, label: new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "short" }).format(t) });
  }
  return out;
}

async function series(from: Date, to: Date, unit: "hour" | "day"): Promise<Point[]> {
  const rows = await db.query<{ key: string; revenue: number; orders: number }>(
    `select to_char(date_trunc('${unit}', paid_at at time zone '${TZ}'), 'YYYY-MM-DD"T"HH24') as key,
            coalesce(sum(total_cents - refund_cents), 0)::int as revenue, count(*)::int as orders
       from orders where status <> 'cancelled' and paid_at >= $1 and paid_at < $2 group by 1`,
    [from, to],
  );
  const byKey = new Map(rows.map((r) => [r.key, r]));
  return bucketKeys(from, to, unit).map((b) => ({ ...b, revenue: byKey.get(b.key)?.revenue ?? 0, orders: byKey.get(b.key)?.orders ?? 0 }));
}

// — Entonnoir —

export type Funnel = { sessions: number; productViews: number; carts: number; checkouts: number };

async function funnel(from: Date, to: Date): Promise<Funnel> {
  const r = await db.one<{ sessions: number; product_views: number; carts: number; checkouts: number }>(
    `select count(distinct session_id) filter (where type in ('visit', 'product_view', 'add_to_cart'))::int as sessions,
            count(distinct session_id) filter (where type = 'product_view')::int as product_views,
            count(distinct session_id) filter (where type = 'add_to_cart')::int as carts,
            count(*) filter (where type = 'checkout_start')::int as checkouts
       from events where created_at >= $1 and created_at < $2`,
    [from, to],
  );
  return { sessions: r!.sessions, productViews: r!.product_views, carts: r!.carts, checkouts: r!.checkouts };
}

// — Le tableau de bord entier —

export type StockLine = { id: string; productId: string; sku: string; name: string; stock: number; perDay: number; days: number | null; level: StockLevel; toOrder: number; emptyOn: Date | null; lowStockAt: number };
export type RecentOrder = { id: string; reference: string; status: OrderStatus; name: string; email: string; total_cents: number; paid_at: Date; units: number };

export async function getDashboard(periodId: string | undefined) {
  const now = new Date();
  const period = resolvePeriod(periodId, now);
  const settings = await getSettings();
  const monthStart = resolvePeriod("mois", now).from;
  const p = parts(now);
  const monthEnd = parisTime(p.y, p.m + 1, 1);

  const [cur, prev, curve, prevCurve, fun, prevFun, split, todo, shipping, variants, loyalty, countries, promos, sources, skus, recent, month] = await Promise.all([
    totals(period.from, period.to),
    totals(period.prevFrom, period.prevTo),
    series(period.from, period.to, period.unit),
    series(period.prevFrom, period.prevTo, period.unit),
    funnel(period.from, period.to),
    funnel(period.prevFrom, period.prevTo),
    // Première commande d'un client, ou réachat : le rang de la commande chez ce client, toutes périodes confondues.
    db.one<{ first_orders: number; first_revenue: number; repeat_orders: number; repeat_revenue: number }>(
      `with ranked as (
         select paid_at, total_cents - refund_cents as net, row_number() over (partition by customer_id order by paid_at, id) as rank
           from orders where status <> 'cancelled' and customer_id is not null)
       select count(*) filter (where rank = 1)::int as first_orders, coalesce(sum(net) filter (where rank = 1), 0)::int as first_revenue,
              count(*) filter (where rank > 1)::int as repeat_orders, coalesce(sum(net) filter (where rank > 1), 0)::int as repeat_revenue
         from ranked where paid_at >= $1 and paid_at < $2`,
      [period.from, period.to],
    ),
    db.one<{ to_prepare: number; to_ship: number; late: number; oldest: Date | null; stale_shipped: number }>(
      `select count(*) filter (where status = 'paid')::int as to_prepare,
              count(*) filter (where status = 'preparing')::int as to_ship,
              count(*) filter (where status in ('paid', 'preparing') and paid_at < now() - make_interval(hours => $1::int))::int as late,
              min(paid_at) filter (where status in ('paid', 'preparing')) as oldest,
              count(*) filter (where status = 'shipped' and shipped_at < now() - interval '10 days')::int as stale_shipped
         from orders`,
      [settings.lateAfterHours],
    ),
    db.one<{ shipped: number; median_hours: number | null; on_time: number }>(
      `select count(*)::int as shipped,
              percentile_cont(0.5) within group (order by extract(epoch from shipped_at - paid_at) / 3600) as median_hours,
              count(*) filter (where shipped_at - paid_at <= make_interval(hours => $3::int))::int as on_time
         from orders where shipped_at >= $1 and shipped_at < $2`,
      [period.from, period.to, settings.lateAfterHours],
    ),
    listVariants(),
    db.one<{ customers: number; repeaters: number; avg_revenue: number; median_days: number | null; to_win_back: number }>(
      `with per as (
         select customer_id, count(*) as n, min(paid_at) as first_at, max(paid_at) as last_at,
                (array_agg(paid_at order by paid_at))[2] as second_at, sum(total_cents - refund_cents) as revenue
           from orders where status <> 'cancelled' and customer_id is not null group by 1)
       select count(*)::int as customers, count(*) filter (where n >= 2)::int as repeaters, coalesce(avg(revenue), 0)::int as avg_revenue,
              percentile_cont(0.5) within group (order by extract(epoch from second_at - first_at) / 86400) filter (where second_at is not null) as median_days,
              count(*) filter (where last_at < now() - interval '30 days' and last_at >= now() - interval '75 days')::int as to_win_back
         from per`,
    ),
    db.query<{ country_code: string; orders: number; revenue: number }>(
      "select country_code, count(*)::int as orders, coalesce(sum(total_cents - refund_cents), 0)::int as revenue from orders where status <> 'cancelled' and paid_at >= $1 and paid_at < $2 group by 1 order by revenue desc limit 6",
      [period.from, period.to],
    ),
    db.query<{ promo_code: string; orders: number; discount: number; revenue: number }>(
      "select promo_code, count(*)::int as orders, coalesce(sum(discount_cents), 0)::int as discount, coalesce(sum(total_cents - refund_cents), 0)::int as revenue from orders where status <> 'cancelled' and promo_code is not null and paid_at >= $1 and paid_at < $2 group by 1 order by orders desc limit 6",
      [period.from, period.to],
    ),
    db.query<{ source: string; sessions: number; carts: number }>(
      `select coalesce(source, 'direct') as source, count(distinct session_id)::int as sessions,
              count(distinct session_id) filter (where session_id in (select session_id from events where type = 'add_to_cart' and created_at >= $1 and created_at < $2))::int as carts
         from events where type = 'visit' and created_at >= $1 and created_at < $2 group by 1 order by sessions desc limit 6`,
      [period.from, period.to],
    ),
    db.query<{ sku: string; name: string; quantity: number; units: number; revenue: number }>(
      `select l.sku, max(l.name) as name, sum(l.quantity)::int as quantity, sum(l.units)::int as units, sum(l.line_cents)::int as revenue
         from order_lines l join orders o on o.id = l.order_id
        where o.status <> 'cancelled' and o.paid_at >= $1 and o.paid_at < $2 group by 1 order by revenue desc`,
      [period.from, period.to],
    ),
    db.query<RecentOrder>(
      `select o.id, o.reference, o.status, o.name, o.email, o.total_cents, o.paid_at,
              (select coalesce(sum(l.units), 0)::int from order_lines l where l.order_id = o.id) as units
         from orders o order by o.paid_at desc limit 7`,
    ),
    totals(monthStart, now),
  ]);

  const stock: StockLine[] = variants
    .filter((v) => v.is_active && !v.stock_variant_id)
    .map((v) => ({ id: v.id, productId: v.product_id, sku: v.sku, name: `${v.product_name} · ${v.name}`, stock: v.stock, lowStockAt: v.low_stock_at, ...cover(v, settings.restockTargetDays) }));

  // L'objectif du mois : où on en est, et où on finit si le rythme tient.
  const elapsed = (now.getTime() - monthStart.getTime()) / (monthEnd.getTime() - monthStart.getTime());
  const goal = settings.monthlyGoalCents > 0
    ? { goal: settings.monthlyGoalCents, revenue: month.revenue, elapsed, projected: elapsed > 0.03 ? Math.round(month.revenue / elapsed) : null }
    : null;

  return {
    period, now, settings, cur, prev, curve, prevCurve, fun, prevFun, split: split!, todo: todo!, shipping: shipping!, stock, loyalty: loyalty!,
    countries, promos, sources, skus, recent, goal,
  };
}
export type Dashboard = Awaited<ReturnType<typeof getDashboard>>;

/** Ce qui attend dans l'admin, pour la pastille du menu. */
export async function pendingCount(): Promise<number> {
  const r = await db.one<{ n: number }>("select count(*)::int as n from orders where status in ('paid', 'preparing')");
  return r?.n ?? 0;
}
