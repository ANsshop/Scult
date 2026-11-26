"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CartCount } from "@/components/cart/CartCount";
import { ANNONCE, NAV } from "@/lib/content/site";
import { Wordmark } from "./Wordmark";

/**
 * L'en-tête : la bande d'annonce qui défile, puis la navigation
 * (SCULT · Pre-workout · Pochons · La formule · Le bouffon · Panier). Hauteur totale :
 * `--entete` (globals.css).
 * Sur ordinateur, les liens sont en ligne. Sur mobile, il reste le logo, le
 * panier et un bouton « Menu » qui déplie les liens sous la barre.
 *
 * `overlay` : posée par-dessus un hero plein écran (l'accueil).
 * Elle est alors fixe et transparente en haut de page, et prend son fond dès
 * qu'on défile. Sinon elle est collante, sur le fond de la page.
 */
export function Header({ overlay = false }: { overlay?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const solid = scrolled || open || !overlay;
  return (
    <header className={`${overlay ? "fixed inset-x-0 top-0" : "sticky top-0"} entete sombre z-40 text-texte transition-colors duration-300 ${solid ? "bg-fond/90 shadow-[0_1px_0_rgb(242_240_234/0.16)] backdrop-blur" : "bg-transparent"}`}>
      {/* La bande d'annonce : le même texte répété, qui glisse en continu (à l'arrêt en mouvement réduit) */}
      <Link href={ANNONCE.href} aria-label={ANNONCE.text} className="block h-8 overflow-hidden bg-rose text-noir">
        <span aria-hidden className="annonce-piste flex h-full w-max items-center whitespace-nowrap">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className="label flex items-center font-bold">
              {ANNONCE.text}<span className="mx-5 inline-block h-1.5 w-1.5 rounded-full bg-noir" />
            </span>
          ))}
        </span>
      </Link>
      <div className="mx-auto flex h-14 max-w-[1360px] items-center justify-between gap-4 px-5 md:px-10">
        <Link href="/" aria-label="SCULT — accueil" className="flex items-center" onClick={() => setOpen(false)}><Wordmark className="h-[1.15rem] w-auto" /></Link>
        <nav aria-label="Navigation principale" className="hidden items-center gap-8 md:flex">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="label hover:text-rose">{n.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <CartCount />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="menu-mobile"
            className="label flex h-10 items-center gap-2 rounded-full border border-texte/30 px-3.5 md:hidden"
          >
            <span aria-hidden className="flex w-4 flex-col gap-[3px]">
              <span className={`h-px bg-current transition-transform ${open ? "translate-y-[4px] rotate-45" : ""}`} />
              <span className={`h-px bg-current ${open ? "opacity-0" : ""}`} />
              <span className={`h-px bg-current transition-transform ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
            </span>
            {open ? "Fermer" : "Menu"}
          </button>
        </div>
      </div>
      <nav id="menu-mobile" aria-label="Menu" hidden={!open} className="border-t bg-fond px-5 pb-6 pt-2 md:hidden">
        <ul className="divide-y">
          {NAV.map((n) => (
            <li key={n.href}>
              <Link href={n.href} onClick={() => setOpen(false)} className="display flex items-center justify-between py-4 text-[1.75rem] hover:text-rose">
                {n.label}<span aria-hidden className="text-rose">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
