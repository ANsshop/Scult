"use client";

import { useCallback, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { HERO_SLIDES } from "@/lib/content/hero-slides";
import { Corners } from "./Corners";

/** Durée d'une slide avant le passage automatique à la suivante. */
const SLIDE_MS = 7000;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Hero en slider, DA « Cri ». Les slides sont empilées dans une même case de
 * grille et se fondent l'une dans l'autre. Sur ordinateur le visuel est calé
 * à droite et le texte tient dans le mur bleu laissé vide à gauche ; sur
 * mobile le visuel passe en haut, le titre et l'appel dessous.
 *
 * Le défilement automatique est porté par l'animation de la barre de
 * progression (`hero-progress`, globals.css) : sa fin déclenche la slide
 * suivante. Il se met en pause au survol et au focus clavier, et n'existe pas
 * avec `prefers-reduced-motion` (les animations y sont coupées).
 */
export function Hero() {
  const slides = HERO_SLIDES;
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const touchX = useRef<number | null>(null);
  const paused = hovered || focused;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  return (
    <section
      aria-roledescription="carrousel"
      aria-label="À la une"
      className="grain relative bg-klein text-marble"
      onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
      onFocus={(e) => setFocused(e.target.matches(":focus-visible"))}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setFocused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 48) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {/* Deux coins seulement, côté mur bleu : à droite ils tombaient sur le pot ou la statue selon la slide */}
      <Corners className="top-14" tl="SCULT · 2026" bl="Fabriqué dans l'UE" />
      <div className="relative grid">
        {slides.map((s, i) => {
          const active = i === index;
          const Title = i === 0 ? "h1" : "h2";
          const position = {
            "--pos-m": s.position?.mobile ?? "50% 100%",
            "--pos-d": s.position?.desktop ?? "100% 50%",
          } as CSSProperties;
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} sur ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={`relative col-start-1 row-start-1 transition-opacity duration-700 ease-(--ease-scult) ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <picture>
                <source media="(max-width: 767px)" srcSet={s.image.mobile} />
                <img
                  src={s.image.desktop}
                  alt={s.image.alt}
                  fetchPriority={i === 0 ? "high" : "low"}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  style={position}
                  className="h-[76svh] w-full object-cover object-(--pos-m) md:h-[92svh] md:object-(--pos-d)"
                />
              </picture>
              <div aria-hidden className={`pointer-events-none absolute inset-0 hidden bg-gradient-to-r via-klein/25 to-transparent md:block md:w-[55%] ${s.dark ? "from-ink/70 via-ink/25" : "from-klein/70"}`} />
              <div className="flex flex-col justify-center px-5 pb-14 pt-20 md:absolute md:inset-0 md:px-10 md:pb-16 md:pt-0 md:pr-[62%]">
                <p className="label text-marble/85">{s.label}</p>
                <Title className="display mt-4 text-[clamp(2.6rem,4.4vw,4.75rem)]">{s.title}</Title>
                <p className="mt-6 max-w-md text-[1.05rem] leading-relaxed text-marble/90">{s.text}</p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href={s.cta.href} variant="marble">{s.cta.label}</ButtonLink>
                  {s.secondary && (
                    <ButtonLink href={s.secondary.href} variant="outline" className="text-marble hover:border-marble hover:bg-marble hover:text-ink">{s.secondary.label}</ButtonLink>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Commandes : sous le visuel sur mobile, en bas de la colonne texte sur ordinateur */}
        <div className="absolute left-5 right-5 top-[calc(76svh+1.25rem)] z-10 flex items-center gap-4 md:left-10 md:right-auto md:top-auto md:bottom-16">
          <button type="button" onClick={() => go(index - 1)} aria-label="Slide précédente" className="label flex h-8 w-8 items-center justify-center border border-marble/40 hover:bg-marble hover:text-ink">←</button>
          <div className="flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Slide ${i + 1} : ${s.label}`}
                aria-current={i === index}
                className="relative h-8 w-9"
              >
                <span className="absolute inset-x-0 top-1/2 h-px bg-marble/35" />
                {i === index && (
                  <span
                    key={index}
                    onAnimationEnd={() => go(index + 1)}
                    style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" }}
                    className="hero-progress absolute inset-x-0 top-1/2 h-0.5 -translate-y-px origin-left bg-marble"
                  />
                )}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => go(index + 1)} aria-label="Slide suivante" className="label flex h-8 w-8 items-center justify-center border border-marble/40 hover:bg-marble hover:text-ink">→</button>
          <span className="label tabular-nums text-marble/85" aria-live="polite">{pad(index + 1)} / {pad(count)}</span>
        </div>
      </div>
    </section>
  );
}
