import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { customerNoteAction } from "../../../actions";
import { BTN_GHOST, Card, Flash, INPUT, PageHeader, ROW, Stat, StatusBadge, TABLE, TD, TH, TableWrap, Tag } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { ago, country, dateLong, dateTime, eur, num } from "@/lib/admin/format";
import { getCustomer } from "@/lib/store/customers";

export const metadata: Metadata = { title: "Client" };

export default async function CustomerPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const data = await getCustomer(id);
  if (!data) notFound();
  const { customer, orders, address, stats } = data;
  const now = new Date();
  const overdue = stats.nextExpectedAt && stats.nextExpectedAt < now;

  return (
    <>
      <PageHeader
        title={customer.name || customer.email}
        back={{ href: "/admin/clients", label: "Clients" }}
        sub={<span className="flex flex-wrap items-center gap-x-3 gap-y-2"><a href={`mailto:${customer.email}`} className="underline underline-offset-4 hover:text-texte">{customer.email}</a>{stats.firstAt && <span>Client depuis le {dateLong(stats.firstAt)}</span>}{stats.orders >= 3 && <Tag tone="rose">fidèle</Tag>}</span>}
      />
      <Flash ok={sp.ok} erreur={sp.erreur} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Dépense totale" value={eur(stats.revenueCents, true)} note="Commandes non annulées, remboursements déduits." />
        <Stat label="Commandes" value={num(stats.orders)} note={`${num(stats.units)} pots au total.`} />
        <Stat label="Panier moyen" value={stats.orders ? eur(stats.averageCents) : "—"} />
        <Stat
          label="Rythme d'achat"
          value={stats.avgGapDays === null ? "—" : `${num(stats.avgGapDays)} j`}
          note={stats.avgGapDays === null ? (stats.lastAt ? `Un seul achat, ${ago(stats.lastAt, now)}.` : "Aucun achat.") : <>Entre deux commandes, en moyenne. {stats.nextExpectedAt && (overdue ? <strong className="text-texte">Aurait dû recommander le {dateLong(stats.nextExpectedAt)}.</strong> : `Prochaine attendue vers le ${dateLong(stats.nextExpectedAt)}.`)}</>}
        />
      </div>

      <div className="mt-3 grid items-start gap-3 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Commandes" flush>
          <TableWrap>
            <table className={TABLE}>
              <thead><tr><th className={TH}>Commande</th><th className={TH}>Date</th><th className={`${TH} text-right`}>Pots</th><th className={`${TH} text-right`}>Total</th><th className={TH}>Statut</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className={ROW}>
                    <td className={TD}><Link href={`/admin/commandes/${o.id}`} className="font-semibold hover:underline">{o.reference}</Link>{o.promo_code && <span className="block text-[0.74rem] text-discret">{o.promo_code}</span>}</td>
                    <td className={`${TD} whitespace-nowrap text-doux`}>{dateTime(o.paid_at)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{o.units}</td>
                    <td className={`${TD} text-right font-medium tabular-nums`}>{eur(o.total_cents)}{o.refund_cents > 0 && <span className="block text-[0.74rem] font-normal" style={{ color: "#a82424" }}>−{eur(o.refund_cents)} remboursés</span>}</td>
                    <td className={TD}><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>

        <div className="grid gap-3">
          {address && (
            <Card title="Dernière adresse de livraison">
              <address className="text-[0.875rem] not-italic leading-relaxed">{customer.name}<br />{address.address_line1}{address.address_line2 && <><br />{address.address_line2}</>}<br />{address.postal_code} {address.city}<br />{country(address.country_code)}</address>
            </Card>
          )}
          <Card title="Note interne" hint="Visible seulement ici.">
            <form action={customerNoteAction} className="space-y-3">
              <input type="hidden" name="id" value={customer.id} />
              <textarea name="note" rows={4} defaultValue={customer.note ?? ""} placeholder="Coach, salle partenaire, préfère Mondial Relay" className={`${INPUT} h-auto py-2.5`} />
              <button type="submit" className={BTN_GHOST}>Enregistrer la note</button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
