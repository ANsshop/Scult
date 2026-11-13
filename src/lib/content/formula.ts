import { CLAIMS } from "./methode";
import { PRODUCT_INFO } from "./product-info";

/**
 * Section « La formule » de l'accueil. Les quantités viennent de
 * PRODUCT_INFO (même source que la fiche produit et le dos du pot) : rien
 * n'est ressaisi ici. Ce fichier ne porte que ce qu'on a le droit d'en dire —
 * une allégation autorisée (lib/content/methode.ts) ou une précaution tirée
 * de l'étiquetage, ou ce que l'ingrédient est. Jamais ce qu'il « fait ».
 */
export const CRI_DOSES = 30; // pot de 690 g, dose de 23 g

const creatine = CLAIMS.find((c) => c.id === "creatine");

const NOTES: Record<string, { text: string; claim?: boolean }> = {
  "L-citrulline": { text: "Le premier ingrédient de la liste : c'est lui qui pèse le plus dans la dose." },
  "Bêta-alanine": { text: "Peut provoquer des picotements passagers. La première semaine, commencez par une demi-dose." },
  "Créatine": {
    text: `« ${creatine?.claim} » 3 g, c'est la quantité journalière visée par l'allégation.`,
    claim: true,
  },
  "L-tyrosine": { text: "Acide aminé." },
  "Taurine": { text: "Naturellement présente dans la viande et le poisson." },
  "L-théanine": { text: "Acide aminé naturellement présent dans le thé." },
  "Caféine": { text: "Une dose par jour maximum, sans autre source de caféine. Déconseillé aux enfants et aux femmes enceintes." },
};

/** Les lignes mises en avant, dans l'ordre du tableau ; le reste passe en liste compacte. */
const MAIN = ["L-citrulline", "Bêta-alanine", "Créatine", "L-tyrosine", "Taurine", "L-théanine", "Caféine"];

/** « 8 000 mg » → { value: "8", unit: "g" } ; « 200 mg » et « 1,4 mg » restent en mg. */
export function splitAmount(amount: string): { value: string; unit: string } {
  const m = amount.replace(/[\s  ]/g, "").match(/^([\d,]+)(mg|g)$/);
  if (!m) return { value: amount, unit: "" };
  const n = Number(m[1].replace(",", "."));
  if (m[2] === "mg" && n >= 1000 && n % 100 === 0) return { value: String(n / 1000).replace(".", ","), unit: "g" };
  return { value: m[1], unit: m[2] };
}

export function getFormula(slug: string) {
  const info = PRODUCT_INFO[slug];
  if (!info) return null;
  const main = MAIN.flatMap((name) => {
    const line = info.nutrition.find((n) => n.name === name);
    return line ? [{ ...line, ...splitAmount(line.amount), note: NOTES[name]?.text ?? null, claim: NOTES[name]?.claim ?? false }] : [];
  });
  const rest = info.nutrition.filter((n) => !MAIN.includes(n.name));
  return { main, rest, caffeineWarning: info.caffeineWarning ?? null };
}
