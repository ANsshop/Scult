import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { productAction, stockAction, variantAction } from "../../../actions";
import { BTN_DARK, BTN_GHOST, BTN_PRIMARY, Card, Field, Flash, INPUT, PageHeader, ROW, StockBadge, TABLE, TD, TH, TableWrap, Tag } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { centsInput, dateTime, eur, num, pct } from "@/lib/admin/format";
import { cover, getProduct } from "@/lib/store/products";
import { getSettings } from "@/lib/store/settings";

export const metadata: Metadata = { title: "Produit" };

const REASON: Record<string, string> = { order: "Commande", return: "Retour en rayon", restock: "Réassort", adjust: "Correction", seed: "Stock de départ" };

export default async function ProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin();
  const [{ id }, sp, settings] = await Promise.all([params, searchParams, getSettings()]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getProduct(id);
  if (!data) notFound();
  const { product, variants, movements } = data;

  return (
    <>
      <PageHeader title={product.name} back={{ href: "/admin/produits", label: "Produits et stock" }} sub={<span className="flex flex-wrap items-center gap-2"><Tag>{product.is_active ? "En vente" : "Hors vente"}</Tag><Link href={`/produits/${product.slug}`} className="underline underline-offset-4 hover:text-texte">Voir la fiche sur le site</Link></span>} />
      <Flash ok={sp.ok} erreur={sp.erreur} />

      <div className="grid items-start gap-3 xl:grid-cols-[1.3fr_1fr]">
        <div className="grid gap-3">
          {variants.map((v) => {
            const c = cover(v, settings.restockTargetDays);
            const margin = v.effective_cost_cents === null ? null : v.price_cents - v.effective_cost_cents;
            return (
              <Card key={v.id} title={v.name} hint={v.sku} action={v.stock_variant_id ? <Tag>puise dans le stock de {v.holder_sku}</Tag> : <StockBadge level={c.level} />}>
                <form action={variantAction} className="grid gap-4 sm:grid-cols-2">
                  <input type="hidden" name="id" value={v.id} /><input type="hidden" name="productId" value={product.id} />
                  <Field label="Prix de vente (€, TTC)"><input name="price" inputMode="decimal" required defaultValue={centsInput(v.price_cents)} className={INPUT} /></Field>
                  <Field label="Prix barré (€)" hint="Facultatif. Affiché barré à côté du prix."><input name="compareAt" inputMode="decimal" defaultValue={centsInput(v.compare_at_cents)} className={INPUT} /></Field>
                  <Field label="Prix de revient (€)" hint={v.stock_variant_id ? `Vide : ${v.unit_count} fois celui du pot${v.effective_cost_cents !== null ? `, soit ${eur(v.effective_cost_cents)}` : ""}.` : "Ce que vous coûte un pot livré chez vous. Sert à calculer la marge."}><input name="cost" inputMode="decimal" defaultValue={centsInput(v.cost_cents)} placeholder={v.stock_variant_id ? "Déduit du pot" : "ex. 14,50"} className={INPUT} /></Field>
                  <Field label="Seuil d'alerte (pots)" hint="En dessous, le stock passe en « critique »."><input name="lowStockAt" inputMode="numeric" defaultValue={v.low_stock_at} disabled={Boolean(v.stock_variant_id)} className={`${INPUT} disabled:bg-[#f4f3f0] disabled:text-discret`} />{v.stock_variant_id && <input type="hidden" name="lowStockAt" value={v.low_stock_at} />}</Field>
                  <label className="flex items-center gap-2.5 text-[0.875rem] sm:col-span-2"><input type="checkbox" name="isActive" defaultChecked={v.is_active} className="accent-[#ff2e93]" />En vente sur le site</label>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 sm:col-span-2">
                    <p className="text-[0.82rem] text-doux">{margin === null ? "Marge : prix de revient à renseigner." : <>Marge par vente : <strong className="text-texte">{eur(margin)}</strong> ({pct(margin / Math.max(1, v.price_cents), 0)})</>}</p>
                    <button type="submit" className={BTN_DARK}>Enregistrer</button>
                  </div>
                </form>

                {!v.stock_variant_id && (
                  <div className="mt-5 border-t pt-5">
                    <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><span className="text-[1.7rem] font-semibold leading-none tabular-nums">{num(v.stock)}</span><span className="text-[0.875rem] text-doux">pots en stock{c.days !== null && ` · ${num(c.days)} jours au rythme actuel (${num(c.perDay, 1)} par jour)`}</span></p>
                    <form action={stockAction} className="mt-4 grid gap-3 sm:grid-cols-[11rem_7rem_1fr_auto] sm:items-end">
                      <input type="hidden" name="id" value={v.id} /><input type="hidden" name="productId" value={product.id} />
                      <Field label="Mouvement"><select name="kind" className={INPUT}><option value="restock">Réassort (entrée)</option><option value="add">Correction : ajouter</option><option value="remove">Correction : retirer</option></select></Field>
                      <Field label="Quantité"><input name="quantity" inputMode="numeric" required placeholder="0" className={INPUT} /></Field>
                      <Field label="Note"><input name="note" placeholder="Lot 003, casse, inventaire" className={INPUT} /></Field>
                      <button type="submit" className={BTN_PRIMARY}>Valider</button>
                    </form>
                    <p className="mt-2 text-[0.76rem] text-discret">On saisit un écart, pas un total : une commande passée entre-temps n&apos;est jamais écrasée.{c.toOrder > 0 && ` Pour tenir ${settings.restockTargetDays} jours, il faudrait commander ${num(c.toOrder)} pots.`}</p>
                  </div>
                )}
              </Card>
            );
          })}

          <Card title="Journal du stock" hint="Les 40 derniers mouvements." flush>
            <TableWrap>
              <table className={TABLE}>
                <thead><tr><th className={TH}>Date</th><th className={TH}>Mouvement</th><th className={`${TH} text-right`}>Écart</th><th className={`${TH} text-right`}>Stock après</th></tr></thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className={ROW}>
                      <td className={`${TD} whitespace-nowrap text-doux`}>{dateTime(m.created_at)}</td>
                      <td className={TD}>{REASON[m.reason] ?? m.reason}{m.reference && m.order_id && <> · <Link href={`/admin/commandes/${m.order_id}`} className="underline underline-offset-2 hover:text-rose">{m.reference}</Link></>}<span className="block text-[0.76rem] text-discret">{[m.note, m.actor].filter(Boolean).join(" · ")}</span></td>
                      <td className={`${TD} text-right font-medium tabular-nums`}>{m.delta > 0 ? "+" : "−"}{num(Math.abs(m.delta))}</td>
                      <td className={`${TD} text-right tabular-nums`}>{num(m.stock_after)}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && <tr><td className={`${TD} text-doux`} colSpan={4}>Aucun mouvement pour l&apos;instant.</td></tr>}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </div>

        <Card title="Fiche sur le site" hint="Le nom et la description affichés aux clients.">
          <form action={productAction} className="space-y-4">
            <input type="hidden" name="id" value={product.id} />
            <Field label="Nom"><input name="name" required defaultValue={product.name} className={INPUT} /></Field>
            <Field label="Description" hint="Aucune promesse d'effet : le texte doit rester factuel (règlement sur les allégations)."><textarea name="description" rows={6} defaultValue={product.description} className={`${INPUT} h-auto py-2.5 leading-relaxed`} /></Field>
            <Field label="Titre pour Google" hint="Facultatif."><input name="seoTitle" defaultValue={product.seo_title ?? ""} className={INPUT} /></Field>
            <Field label="Description pour Google" hint="Facultatif. 155 caractères environ."><textarea name="seoDescription" rows={3} defaultValue={product.seo_description ?? ""} className={`${INPUT} h-auto py-2.5`} /></Field>
            <label className="flex items-center gap-2.5 text-[0.875rem]"><input type="checkbox" name="isActive" defaultChecked={product.is_active} className="accent-[#ff2e93]" />Produit en vente</label>
            <button type="submit" className={`${BTN_GHOST} w-full`}>Enregistrer la fiche</button>
          </form>
        </Card>
      </div>
    </>
  );
}
