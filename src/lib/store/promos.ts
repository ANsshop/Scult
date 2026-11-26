import "server-only";
import { db, type Db } from "@/lib/db";

export type Promo = {
  id: string; code: string; label: string | null; discount_type: "percent" | "fixed"; discount_value: number;
  min_subtotal_cents: number; max_uses: number | null; uses_count: number; starts_at: Date | null; ends_at: Date | null;
  is_active: boolean; created_at: Date;
};

export const normalizeCode = (code: string) => code.trim().toUpperCase();

/** La remise d'un code sur un sous-total, en centimes ; jamais plus que le sous-total. */
export function promoDiscount(promo: Pick<Promo, "discount_type" | "discount_value">, subtotalCents: number): number {
  const raw = promo.discount_type === "percent" ? Math.round((subtotalCents * promo.discount_value) / 100) : promo.discount_value;
  return Math.max(0, Math.min(raw, subtotalCents));
}

/** Pourquoi un code ne s'applique pas, ou `null` s'il s'applique. */
export function promoProblem(promo: Promo, subtotalCents: number, now = new Date()): string | null {
  if (!promo.is_active) return "Ce code promo n'est plus actif.";
  if (promo.starts_at && now < promo.starts_at) return "Ce code promo n'est pas encore valable.";
  if (promo.ends_at && now > promo.ends_at) return "Ce code promo a expiré.";
  if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) return "Ce code promo a déjà été utilisé le nombre de fois prévu.";
  if (subtotalCents < promo.min_subtotal_cents) return `Ce code promo demande ${(promo.min_subtotal_cents / 100).toFixed(2).replace(".", ",").replace(",00", "")} € d'achat au minimum.`;
  return null;
}

export const findPromo = (code: string, on: Db = db) => on.one<Promo>("select * from promo_codes where code = $1", [normalizeCode(code)]);

/** Les codes et ce qu'ils ont rapporté : commandes, remise accordée, chiffre d'affaires (commandes non annulées). */
export type PromoWithStats = Promo & { orders: number; discount_cents: number; revenue_cents: number };
export const listPromos = () =>
  db.query<PromoWithStats>(
    `select p.*, count(o.id)::int as orders, coalesce(sum(o.discount_cents), 0)::int as discount_cents,
            coalesce(sum(o.total_cents - o.refund_cents), 0)::int as revenue_cents
       from promo_codes p
       left join orders o on o.promo_code = p.code and o.status <> 'cancelled'
      group by p.id order by p.is_active desc, p.created_at desc`,
  );

export const getPromo = (id: string) => db.one<Promo>("select * from promo_codes where id = $1", [id]);

export type PromoInput = {
  code: string; label: string | null; discountType: "percent" | "fixed"; discountValue: number; minSubtotalCents: number;
  maxUses: number | null; startsAt: Date | null; endsAt: Date | null; isActive: boolean;
};

/** Crée (`id` nul) ou modifie un code. Rend `null` si le code existe déjà sous un autre identifiant. */
export async function savePromo(id: string | null, input: PromoInput): Promise<string | null> {
  const values = [normalizeCode(input.code), input.label, input.discountType, input.discountValue, input.minSubtotalCents, input.maxUses, input.startsAt, input.endsAt, input.isActive];
  const clash = await db.one<{ id: string }>("select id from promo_codes where code = $1", [values[0]]);
  if (clash && clash.id !== id) return null;
  if (id) {
    await db.query(
      `update promo_codes set code = $1, label = $2, discount_type = $3, discount_value = $4, min_subtotal_cents = $5,
              max_uses = $6, starts_at = $7, ends_at = $8, is_active = $9, updated_at = now() where id = $10`,
      [...values, id],
    );
    return id;
  }
  const row = await db.one<{ id: string }>(
    `insert into promo_codes (code, label, discount_type, discount_value, min_subtotal_cents, max_uses, starts_at, ends_at, is_active)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
    values,
  );
  return row!.id;
}

/** Un code jamais utilisé se supprime ; un code utilisé est seulement désactivé, pour garder l'historique. */
export async function removePromo(id: string): Promise<"deleted" | "disabled"> {
  const promo = await getPromo(id);
  if (!promo) return "deleted";
  const used = await db.one<{ n: number }>("select count(*)::int as n from orders where promo_code = $1", [promo.code]);
  if ((used?.n ?? 0) > 0 || promo.uses_count > 0) {
    await db.query("update promo_codes set is_active = false, updated_at = now() where id = $1", [id]);
    return "disabled";
  }
  await db.query("delete from promo_codes where id = $1", [id]);
  return "deleted";
}
