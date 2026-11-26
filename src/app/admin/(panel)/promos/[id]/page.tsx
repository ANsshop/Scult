import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { promoAction } from "../../../actions";
import { BTN_DANGER, BTN_PRIMARY, Card, Field, Flash, INPUT, PageHeader } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { centsInput, inputDateTime } from "@/lib/admin/format";
import { getPromo } from "@/lib/store/promos";

export const metadata: Metadata = { title: "Code promo" };

export default async function PromoPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const isNew = id === "nouveau";
  if (!isNew && !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const promo = isNew ? null : await getPromo(id);
  if (!isNew && !promo) notFound();

  return (
    <>
      <PageHeader title={promo ? promo.code : "Nouveau code"} back={{ href: "/admin/promos", label: "Codes promo" }} sub={promo ? `Utilisé ${promo.uses_count} fois.` : "Le client le saisit sur la page de commande."} />
      <Flash ok={sp.ok} erreur={sp.erreur} />
      <div className="max-w-2xl">
        <Card>
          <form action={promoAction} className="grid gap-4 sm:grid-cols-2">
            {promo && <input type="hidden" name="id" value={promo.id} />}
            <Field label="Code" hint="Lettres, chiffres, tirets. Écrit en majuscules."><input name="code" required defaultValue={promo?.code ?? ""} placeholder="BOUFFON10" autoCapitalize="characters" className={`${INPUT} font-mono uppercase`} /></Field>
            <Field label="Nom interne" hint="Pour vous y retrouver."><input name="label" defaultValue={promo?.label ?? ""} placeholder="Lancement, salle partenaire" className={INPUT} /></Field>
            <Field label="Type de remise"><select name="type" defaultValue={promo?.discount_type ?? "percent"} className={INPUT}><option value="percent">Pourcentage</option><option value="fixed">Montant fixe (€)</option></select></Field>
            <Field label="Valeur" hint="10 pour 10 %, ou 5 pour 5 €."><input name="value" required inputMode="decimal" defaultValue={promo ? (promo.discount_type === "percent" ? String(promo.discount_value) : centsInput(promo.discount_value)) : ""} className={INPUT} /></Field>
            <Field label="Minimum d'achat (€)" hint="Facultatif. Sur les articles, avant port."><input name="min" inputMode="decimal" defaultValue={promo && promo.min_subtotal_cents > 0 ? centsInput(promo.min_subtotal_cents) : ""} className={INPUT} /></Field>
            <Field label="Nombre d'utilisations" hint="Facultatif. Vide : sans limite."><input name="maxUses" inputMode="numeric" defaultValue={promo?.max_uses ?? ""} className={INPUT} /></Field>
            <Field label="Début" hint="Facultatif. Heure de Paris."><input name="startsAt" type="datetime-local" defaultValue={inputDateTime(promo?.starts_at ?? null)} className={INPUT} /></Field>
            <Field label="Fin" hint="Facultatif."><input name="endsAt" type="datetime-local" defaultValue={inputDateTime(promo?.ends_at ?? null)} className={INPUT} /></Field>
            <label className="flex items-center gap-2.5 text-[0.875rem] sm:col-span-2"><input type="checkbox" name="isActive" defaultChecked={promo?.is_active ?? true} className="accent-[#ff2e93]" />Code actif</label>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 sm:col-span-2">
              <button type="submit" className={BTN_PRIMARY}>{promo ? "Enregistrer" : "Créer le code"}</button>
              {promo && <button type="submit" name="intent" value="delete" formNoValidate className={BTN_DANGER}>{promo.uses_count > 0 ? "Désactiver" : "Supprimer"}</button>}
            </div>
          </form>
        </Card>
        <p className="mt-3 text-[0.8rem] text-discret">Un code refusé (expiré, épuisé, minimum non atteint) est signalé au client sur la page de commande, avec la raison, avant qu&apos;il paie.</p>
      </div>
    </>
  );
}
