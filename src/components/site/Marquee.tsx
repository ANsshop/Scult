/**
 * Bandeau défilant sur deux lignes, sous le hero : la première en lettres
 * pleines, la seconde au contour, qui défilent en sens opposés. Les points
 * rouges reprennent la pastille du pot. Tout ce qui est écrit ici est déjà
 * vrai ailleurs sur le site (fiche, FAQ, livraison) : rien d'inventé.
 */
const ROW_1 = ["Dosages écrits sur le pot", "Lot numéroté", "Fabriqué dans l'UE", "30 doses", "Fruits rouges"];
const ROW_2 = ["Livraison offerte dès 60 €", "Europe en 2 à 8 jours", "Retour 14 jours", "Paiement Stripe"];

function Row({ items, outline = false, reverse = false }: { items: string[]; outline?: boolean; reverse?: boolean }) {
  // Deux copies bout à bout : la translation de −50 % boucle sans raccord.
  const copy = (hidden: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {items.map((item) => (
        <li key={item} className="flex items-center">
          <span className={outline ? "text-outline" : ""}>{item}</span>
          <span aria-hidden className="mx-[0.45em] inline-block h-[0.17em] w-[0.17em] shrink-0 rounded-full bg-ruby" />
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`marquee-row display flex w-max whitespace-nowrap text-[clamp(2.25rem,5.4vw,5rem)] leading-none ${reverse ? "marquee-reverse" : ""}`}>
      {copy(false)}
      {copy(true)}
      {copy(true)}
      {copy(true)}
    </div>
  );
}

export function Marquee() {
  return (
    <section aria-label="En bref" className="overflow-hidden border-b py-6 md:py-9">
      <Row items={ROW_1} />
      <div className="mt-2 md:mt-3">
        <Row items={ROW_2} outline reverse />
      </div>
    </section>
  );
}
