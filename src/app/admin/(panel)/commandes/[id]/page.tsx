import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { labelAction, orderAction } from "../../../actions";
import { BTN_DANGER, BTN_DARK, BTN_GHOST, BTN_PRIMARY, Card, Field, Flash, INPUT, Icon, PageHeader, STATE, StatusBadge, TABLE, TD, TH, TableWrap, Tag } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { ago, centsInput, country, dateLong, dateTime, eur, num, pct } from "@/lib/admin/format";
import { emailReady } from "@/lib/notify/email";
import { CARRIERS, trackingUrl } from "@/lib/notify/tracking";
import { sendcloudReady, shippingOptions, type ShippingOption } from "@/lib/sendcloud";
import { getOrder, parcelWeightKg } from "@/lib/store/orders";
import { getSettings } from "@/lib/store/settings";

export const metadata: Metadata = { title: "Commande" };

const EVENT: Record<string, string> = {
  paid: "Payée", preparing: "Passée en préparation", shipped: "Expédiée", delivered: "Livrée", cancelled: "Annulée", refunded: "Remboursée",
  partial_refund: "Remboursement partiel", note: "Note", tracking: "Suivi modifié", email: "E-mail", email_failed: "E-mail non envoyé", label: "Étiquette créée", label_cancelled: "Étiquette annulée",
};

function Hidden({ id, intent }: { id: string; intent: string }) {
  return <><input type="hidden" name="id" value={id} /><input type="hidden" name="intent" value={intent} /></>;
}

