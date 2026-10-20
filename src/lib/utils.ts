import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Centimes → « 39 € » / « 5,90 € ». La seule conversion en euros du site. */
export function formatPrice(cents: number, currency = "EUR", locale = "fr-FR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** TVA calculée comme le socle : assiette = lignes + port − remise, arrondi à l'entier. */
export function vatCents(baseCents: number, vatRate: number) {
  return Math.round((baseCents * vatRate) / 100);
}
