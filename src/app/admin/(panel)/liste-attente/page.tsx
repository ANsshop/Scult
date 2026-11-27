import type { Metadata } from "next";
import Link from "next/link";
import { BTN_GHOST, Card, Empty, PageHeader, ROW, Stat, TABLE, TD, TH, TableWrap, Tag } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { ago, dateTime, num, share } from "@/lib/admin/format";
import { getLaunch } from "@/lib/launch";
import { listWaitlist, waitlistStats } from "@/lib/store/waitlist";

export const metadata: Metadata = { title: "Liste d'attente" };

/**
 * La liste d'attente : qui a demandé à être prévenu à la sortie, et d'où
 * viennent ces inscrits. Le taux d'inscription d'une provenance rapporte ses
 * inscrits à ses visites (mesure d'audience du site) : c'est lui qui dit si
 * une vidéo ou un lien fait venir des gens qui s'inscrivent.
 */
export default async function WaitlistPage() {
  await requireAdmin();
  const [stats, rows, launch] = await Promise.all([waitlistStats(), listWaitlist(500), getLaunch()]);
  const now = new Date();
  return (
    <>
      <PageHeader title="Liste d'attente" sub={launch.open ? "La boutique est ouverte : le site n'inscrit plus, il vend." : `Le site inscrit en attendant la sortie (${launch.when}).`}>
        {stats.total > 0 && <a href="/admin/liste-attente-csv" className={BTN_GHOST}>Exporter en CSV</a>}
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat hero label="Inscrits" value={num(stats.total)} />
        <Stat label="Sept derniers jours" value={num(stats.week)} />
        <Stat label="Aujourd'hui" value={num(stats.today)} />
      </div>

      <div className="mt-3 grid items-start gap-3 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card title="D'où ils viennent" hint={<>Pour suivre un lien, ajoutez-lui sa provenance : <code className="rounded bg-[#f4f3f0] px-1.5 py-0.5 text-[0.8rem]">?utm_source=tiktok</code></>} flush>
          {stats.sources.length === 0 ? (
            <div className="px-5 pb-5"><Empty title="Personne pour l'instant">Les provenances apparaissent dès la première inscription.</Empty></div>
          ) : (
            <TableWrap>
              <table className={TABLE}>
                <thead><tr><th className={TH}>Provenance</th><th className={`${TH} text-right`}>Inscrits</th><th className={`${TH} text-right`}>Visites</th><th className={`${TH} text-right`}>Taux d&apos;inscription</th></tr></thead>
                <tbody>
                  {stats.sources.map((s) => (
                    <tr key={s.source} className={ROW}>
                      <td className={TD}>{s.source}</td>
                      <td className={`${TD} text-right tabular-nums`}>{num(s.signups)}</td>
                      <td className={`${TD} text-right tabular-nums text-doux`}>{s.visits ? num(s.visits) : "—"}</td>
                      <td className={`${TD} text-right tabular-nums`}>{s.visits >= s.signups && s.visits > 0 ? share(s.signups, s.visits) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>

        <Card title="Les inscrits" hint={rows.length < stats.total ? `Les ${num(rows.length)} plus récents ; l'export CSV les contient tous.` : "Du plus récent au plus ancien."} flush>
          {rows.length === 0 ? (
            <div className="px-5 pb-5"><Empty title="Aucun inscrit">Le formulaire est sur la <Link href="/produits/cri#liste" className="underline underline-offset-4">fiche du produit</Link>, à la place du bouton d&apos;achat.</Empty></div>
          ) : (
            <TableWrap>
              <table className={TABLE}>
                <thead><tr><th className={TH}>E-mail</th><th className={TH}>Provenance</th><th className={TH}>Appareil</th><th className={`${TH} text-right`}>Inscrit</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className={ROW}>
                      <td className={`${TD} break-all`}>{r.email}</td>
                      <td className={TD}><Tag>{r.source ?? "direct"}</Tag></td>
                      <td className={`${TD} text-doux`}>{r.device === "mobile" ? "Téléphone" : r.device === "desktop" ? "Ordinateur" : "—"}</td>
                      <td className={`${TD} whitespace-nowrap text-right text-doux`} title={dateTime(r.created_at)}>{ago(r.created_at, now)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>
      </div>
    </>
  );
}
