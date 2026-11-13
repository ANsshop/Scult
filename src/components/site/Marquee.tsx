"use client";

import { useEffect, useRef } from "react";

/**
 * Bandeau sur deux lignes, sous le hero : la première en lettres pleines, la
 * seconde au contour. Il ne défile pas tout seul : il glisse avec le
 * défilement de la page — la ligne 1 part à gauche quand on descend, la
 * ligne 2 à droite, et l'inverse quand on remonte. Les points rouges
 * reprennent la pastille du pot. Tout ce qui est écrit ici est déjà vrai
 * ailleurs sur le site (fiche, FAQ, livraison) : rien d'inventé.
 */
const ROW_1 = ["Dosages écrits sur le pot", "Lot numéroté", "Fabriqué dans l'UE", "30 doses", "Fruits rouges"];
const ROW_2 = ["Livraison offerte dès 60 €", "Europe en 2 à 8 jours", "Retour 14 jours", "Paiement Stripe"];

/** Pixels de glissement par pixel de page défilé. */
const SPEED = 0.55;

function Row({ items, outline = false, rowRef }: { items: string[]; outline?: boolean; rowRef: React.RefObject<HTMLDivElement | null> }) {
  // Quatre copies bout à bout : assez de texte pour glisser sans jamais montrer le vide.
  const copy = (hidden: boolean) => (
    <ul aria-hidden={hidden} className="flex shrink-0 items-center">
      {items.map((item) => (
        <li key={item} className="flex items-center">
          <span className={outline ? "text-outline" : ""}>{item}</span>
          <span aria-hidden className="mx-[0.45em] inline-block h-[0.17em] w-[0.17em] shrink-0 rounded-full bg-ruby" />
        </li>
      ))}
    </ul>
  );
  return (
    <div ref={rowRef} className="display flex w-max whitespace-nowrap text-[clamp(2.25rem,5.4vw,5rem)] leading-none will-change-transform">
      {copy(false)}
      {copy(true)}
      {copy(true)}
      {copy(true)}
    </div>
  );
}

export function Marquee() {
  const row1 = useRef<HTMLDivElement>(null);
  const row2 = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // La ligne 2 part décalée d'une demi-largeur : elle a ainsi du texte à gauche pour glisser vers la droite.
    const apply = (y: number) => {
      if (row1.current) row1.current.style.transform = `translate3d(${-y * SPEED}px, 0, 0)`;
      if (row2.current) row2.current.style.transform = `translate3d(calc(-50% + ${y * SPEED}px), 0, 0)`;
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      apply(0);
      return;
    }
    // Le glissement rattrape le défilement en douceur plutôt que par à-coups de molette.
    let target = window.scrollY;
    let current = target;
    let frame = 0;
    apply(current);
    const tick = () => {
      current += (target - current) * 0.14;
      if (Math.abs(target - current) < 0.5) current = target;
      apply(current);
      frame = current === target ? 0 : requestAnimationFrame(tick);
    };
    const onScroll = () => {
      target = window.scrollY;
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section aria-label="En bref" className="overflow-hidden border-b py-6 md:py-9">
      <Row items={ROW_1} rowRef={row1} />
      <div className="mt-2 md:mt-3">
        <Row items={ROW_2} outline rowRef={row2} />
      </div>
    </section>
  );
}
