/** Port forfaitaire, 3 zones Europe. Calculé ici, envoyé au socle en shippingCents. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 6000;

export type ShippingZone = {
  id: "fr" | "eu-proche" | "eu-reste";
  label: string;
  rateCents: number;
  countries: string[];
  delayDays: [number, number];
};

export const SHIPPING_ZONES: ShippingZone[] = [
  { id: "fr", label: "France", rateCents: 590, countries: ["FR"], delayDays: [2, 4] },
  { id: "eu-proche", label: "Europe proche", rateCents: 890, countries: ["BE", "LU", "DE", "NL", "IT", "ES", "AT"], delayDays: [3, 6] },
  { id: "eu-reste", label: "Reste de l'Europe", rateCents: 1290, countries: ["PT", "IE", "SE", "DK", "FI", "PL", "GR", "CZ"], delayDays: [4, 8] },
];

export const SHIPPABLE_COUNTRY_CODES = SHIPPING_ZONES.flatMap((z) => z.countries);

export function zoneForCountry(code: string) {
  return SHIPPING_ZONES.find((z) => z.countries.includes(code));
}

export function shippingCentsFor(countryCode: string, subtotalAfterDiscountCents: number) {
  const zone = zoneForCountry(countryCode);
  if (!zone) return undefined;
  return { zone, cents: subtotalAfterDiscountCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : zone.rateCents };
}
