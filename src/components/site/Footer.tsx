import Link from "next/link";
import { Corners } from "./Corners";

const COLS = [
  { title: "Boutique", links: [["Whey isolate", "/produits/whey"], ["Créatine", "/produits/creatine"], ["Collagène marin", "/produits/collagene"], ["Trio Sculpt", "/produits/trio"]] },
  { title: "Aide", links: [["Méthode & sources", "/methode"], ["Questions fréquentes", "/faq"], ["Livraison & retours", "/livraison-retours"], ["Nous écrire", "mailto:hello@scult.eu"]] },
  { title: "Légal", links: [["CGV", "/cgv"], ["Mentions légales", "/mentions-legales"], ["Confidentialité", "/confidentialite"]] },
];

/** Le wordmark géant comme une inscription gravée, sur Klein. */
export function Footer() {
  return (
    <footer className="grain relative mt-auto bg-klein text-marble">
      <Corners tl="SCULT · EU" tr="Lot 001" bl="Fabriqué dans l'UE" br={`© ${new Date().getFullYear()}`} />
      <div className="mx-auto max-w-[1360px] px-5 pb-16 pt-24 md:px-10 md:pt-32">
        <p aria-hidden className="display select-none text-[clamp(5rem,22vw,20rem)]">Scult</p>
        <div className="mt-14 grid grid-cols-2 gap-10 border-t border-marble/25 pt-10 md:grid-cols-4">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="label text-marble/70">{c.title}</p>
              <ul className="mt-4 space-y-2.5">
                {c.links.map(([label, href]) => <li key={href}><Link href={href} className="text-[0.95rem] hover:underline underline-offset-4">{label}</Link></li>)}
              </ul>
            </div>
          ))}
          <div>
            <p className="label text-marble/70">Mention</p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-marble/85">
              Complément alimentaire. Ne remplace pas une alimentation variée et équilibrée ni un mode de vie sain. Ne pas dépasser la dose journalière recommandée. Tenir hors de portée des jeunes enfants.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
