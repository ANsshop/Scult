import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Wordmark } from "./Wordmark";

const COLS = [
  { title: "Boutique", links: [["CRI · pré-workout", "/produits/cri"], ["La formule", "/#formule"], ["Panier", "/panier"]] },
  { title: "Aide", links: [["Performance & sources", "/methode"], ["Questions fréquentes", "/faq"], ["Livraison & retours", "/livraison-retours"], ["Nous écrire", "mailto:hello@scult.eu"]] },
  { title: "Légal", links: [["CGV", "/cgv"], ["Mentions légales", "/mentions-legales"], ["Confidentialité", "/confidentialite"]] },
];

/**
 * Footer : bleu uni, et le pot en très grand en arrière-plan, penché, coupé
 * par le bord — la même pièce que la carte produit, à l'échelle du décor.
 * Ordinateur : le texte tient dans la moitié gauche. Mobile : le pot monte
 * en haut à droite, à côté de la signature et du bouton, pour que l'essentiel
 * tienne dans le premier écran du footer ; les liens se rangent sur deux
 * colonnes et le footer ne garde pas de vide en bas.
 */
export function Footer() {
  return (
    <footer className="relative mt-auto overflow-hidden bg-klein text-marble">
      {/* Grain léger, pour que l'aplat ne soit pas plat */}
      <div aria-hidden className="absolute inset-0 opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: "url(/noise.svg)", backgroundSize: "180px" }} />
      {/* Le pot, en fond */}
      <div aria-hidden className="pointer-events-none absolute right-[-17vw] top-10 w-[62vw] md:right-[-2%] md:top-[7%] md:w-[min(47vw,44rem)]">
        <Image src="/home/pot-detoure.webp" alt="" width={900} height={1096} sizes="(min-width: 768px) 47vw, 62vw" className="flash-shadow h-auto w-full rotate-[8deg]" />
      </div>

      <div className="relative mx-auto max-w-[1360px] px-5 pb-8 pt-14 md:px-10 md:pb-10 md:pt-24">
        <div className="md:max-w-[50%]">
          {/* Sur mobile, ce bloc laisse la place du pot à droite et fait sa hauteur */}
          <div className="min-h-[70vw] pr-[42vw] md:min-h-0 md:pr-0">
            <Link href="/" aria-label="SCULT — accueil" className="inline-block"><Wordmark className="h-[clamp(2rem,4.8vw,4.25rem)] w-auto" /></Link>
            <p className="display mt-6 text-[clamp(1.35rem,2.4vw,2.25rem)] md:mt-8">Rien ne se sculpte en silence.</p>
            <ButtonLink href="/produits/cri" variant="marble" className="mt-6 !px-5 md:mt-7 md:!px-7">Commander · 49 €</ButtonLink>
          </div>

          <nav aria-label="Pied de page" className="mt-8 grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3 md:mt-16">
            {COLS.map((c) => (
              <div key={c.title} className={c.title === "Aide" ? "row-span-2 sm:row-span-1" : ""}>
                <p className="label text-marble/70">{c.title}</p>
                <ul className="mt-3 space-y-3 md:mt-4 md:space-y-2.5">
                  {c.links.map(([label, href]) => (
                    <li key={href}><Link href={href} className="text-[0.95rem] underline-offset-4 hover:underline">{label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          <div className="mt-10 border-t border-marble/25 pt-6 md:mt-16">
            <p className="max-w-xl text-[0.8rem] leading-relaxed text-marble/85">
              Complément alimentaire. Ne remplace pas une alimentation variée et équilibrée ni un mode de vie sain. Ne pas dépasser la dose journalière recommandée. Tenir hors de portée des jeunes enfants.
            </p>
            <p className="label mt-5 text-marble/70">© {new Date().getFullYear()} SCULT · Fabriqué dans l&apos;UE<span className="hidden md:inline"> · Lot 001</span></p>
          </div>
        </div>
      </div>
    </footer>
  );
}
