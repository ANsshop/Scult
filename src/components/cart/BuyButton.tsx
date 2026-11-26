"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CartLine } from "@/lib/types";
import { getFlavour } from "@/lib/content/flavours";
import { AddToCart } from "./AddToCart";

/** Hauteur de l'en-tête collant (`--entete`, 5,5 rem) : un bouton passé dessous n'est plus à l'écran. */
const HEADER_PX = 88;

/**
 * Le bouton d'achat de la fiche produit, et son double collé en bas de
 * l'écran : dès que le bouton de la page n'est plus visible (avant lui sur
 * téléphone, où la galerie passe d'abord ; après lui quand on lit la suite),
 * une barre fixe le remplace, avec le nom, le choix en cours et le même
 * bouton. Il y a donc toujours un bouton d'achat à l'écran, jamais deux.
 *
 * La barre est montée dans <body> : collée à l'écran quel que soit le bloc qui
 * contient le bouton, et au-dessus des sections suivantes.
 *
 * `title`, `detail` : ce que la barre écrit à côté du bouton (« CRI », « Pack de 2 »).
 */
export function BuyButton({ item, inStock = true, preorderEta = null, title, detail, className = "" }: { item: CartLine; inStock?: boolean; preorderEta?: string | null; title: string; detail?: string; className?: string }) {
  const anchor = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState<boolean | null>(null); // null : pas encore mesuré

  useEffect(() => {
    const el = anchor.current;
    if (!el) return;
    // Un bouton à moitié coupé par le bord de l'écran ne compte pas comme visible.
    const io = new IntersectionObserver(([entry]) => setAway(entry.intersectionRatio < 0.75), { rootMargin: `-${HEADER_PX}px 0px 0px 0px`, threshold: [0, 0.75] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={anchor} className={className}>
        <AddToCart key={item.sku} item={item} inStock={inStock} preorderEta={preorderEta} className="!h-14 w-full" />
      </div>
      {away !== null && createPortal(
        <div
          aria-hidden={!away}
          inert={!away}
          data-barre-achat
          className={`sombre fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-fond/95 backdrop-blur transition-transform duration-300 ease-(--ease-scult) ${away ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="mx-auto flex max-w-[1360px] items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:gap-5 md:px-10">
            <Image src={getFlavour(item.flavours?.[0]).mini} alt="" width={200} height={244} className="h-11 w-auto shrink-0" />
            <p className="min-w-0 flex-1">
              <span className="display block truncate text-[1.2rem] leading-none md:text-[1.4rem]">{title}</span>
              {detail && <span className="label mt-1.5 block truncate !text-[0.65rem] text-doux">{detail}</span>}
            </p>
            <AddToCart key={item.sku} item={item} inStock={inStock} preorderEta={preorderEta} className="!h-12 shrink-0 !px-5 md:w-80" />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
