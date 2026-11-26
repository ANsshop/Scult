/** L'affichage des nombres et des dates dans l'admin. Partout les mêmes règles ; les jours sont ceux de Paris. */
const TZ = "Europe/Paris";

/** Centimes → « 1 284,50 € ». `round` : sans centimes, pour les grands totaux. */
export function eur(cents: number, round = false) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: round ? 0 : 2, maximumFractionDigits: round ? 0 : 2 }).format(cents / 100);
}
export const num = (n: number, digits = 0) => new Intl.NumberFormat("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
/** Un taux : `ratio` entre 0 et 1 → « 2,4 % ». */
export const pct = (ratio: number, digits = 1) => `${num(ratio * 100, digits)} %`;
/** Part de `part` dans `whole`, ou « — » quand il n'y a rien à diviser. */
export const share = (part: number, whole: number, digits = 1) => (whole > 0 ? pct(part / whole, digits) : "—");

export const dateTime = (d: Date) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(d);
export const dateLong = (d: Date) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" }).format(d);
export const dateShort = (d: Date) => new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric", month: "short", year: "2-digit" }).format(d);
/** Pour un champ <input type="datetime-local"> : l'heure de Paris, sans fuseau. */
export function inputDateTime(d: Date | null) {
  if (!d) return "";
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** « il y a 3 h », « il y a 2 j » : l'âge de ce qui attend. */
export function ago(d: Date, now = new Date()) {
  const min = Math.max(0, Math.round((now.getTime() - d.getTime()) / 60_000));
  if (min < 60) return `il y a ${min} min`;
  if (min < 48 * 60) return `il y a ${Math.round(min / 60)} h`;
  return `il y a ${Math.round(min / 1440)} j`;
}
/** Une durée en heures → « 19 h » ou « 2,4 j ». */
export const hours = (h: number) => (h < 48 ? `${num(h)} h` : `${num(h / 24, 1)} j`);

const COUNTRIES: Record<string, string> = { FR: "France", BE: "Belgique", LU: "Luxembourg", DE: "Allemagne", NL: "Pays-Bas", IT: "Italie", ES: "Espagne", AT: "Autriche", PT: "Portugal", IE: "Irlande", SE: "Suède", DK: "Danemark", FI: "Finlande", PL: "Pologne", GR: "Grèce", CZ: "Tchéquie" };
export const country = (code: string | null) => (code ? COUNTRIES[code] ?? code : "—");

/** L'inverse de inputDateTime : « 2026-11-26T10:00 », heure de Paris → l'instant. `null` si le champ est vide ou mal formé. */
export function fromInputDateTime(value: string | null | undefined): Date | null {
  const m = value?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const wall = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const offset = (t: number) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(t)).map((x) => [x.type, Number(x.value)]));
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(t / 1000) * 1000;
  };
  return new Date(wall - offset(wall - offset(wall)));
}

/** « 49,90 » ou « 49.9 » → 4990 centimes ; `null` si ce n'est pas un montant. */
export function toCents(value: string | null | undefined): number | null {
  const text = (value ?? "").trim().replace(/\s/g, "").replace(",", ".").replace("€", "");
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  return Math.round(parseFloat(text) * 100);
}
/** Centimes → « 49,90 », pour remplir un champ. */
export const centsInput = (cents: number | null) => (cents === null ? "" : (cents / 100).toFixed(2).replace(".", ","));
