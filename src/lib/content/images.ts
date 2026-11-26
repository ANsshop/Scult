import MANIFEST from "./bouffon-images.json";

/**
 * Les visuels de la DA « bouffon » (public/bouffon/), produits par
 * scripts/bouffon-images.mjs en AVIF et WebP à plusieurs largeurs. Le
 * manifeste donne, pour chaque visuel, ses dimensions d'origine et les
 * largeurs disponibles : rien n'est écrit en dur dans les composants.
 */
export type ImageName = keyof typeof MANIFEST;
type Format = "avif" | "webp";

const entry = (name: ImageName) => MANIFEST[name];

/** L'adresse d'un visuel à la largeur disponible la plus proche au-dessus de `width`. */
export function imageUrl(name: ImageName, width: number, format: Format = "webp"): string {
  const { widths } = entry(name);
  const w = widths.find((x) => x >= width) ?? widths[widths.length - 1];
  return `/bouffon/${name}-${w}.${format}`;
}

/** Le `srcset` complet d'un visuel dans un format. */
export function imageSrcSet(name: ImageName, format: Format): string {
  return entry(name).widths.map((w) => `/bouffon/${name}-${w}.${format} ${w}w`).join(", ");
}

/** Largeur et hauteur d'origine : les attributs `width` / `height` qui réservent la place. */
export function imageSize(name: ImageName): { width: number; height: number } {
  const { width, height } = entry(name);
  return { width, height };
}

/** La hauteur d'un visuel à une largeur donnée, pour les images décrites au catalogue. */
export function imageAt(name: ImageName, width: number, alt: string) {
  const { width: w, height: h } = entry(name);
  return { url: imageUrl(name, width), alt, width, height: Math.round((width * h) / w) };
}
