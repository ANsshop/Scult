import { FREE_SHIPPING_THRESHOLD_CENTS } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";

const ITEMS = [
  ["Livraison Europe", `2–8 jours ouvrés. Offerte dès ${formatPrice(FREE_SHIPPING_THRESHOLD_CENTS)}.`],
  ["Pot scellé", "Pastille rouge intacte = jamais ouvert. Retour 14 jours tant qu'elle l'est."],
  ["Paiement", "Stripe — CB, Apple Pay, Google Pay. Aucune donnée bancaire chez nous."],
];

export function Reassurance({ className = "" }: { className?: string }) {
  return (
    <ul aria-label="Garanties" className={`space-y-3 ${className}`}>
      {ITEMS.map(([t, b]) => (
        <li key={t} className="flex gap-3 text-sm">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-ruby" />
          <p><strong className="font-medium">{t}.</strong> <span className="text-stone">{b}</span></p>
        </li>
      ))}
    </ul>
  );
}
