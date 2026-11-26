import type { Metadata } from "next";
import Link from "next/link";
import { BTN_GHOST, Card, Empty, INPUT, PageHeader, Pagination, ROW, TABLE, TD, TH, TableWrap, Tabs, Tag } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { ago, country, dateShort, eur, num } from "@/lib/admin/format";
import { CUSTOMER_SORTS, listCustomers, type CustomerSort } from "@/lib/store/customers";

export const metadata: Metadata = { title: "Clients" };

const FILTERS = [
  { id: "tous", label: "Tous" },
  { id: "fideles", label: "Ont recommandé" },
  { id: "a-relancer", label: "À relancer" },
] as const;
const SORTS: { id: CustomerSort; label: string }[] = [
  { id: "recent", label: "Dernier achat" },
  { id: "depense", label: "Dépense" },
  { id: "commandes", label: "Nombre de commandes" },
  { id: "ancien", label: "Ancienneté" },
];

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; tri?: string; filtre?: string; page?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const sort = (sp.tri && sp.tri in CUSTOMER_SORTS ? sp.tri : "recent") as CustomerSort;
  const filter = FILTERS.find((f) => f.id === sp.filtre)?.id ?? "tous";
  const { rows, total, page, pages } = await listCustomers({ q: sp.q, sort, page: Number(sp.page) || 1, only: filter === "tous" ? null : filter });
  const now = new Date();
  const href = (o: { filtre?: string; tri?: string; page?: number }) => {
    const p = new URLSearchParams();
    const f = o.filtre ?? filter, t = o.tri ?? sort;
    if (f !== "tous") p.set("filtre", f);
    if (t !== "recent") p.set("tri", t);
    if (sp.q) p.set("q", sp.q);
    if (o.page && o.page > 1) p.set("page", String(o.page));
    const qs = p.toString();
    return `/admin/clients${qs ? `?${qs}` : ""}`;
  };

  return (
    <>
      <PageHeader
        title="Clients"
        sub={filter === "a-relancer" ? "Dernier achat il y a 30 à 75 jours : leur pot de 30 doses est fini, ils n'ont pas recommandé." : `${num(total)} client${total > 1 ? "s" : ""}, invités compris : une ligne par adresse e-mail.`}
      />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs current={filter} items={FILTERS.map((f) => ({ id: f.id, label: f.label, href: href({ filtre: f.id, page: 1 }) }))} />
        <form className="flex w-full gap-2 sm:w-auto">
          {filter !== "tous" && <input type="hidden" name="filtre" value={filter} />}
          {sort !== "recent" && <input type="hidden" name="tri" value={sort} />}
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Nom ou e-mail" aria-label="Chercher un client" className={`${INPUT} sm:w-64`} />
          <button type="submit" className={BTN_GHOST}>Chercher</button>
        </form>
      </div>

      <Card flush className="[&>div]:pt-0">
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-5 py-3 text-[0.8rem] text-doux">
          Trier par
          {SORTS.map((s) => <Link key={s.id} href={href({ tri: s.id, page: 1 })} aria-current={s.id === sort ? "true" : undefined} className={s.id === sort ? "font-semibold text-texte underline decoration-rose decoration-2 underline-offset-4" : "hover:text-texte"}>{s.label}</Link>)}
        </p>
        {rows.length === 0 ? (
          <Empty title={sp.q ? "Aucun client ne correspond." : "Personne ici pour l'instant."} />
        ) : (
          <TableWrap>
            <table className={TABLE}>
              <thead><tr><th className={TH}>Client</th><th className={TH}>Pays</th><th className={`${TH} text-right`}>Commandes</th><th className={`${TH} text-right`}>Dépense</th><th className={`${TH} text-right`}>Panier moyen</th><th className={TH}>Dernier achat</th><th className={TH}>Client depuis</th></tr></thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className={ROW}>
                    <td className={`${TD} max-w-[17rem]`}><Link href={`/admin/clients/${c.id}`} className="flex items-center gap-2 font-medium hover:underline"><span className="truncate">{c.name || c.email}</span>{c.orders >= 3 && <Tag tone="rose">fidèle</Tag>}</Link><span className="block truncate text-[0.76rem] text-discret">{c.email}</span></td>
                    <td className={TD}>{country(c.country_code)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{c.orders}</td>
                    <td className={`${TD} text-right font-medium tabular-nums`}>{eur(c.revenue_cents)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{c.orders ? eur(Math.round(c.revenue_cents / c.orders)) : "—"}</td>
                    <td className={`${TD} whitespace-nowrap`}>{c.last_at ? ago(c.last_at, now) : "—"}</td>
                    <td className={`${TD} whitespace-nowrap text-doux`}>{c.first_at ? dateShort(c.first_at) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
        <Pagination page={page} pages={pages} href={(p) => href({ page: p })} />
      </Card>
    </>
  );
}
