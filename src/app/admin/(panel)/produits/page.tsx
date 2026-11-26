import type { Metadata } from "next";
import Link from "next/link";
import { Card, Flash, Icon, Meter, PageHeader, ROW, STATE, StockBadge, TABLE, TD, TH, TableWrap, Tag, levelColor } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { dateShort, eur, num, pct } from "@/lib/admin/format";
import { cover, listVariants } from "@/lib/store/products";
import { getSettings } from "@/lib/store/settings";

export const metadata: Metadata = { title: "Produits et stock" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin();
  const [sp, variants, settings] = await Promise.all([searchParams, listVariants(), getSettings()]);
  const holders = variants.filter((v) => !v.stock_variant_id);
  const missingCost = variants.filter((v) => v.is_active && v.effective_cost_cents === null);
  const stockValue = holders.reduce((s, v) => s + (v.cost_cents ?? 0) * Math.max(0, v.stock), 0);

  return (
    <>
      <PageHeader title="Produits et stock" sub="Les prix, le prix de revient, et ce que le stock permet de tenir au rythme des 30 derniers jours." />
      <Flash ok={sp.ok} erreur={sp.erreur} />
      {missingCost.length > 0 && (
        <p className="mb-4 flex items-start gap-2.5 rounded-xl border border-[#ec835a]/50 bg-[#ec835a]/8 px-4 py-3 text-[0.875rem]">
          <Icon name="alert" className="mt-0.5 shrink-0" style={{ color: STATE.serious }} />
          <span>Prix de revient manquant sur {missingCost.map((v) => v.sku).join(", ")} : sans lui, la marge ne peut pas se calculer. Ouvrez le produit pour le renseigner.</span>
        </p>
      )}

      <Card title="Stock" hint={`Quantité à commander : pour revenir à ${settings.restockTargetDays} jours de stock. Valeur du stock au prix de revient : ${eur(stockValue, true)}.`} flush>
        <TableWrap>
          <table className={TABLE}>
            <thead><tr><th className={TH}>Article</th><th className={`${TH} text-right`}>En stock</th><th className={`${TH} text-right`}>Sortis 7 j</th><th className={`${TH} text-right`}>Sortis 30 j</th><th className={TH}>Tient encore</th><th className={`${TH} text-right`}>À commander</th></tr></thead>
            <tbody>
              {holders.map((v) => {
                const c = cover(v, settings.restockTargetDays);
                // La semaine s'emballe-t-elle par rapport au mois ? Alors le stock tiendra moins que prévu.
                const hot = v.units_7d / 7 > (v.units_30d / 30) * 1.3 && v.units_7d >= 5;
                return (
                  <tr key={v.id} className={ROW}>
                    <td className={`${TD} min-w-[13rem]`}><Link href={`/admin/produits/${v.product_id}`} className="font-medium hover:underline">{v.product_name} · {v.name}</Link><span className="block text-[0.76rem] text-discret">{v.sku}{!v.is_active && " · hors vente"}</span></td>
                    <td className={`${TD} text-right text-[1rem] font-semibold tabular-nums`}>{num(v.stock)}<span className="block text-[0.74rem] font-normal text-discret">alerte à {num(v.low_stock_at)}</span></td>
                    <td className={`${TD} text-right tabular-nums`}>{num(v.units_7d)}{hot && <span className="block text-[0.74rem]" style={{ color: "#a8501f" }}>ça accélère</span>}</td>
                    <td className={`${TD} text-right tabular-nums`}>{num(v.units_30d)}<span className="block text-[0.74rem] text-discret">{c.perDay > 0 ? `${num(c.perDay, 1)} par jour` : "—"}</span></td>
                    <td className={TD}>
                      <div className="flex items-center gap-3"><div className="w-20 shrink-0"><Meter ratio={c.days === null ? (v.stock > 0 ? 1 : 0) : c.days / 60} color={levelColor(c.level)} label={c.days === null ? "Pas de vente récente" : `${num(c.days)} jours de stock`} /></div><span className="whitespace-nowrap font-medium tabular-nums">{c.days === null ? "—" : `${num(c.days)} j`}</span><StockBadge level={c.level} /></div>
                      {c.emptyOn && v.stock > 0 && <span className="mt-1 block text-[0.76rem] text-discret">Rupture estimée le {dateShort(c.emptyOn)}</span>}
                    </td>
                    <td className={`${TD} text-right tabular-nums`}>{c.toOrder > 0 ? <span className="font-semibold">{num(c.toOrder)}</span> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Card title="Prix et marge" hint="Par article vendu. La marge est celle d'une vente au prix affiché, sans code promo." className="mt-3" flush>
        <TableWrap>
          <table className={TABLE}>
            <thead><tr><th className={TH}>Article</th><th className={`${TH} text-right`}>Prix de vente</th><th className={`${TH} text-right`}>Prix de revient</th><th className={`${TH} text-right`}>Marge par vente</th><th className={`${TH} text-right`}>Taux</th><th className={`${TH} text-right`}>Vendus 30 j</th></tr></thead>
            <tbody>
              {variants.map((v) => {
                const cost = v.effective_cost_cents;
                const margin = cost === null ? null : v.price_cents - cost;
                return (
                  <tr key={v.id} className={ROW}>
                    <td className={`${TD} min-w-[13rem]`}>
                      <Link href={`/admin/produits/${v.product_id}`} className="font-medium hover:underline">{v.product_name} · {v.name}</Link>
                      <span className="flex flex-wrap items-center gap-2 text-[0.76rem] text-discret">{v.sku}{v.stock_variant_id && <Tag>puise dans {v.holder_sku}</Tag>}{!v.is_active && <Tag>hors vente</Tag>}</span>
                    </td>
                    <td className={`${TD} text-right tabular-nums`}>{eur(v.price_cents)}{v.compare_at_cents && <span className="block text-[0.74rem] text-discret line-through">{eur(v.compare_at_cents)}</span>}</td>
                    <td className={`${TD} text-right tabular-nums`}>{cost === null ? <span style={{ color: "#a8501f" }}>à renseigner</span> : eur(cost)}{v.cost_cents === null && cost !== null && <span className="block text-[0.74rem] text-discret">{v.unit_count} × le pot</span>}</td>
                    <td className={`${TD} text-right font-medium tabular-nums`}>{margin === null ? "—" : eur(margin)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{margin === null || v.price_cents === 0 ? "—" : pct(margin / v.price_cents, 0)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{num(v.sold_30d)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </>
  );
}
