import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Sendcloud : les étiquettes d'expédition et le suivi des colis. Même montage
 * que PTM : le compte Sendcloud de Peptide Partners, avec la marque et
 * l'adresse d'expéditeur propres à SCULT, par l'API v3 (`/shipments`) — l'API
 * v2 ne crée plus de colis sur les comptes récents, elle sert encore à lire et
 * à annuler.
 *
 * Variables : SENDCLOUD_PUBLIC_KEY, SENDCLOUD_SECRET_KEY, SENDCLOUD_BRAND_ID,
 * SENDCLOUD_SENDER_ADDRESS_ID, et SENDCLOUD_WEBHOOK_SECRET pour les signaux de
 * suivi. La marque et l'adresse sont toujours envoyées explicitement : sur un
 * compte partagé, sans elles, le colis partirait au nom d'un autre.
 */

/** L'adresse et la marque du logisticien sur le compte partagé : jamais pour une boutique (règle de Peptide Partners). */
const FORBIDDEN_SENDER = 899773;
const FORBIDDEN_BRAND = 761638;

const base = () => (process.env.SENDCLOUD_API_URL ?? "https://panel.sendcloud.sc/api").replace(/\/$/, "");
const id = (name: string) => { const n = Number(process.env[name]); return Number.isInteger(n) && n > 0 ? n : null; };

/** Ce qui manque pour créer des étiquettes, ou `null` si tout est prêt. */
export function sendcloudProblem(): string | null {
  if (!process.env.SENDCLOUD_PUBLIC_KEY || !process.env.SENDCLOUD_SECRET_KEY) return "les clés Sendcloud manquent (SENDCLOUD_PUBLIC_KEY, SENDCLOUD_SECRET_KEY)";
  if (!id("SENDCLOUD_SENDER_ADDRESS_ID")) return "l'adresse d'expéditeur SCULT manque (SENDCLOUD_SENDER_ADDRESS_ID)";
  if (!id("SENDCLOUD_BRAND_ID")) return "la marque SCULT manque (SENDCLOUD_BRAND_ID)";
  if (id("SENDCLOUD_SENDER_ADDRESS_ID") === FORBIDDEN_SENDER || id("SENDCLOUD_BRAND_ID") === FORBIDDEN_BRAND) return "l'adresse ou la marque configurée est celle du logisticien, pas celle de SCULT";
  return null;
}
export const sendcloudReady = () => sendcloudProblem() === null;

const auth = () => "Basic " + Buffer.from(`${process.env.SENDCLOUD_PUBLIC_KEY}:${process.env.SENDCLOUD_SECRET_KEY}`).toString("base64");

/** Les erreurs de l'API v3 ({ errors: [{ detail, source.pointer }] }) en une phrase lisible. */
function explain(status: number, body: string): string {
  try {
    const errors = JSON.parse(body)?.errors;
    if (Array.isArray(errors) && errors.length) {
      return `Sendcloud (${status}) : ` + errors.map((e: { detail?: string; code?: string; source?: { pointer?: string } }) => `${e.detail ?? e.code ?? "erreur"}${e.source?.pointer ? ` (${e.source.pointer})` : ""}`).join(" · ");
    }
  } catch { /* pas du JSON */ }
  return `Sendcloud (${status}) : ${body.slice(0, 240)}`;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: auth(), ...(init?.headers ?? {}) },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(explain(res.status, text));
  return JSON.parse(text) as T;
}

// — Les modes d'envoi possibles pour un colis —

export type ShippingOption = { code: string; name: string; carrier: string; contractId: number | null; priceEur: number | null; signature: boolean };

type RawOption = {
  code: string; name: string; carrier: { code: string; name: string }; contract?: { id: number } | null;
  functionalities?: { last_mile?: string | null; signature?: boolean | null };
  quotes?: { price?: { breakdown?: { price?: { value?: string } }[] } }[];
};

/**
 * Les modes d'envoi à domicile que le compte peut utiliser vers ce pays, pour
 * ce poids, du moins cher au plus cher. (La boutique ne propose pas de point
 * relais : l'adresse est saisie chez Stripe.)
 */
