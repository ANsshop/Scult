import type { Metadata } from "next";
import { passwordAction, settingsAction } from "../../actions";
import { BTN_DARK, BTN_GHOST, Card, Field, Flash, INPUT, PageHeader, TABLE, TD, TH, TableWrap } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { centsInput, eur } from "@/lib/admin/format";
import { getSettings } from "@/lib/store/settings";
import { FREE_SHIPPING_THRESHOLD_CENTS, SHIPPING_ZONES } from "@/lib/shipping";

export const metadata: Metadata = { title: "Réglages" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const admin = await requireAdmin();
  const [sp, settings] = await Promise.all([searchParams, getSettings()]);

  return (
    <>
      <PageHeader title="Réglages" />
      <Flash ok={sp.ok} erreur={sp.erreur} />
      <div className="grid items-start gap-3 xl:grid-cols-2">
        <Card title="Pilotage" hint="Ce qui règle les alertes et les projections du tableau de bord.">
          <form action={settingsAction} className="space-y-4">
            <Field label="Objectif de chiffre d'affaires du mois (€)" hint="Vide ou 0 : pas d'objectif. Le tableau de bord dit où finira le mois au rythme actuel."><input name="goal" inputMode="decimal" defaultValue={settings.monthlyGoalCents ? centsInput(settings.monthlyGoalCents) : ""} placeholder="25000" className={INPUT} /></Field>
            <Field label="Une commande est en retard après (heures)" hint="Compté depuis le paiement, tant que le colis n'est pas parti."><input name="late" inputMode="numeric" required defaultValue={settings.lateAfterHours} className={INPUT} /></Field>
            <Field label="Jours de stock visés à chaque réassort" hint="Sert à proposer la quantité à commander."><input name="target" inputMode="numeric" required defaultValue={settings.restockTargetDays} className={INPUT} /></Field>
            <button type="submit" className={BTN_DARK}>Enregistrer</button>
          </form>
        </Card>

        <div className="grid gap-3">
          <Card title="Mon compte" hint={`${admin.name} · ${admin.email}`}>
            <form action={passwordAction} className="space-y-4">
              <Field label="Mot de passe actuel"><input name="current" type="password" required autoComplete="current-password" className={INPUT} /></Field>
              <Field label="Nouveau mot de passe" hint="10 caractères au moins."><input name="next" type="password" required minLength={10} autoComplete="new-password" className={INPUT} /></Field>
              <Field label="Le même, une seconde fois"><input name="confirm" type="password" required minLength={10} autoComplete="new-password" className={INPUT} /></Field>
              <button type="submit" className={BTN_GHOST}>Changer le mot de passe</button>
            </form>
          </Card>

          <Card title="Livraison" hint={`Offerte dès ${eur(FREE_SHIPPING_THRESHOLD_CENTS, true)} d'achat. Ces tarifs sont écrits dans le code du site, pas encore modifiables ici.`} flush>
            <TableWrap>
            <table className={TABLE}>
              <thead><tr><th className={TH}>Zone</th><th className={TH}>Pays</th><th className={`${TH} text-right`}>Tarif</th><th className={`${TH} text-right`}>Délai</th></tr></thead>
              <tbody>
                {SHIPPING_ZONES.map((z) => <tr key={z.id}><td className={`${TD} whitespace-nowrap font-medium`}>{z.label}</td><td className={`${TD} text-doux`}>{z.countries.join(", ")}</td><td className={`${TD} whitespace-nowrap text-right tabular-nums`}>{eur(z.rateCents)}</td><td className={`${TD} whitespace-nowrap text-right`}>{z.delayDays[0]}–{z.delayDays[1]} j</td></tr>)}
              </tbody>
            </table>
            </TableWrap>
          </Card>
        </div>
      </div>
    </>
  );
}
