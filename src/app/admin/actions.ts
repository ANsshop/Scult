"use server";

import { revalidatePath, updateTag } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { LOGIN_PATH, adminReady, changePassword, login, logout, requireAdmin } from "@/lib/admin/auth";
import { fromInputDateTime, toCents } from "@/lib/admin/format";
import { CATALOGUE_TAG } from "@/lib/store/catalogue";
import { saveCustomerNote } from "@/lib/store/customers";
import { advanceOrder, cancelOrder, noteOrder, refundOrder, setTracking, type ActionResult } from "@/lib/store/orders";
import { adjustStock, saveProduct, saveVariant } from "@/lib/store/products";
import { removePromo, savePromo } from "@/lib/store/promos";
import { saveSettings } from "@/lib/store/settings";

/**
 * Tout ce que l'admin peut modifier passe par ici. Chaque action :
 *  1. vérifie que la personne est connectée (requireAdmin) — jamais seulement la page ;
 *  2. valide ce qui arrive du formulaire ;
 *  3. appelle la fonction métier (lib/store/) ;
 *  4. revient à la page avec un message dans l'adresse (`?ok=` ou `?erreur=`).
 */

const str = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
const uuid = z.string().uuid();

/** Revient à `path` avec le message. Ne rend jamais la main. */
function back(path: string, message: { ok?: string; erreur?: string }): never {
  const [key, value] = Object.entries(message)[0];
  redirect(`${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(String(value))}`);
}

/** Après une écriture : les pages de l'admin se recalculent ; `catalogue` : le site aussi (prix, stock). */
function refresh(catalogue = false) {
  revalidatePath("/admin", "layout");
  if (catalogue) updateTag(CATALOGUE_TAG);
}

// — Session —

export async function loginAction(form: FormData) {
  if (!adminReady()) back(LOGIN_PATH, { erreur: "L'admin n'est pas configuré : il manque la base ou le secret de session." });
  const email = str(form, "email");
  const password = String(form.get("password") ?? "");
  if (!email || !password) back(LOGIN_PATH, { erreur: "E-mail et mot de passe requis." });
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "inconnue";
  const result = await login(email, password, ip);
  if (!result.ok) back(LOGIN_PATH, { erreur: result.error });
  redirect("/admin");
}

export async function logoutAction() {
  await logout();
  redirect(LOGIN_PATH);
}

// — Commandes —

export async function orderAction(form: FormData) {
  const admin = await requireAdmin();
  const id = uuid.safeParse(str(form, "id"));
  if (!id.success) back("/admin/commandes", { erreur: "Commande introuvable." });
  const page = `/admin/commandes/${id.data}`;
  const intent = str(form, "intent");
  const tracking = { carrier: str(form, "carrier") || null, number: str(form, "tracking") || null };
  let result: ActionResult;
  let done = "";
  switch (intent) {
    case "prepare": result = await advanceOrder(id.data, "preparing", admin.name); done = "Commande passée en préparation."; break;
    case "ship": result = await advanceOrder(id.data, "shipped", admin.name, tracking); done = tracking.number ? "Commande expédiée, suivi enregistré." : "Commande expédiée (sans numéro de suivi)."; break;
    case "deliver": result = await advanceOrder(id.data, "delivered", admin.name); done = "Commande marquée livrée."; break;
    case "tracking": result = await setTracking(id.data, admin.name, tracking); done = "Suivi mis à jour."; break;
    case "cancel": result = await cancelOrder(id.data, admin.name, { restock: form.get("restock") === "on", reason: str(form, "reason") || null }); done = "Commande annulée."; break;
    case "refund": {
      const amount = toCents(str(form, "amount"));
      if (amount === null) back(page, { erreur: "Montant à rembourser invalide." });
      result = await refundOrder(id.data, admin.name, { amountCents: amount, restock: form.get("restock") === "on", reason: str(form, "reason") || null });
      done = "Remboursement consigné. Pensez à le faire dans Stripe : cet écran ne déplace pas d'argent.";
      break;
    }
    case "note": result = await noteOrder(id.data, admin.name, str(form, "note")); done = "Note enregistrée."; break;
    default: result = { ok: false, error: "Action inconnue." };
  }
  if (!result.ok) back(page, { erreur: result.error });
  // Annuler ou rembourser peut remettre du stock en rayon : le site doit le voir.
  refresh(intent === "cancel" || intent === "refund");
  back(str(form, "retour") === "liste" ? "/admin/commandes" : page, { ok: done });
}

