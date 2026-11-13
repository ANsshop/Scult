"use client";

import { useCart } from "./CartProvider";

/**
 * Le bouton panier de la barre de navigation : une pilule avec un sac, le mot
 * « Panier » (masqué sur très petit écran) et le nombre d'articles. Il prend
 * la couleur du texte autour de lui (clair sur bleu, encre sur clair) ; la
 * pastille passe au rouge dès qu'il y a un article. `data-cart-badge` est la
 * cible de l'animation d'ajout au panier (AddToCart).
 */
export function CartCount({ className = "" }: { className?: string }) {
  const { count, openCart } = useCart();
  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Panier, ${count} article(s)`}
      className={`btn-shine label group flex h-10 items-center gap-2 rounded-full bg-[color-mix(in_srgb,currentColor_13%,transparent)] pl-3.5 pr-1.5 transition-colors hover:bg-[color-mix(in_srgb,currentColor_24%,transparent)] ${className}`}
    >
      <svg aria-hidden viewBox="0 0 20 20" className="h-[1.05rem] w-[1.05rem] transition-transform duration-300 group-hover:-rotate-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.2 7h11.6l-.9 9.2a1.5 1.5 0 0 1-1.5 1.3H6.6a1.5 1.5 0 0 1-1.5-1.3L4.2 7Z" />
        <path d="M7.2 7V5.8a2.8 2.8 0 0 1 5.6 0V7" />
      </svg>
      <span className="hidden sm:inline">Panier</span>
      <span
        data-cart-badge
        className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-[0.72rem] tabular-nums transition-colors ${count > 0 ? "bg-ruby text-white" : "bg-[color-mix(in_srgb,currentColor_18%,transparent)]"}`}
      >
        {count}
      </span>
    </button>
  );
}
