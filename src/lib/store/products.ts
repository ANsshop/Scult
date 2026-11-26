import "server-only";
import { db, tx } from "@/lib/db";
import { moveStock } from "./orders";

/**
 * Les produits vus de l'admin : prix, prix de revient, stock, et ce que le
 * stock permet encore de tenir au rythme des ventes.
 */

export type VariantStock = {
  id: string; product_id: string; product_name: string; product_slug: string; sku: string; name: string;
  price_cents: number; compare_at_cents: number | null; cost_cents: number | null; effective_cost_cents: number | null;
  stock: number; low_stock_at: number; unit_count: number; stock_variant_id: string | null; holder_sku: string | null; holder_stock: number | null;
  is_active: boolean; units_30d: number; units_7d: number;
  /** Ventes de cet article lui-même sur 30 jours (un pack vendu = 1), sans ce qui part dans les packs. */
  sold_30d: number;
};

/** Sur combien de jours on mesure le rythme des ventes. */
export const PACE_DAYS = 30;

/**
 * Toutes les variantes, avec les unités sorties sur 30 et 7 jours. Pour un
 * article qui tient son propre stock, les unités comptent aussi celles parties
 * dans les packs qui puisent chez lui : c'est son stock qui baisse.
 */
export const listVariants = () =>
  db.query<VariantStock>(
    `select v.id, v.product_id, p.name as product_name, p.slug as product_slug, v.sku, v.name, v.price_cents, v.compare_at_cents, v.cost_cents,
            coalesce(v.cost_cents, s.cost_cents * v.unit_count) as effective_cost_cents,
            v.stock, v.low_stock_at, v.unit_count, v.stock_variant_id, s.sku as holder_sku, s.stock as holder_stock, v.is_active,
            coalesce(m.units_30d, 0)::int as units_30d, coalesce(m.units_7d, 0)::int as units_7d, coalesce(m.sold_30d, 0)::int as sold_30d
       from variants v
       join products p on p.id = v.product_id
       left join variants s on s.id = v.stock_variant_id
       left join lateral (
         select sum(l.units) filter (where o.paid_at >= now() - interval '${PACE_DAYS} days') as units_30d,
                sum(l.units) filter (where o.paid_at >= now() - interval '7 days') as units_7d,
                sum(l.quantity) filter (where lv.id = v.id and o.paid_at >= now() - interval '${PACE_DAYS} days') as sold_30d
           from order_lines l
           join orders o on o.id = l.order_id and o.status <> 'cancelled'
           join variants lv on lv.id = l.variant_id
          where case when v.stock_variant_id is null then coalesce(lv.stock_variant_id, lv.id) = v.id else lv.id = v.id end
       ) m on true
      order by p.position, p.name, v.position, v.name`,
  );

export type StockLevel = "rupture" | "critique" | "a-surveiller" | "ok" | "sans-vente";

/**
 * Ce que le stock permet de tenir : le rythme (unités par jour sur 30 jours),
 * le nombre de jours restants, et un niveau d'alerte à quatre degrés —
 * pas un « critique » pour tout.
 */
export function cover(v: { stock: number; low_stock_at: number; units_30d: number }, restockTargetDays: number) {
  const perDay = v.units_30d / PACE_DAYS;
  const days = perDay > 0 ? Math.max(0, v.stock) / perDay : null;
  const level: StockLevel = v.stock <= 0 ? "rupture" : days === null ? (v.stock <= v.low_stock_at ? "critique" : "sans-vente") : days < 14 || v.stock <= v.low_stock_at ? "critique" : days < 30 ? "a-surveiller" : "ok";
  // Ce qu'il faut commander pour revenir au nombre de jours de stock visé.
  const toOrder = perDay > 0 ? Math.max(0, Math.ceil(perDay * restockTargetDays - Math.max(0, v.stock))) : 0;
  return { perDay, days, level, toOrder, emptyOn: days === null ? null : new Date(Date.now() + days * 86_400_000) };
}

export type ProductDetail = {
  id: string; slug: string; name: string; description: string; category_name: string | null; seo_title: string | null; seo_description: string | null;
  images: { url: string; alt: string; width: number; height: number }[]; is_active: boolean; updated_at: Date;
};
export type Movement = { id: string; variant_id: string; sku: string; delta: number; stock_after: number; reason: string; note: string | null; actor: string | null; created_at: Date; reference: string | null; order_id: string | null };

export async function getProduct(id: string) {
  const product = await db.one<ProductDetail>("select * from products where id = $1", [id]);
  if (!product) return null;
  const [variants, movements] = await Promise.all([
    listVariants().then((all) => all.filter((v) => v.product_id === id)),
    db.query<Movement>(
      `select m.id::text, m.variant_id, v.sku, m.delta, m.stock_after, m.reason, m.note, m.actor, m.created_at, o.reference, m.order_id
         from stock_movements m join variants v on v.id = m.variant_id left join orders o on o.id = m.order_id
        where v.product_id = $1 order by m.created_at desc, m.id desc limit 40`,
      [id],
    ),
  ]);
  return { product, variants, movements };
}

export const listProducts = () =>
  db.query<{ id: string; slug: string; name: string; is_active: boolean; image: string | null }>("select id, slug, name, is_active, images->0->>'url' as image from products order by position, name");

export async function saveProduct(id: string, input: { name: string; description: string; seoTitle: string | null; seoDescription: string | null; isActive: boolean }) {
  await db.query("update products set name = $2, description = $3, seo_title = $4, seo_description = $5, is_active = $6, updated_at = now() where id = $1", [
    id, input.name, input.description, input.seoTitle, input.seoDescription, input.isActive,
  ]);
}

export async function saveVariant(id: string, input: { priceCents: number; compareAtCents: number | null; costCents: number | null; lowStockAt: number; isActive: boolean }) {
  await db.query("update variants set price_cents = $2, compare_at_cents = $3, cost_cents = $4, low_stock_at = $5, is_active = $6, updated_at = now() where id = $1", [
    id, input.priceCents, input.compareAtCents, input.costCents, input.lowStockAt, input.isActive,
  ]);
}

/**
 * Entrée de stock (réassort) ou correction d'inventaire. On écrit un écart,
 * jamais une valeur absolue : une commande passée pendant que l'écran était
 * ouvert n'est pas écrasée.
 */
export async function adjustStock(variantId: string, delta: number, reason: "restock" | "adjust", note: string | null, actor: string): Promise<{ ok: true; stock: number } | { ok: false; error: string }> {
  if (!Number.isInteger(delta) || delta === 0) return { ok: false, error: "Quantité invalide." };
  return tx(async (on) => {
    const v = await on.one<{ stock_variant_id: string | null }>("select stock_variant_id from variants where id = $1 for update", [variantId]);
    if (!v) return { ok: false, error: "Article introuvable." };
    if (v.stock_variant_id) return { ok: false, error: "Un pack n'a pas de stock à lui : corrigez celui du pot." };
    return { ok: true, stock: await moveStock(on, variantId, delta, reason, { note, actor }) };
  });
}