// — Produits et stock —

export async function productAction(form: FormData) {
  await requireAdmin();
  const id = uuid.safeParse(str(form, "id"));
  if (!id.success) back("/admin/produits", { erreur: "Produit introuvable." });
  const page = `/admin/produits/${id.data}`;
  const name = str(form, "name");
  if (!name) back(page, { erreur: "Le nom est requis." });
  await saveProduct(id.data, { name, description: str(form, "description"), seoTitle: str(form, "seoTitle") || null, seoDescription: str(form, "seoDescription") || null, isActive: form.get("isActive") === "on" });
  refresh(true);
  back(page, { ok: "Produit enregistré. Le site se met à jour dans la minute." });
}

export async function variantAction(form: FormData) {
  await requireAdmin();
  const id = uuid.safeParse(str(form, "id"));
  const page = `/admin/produits/${str(form, "productId")}`;
  if (!id.success) back("/admin/produits", { erreur: "Article introuvable." });
  const price = toCents(str(form, "price"));
  if (price === null) back(page, { erreur: "Prix de vente invalide." });
  const compareRaw = str(form, "compareAt"), costRaw = str(form, "cost");
  const compareAt = compareRaw ? toCents(compareRaw) : null;
  const cost = costRaw ? toCents(costRaw) : null;
  if (compareRaw && compareAt === null) back(page, { erreur: "Prix barré invalide." });
  if (costRaw && cost === null) back(page, { erreur: "Prix de revient invalide." });
  if (compareAt !== null && compareAt <= price) back(page, { erreur: "Le prix barré doit être plus haut que le prix de vente." });
  const lowStockAt = z.coerce.number().int().min(0).max(100000).safeParse(str(form, "lowStockAt") || "0");
  if (!lowStockAt.success) back(page, { erreur: "Seuil d'alerte invalide." });
  await saveVariant(id.data, { priceCents: price, compareAtCents: compareAt, costCents: cost, lowStockAt: lowStockAt.data, isActive: form.get("isActive") === "on" });
  refresh(true);
  back(page, { ok: "Article enregistré. Le prix de revient s'applique aux prochaines commandes." });
}

export async function stockAction(form: FormData) {
  const admin = await requireAdmin();
  const id = uuid.safeParse(str(form, "id"));
  const page = `/admin/produits/${str(form, "productId")}`;
  if (!id.success) back("/admin/produits", { erreur: "Article introuvable." });
  const quantity = z.coerce.number().int().min(1).max(100000).safeParse(str(form, "quantity"));
  if (!quantity.success) back(page, { erreur: "Quantité invalide : un nombre entier, au moins 1." });
  const kind = str(form, "kind"); // restock : entrée ; remove : sortie (casse, écart d'inventaire)
  const result = await adjustStock(id.data, kind === "remove" ? -quantity.data : quantity.data, kind === "restock" ? "restock" : "adjust", str(form, "note") || null, admin.name);
  if (!result.ok) back(page, { erreur: result.error });
  refresh(true);
  back(page, { ok: `Stock mis à jour : ${result.stock} en rayon.` });
}

// — Clients —

export async function customerNoteAction(form: FormData) {
  await requireAdmin();
  const id = uuid.safeParse(str(form, "id"));
  if (!id.success) back("/admin/clients", { erreur: "Client introuvable." });
  await saveCustomerNote(id.data, str(form, "note"));
  refresh();
  back(`/admin/clients/${id.data}`, { ok: "Note enregistrée." });
}

