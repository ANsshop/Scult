"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartCount } from "@/components/cart/CartCount";
import { Wordmark } from "./Wordmark";

export const NAV = [
  { label: "CRI", href: "/produits/cri" },
  { label: "La formule", href: "/#formule" },
  { label: "Méthode", href: "/methode" },
  { label: "FAQ", href: "/faq" },
];

/**
 * Bandeau fin, labels mono : la ligne de métadonnées de l'affiche.
 * Transparent en haut de page, il prend son fond et son filet dès qu'on
 * défile. `onBlue` : posé par-dessus une section Klein (hero), texte marbre ;
 * un voile sombre en dégradé garde les labels lisibles sur la photo.
 */
export function Header({ onBlue = false }: { onBlue?: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const position = onBlue ? "fixed inset-x-0 top-0" : "sticky top-0";
  const tone = onBlue ? "text-marble" : "text-ink";
  // Le filet bas n'existe qu'une fois la page défilée. Sur bleu c'est une
  // ombre d'un pixel : la règle globale `* { border-color }` de globals.css
  // n'est pas dans une couche et écrase les utilitaires `border-*`.
  const surface = scrolled
    ? onBlue
      ? "bg-klein/85 backdrop-blur shadow-[0_1px_0_rgb(242_240_234/0.25)]"
      : "border-b bg-marble/90 backdrop-blur"
    : onBlue
      ? "bg-gradient-to-b from-ink/45 to-transparent"
      : "bg-transparent";

  return (
    <header className={`${position} z-40 transition-colors duration-300 ${tone} ${surface}`}>
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
