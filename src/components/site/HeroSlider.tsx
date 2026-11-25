"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export type HeroSlide = {
  id: string;
  /** Ce que montre la slide, pour les lecteurs d'écran (« Slide 2 : l'offre »). */
  label: string;
  /** Visuel clair : l'en-tête garde son fond noir, les commandes passent en noir sur blanc. */
  clair?: boolean;
  node: ReactNode;
};

/** Temps d'affichage d'une slide avant de passer seule à la suivante. */
const DELAY = 6500;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Le slider du hero de l'accueil. Les slides sont rendues par le serveur
 * (Hero.tsx) : ce composant ne fait que les empiler, en montrer une, et poser
 * les commandes. Sans JavaScript, la première slide — le hero dark, avec le
 * h1 — reste affichée.
 *
 * Mobile : la scène fait un écran (plus sur un téléphone très court : il faut
 * la place du pot de l'affiche, 130 % de la largeur, et du bouton) ; on change de slide en glissant le doigt ou
 * aux deux traits du bas. Sous la scène, `pied` (le texte du hero) puis la
 * mention légale. Ordinateur : flèches et compteur en bas à droite, la mention
 * en bas à gauche.
 *
 * Défilement automatique : toutes les 6,5 s, jamais pendant l'intro rose, ni
 * au survol, ni quand un élément du hero a le focus, ni une fois la page
 * défilée. Il s'arrête pour de bon au premier geste (flèche, trait,
 * glissement, bouton pause) et n'existe pas en mouvement réduit.
 */
export function HeroSlider({ slides, pied, legal }: { slides: HeroSlide[]; pied: ReactNode; legal: string }) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const hold = useRef(false);
  const since = useRef(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const clair = Boolean(slides[index].clair);

  const go = (i: number) => {
    setAuto(false);
    setIndex(((i % count) + count) % count);
  };

  useEffect(() => {
    since.current = performance.now();
  }, [index]);

  useEffect(() => {
    if (!auto || count < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const reset = () => { since.current = performance.now(); };
    reset();
    window.addEventListener("scult:intro-fin", reset);
    const id = window.setInterval(() => {
      const intro = document.documentElement.dataset.intro;
      const waiting = intro === "play" || intro === "glitch" || intro === "fade" || hold.current || document.hidden || window.scrollY > window.innerHeight * 0.5;
      if (waiting) return reset();
      if (performance.now() - since.current >= DELAY) setIndex((i) => (i + 1) % count);
    }, 400);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("scult:intro-fin", reset);
    };
  }, [auto, count]);

  const chip = `label flex h-10 items-center justify-center rounded-full border backdrop-blur transition-colors hover:border-rose hover:bg-rose hover:text-noir ${clair ? "border-noir/20 bg-white/80 text-noir" : "border-white/25 bg-black/50 text-[#f2f0ea]"}`;

  return (
    <section data-clair={clair ? "" : undefined} aria-roledescription="carrousel" aria-label="À la une" className="hero relative isolate">
      <div
        className="relative grid h-[max(100svh,calc(130vw+6rem))] overflow-hidden bg-noir md:h-auto"
        onPointerEnter={(e) => { if (e.pointerType === "mouse") hold.current = true; }}
        onPointerLeave={() => { hold.current = false; }}
        onFocusCapture={() => { hold.current = true; }}
        onBlurCapture={() => { hold.current = false; }}
        onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start || count < 2) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 48 && Math.abs(dx) > 1.5 * Math.abs(dy)) go(index + (dx < 0 ? 1 : -1));
        }}
      >
        {slides.map((s, i) => {
          const active = i === index;
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} sur ${count} : ${s.label}`}
              aria-hidden={!active}
              inert={!active}
              className={`relative col-start-1 row-start-1 min-h-0 transition-opacity duration-700 ease-(--ease-scult) ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              {s.node}
            </div>
          );
        })}

        {count > 1 && (
          <>
            {/* Mobile : un trait par slide, sous le bouton */}
            <div className="absolute inset-x-0 bottom-2.5 z-20 flex justify-center gap-2 md:hidden">
              {slides.map((s, i) => (
                <button key={s.id} type="button" onClick={() => go(i)} aria-label={`Slide ${i + 1} : ${s.label}`} aria-current={i === index} className="flex h-6 w-9 items-center">
                  <span className={`h-1 w-full rounded-full transition-colors ${i === index ? "bg-rose" : clair ? "bg-noir/25" : "bg-white/30"}`} />
                </button>
              ))}
            </div>
            {/* Ordinateur : compteur, flèches, pause */}
            <div className="absolute bottom-7 right-10 z-20 hidden items-center gap-2 md:flex">
              <span className={`${chip} pointer-events-none px-4 tabular-nums`} aria-live="polite">{pad(index + 1)} / {pad(count)}</span>
              <button type="button" onClick={() => go(index - 1)} aria-label="Slide précédente" className={`${chip} w-10`}>←</button>
              <button type="button" onClick={() => go(index + 1)} aria-label="Slide suivante" className={`${chip} w-10`}>→</button>
              <button type="button" onClick={() => setAuto((v) => !v)} aria-label={auto ? "Arrêter le défilement automatique" : "Relancer le défilement automatique"} className={`${chip} w-10 motion-reduce:hidden`}>
                <span aria-hidden>{auto ? "❚❚" : "▶"}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Mobile : le texte du hero, sous la scène. Ordinateur : il ne reste que la mention, posée en bas à gauche de la scène. */}
      <div className="sombre bg-fond px-5 pb-9 pt-6 md:absolute md:bottom-7 md:left-[max(2.5rem,calc((100vw-1360px)/2+2.5rem))] md:z-20 md:bg-transparent md:p-0">
        <div className="md:hidden">{pied}</div>
        <p className={`label mt-7 !text-[0.5625rem] leading-relaxed text-discret md:mt-0 ${clair ? "md:text-noir/70" : ""}`}>{legal}</p>
      </div>
    </section>
  );
}
