import type { Metadata } from "next";
import Link from "next/link";
import { SalesChart } from "@/components/admin/SalesChart";
import { Card, Delta, Icon, Meter, PageHeader, ROW, STATE, Split, Stat, StatusBadge, StockBadge, TABLE, TD, TH, TableWrap, Tabs, levelColor } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { ago, country, dateShort, eur, hours, num, pct, share } from "@/lib/admin/format";
import { PERIODS, change, getDashboard } from "@/lib/store/stats";

export const metadata: Metadata = { title: "Tableau de bord" };

/** Une étape de l'entonnoir : sa barre, sa valeur, et ce qu'elle garde de l'étape d'avant. */
function Step({ label, value, max, from, hint }: { label: string; value: number; max: number; from: number | null; hint?: string }) {
  const width = max > 0 ? Math.max(value > 0 ? 1 : 0, (value / max) * 100) : 0;
  return (
    <li className="grid grid-cols-[7.5rem_1fr] items-center gap-x-4 gap-y-1 sm:grid-cols-[9.5rem_1fr_7.5rem]">
      <span className="text-[0.85rem]">{label}{hint && <span className="block text-[0.74rem] text-discret">{hint}</span>}</span>
      <span className="flex items-center gap-3">
        <span className="h-3 rounded-r-[4px] bg-rose" style={{ width: `${width}%`, minWidth: value > 0 ? 3 : 0 }} />
        <span className="shrink-0 text-[0.9rem] font-semibold tabular-nums">{num(value)}</span>
      </span>
      <span className="col-start-2 text-[0.78rem] text-discret sm:col-start-3 sm:text-right">{from === null ? "" : `${share(value, from)} de l'étape d'avant`}</span>
    </li>
  );
}

