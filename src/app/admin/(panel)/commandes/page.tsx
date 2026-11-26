import type { Metadata } from "next";
import Link from "next/link";
import { orderAction } from "../../actions";
import { BTN_DARK, BTN_GHOST, Card, Empty, Flash, INPUT, PageHeader, Pagination, ROW, StatusBadge, TABLE, TD, TH, TableWrap, Tabs, Tag } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { ago, country, dateTime, eur } from "@/lib/admin/format";
import { ORDER_TABS, listOrders, orderCounts, type OrderTab } from "@/lib/store/orders";
import { getSettings } from "@/lib/store/settings";

export const metadata: Metadata = { title: "Commandes" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ onglet?: string; q?: string; page?: string; ok?: string; erreur?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const tab = (ORDER_TABS.find((t) => t.id === sp.onglet)?.id ?? "a-traiter") as OrderTab;
  const [{ rows, total, page, pages }, counts, settings] = await Promise.all([listOrders({ tab, q: sp.q, page: Number(sp.page) || 1 }), orderCounts(), getSettings()]);
  const now = new Date();
  const lateBefore = now.getTime() - settings.lateAfterHours * 3_600_000;
  const href = (o: { onglet?: string; page?: number }) => {
    const p = new URLSearchParams();
    const onglet = o.onglet ?? tab;
    if (onglet !== "a-traiter") p.set("onglet", onglet);
    if (sp.q) p.set("q", sp.q);
    if (o.page && o.page > 1) p.set("page", String(o.page));
    const qs = p.toString();
    return `/admin/commandes${qs ? `?${qs}` : ""}`;
  };
  const count = (statuses: readonly string[]) => (statuses.length ? statuses.reduce((s, k) => s + (counts[k as keyof typeof counts] ?? 0), 0) : Object.values(counts).reduce((s, n) => s + n, 0));

  return (
    <>
      <PageHeader title="Commandes" sub={tab === "a-traiter" ? "Ce qui attend, la plus ancienne en premier : c'est l'ordre de préparation." : `${total} commande${total > 1 ? "s" : ""}.`} />
      <Flash ok={sp.ok} erreur={sp.erreur} />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs current={tab} items={ORDER_TABS.map((t) => ({ id: t.id, label: t.label, href: href({ onglet: t.id, page: 1 }), count: count(t.statuses) }))} />
        <form className="flex w-full gap-2 sm:w-auto">
          {tab !== "a-traiter" && <input type="hidden" name="onglet" value={tab} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Référence, e-mail, nom, suivi" aria-label="Chercher une commande" className={`${INPUT} sm:w-72`} />
          <button type="submit" className={BTN_GHOST}>Chercher</button>
        </form>
      </div>

      <Card flush className="[&>div]:pt-0">
        {rows.length === 0 ? (
          <Empty title={sp.q ? "Aucune commande ne correspond." : tab === "a-traiter" ? "Rien à préparer." : "Aucune commande ici."}>{tab === "a-traiter" && !sp.q ? "Tout est parti. Les nouvelles commandes payées arrivent ici." : undefined}</Empty>
        ) : (
          <>
          {/* Téléphone : une carte par commande, tout tient sans défiler de côté */}
          <ul className="divide-y md:hidden">
            {rows.map((o) => {
              const waiting = o.status === "paid" || o.status === "preparing";
              const late = waiting && o.paid_at.getTime() < lateBefore;
              return (
                <li key={o.id}>
                  <Link href={`/admin/commandes/${o.id}`} className="block px-4 py-3.5 active:bg-[#f4f3f0]">
                    <span className="flex items-center justify-between gap-3"><span className="font-semibold">{o.reference}</span><StatusBadge status={o.status} /></span>
                    <span className="mt-1.5 flex items-baseline justify-between gap-3 text-[0.875rem]"><span className="truncate">{o.name || o.email}{o.customer_orders > 1 && <span className="text-discret"> · {o.customer_orders}ᵉ commande</span>}</span><span className="shrink-0 font-medium tabular-nums">{eur(o.total_cents)}</span></span>
                    <span className="mt-0.5 block text-[0.76rem]" style={{ color: late ? "#a82424" : "#76736d" }}>{o.units} pot{o.units > 1 ? "s" : ""} · {o.city}, {country(o.country_code)} · {waiting ? `payée ${ago(o.paid_at, now)}${late ? " · en retard" : ""}` : dateTime(o.paid_at)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="hidden md:block">
          <TableWrap>
            <table className={TABLE}>
              <thead>
                <tr><th className={TH}>Commande</th><th className={TH}>Client</th><th className={TH}>Destination</th><th className={`${TH} text-right`}>Pots</th><th className={`${TH} text-right`}>Total</th><th className={TH}>Statut</th><th className={TH}><span className="sr-only">Action</span></th></tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const waiting = o.status === "paid" || o.status === "preparing";
                  const late = waiting && o.paid_at.getTime() < lateBefore;
                  return (
                    <tr key={o.id} className={ROW}>
                      <td className={TD}>
                        <Link href={`/admin/commandes/${o.id}`} className="font-semibold hover:underline">{o.reference}</Link>
                        <span className="block whitespace-nowrap text-[0.76rem]" style={{ color: late ? "#a82424" : undefined }}>
                          <span className={late ? "font-medium" : "text-discret"}>{waiting ? `Payée ${ago(o.paid_at, now)}${late ? " · en retard" : ""}` : dateTime(o.paid_at)}</span>
                        </span>
                      </td>
                      <td className={`${TD} max-w-[15rem]`}>
                        <span className="flex items-center gap-2"><span className="truncate">{o.name || "—"}</span>{o.customer_orders > 1 && <Tag tone="rose">{o.customer_orders}ᵉ commande</Tag>}</span>
                        <span className="block truncate text-[0.76rem] text-discret">{o.email}</span>
                      </td>
                      <td className={`${TD} whitespace-nowrap`}>{o.city}<span className="block text-[0.76rem] text-discret">{country(o.country_code)}</span></td>
                      <td className={`${TD} text-right tabular-nums`}>{o.units}</td>
                      <td className={`${TD} whitespace-nowrap text-right font-medium tabular-nums`}>{eur(o.total_cents)}{o.promo_code && <span className="block text-[0.74rem] font-normal text-discret">{o.promo_code}</span>}</td>
                      <td className={TD}><StatusBadge status={o.status} /></td>
                      <td className={`${TD} text-right`}>
                        {o.status === "paid" ? (
                          <form action={orderAction}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="intent" value="prepare" /><input type="hidden" name="retour" value="liste" /><button type="submit" className={`${BTN_DARK} !h-9 !px-4 !text-[0.8rem]`}>Préparer</button></form>
                        ) : (
                          <Link href={`/admin/commandes/${o.id}`} className={`${BTN_GHOST} !h-9 !px-4 !text-[0.8rem]`}>{o.status === "preparing" ? "Expédier" : "Ouvrir"}</Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
          </div>
          </>
        )}
        <Pagination page={page} pages={pages} href={(p) => href({ page: p })} />
      </Card>
    </>
  );
}
