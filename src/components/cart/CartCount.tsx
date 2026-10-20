"use client";

import { useCart } from "./CartProvider";

export function CartCount({ className = "" }: { className?: string }) {
  const { count, openCart } = useCart();
  return (
    <button type="button" onClick={openCart} className={`label flex items-center gap-2 ${className}`} aria-label={`Panier, ${count} article(s)`}>
      Panier <span className="inline-flex h-5 min-w-5 items-center justify-center bg-ruby px-1 text-[0.65rem] text-white tabular-nums">{count}</span>
    </button>
  );
}