// — Codes promo —

export async function promoAction(form: FormData) {
  await requireAdmin();
  const rawId = str(form, "id");
  const id = rawId ? uuid.safeParse(rawId) : null;
  const page = `/admin/promos/${id?.success ? id.data : "nouveau"}`;
  if (str(form, "intent") === "delete" && id?.success) {
    const outcome = await removePromo(id.data);
    refresh();
    back("/admin/promos", { ok: outcome === "deleted" ? "Code supprimé." : "Ce code a déjà servi : il est désactivé, pas supprimé, pour garder l'historique." });
  }
  const code = str(form, "code").toUpperCase();
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) back(page, { erreur: "Code invalide : 3 à 24 lettres, chiffres ou tirets, sans espace." });
  const type = str(form, "type") === "fixed" ? "fixed" : "percent";
  const value = type === "percent" ? Number(str(form, "value").replace(",", ".")) : toCents(str(form, "value"));
  if (value === null || !Number.isFinite(value) || value <= 0) back(page, { erreur: "Valeur de la remise invalide." });
  if (type === "percent" && (!Number.isInteger(value) || value > 90)) back(page, { erreur: "Un pourcentage entier, 90 au plus." });
  const min = str(form, "min") ? toCents(str(form, "min")) : 0;
  if (min === null) back(page, { erreur: "Minimum d'achat invalide." });
  const maxRaw = str(form, "maxUses");
  const maxUses = maxRaw ? z.coerce.number().int().min(1).safeParse(maxRaw) : null;
  if (maxUses && !maxUses.success) back(page, { erreur: "Nombre d'utilisations invalide." });
  const startsAt = fromInputDateTime(str(form, "startsAt")), endsAt = fromInputDateTime(str(form, "endsAt"));
  if (startsAt && endsAt && endsAt <= startsAt) back(page, { erreur: "La fin doit être après le début." });
  const saved = await savePromo(id?.success ? id.data : null, {
    code, label: str(form, "label") || null, discountType: type, discountValue: value, minSubtotalCents: min, maxUses: maxUses?.success ? maxUses.data : null, startsAt, endsAt, isActive: form.get("isActive") === "on",
  });
  if (!saved) back(page, { erreur: `Le code ${code} existe déjà.` });
  refresh();
  back("/admin/promos", { ok: `Code ${code} enregistré.` });
}

// — Réglages —

export async function settingsAction(form: FormData) {
  await requireAdmin();
  const goalRaw = str(form, "goal");
  const goal = goalRaw ? toCents(goalRaw) : 0;
  if (goal === null) back("/admin/reglages", { erreur: "Objectif du mois invalide." });
  const late = z.coerce.number().int().min(1).max(240).safeParse(str(form, "late"));
  const target = z.coerce.number().int().min(7).max(365).safeParse(str(form, "target"));
  if (!late.success) back("/admin/reglages", { erreur: "Délai avant retard invalide (1 à 240 heures)." });
  if (!target.success) back("/admin/reglages", { erreur: "Jours de stock visés invalides (7 à 365)." });
  await saveSettings({ monthlyGoalCents: goal, lateAfterHours: late.data, restockTargetDays: target.data });
  refresh();
  back("/admin/reglages", { ok: "Réglages enregistrés." });
}

export async function passwordAction(form: FormData) {
  const admin = await requireAdmin();
  const next = String(form.get("next") ?? "");
  if (next !== String(form.get("confirm") ?? "")) back("/admin/reglages", { erreur: "Les deux mots de passe ne sont pas identiques." });
  const result = await changePassword(admin.id, String(form.get("current") ?? ""), next);
  if (!result.ok) back("/admin/reglages", { erreur: result.error });
  back("/admin/reglages", { ok: "Mot de passe changé." });
}