function TrackingFields({ carrier, number }: { carrier: string | null; number: string | null }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
      <Field label="Transporteur">
        <select name="carrier" defaultValue={carrier ?? "Colissimo"} className={INPUT}>{CARRIERS.map((c) => <option key={c}>{c}</option>)}</select>
      </Field>
      <Field label="Numéro de suivi"><input name="tracking" defaultValue={number ?? ""} placeholder="6A12345678901" autoComplete="off" className={INPUT} /></Field>
    </div>
  );
}

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [data, settings] = await Promise.all([getOrder(id), getSettings()]);
  if (!data) notFound();
  const { order: o, lines, events, history } = data;
  const now = new Date();
  const waiting = o.status === "paid" || o.status === "preparing";
  const late = waiting && now.getTime() - o.paid_at.getTime() > settings.lateAfterHours * 3_600_000;
  const net = o.subtotal_cents - o.discount_cents;
  const margin = o.cost_cents === null ? null : net - o.cost_cents;
  const refundable = o.total_cents - o.refund_cents;
  const canRefund = ["paid", "preparing", "shipped", "delivered"].includes(o.status) && refundable > 0;
  const url = o.tracking_url || trackingUrl(o.tracking_carrier, o.tracking_number);
  // Sendcloud : sur une commande à préparer et sans étiquette, on demande les modes d'envoi possibles pour ce colis.
  const sendcloud = sendcloudReady();
  const canLabel = sendcloud && waiting && !o.sendcloud_parcel_id;
  const weight = canLabel ? (await parcelWeightKg(o.id)) ?? 1 : 0;
  let options: ShippingOption[] = [];
  let optionsError: string | null = null;
  if (canLabel) {
    try { options = await shippingOptions(o.country_code, weight); } catch (e) { optionsError = e instanceof Error ? e.message : "Sendcloud ne répond pas."; }
  }
  const units = lines.reduce((s, l) => s + l.units, 0);
  const mails = emailReady();


  // L'étape suivante, selon le statut. Rendue deux fois : en tête sur téléphone, dans la colonne de droite sur grand écran.
  const next = (
    <>
          {/* L'étiquette Sendcloud : la créer, l'imprimer, suivre le colis */}
          {canLabel && (
            <Card title="Étiquette Sendcloud" hint="Créée sur le compte Peptide Partners, à la marque et à l'adresse de SCULT.">
              {optionsError ? (
                <p className="flex items-start gap-2 text-[0.85rem]"><Icon name="alert" size={14} className="mt-0.5 shrink-0" style={{ color: STATE.critical }} /><span>{optionsError}</span></p>
              ) : options.length === 0 ? (
                <p className="text-[0.85rem] text-doux">Aucun mode d&apos;envoi à domicile n&apos;est disponible vers {country(o.country_code)} sur ce compte Sendcloud.</p>
              ) : (
                <form action={labelAction} className="space-y-3">
                  <input type="hidden" name="id" value={o.id} /><input type="hidden" name="intent" value="create" />
                  <Field label="Mode d'envoi" hint="Du moins cher au plus cher, tarif hors taxes pour le poids proposé.">
                    <select name="option" className={INPUT}>
                      {options.map((opt) => <option key={`${opt.code}|${opt.contractId}`} value={`${opt.code}|${opt.contractId ?? ""}`}>{opt.name}{opt.priceEur !== null ? ` · ${num(opt.priceEur, 2)} €` : ""}{opt.signature ? " · contre signature" : ""}</option>)}
                    </select>
                  </Field>
                  <Field label="Poids du colis (kg)" hint="Proposé d'après les articles, emballage compris. Corrigez-le si besoin."><input name="weight" inputMode="decimal" required defaultValue={String(weight).replace(".", ",")} className={INPUT} /></Field>
                  <button type="submit" className={`${BTN_PRIMARY} h-11 w-full`}>Créer l&apos;étiquette</button>
                  <p className="text-[0.76rem] text-discret">Une étiquette créée est facturée par Sendcloud : elle s&apos;annule tant que le colis n&apos;est pas remis au transporteur.</p>
                </form>
              )}
            </Card>
          )}
          {o.sendcloud_parcel_id && (
            <Card title="Étiquette Sendcloud" hint={o.label_created_at ? `Créée le ${dateTime(o.label_created_at)}` : undefined}>
              <p className="text-[0.9rem]">{o.tracking_carrier ?? "Colis"}{o.tracking_number && <> · <span className="font-mono text-[0.85rem]">{o.tracking_number}</span></>}</p>
              {o.sendcloud_status && <p className="mt-1 text-[0.82rem] text-doux">Dernier état : {o.sendcloud_status}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={`/admin/etiquette/${o.id}`} target="_blank" rel="noopener noreferrer" className={BTN_DARK}>Imprimer l&apos;étiquette</a>
                {sendcloud && <form action={labelAction}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="intent" value="sync" /><button type="submit" className={BTN_GHOST}>Actualiser le suivi</button></form>}
              </div>
              {waiting && <p className="mt-3 text-[0.76rem] text-discret">La commande passe à « expédiée » toute seule quand le transporteur prend le colis, et le client reçoit alors son numéro de suivi.</p>}
              {waiting && sendcloud && (
                <details className="mt-4 border-t pt-4">
                  <summary className="cursor-pointer text-[0.85rem] text-doux hover:text-texte">Annuler cette étiquette</summary>
                  <form action={labelAction} className="mt-3"><input type="hidden" name="id" value={o.id} /><input type="hidden" name="intent" value="cancel" /><button type="submit" className={`${BTN_DANGER} w-full`}>Annuler l&apos;étiquette chez Sendcloud</button></form>
                </details>
              )}
            </Card>
          )}
          {o.status === "paid" && (
            <Card title="Étape suivante">
              <form action={orderAction}><Hidden id={o.id} intent="prepare" /><button type="submit" className={`${BTN_PRIMARY} h-11 w-full`}>Je prépare ce colis</button></form>
              <details className="mt-4 border-t pt-4">
                <summary className="cursor-pointer text-[0.85rem] text-doux hover:text-texte">Déjà prêt ? Expédier directement</summary>
                <form action={orderAction} className="mt-4 space-y-3"><Hidden id={o.id} intent="ship" /><TrackingFields carrier={null} number={null} /><button type="submit" className={`${BTN_DARK} w-full`}>Marquer expédiée</button></form>
              </details>
            </Card>
          )}
          {o.status === "preparing" && (
            <Card title={o.sendcloud_parcel_id ? "Ou marquer expédiée à la main" : "Étape suivante"} hint={o.sendcloud_parcel_id ? "Si le transporteur tarde à signaler le départ." : mails ? "Collez le numéro de suivi : le client le reçoit par e-mail." : "Collez le numéro de suivi de l'étiquette."}>
              <form action={orderAction} className="space-y-3"><Hidden id={o.id} intent="ship" /><TrackingFields carrier={o.tracking_carrier} number={o.tracking_number} /><button type="submit" className={`${BTN_PRIMARY} h-11 w-full`}>Marquer expédiée</button></form>
            </Card>
          )}
          {(o.status === "shipped" || o.status === "delivered") && (
            <Card title="Expédition" hint={o.shipped_at ? `Partie le ${dateTime(o.shipped_at)}${o.delivered_at ? ` · livrée le ${dateTime(o.delivered_at)}` : ""}` : undefined}>
              <p className="text-[0.9rem]">{o.tracking_number ? <>{o.tracking_carrier ?? "Suivi"} · <span className="font-mono text-[0.85rem]">{o.tracking_number}</span></> : <span className="text-doux">Pas de numéro de suivi.</span>}</p>
              {url && <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[0.82rem] underline underline-offset-4 hover:text-rose">Suivre le colis</a>}
              {o.status === "shipped" && <form action={orderAction} className="mt-4"><Hidden id={o.id} intent="deliver" /><button type="submit" className={`${BTN_PRIMARY} w-full`}>Marquer livrée</button></form>}
              <details className="mt-4 border-t pt-4">
                <summary className="cursor-pointer text-[0.85rem] text-doux hover:text-texte">Corriger le suivi</summary>
                <form action={orderAction} className="mt-4 space-y-3"><Hidden id={o.id} intent="tracking" /><TrackingFields carrier={o.tracking_carrier} number={o.tracking_number} /><label className="flex items-start gap-2.5 text-[0.875rem]"><input type="checkbox" name="notify" defaultChecked className="mt-1 accent-[#ff2e93]" /><span>Renvoyer l&apos;avis d&apos;expédition au client</span></label><button type="submit" className={`${BTN_GHOST} w-full`}>Enregistrer le suivi</button></form>
              </details>
            </Card>
          )}

    </>
  );

  return (
    <>
      <PageHeader
        title={o.reference}
        back={{ href: "/admin/commandes", label: "Commandes" }}
        sub={<span className="flex flex-wrap items-center gap-x-3 gap-y-2"><StatusBadge status={o.status} /><span>Payée le {dateTime(o.paid_at)}</span>{late && <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: "#a82424" }}><Icon name="alert" size={14} />En retard : payée {ago(o.paid_at, now)}</span>}</span>}
      />
      <Flash ok={sp.ok} erreur={sp.erreur} />

      <div className="mb-3 grid gap-3 xl:hidden">{next}</div>
      <div className="grid items-start gap-3 xl:grid-cols-[1.55fr_1fr]">
        <div className="grid gap-3">
          <Card title="Articles" hint={`${units} pot${units > 1 ? "s" : ""} à mettre dans le colis.`} flush>
            <TableWrap>
              <table className={TABLE}>
                <thead><tr><th className={TH}>Article</th><th className={`${TH} text-right`}>Prix</th><th className={`${TH} text-right`}>Qté</th><th className={`${TH} text-right`}>Total</th></tr></thead>
                <tbody>
                  {lines.map((l) => (
                    <tr key={l.id}>
                      <td className={TD}>{l.product_id ? <Link href={`/admin/produits/${l.product_id}`} className="font-medium hover:underline">{l.name}</Link> : <span className="font-medium">{l.name}</span>}<span className="block text-[0.76rem] text-discret">{l.sku}{l.units > l.quantity ? ` · ${l.units} pots` : ""}</span></td>
                      <td className={`${TD} text-right tabular-nums`}>{eur(l.unit_price_cents)}</td>
                      <td className={`${TD} text-right tabular-nums`}>{l.quantity}</td>
                      <td className={`${TD} text-right tabular-nums`}>{eur(l.line_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <dl className="space-y-1.5 border-t px-5 py-4 text-[0.875rem] tabular-nums">
              <div className="flex justify-between"><dt className="text-doux">Articles</dt><dd>{eur(o.subtotal_cents)}</dd></div>
              {o.discount_cents > 0 && <div className="flex justify-between"><dt className="text-doux">Remise{o.promo_code && <> <Tag>{o.promo_code}</Tag></>}</dt><dd>−{eur(o.discount_cents)}</dd></div>}
              <div className="flex justify-between"><dt className="text-doux">Livraison</dt><dd>{o.shipping_cents === 0 ? "Offerte" : eur(o.shipping_cents)}</dd></div>
              <div className="flex justify-between border-t pt-2 text-[1rem] font-semibold"><dt>Total payé</dt><dd>{eur(o.total_cents)}</dd></div>
              {o.refund_cents > 0 && <div className="flex justify-between" style={{ color: "#a82424" }}><dt>Remboursé</dt><dd>−{eur(o.refund_cents)}</dd></div>}
              <div className="flex justify-between pt-1 text-[0.82rem] text-doux">
                <dt>Marge brute sur les articles</dt>
                <dd>{margin === null ? "prix de revient inconnu" : `${eur(margin)} · ${net > 0 ? pct(margin / net, 0) : "—"}`}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Historique">
            <ol className="relative space-y-4 before:absolute before:bottom-1.5 before:left-[5px] before:top-1.5 before:w-px before:bg-[#e1e0d9]">
              {events.map((e) => (
                <li key={e.id} className="relative pl-6">
                  <span aria-hidden className="absolute left-0 top-1.5 h-[11px] w-[11px] rounded-full border-2 border-white bg-noir" />
                  <p className="text-[0.875rem]"><span className="font-medium">{EVENT[e.type] ?? e.type}</span>{e.detail && <span className="text-doux"> — {e.detail}</span>}</p>
                  <p className="text-[0.76rem] text-discret">{dateTime(e.created_at)}{e.actor ? ` · ${e.actor}` : ""}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="grid gap-3">
          <div className="hidden gap-3 xl:grid">{next}</div>
          <Card title="Client">
            <p className="font-medium">{o.name || "—"}</p>
            <a href={`mailto:${o.email}?subject=${encodeURIComponent(`Votre commande SCULT ${o.reference}`)}`} className="text-[0.875rem] underline underline-offset-4 hover:text-rose">{o.email}</a>
            {history && (
              <p className="mt-3 text-[0.82rem] text-doux">
                {history.orders > 1 ? <><strong className="text-texte">{history.orders} commandes</strong>, {eur(history.revenue_cents, true)} dépensés{history.first_at ? ` depuis le ${dateLong(history.first_at)}` : ""}.</> : "Première commande."}
                {o.customer_id && <> <Link href={`/admin/clients/${o.customer_id}`} className="underline underline-offset-2 hover:text-texte">Voir sa fiche</Link></>}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
              <form action={orderAction}><Hidden id={o.id} intent="email-confirmation" /><button type="submit" disabled={!mails} className={`${BTN_GHOST} !h-9 !px-3.5 !text-[0.78rem]`}>Renvoyer la confirmation</button></form>
              {(o.status === "shipped" || o.status === "delivered") && <form action={orderAction}><Hidden id={o.id} intent="email-shipped" /><button type="submit" disabled={!mails} className={`${BTN_GHOST} !h-9 !px-3.5 !text-[0.78rem]`}>Renvoyer l&apos;avis d&apos;expédition</button></form>}
              {!mails && <p className="w-full text-[0.76rem] text-discret">Les e-mails ne sont pas encore branchés : rien ne part pour l&apos;instant (voir Réglages).</p>}
            </div>
            <address className="mt-4 border-t pt-4 text-[0.875rem] not-italic leading-relaxed">
              <span className="mb-1 block text-[0.76rem] text-discret">Adresse de livraison</span>
              {o.name}<br />{o.address_line1}{o.address_line2 && <><br />{o.address_line2}</>}<br />{o.postal_code} {o.city}<br />{country(o.country_code)}
            </address>
          </Card>

          <Card title="Note interne" hint="Visible seulement ici.">
            <form action={orderAction} className="space-y-3"><Hidden id={o.id} intent="note" /><textarea name="note" defaultValue={o.admin_note ?? ""} rows={3} placeholder="Client prévenu, colis refait, etc." className={`${INPUT} h-auto py-2.5`} /><button type="submit" className={BTN_GHOST}>Enregistrer la note</button></form>
          </Card>

          {(waiting || canRefund) && (
            <Card title="Annuler ou rembourser">
              {waiting && (
                <details>
                  <summary className={`${BTN_DANGER} w-full`}>Annuler la commande</summary>
                  <form action={orderAction} className="mt-4 space-y-3">
                    <Hidden id={o.id} intent="cancel" />
                    <Field label="Raison (facultatif)"><input name="reason" placeholder="Demande du client, doublon" className={INPUT} /></Field>
                    <label className="flex items-start gap-2.5 text-[0.875rem]"><input type="checkbox" name="restock" defaultChecked className="mt-1 accent-[#ff2e93]" /><span>Remettre les {units} pot{units > 1 ? "s" : ""} en stock</span></label>
                    <label className="flex items-start gap-2.5 text-[0.875rem]"><input type="checkbox" name="notify" defaultChecked className="mt-1 accent-[#ff2e93]" /><span>Prévenir le client par e-mail</span></label>
                    <p className="flex items-start gap-2 text-[0.8rem] text-doux"><Icon name="alert" size={14} className="mt-0.5 shrink-0" style={{ color: STATE.serious }} />L&apos;annulation ne rembourse pas le client : le remboursement se fait dans Stripe.</p>
                    <button type="submit" className={`${BTN_DANGER} w-full`}>Confirmer l&apos;annulation</button>
                  </form>
                </details>
              )}
              {canRefund && (
                <details className={waiting ? "mt-3" : ""}>
                  <summary className={`${BTN_GHOST} w-full`}>Consigner un remboursement</summary>
                  <form action={orderAction} className="mt-4 space-y-3">
                    <Hidden id={o.id} intent="refund" />
                    <Field label="Montant remboursé (€)" hint={`Jusqu'à ${eur(refundable)}. Le montant entier passe la commande en « Remboursée ».`}><input name="amount" inputMode="decimal" defaultValue={centsInput(refundable)} className={INPUT} /></Field>
                    <Field label="Raison (facultatif)"><input name="reason" placeholder="Colis abîmé, retour" className={INPUT} /></Field>
                    <label className="flex items-start gap-2.5 text-[0.875rem]"><input type="checkbox" name="restock" className="mt-1 accent-[#ff2e93]" /><span>Remettre les pots en stock (retour reçu, pot scellé)</span></label>
                    <label className="flex items-start gap-2.5 text-[0.875rem]"><input type="checkbox" name="notify" defaultChecked className="mt-1 accent-[#ff2e93]" /><span>Prévenir le client par e-mail (à cocher une fois le remboursement fait dans Stripe)</span></label>
                    <p className="flex items-start gap-2 text-[0.8rem] text-doux"><Icon name="alert" size={14} className="mt-0.5 shrink-0" style={{ color: STATE.serious }} />Cet écran consigne le remboursement pour que les chiffres restent justes. L&apos;argent, lui, se rend dans Stripe.</p>
                    <button type="submit" className={`${BTN_DARK} w-full`}>Consigner le remboursement</button>
                  </form>
                </details>
              )}
              {o.external_ref && <a href={`https://dashboard.stripe.com/search?query=${encodeURIComponent(o.external_ref)}`} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-[0.82rem] text-doux underline underline-offset-4 hover:text-texte">Ouvrir le paiement dans Stripe</a>}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
