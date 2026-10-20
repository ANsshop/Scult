import Link from "next/link";
import { CartCount } from "@/components/cart/CartCount";
import { Wordmark } from "./Wordmark";

export const NAV = [
  { label: "Whey", href: "/produits/whey" },
  { label: "Créatine", href: "/produits/creatine" },
  { label: "Collagène", href: "/produits/collagene" },
  { label: "Trio", href: "/produits/trio" },
  { label: "Méthode", href: "/methode" },
  { label: "FAQ", href: "/faq" },
];

/** Bandeau fin, filet bas, labels mono : la ligne de métadonnées de l'affiche. */
export function Header({ onBlue = false }: { onBlue?: boolean }) {
  return (
    <header className={`sticky top-0 z-40 border-b ${onBlue ? "border-marble/25 bg-klein text-marble" : "bg-marble/90 text-ink backdrop-blur"}`}>
      <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between px-5 md:px-10">
        <Link href="/" aria-label="SCULT — accueil" className="flex items-center"><Wordmark className="h-4 w-auto" /></Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-6 md:flex">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="label hover:underline underline-offset-4">{n.label}</Link>)}
        </nav>
        <CartCount />
      </div>
    </header>
  );
}