export async function shippingOptions(toCountry: string, weightKg: number): Promise<ShippingOption[]> {
  const data = await call<{ data?: RawOption[] }>("/v3/fetch-shipping-options", {
    method: "POST",
    body: JSON.stringify({ from_country_code: "FR", to_country_code: toCountry.toUpperCase(), weight: { value: weightKg.toFixed(3), unit: "kg" } }),
  });
  return (data.data ?? [])
    .filter((o) => o.contract?.id && (o.functionalities?.last_mile ?? "home_delivery") === "home_delivery")
    .map((o) => {
      const lines = o.quotes?.[0]?.price?.breakdown ?? [];
      // Le tarif est décomposé (base + suppléments) : on additionne tout.
      const price = lines.length ? lines.reduce((s, l) => s + (Number(l.price?.value) || 0), 0) : null;
      return { code: o.code, name: o.name, carrier: o.carrier?.name ?? o.carrier?.code ?? "", contractId: o.contract?.id ?? null, priceEur: price, signature: Boolean(o.functionalities?.signature) };
    })
    .sort((a, b) => (a.priceEur ?? Infinity) - (b.priceEur ?? Infinity));
}

// — Créer une étiquette —

/** Les longueurs que les transporteurs acceptent (Mondial Relay compte la ligne 1 avec le numéro de voie). */
const MAX = { name: 35, line: 32, house: 20, postal: 12, city: 30 };

/** « 12 bis rue des Lilas » → le numéro (« 12 bis ») et la voie (« rue des Lilas »). Sans numéro en tête, tout reste dans la voie. */
export function splitHouseNumber(line: string): { houseNumber: string | null; street: string } {
  const m = line.trim().match(/^(\d+(?:\s?(?:bis|ter|quater|[a-z]))?)[\s,]+(.+)$/i);
  return m && m[1].length <= MAX.house ? { houseNumber: m[1], street: m[2].trim() } : { houseNumber: null, street: line.trim() };
}

export type LabelInput = {
  reference: string; name: string; email: string; line1: string; line2: string | null; postalCode: string; city: string; countryCode: string;
  totalCents: number; weightKg: number; optionCode: string; contractId: number | null;
  items: { name: string; sku: string; quantity: number; unitCents: number }[];
};
export type Label = { parcelId: number; trackingNumber: string | null; trackingUrl: string | null; carrier: string | null; status: string | null };

type RawParcel = { id: number; tracking_number?: string | null; tracking_url?: string | null; status?: { id?: number; code?: string; message?: string }; carrier?: { code?: string; name?: string } };

/**
 * Crée le colis chez Sendcloud et l'annonce au transporteur (un seul appel,
 * jamais rejoué : un doublon serait une étiquette payée deux fois).
 * L'adresse est mise aux longueurs acceptées ; une rue trop longue fait
 * échouer avec un message clair plutôt que d'être coupée — une rue amputée
 * enverrait le colis nulle part.
 */
export async function createLabel(input: LabelInput): Promise<Label> {
  const problem = sendcloudProblem();
  if (problem) throw new Error(`Sendcloud n'est pas prêt : ${problem}.`);
  if (!input.email) throw new Error("Le transporteur exige un e-mail : cette commande n'en a pas.");
  const { houseNumber, street } = splitHouseNumber(input.line1);
  if (street.length + (houseNumber ? houseNumber.length + 1 : 0) > MAX.line) throw new Error(`Adresse trop longue pour le transporteur (${MAX.line} caractères au plus) : « ${input.line1} ». Abrégez-la dans Stripe ou créez l'étiquette à la main.`);
  const totalQuantity = input.items.reduce((s, i) => s + i.quantity, 0) || 1;
  const body = {
    to_address: {
      name: input.name.trim().slice(0, MAX.name),
      address_line_1: street,
      ...(houseNumber ? { house_number: houseNumber } : {}),
      ...(input.line2?.trim() ? { address_line_2: input.line2.trim().slice(0, MAX.line) } : {}),
      postal_code: input.postalCode.trim().slice(0, MAX.postal),
      city: input.city.trim().slice(0, MAX.city),
      country_code: input.countryCode.toUpperCase(),
      email: input.email,
    },
    // L'API refuse un identifiant d'adresse ET des champs d'adresse dans le même objet.
    from_address: { sender_address_id: id("SENDCLOUD_SENDER_ADDRESS_ID") },
    brand_id: id("SENDCLOUD_BRAND_ID"),
    ship_with: { type: "shipping_option_code", properties: { shipping_option_code: input.optionCode, ...(input.contractId ? { contract_id: input.contractId } : {}) } },
    order_number: input.reference,
    total_order_price: { currency: "EUR", value: (input.totalCents / 100).toFixed(2) },
    parcels: [{
      weight: { value: input.weightKg.toFixed(3), unit: "kg" },
      parcel_items: input.items.map((i) => ({ description: i.name.slice(0, 60), quantity: i.quantity, weight: { value: (input.weightKg / totalQuantity).toFixed(3), unit: "kg" }, price: { value: (i.unitCents / 100).toFixed(2), currency: "EUR" }, sku: i.sku })),
    }],
  };
  const res = await call<{ data?: { id: string; parcels?: RawParcel[] } }>("/v3/shipments", { method: "POST", body: JSON.stringify(body) });
  const parcel = res.data?.parcels?.[0];
  if (!parcel?.id) throw new Error("Sendcloud a créé l'envoi sans renvoyer de colis : vérifiez dans Sendcloud avant de recommencer.");
  let label: Label = { parcelId: parcel.id, trackingNumber: parcel.tracking_number ?? null, trackingUrl: parcel.tracking_url ?? null, carrier: parcel.carrier?.name ?? null, status: parcel.status?.message ?? null };
  // Le transporteur attribue le numéro de suivi une à deux secondes après : on l'attend un peu, le signal de suivi fera le reste.
  for (const wait of [800, 1200, 1600]) {
    if (label.trackingNumber) break;
    await new Promise((r) => setTimeout(r, wait));
    label = { ...label, ...(await readParcel(parcel.id).then((p) => ({ trackingNumber: p.trackingNumber, trackingUrl: p.trackingUrl ?? label.trackingUrl, carrier: p.carrier ?? label.carrier, status: p.status ?? label.status })).catch(() => ({}))) };
  }
  return label;
}