/** Une ligne « à faire » : un chiffre qui mène à l'écran où on le traite. */
function Todo({ href, value, label, detail, alert = false }: { href: string; value: number; label: string; detail: string; alert?: boolean }) {
  return (
    <Link href={href} className="group flex items-center gap-4 rounded-2xl border bg-white p-4 transition-colors hover:border-texte">
      <span className="flex h-11 min-w-11 items-center justify-center rounded-xl px-2 text-[1.25rem] font-semibold tabular-nums" style={alert && value > 0 ? { background: "rgb(208 59 59 / 0.1)", color: "#a82424" } : { background: "#f4f3f0" }}>{value}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[0.9rem] font-semibold">{alert && value > 0 && <Icon name="alert" size={14} style={{ color: STATE.critical }} />}{label}</span>
        <span className="block text-[0.78rem] leading-snug text-discret">{detail}</span>
      </span>
      <span aria-hidden className="text-discret transition-transform group-hover:translate-x-0.5 group-hover:text-texte">→</span>
    </Link>
  );
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ periode?: string }> }) {
  await requireAdmin();
  const { periode } = await searchParams;
  const d = await getDashboard(periode);
  const { cur, prev, fun, prevFun, period } = d;

  const basket = cur.orders ? cur.revenue / cur.orders : 0;
  const prevBasket = prev.orders ? prev.revenue / prev.orders : 0;
  const marginRate = cur.marginBase > 0 ? cur.margin / cur.marginBase : null;
  const prevMarginRate = prev.marginBase > 0 ? prev.margin / prev.marginBase : null;
  const conversion = fun.sessions > 0 ? cur.orders / fun.sessions : null;
  const prevConversion = prevFun.sessions > 0 ? prev.orders / prevFun.sessions : null;
  const worst = [...d.stock].sort((a, b) => (a.days ?? Infinity) - (b.days ?? Infinity))[0];
  const alerts = d.stock.filter((s) => s.level === "rupture" || s.level === "critique").length;
  const repeatRate = d.loyalty.customers > 0 ? d.loyalty.repeaters / d.loyalty.customers : null;

  return (
    <>
      <PageHeader title="Tableau de bord" sub={<>{period.label}, {period.compare}.</>}>
        <Tabs current={period.id} items={PERIODS.map((p) => ({ id: p.id, label: p.label, href: p.id === "30j" ? "/admin" : `/admin?periode=${p.id}` }))} />
      </PageHeader>

      {/* Ce qui attend, avant tout chiffre */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Todo href="/admin/commandes" value={d.todo.to_prepare} label="À préparer" detail={d.todo.oldest ? `La plus ancienne : ${ago(d.todo.oldest, d.now)}` : "Rien n'attend"} />
        <Todo href="/admin/commandes" value={d.todo.to_ship} label="À expédier" detail="Préparées, pas encore parties" />
        <Todo href="/admin/commandes" value={d.todo.late} label="En retard" detail={`Payées depuis plus de ${d.settings.lateAfterHours} h`} alert />
        <Todo href="/admin/produits" value={alerts} label="Alertes de stock" detail={worst?.days != null ? `${worst.sku} : ${num(worst.days)} jours de stock` : "Pas de vente récente"} alert />
      </div>

      {/* Les cinq chiffres de la période */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr_1fr_1fr]">
        <Stat hero label="Chiffre d'affaires" value={eur(cur.revenue, true)} delta={<Delta value={change(cur.revenue, prev.revenue)} />} note={<>Payé par les clients, port compris{cur.refunds > 0 ? `, ${eur(cur.refunds, true)} de remboursements déduits` : ""}.</>} />
        <Stat label="Commandes" value={num(cur.orders)} delta={<Delta value={change(cur.orders, prev.orders)} />} note={`${num(cur.units)} pots vendus.`} />
        <Stat label="Panier moyen" value={cur.orders ? eur(basket) : "—"} delta={<Delta value={change(basket, prevBasket)} />} note={cur.orders ? `${num(cur.units / cur.orders, 2)} pots par commande.` : "Aucune commande."} />
        <Stat
          label="Marge brute"
          value={marginRate === null ? "—" : pct(marginRate)}
          delta={marginRate !== null && prevMarginRate !== null ? <Delta value={(marginRate - prevMarginRate) * 100} suffix=" pt" /> : undefined}
          note={marginRate === null ? <>Renseignez le prix de revient dans <Link href="/admin/produits" className="underline">Produits</Link> pour la voir.</> : <>{eur(cur.margin, true)} sur les articles, hors port.{cur.missingCost > 0 ? ` ${cur.missingCost} commande${cur.missingCost > 1 ? "s" : ""} sans prix de revient, non comptée${cur.missingCost > 1 ? "s" : ""}.` : ""}</>}
        />
        <Stat
          label="Conversion"
          value={conversion === null ? "—" : pct(conversion, 2)}
          delta={conversion !== null && prevConversion !== null ? <Delta value={(conversion - prevConversion) * 100} suffix=" pt" /> : undefined}
          note={conversion === null ? "Pas encore de visite mesurée." : `${num(cur.orders)} commandes pour ${num(fun.sessions)} visites.`}
        />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[2fr_1fr]">
        <Card title="Ventes" hint={period.unit === "hour" ? "Par heure, à l'heure de Paris." : "Par jour, à la date du paiement."}>
          <SalesChart points={d.curve} previous={d.prevCurve} currentLabel={period.label} previousLabel={period.previous} />
        </Card>

        <div className="grid gap-3">
          <Card title="Objectif du mois" action={<Link href="/admin/reglages" className="text-[0.78rem] text-doux underline underline-offset-4 hover:text-texte">Modifier</Link>}>
            {d.goal ? (
              <>
                <p className="text-[1.7rem] font-semibold leading-none tracking-tight">{eur(d.goal.revenue, true)} <span className="text-[0.9rem] font-normal text-doux">sur {eur(d.goal.goal, true)}</span></p>
                <div className="mt-4"><Meter ratio={d.goal.revenue / d.goal.goal} label={`${pct(d.goal.revenue / d.goal.goal, 0)} de l'objectif`} /></div>
                <p className="mt-3 text-[0.82rem] text-doux">
                  {pct(d.goal.revenue / d.goal.goal, 0)} de l&apos;objectif, à {pct(d.goal.elapsed, 0)} du mois.
                  {d.goal.projected !== null && <> À ce rythme : <strong className="text-texte">{eur(d.goal.projected, true)}</strong> en fin de mois{d.goal.projected >= d.goal.goal ? ", objectif tenu." : `, il manquerait ${eur(d.goal.goal - d.goal.projected, true)}.`}</>}
                </p>
              </>
            ) : (
              <p className="text-[0.875rem] text-doux">Pas d&apos;objectif fixé. Donnez-en un dans les réglages pour voir où finira le mois au rythme actuel.</p>
            )}
          </Card>
          <Card title="Ce qui se vend" hint="Part des commandes de la période.">
            <Split label="Pot ou pack" parts={[{ name: "Avec un pack", value: cur.packOrders, display: share(cur.packOrders, cur.orders, 0) }, { name: "Pot à l'unité", value: cur.orders - cur.packOrders, display: share(cur.orders - cur.packOrders, cur.orders, 0) }]} />
            <div className="mt-5 border-t pt-5">
              <Split label="Nouveaux clients ou réachats" parts={[{ name: "Première commande", value: d.split.first_orders, display: share(d.split.first_orders, d.split.first_orders + d.split.repeat_orders, 0) }, { name: "Réachat", value: d.split.repeat_orders, display: share(d.split.repeat_orders, d.split.first_orders + d.split.repeat_orders, 0) }]} />
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Du visiteur à la commande" hint="Où les visiteurs s'arrêtent, sur la période.">
          {fun.sessions > 0 ? (
            <ul className="space-y-3.5">
              <Step label="Visites" value={fun.sessions} max={fun.sessions} from={null} />
              <Step label="Ont vu une fiche produit" value={fun.productViews} max={fun.sessions} from={fun.sessions} />
              <Step label="Ont ajouté au panier" value={fun.carts} max={fun.sessions} from={fun.productViews} />
              <Step label="Passages en caisse" value={fun.checkouts} max={fun.sessions} from={fun.carts} hint="Clics sur « Payer »" />
              <Step label="Commandes payées" value={cur.orders} max={fun.sessions} from={fun.checkouts} />
            </ul>
          ) : (
            <p className="text-[0.875rem] text-doux">Aucune visite mesurée sur la période. La mesure démarre dès que le site tourne sur cette base.</p>
          )}
        </Card>

        <Card title="Fidélité" hint="Depuis l'ouverture, tous clients confondus.">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
            <div><dt className="text-[0.8rem] text-doux">Clients qui ont recommandé</dt><dd className="mt-1 text-[1.5rem] font-semibold leading-none">{repeatRate === null ? "—" : pct(repeatRate, 0)}</dd><dd className="mt-1.5 text-[0.76rem] text-discret">{num(d.loyalty.repeaters)} sur {num(d.loyalty.customers)}</dd></div>
            <div><dt className="text-[0.8rem] text-doux">Délai avant le 2ᵉ achat</dt><dd className="mt-1 text-[1.5rem] font-semibold leading-none">{d.loyalty.median_days === null ? "—" : `${num(d.loyalty.median_days)} j`}</dd><dd className="mt-1.5 text-[0.76rem] text-discret">Médiane. Un pot dure 30 doses.</dd></div>
            <div><dt className="text-[0.8rem] text-doux">Dépense par client</dt><dd className="mt-1 text-[1.5rem] font-semibold leading-none">{d.loyalty.customers ? eur(d.loyalty.avg_revenue, true) : "—"}</dd><dd className="mt-1.5 text-[0.76rem] text-discret">En moyenne, depuis sa première commande.</dd></div>
            <div><dt className="text-[0.8rem] text-doux">À relancer</dt><dd className="mt-1 text-[1.5rem] font-semibold leading-none">{num(d.loyalty.to_win_back)}</dd><dd className="mt-1.5 text-[0.76rem] text-discret"><Link href="/admin/clients?filtre=a-relancer" className="underline underline-offset-2 hover:text-texte">Dernier achat il y a 30 à 75 jours</Link> : leur pot est fini.</dd></div>
          </dl>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Stock" hint={`Au rythme des 30 derniers jours. Quantité à commander : pour tenir ${d.settings.restockTargetDays} jours.`} flush>
          <TableWrap>
            <table className={TABLE}>
              <thead><tr><th className={TH}>Article</th><th className={`${TH} text-right`}>En stock</th><th className={`${TH} text-right`}>Par jour</th><th className={TH}>Tient encore</th><th className={`${TH} text-right`}>À commander</th></tr></thead>
              <tbody>
                {d.stock.map((s) => (
                  <tr key={s.id} className={ROW}>
                    <td className={`${TD} min-w-[11rem]`}><Link href={`/admin/produits/${s.productId}`} className="font-medium hover:underline">{s.name}</Link><span className="block whitespace-nowrap text-[0.76rem] text-discret">{s.sku}</span></td>
                    <td className={`${TD} text-right font-semibold tabular-nums`}>{num(s.stock)}</td>
                    <td className={`${TD} text-right tabular-nums`}>{s.perDay > 0 ? num(s.perDay, 1) : "—"}</td>
                    <td className={TD}>
                      <div className="flex items-center gap-3">
                        <div className="w-16 shrink-0"><Meter ratio={s.days === null ? (s.stock > 0 ? 1 : 0) : s.days / 60} color={levelColor(s.level)} label={s.days === null ? "Pas de vente récente" : `${num(s.days)} jours de stock`} /></div>
                        <span className="whitespace-nowrap tabular-nums">{s.days === null ? "—" : `${num(s.days)} j`}</span>
                        <StockBadge level={s.level} />
                      </div>
                      {s.emptyOn && s.stock > 0 && <span className="mt-1 block text-[0.76rem] text-discret">Rupture estimée le {dateShort(s.emptyOn)}</span>}
                    </td>
                    <td className={`${TD} text-right tabular-nums`}>{s.toOrder > 0 ? num(s.toOrder) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Card>

        <Card title="Expédition" hint="Commandes parties sur la période.">
          <dl className="grid grid-cols-2 gap-x-6">
            <div><dt className="text-[0.8rem] text-doux">Délai paiement → départ</dt><dd className="mt-1 text-[1.5rem] font-semibold leading-none">{d.shipping.median_hours === null ? "—" : hours(Number(d.shipping.median_hours))}</dd><dd className="mt-1.5 text-[0.76rem] text-discret">Médiane sur {num(d.shipping.shipped)} colis.</dd></div>
            <div><dt className="text-[0.8rem] text-doux">Parties dans les {d.settings.lateAfterHours} h</dt><dd className="mt-1 text-[1.5rem] font-semibold leading-none">{share(d.shipping.on_time, d.shipping.shipped, 0)}</dd><dd className="mt-1.5 text-[0.76rem] text-discret">{num(d.shipping.shipped - d.shipping.on_time)} en retard.</dd></div>
          </dl>
          {d.todo.stale_shipped > 0 && <p className="mt-5 flex items-start gap-2 border-t pt-4 text-[0.82rem] text-doux"><Icon name="clock" size={14} className="mt-0.5 shrink-0" style={{ color: STATE.serious }} /><span><Link href="/admin/commandes?onglet=expediees" className="font-medium text-texte underline underline-offset-2">{d.todo.stale_shipped} colis</Link> partis depuis plus de 10 jours ne sont pas marqués livrés.</span></p>}
          <p className="mt-5 border-t pt-4 text-[0.82rem] text-doux">Remboursements sur la période : <strong className="text-texte">{eur(cur.refunds, true)}</strong> ({num(cur.refundedOrders)} commande{cur.refundedOrders > 1 ? "s" : ""}, {share(cur.refundedOrders, cur.orders)}).</p>
        </Card>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Dernières commandes" action={<Link href="/admin/commandes?onglet=toutes" className="text-[0.78rem] text-doux underline underline-offset-4 hover:text-texte">Tout voir</Link>} flush>
          <TableWrap>
            <table className={TABLE}>
              <tbody>
                {d.recent.map((o) => (
                  <tr key={o.id} className={ROW}>
                    <td className={TD}><Link href={`/admin/commandes/${o.id}`} className="font-medium hover:underline">{o.reference}</Link><span className="block text-[0.76rem] text-discret">{ago(o.paid_at, d.now)}</span></td>
                    <td className={`${TD} max-w-[12rem] truncate`}>{o.name || o.email}</td>
                    <td className={TD}><StatusBadge status={o.status} /></td>
                    <td className={`${TD} text-right font-medium tabular-nums`}>{eur(o.total_cents)}</td>
                  </tr>
                ))}
                {d.recent.length === 0 && <tr><td className={`${TD} text-doux`}>Aucune commande pour l&apos;instant.</td></tr>}
              </tbody>
            </table>
          </TableWrap>
        </Card>

        <div className="grid gap-3">
          <Card title="D'où viennent les visites" hint="Et la part qui ajoute au panier." flush>
            <TableWrap>
              <table className={TABLE}>
                <thead><tr><th className={TH}>Source</th><th className={`${TH} text-right`}>Visites</th><th className={`${TH} text-right`}>Ajout au panier</th></tr></thead>
                <tbody>
                  {d.sources.map((s) => <tr key={s.source} className={ROW}><td className={`${TD} capitalize`}>{s.source}</td><td className={`${TD} text-right tabular-nums`}>{num(s.sessions)}</td><td className={`${TD} text-right tabular-nums`}>{share(s.carts, s.sessions)}</td></tr>)}
                  {d.sources.length === 0 && <tr><td className={`${TD} text-doux`} colSpan={3}>Pas encore de visite mesurée.</td></tr>}
                </tbody>
              </table>
            </TableWrap>
          </Card>
          <Card title="Pays et codes promo" flush>
            <TableWrap>
              <table className={TABLE}>
                <thead><tr><th className={TH}>Pays</th><th className={`${TH} text-right`}>Commandes</th><th className={`${TH} text-right`}>Ventes</th></tr></thead>
                <tbody>
                  {d.countries.map((c) => <tr key={c.country_code} className={ROW}><td className={TD}>{country(c.country_code)}</td><td className={`${TD} text-right tabular-nums`}>{num(c.orders)}</td><td className={`${TD} text-right tabular-nums`}>{eur(c.revenue, true)}</td></tr>)}
                  {d.countries.length === 0 && <tr><td className={`${TD} text-doux`} colSpan={3}>Aucune commande sur la période.</td></tr>}
                </tbody>
                {d.promos.length > 0 && (
                  <>
                    <thead><tr><th className={`${TH} border-t`}>Code promo</th><th className={`${TH} border-t text-right`}>Commandes</th><th className={`${TH} border-t text-right`}>Remise donnée</th></tr></thead>
                    <tbody>
                      {d.promos.map((p) => <tr key={p.promo_code} className={ROW}><td className={`${TD} font-mono text-[0.82rem]`}>{p.promo_code}</td><td className={`${TD} text-right tabular-nums`}>{num(p.orders)}</td><td className={`${TD} text-right tabular-nums`}>{eur(p.discount, true)}</td></tr>)}
                    </tbody>
                  </>
                )}
              </table>
            </TableWrap>
          </Card>
        </div>
      </div>
    </>
  );
}
