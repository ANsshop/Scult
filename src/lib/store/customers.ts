import "server-only";
import { db } from "@/lib/db";
import type { OrderStatus } from "./orders";

/**
 * Les clients : une ligne par adresse e-mail, invités compris (la boutique n'a
 * pas de compte client). Tous les chiffres portent sur les commandes non annulées,
 * remboursements déduits.
 */
export type CustomerRow = {
  id: string; email: string; name: string; orders: number; revenue_cents: number; first_at: Date | null; last_at: Date | null; country_code: string | null;
};

export const CUSTOMER_SORTS = { recent: "last_at desc nulls last", depense: "revenue_cents desc", commandes: "orders desc, revenue_cents desc", ancien: "first_at asc nulls last" } as const;
export type CustomerSort = keyof typeof CUSTOMER_SORTS;
export const CUSTOMERS_PAGE = 40;

export async function listCustomers(opts: { q?: string; sort?: CustomerSort; page?: number; only?: "fideles" | "a-relancer" | null }) {
  const params: unknown[] = [];
  const where: string[] = [];
  const q = opts.q?.trim();
  if (q) { params.push(`%${q.replace(/[%_\\]/g, "\\$&")}%`); where.push(`(c.email ilike $${params.length} or c.name ilike $${params.length})`); }
  // « À relancer » : dernier achat il y a 30 à 75 jours — le pot (30 doses) est fini, le client n'est pas encore perdu.
  const having = opts.only === "fideles" ? "having count(o.id) >= 2"
    : opts.only === "a-relancer" ? "having max(o.paid_at) < now() - interval '30 days' and max(o.paid_at) >= now() - interval '75 days'" : "";
  const clause = where.length ? `where ${where.join(" and ")}` : "";
  const page = Math.max(1, opts.page ?? 1);
  const base = `
    from customers c
    left join orders o on o.customer_id = c.id and o.status <> 'cancelled'
    ${clause}
    group by c.id ${having}`;
  const [rows, total] = await Promise.all([
    db.query<CustomerRow>(
      `select c.id, c.email, c.name, count(o.id)::int as orders, coalesce(sum(o.total_cents - o.refund_cents), 0)::int as revenue_cents,
              min(o.paid_at) as first_at, max(o.paid_at) as last_at, (array_agg(o.country_code order by o.paid_at desc))[1] as country_code
         ${base} order by ${CUSTOMER_SORTS[opts.sort ?? "recent"]}, c.email limit ${CUSTOMERS_PAGE} offset ${(page - 1) * CUSTOMERS_PAGE}`,
      params,
    ),
    db.one<{ n: number }>(`select count(*)::int as n from (select c.id ${base}) t`, params),
  ]);
  return { rows, total: total?.n ?? 0, page, pages: Math.max(1, Math.ceil((total?.n ?? 0) / CUSTOMERS_PAGE)) };
}

export type CustomerOrder = { id: string; reference: string; status: OrderStatus; total_cents: number; refund_cents: number; paid_at: Date; units: number; promo_code: string | null };

export async function getCustomer(id: string) {
  const customer = await db.one<{ id: string; email: string; name: string; note: string | null; created_at: Date }>("select id, email, name, note, created_at from customers where id = $1", [id]);
  if (!customer) return null;
  const orders = await db.query<CustomerOrder>(
    `select o.id, o.reference, o.status, o.total_cents, o.refund_cents, o.paid_at, o.promo_code,
            (select coalesce(sum(l.units), 0)::int from order_lines l where l.order_id = o.id) as units
       from orders o where o.customer_id = $1 order by o.paid_at desc`,
    [id],
  );
  const kept = orders.filter((o) => o.status !== "cancelled");
  const revenue = kept.reduce((s, o) => s + o.total_cents - o.refund_cents, 0);
  const dates = kept.map((o) => o.paid_at.getTime()).sort((a, b) => a - b);
  // L'écart moyen entre deux commandes : dit quand ce client devrait recommander.
  const gaps = dates.slice(1).map((d, i) => (d - dates[i]) / 86_400_000);
  const avgGapDays = gaps.length ? gaps.reduce((s, g) => s + g, 0) / gaps.length : null;
  const address = await db.one<{ address_line1: string; address_line2: string | null; postal_code: string; city: string; country_code: string }>(
    "select address_line1, address_line2, postal_code, city, country_code from orders where customer_id = $1 order by paid_at desc limit 1",
    [id],
  );
  return {
    customer, orders, address,
    stats: {
      orders: kept.length, revenueCents: revenue, averageCents: kept.length ? Math.round(revenue / kept.length) : 0,
      units: kept.reduce((s, o) => s + o.units, 0), firstAt: dates.length ? new Date(dates[0]) : null, lastAt: dates.length ? new Date(dates[dates.length - 1]) : null,
      avgGapDays, nextExpectedAt: avgGapDays && dates.length ? new Date(dates[dates.length - 1] + avgGapDays * 86_400_000) : null,
    },
  };
}

export async function saveCustomerNote(id: string, note: string) {
  await db.query("update customers set note = $2 where id = $1", [id, note.trim() || null]);
}
