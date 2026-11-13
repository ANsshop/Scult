import Link from "next/link";

/** Contenu commun aux footers : mêmes liens, même mention obligatoire, quelle que soit la mise en forme. */
export const FOOTER_COLS = [
  { title: "Boutique", links: [["CRI · pré-workout", "/produits/cri"], ["La formule", "/#formule"], ["Panier", "/panier"]] },
  { title: "Aide", links: [["Méthode & sources", "/methode"], ["Questions fréquentes", "/faq"], ["Livraison & retours", "/livraison-retours"], ["Nous écrire", "mailto:hello@scult.eu"]] },
  { title: "Légal", links: [["CGV", "/cgv"], ["Mentions légales", "/mentions-legales"], ["Confidentialité", "/confidentialite"]] },
];

export const MENTION =
  "Complément alimentaire. Ne remplace pas une alimentation variée et équilibrée ni un mode de vie sain. Ne pas dépasser la dose journalière recommandée. Tenir hors de portée des jeunes enfants.";

export const SIGNATURE = "Rien ne se sculpte en silence.";
export const CTA = { label: "Commander CRI · 49 €", href: "/produits/cri" };

/** Les trois colonnes de liens. `muted` : la couleur des titres de colonne. */
export function FooterLinks({ muted, className = "" }: { muted: string; className?: string }) {
  return (
    <nav aria-label="Pied de page" className={`grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 ${className}`}>
      {FOOTER_COLS.map((c) => (
        <div key={c.title}>
          <p className={`label ${muted}`}>{c.title}</p>
          <ul className="mt-4 space-y-2.5">
            {c.links.map(([label, href]) => (
              <li key={href}><Link href={href} className="text-[0.95rem] underline-offset-4 hover:underline">{label}</Link></li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
