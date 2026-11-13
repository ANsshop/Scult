import { PRODUCT_INFO } from "./product-info";

/**
 * Section « La formule » de l'accueil. Les quantités viennent de
 * PRODUCT_INFO (même source que la fiche produit et le dos du pot) : rien
 * n'est ressaisi ici.
 */
export const CRI_DOSES = 30; // pot de 690 g, dose de 23 g

/** Les actifs listés un par un, dans l'ordre du tableau ; le reste tient en une phrase. */
const MAIN = ["L-citrulline", "Bêta-alanine", "Créatine", "L-tyrosine", "Taurine", "L-théanine", "Caféine"];

/** « 8 000 mg » → « 8 g » ; « 200 mg » et « 1,4 mg » restent tels quels. */
export function shortAmount(amount: string): string {
  const m = amount.replace(/[\s  ]/g, "").match(/^([\d,]+)(mg|g)$/);
  if (!m) return amount;
  const n = Number(m[1].replace(",", "."));
  if (m[2] === "mg" && n >= 1000 && n % 100 === 0) return `${String(n / 1000).replace(".", ",")} g`;
  return `${m[1]} ${m[2]}`;
}

export function getFormula(slug: string) {
  const info = PRODUCT_INFO[slug];
  if (!info) return null;
  const main = MAIN.flatMap((name) => {
    const line = info.nutrition.find((n) => n.name === name);
    return line ? [{ name, amount: shortAmount(line.amount) }] : [];
  });
  const rest = info.nutrition.filter((n) => !MAIN.includes(n.name));
  return { main, rest, caffeineWarning: info.caffeineWarning ?? null };
}