export type ParcelState = { parcelId: number; statusCode: number | null; status: string | null; trackingNumber: string | null; trackingUrl: string | null; carrier: string | null };

/** L'état actuel d'un colis. */
export async function readParcel(parcelId: number): Promise<ParcelState> {
  const { parcel } = await call<{ parcel: RawParcel }>(`/v2/parcels/${parcelId}`);
  return { parcelId: parcel.id, statusCode: parcel.status?.id ?? null, status: parcel.status?.message ?? null, trackingNumber: parcel.tracking_number ?? null, trackingUrl: parcel.tracking_url ?? null, carrier: parcel.carrier?.name ?? parcel.carrier?.code ?? null };
}

/** Annule un colis pas encore remis au transporteur. */
export async function cancelParcel(parcelId: number): Promise<void> {
  await call(`/v2/parcels/${parcelId}/cancel`, { method: "POST" });
}

/**
 * Le PDF de l'étiquette. Sendcloud le fabrique deux à quatre secondes après
 * la création du colis : d'ici là il répond 404, on patiente.
 */
export async function labelPdf(parcelId: number): Promise<{ ok: true; pdf: ArrayBuffer } | { ok: false; status: number; message: string }> {
  let last = { status: 0, message: "" };
  for (const wait of [0, 700, 1000, 1300, 1600, 2000, 2500]) {
    if (wait) await new Promise((r) => setTimeout(r, wait));
    const res = await fetch(`${base()}/v3/parcels/${parcelId}/documents/label`, { headers: { Authorization: auth(), Accept: "application/pdf" }, cache: "no-store", signal: AbortSignal.timeout(15_000) });
    if (res.ok) return { ok: true, pdf: await res.arrayBuffer() };
    last = { status: res.status, message: explain(res.status, await res.text()) };
    if (res.status !== 404) break; // seul le 404 est une question de délai
  }
  return { ok: false, ...last };
}

// — Le suivi —

/**
 * Ce qu'un état de colis Sendcloud veut dire pour la commande. Codes repris de
 * l'intégration PTM, vérifiés en production là-bas. `null` : rien à changer
 * (annoncé, en attente, annulé…).
 */
export function orderStatusFor(code: number | null): "shipped" | "delivered" | null {
  if (code === null) return null;
  if (code === 11 || code === 93) return "delivered";
  if ((code >= 3 && code <= 8) || [12, 22, 80, 91, 92].includes(code) || (code >= 62989 && code <= 62996)) return "shipped";
  return null;
}
/** Le colis a-t-il été annulé chez Sendcloud ? On peut alors refaire une étiquette. */
export const isCancelled = (code: number | null) => code === 1998 || code === 2000 || code === 1002;

/** Vérifie qu'un signal vient bien de Sendcloud : HMAC SHA-256 du corps brut, en hexadécimal, dans l'en-tête `Sendcloud-Signature`. */
export function verifyWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.SENDCLOUD_WEBHOOK_SECRET || process.env.SENDCLOUD_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(signature.trim());
  return a.length === b.length && timingSafeEqual(a, b);
}
