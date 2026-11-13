"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AddToCart } from "@/components/cart/AddToCart";
import type { Product } from "@/lib/catalog/queries";
import { formatPrice } from "@/lib/utils";
import { Pot3D } from "./Pot3D";

type Line = { name: string; amount: string };

/** Part du défilement consacrée au tour du pot ; le reste montre l'achat, pot de face. */
const TURN = 0.82;

/**
 * Section 2 de l'accueil : le pot au milieu de l'écran, qui fait un tour
 * complet pendant qu'on défile.
 *
 * La section est plus haute que l'écran (250 svh) et son contenu reste collé :
 * la position dans ce défilement donne l'angle du pot. Les dosages
 * apparaissent un à un à mesure qu'il tourne ; à la fin du tour le pot revient
 * de face et le bouton d'achat se dévoile, puis reste. Le prix (la pastille)
 * est visible dès le début. Sur mobile, un seul dosage à la fois sous le pot,
 * et le bouton d'achat reste en bas d'écran pendant tout le tour.
 * En mouvement réduit : rien n'est collé ni animé, tout est affiché d'emblée.
 */
export function OfferScroll({ product, lines, doses, caffeineWarning }: { product: Product; lines: Line[]; doses: number; caffeineWarning: string | null }) {
  const wrap = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLElement | null>(null);
  const [step, setStep] = useState(0);     // nombre de dosages dévoilés
  const [end, setEnd] = useState(false);   // le tour est fini : l'achat se montre
  const [calm, setCalm] = useState(false);
  const perDose = formatPrice(Math.round(product.priceCents / doses));
  const n = lines.length;

  const update = useCallback(() => {
    const el = wrap.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
    const turn = Math.min(1, p / TURN);
    if (viewer.current) (viewer.current as HTMLElement & { cameraOrbit: string }).cameraOrbit = `${(turn * 360).toFixed(1)}deg 84deg 120%`;
    setStep(Math.min(n, Math.floor(turn * (n + 1))));
    setEnd(p >= TURN - 0.02);
  }, [n]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCalm(true);
      setStep(n);
      setEnd(true);
      return;
    }
    let frame = 0;
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); });
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [n, update]);

  const onReady = useCallback((el: HTMLElement) => { viewer.current = el; update(); }, [update]);

  const half = Math.ceil(n / 2);
  const column = (items: Line[], offset: number, align: "right" | "left") => (
    <ol className={`hidden flex-col gap-7 md:flex ${align === "right" ? "items-end text-right" : "items-start pl-10 text-left"}`}>
      {items.map((line, i) => {
        const on = step > offset + i;
        return (
          <li key={line.name} className={`transition-all duration-500 ease-(--ease-scult) ${on ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}>
            <p className="display text-[clamp(2rem,3.4vw,3.25rem)] leading-none text-klein tabular-nums">{line.amount}</p>
            <p className="display mt-1.5 text-[1.05rem] leading-none">{line.name}</p>
          </li>
        );
      })}
    </ol>
  );
  const current = step > 0 ? lines[step - 1] : null;

  return (
    <section id="formule" className="scroll-mt-14 border-b bg-white">
      <div ref={wrap} className={calm ? "" : "h-[250svh]"}>
        <div className={`px-3 pb-3 pt-[4.25rem] md:px-5 md:pb-5 ${calm ? "" : "sticky top-0 h-svh"}`}>
          <div className="relative flex h-full flex-col overflow-hidden rounded-card bg-white px-5 py-5 md:px-10 md:py-7">
            <p className="label grid grid-cols-2 text-stone md:grid-cols-3">
              <span>CRI · Lot 001</span>
              <span className="hidden text-center md:block">La formule · par dose de 23 g</span>
              <span className="text-right">690 g · {doses} doses</span>
            </p>

            {/* La scène : le pot au centre, les dosages de part et d'autre */}
            <div className="grid flex-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-14">
              {column(lines.slice(0, half), 0, "right")}
              <div className="relative mx-auto w-[min(58vw,36svh)] md:w-[min(30vw,40svh)]">
                <Pot3D
                  alt="Le pot SCULT CRI : le mot CRI en bleu sur le visage d'une statue qui hurle, strap rouge autour du couvercle"
                  sizes="(min-width: 768px) 30vw, 58vw"
                  interactive={false}
                  onReady={onReady}
                />
                {/* La pastille : le seul rouge, et c'est le prix */}
                <p className="pointer-events-none absolute -right-[20%] top-[4%] flex h-[5.75rem] w-[5.75rem] rotate-[9deg] flex-col items-center justify-center rounded-full bg-ruby text-white outline outline-1 -outline-offset-[5px] outline-white/45 md:h-[7.25rem] md:w-[7.25rem]">
                  <span className="display text-[1.75rem] tabular-nums md:text-[2.2rem]">{formatPrice(product.priceCents)}</span>
                  <span className="label mt-1 !text-[0.6rem]">{doses} doses</span>
                </p>
              </div>
              {column(lines.slice(half), half, "left")}
            </div>

            {/* Mobile : un dosage à la fois, sous le pot */}
            <div className="flex h-[4.5rem] flex-col items-center justify-center text-center md:hidden" aria-live="polite">
              {current ? (
                <>
                  <p key={current.name} className="display text-[2.25rem] leading-none text-klein tabular-nums">{current.amount}</p>
                  <p className="display mt-1.5 text-[1rem] leading-none">{current.name}</p>
                </>
              ) : (
                <p className="label text-stone">La formule · faites défiler ↓</p>
              )}
            </div>

            {/* L'achat : toujours là sur mobile, dévoilé à la fin du tour sur ordinateur */}
            <div className={`mt-3 transition-all duration-700 ease-(--ease-scult) md:mt-0 ${end ? "md:translate-y-0 md:opacity-100" : "md:pointer-events-none md:translate-y-4 md:opacity-0"}`}>
              <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center md:justify-center md:gap-8">
                <div className="hidden md:block">
                  <p className="display text-[2.25rem] leading-none">{product.name}</p>
                  <p className="label mt-1.5 text-stone">Pré-workout · fruits rouges</p>
                </div>
                <AddToCart product={product} className="!h-14 w-full md:w-[22rem]" />
                <p className="label hidden text-stone md:block">
                  {perDose} la dose<br />
                  <Link href={`/produits/${product.slug}`} className="underline underline-offset-4 hover:text-klein">Voir la fiche →</Link>
                </p>
              </div>
              <p className="label mt-3 text-center leading-relaxed text-stone">
                <span className="md:hidden">{perDose} la dose · </span>Livraison Europe 2–8 jours · Retour 14 jours
              </p>
              {caffeineWarning && <p className="mt-1.5 text-center text-[0.75rem] leading-snug text-stone">{caffeineWarning}</p>}
            </div>

            {/* Ordinateur : l'invitation à défiler, tant que rien n'est dévoilé */}
            <p aria-hidden className={`label pointer-events-none absolute inset-x-0 bottom-7 hidden text-center text-stone transition-opacity duration-500 md:block ${step === 0 && !end ? "opacity-100" : "opacity-0"}`}>
              Faites défiler ↓
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
