import type { Metadata } from "next";
import Link from "next/link";
import { BTN_PRIMARY, Card, Empty, Flash, PageHeader, ROW, TABLE, TD, TH, TableWrap, Tag } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { dateShort, eur, num } from "@/lib/admin/format";
import { listPromos, promoProblem } from "@/lib/store/promos";

export const metadata: Metadata = { title: "Codes promo" };

export default async function PromosPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin();
  const [sp, promos] = await Promise.all([searchParams, listPromos()]);
  const now = new Date();

  return (
    <>
      <PageHeader title="Codes promo" sub="Ce que chaque code a rapporté, et ce qu'il a coûté en remise.">
        <Link href="/admin/promos/nouveau" className={BTN_PRIMARY}>Nouveau code</Link>
      </PageHeader>
      <Flash ok={sp.ok} erreur={sp.erreur} />
      <Card flush className="[&>div]:pt-0">
        {promos.length === 0 ? (
          <Empty title="Aucun code promo.">Créez-en un pour un lancement, un partenaire ou une relance.</Empty>
        ) : (
          <TableWrap>
            <table className={TABLE}>
              <thead><tr><th className={TH}>Code</th><th className={TH}>Remise</th><th className={TH}>État</th><th className={`${TH} text-right`}>Utilisations</th><th className={`${TH} text-right`}>Ventes</th><th className={`${TH} text-right`}>Remise donnée</th><th className={`${TH} text-right`}>Coût de la remise</th></tr></thead>
              <tbody>
                {promos.map((p) => {
                  // Avec un minimum d'achat, « valable » se juge sur un panier qui l'atteint.
                  const problem = promoProblem(p, p.min_subtotal_cents, now);
                  const gross = p.revenue_cents + p.discount_cents;
                  return (
                    <tr key={p.id} className={ROW}>
                      <td className={TD}><Link href={`/admin/promos/${p.id}`} className="font-mono text-[0.85rem] font-semibold hover:underline">{p.code}</Link>{p.label && <span className="block text-[0.76rem] text-discret">{p.label}</span>}</td>
                      <td className={`${TD} whitespace-nowrap`}>{p.discount_type === "percent" ? `−${p.discount_value} %` : `−${eur(p.discount_value)}`}{p.min_subtotal_cents > 0 && <span className="block text-[0.76rem] text-discret">dès {eur(p.min_subtotal_cents)}</span>}</td>
                      <td className={TD}>{problem ? <Tag>{problem.replace(/^Ce code promo /, "").replace(/\.$/, "")}</Tag> : <Tag tone="rose">valable</Tag>}{p.ends_at && !problem && <span className="block text-[0.76rem] text-discret">jusqu&apos;au {dateShort(p.ends_at)}</span>}</td>
                      <td className={`${TD} text-right tabular-nums`}>{num(p.orders)}{p.max_uses !== null && <span className="text-discret"> / {num(p.max_uses)}</span>}</td>
                      <td className={`${TD} text-right font-medium tabular-nums`}>{eur(p.revenue_cents, true)}</td>
                      <td className={`${TD} text-right tabular-nums`}>{eur(p.discount_cents, true)}</td>
                      <td className={`${TD} text-right tabular-nums`}>{gross > 0 ? `${num((p.discount_cents / gross) * 100, 1)} %` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
      <p className="mt-3 text-[0.8rem] text-discret">Coût de la remise : la part du prix normal abandonnée au client sur les commandes passées avec ce code.</p>
    </>
  );
}
