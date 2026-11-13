"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/** Les slides de la section 3. Visuels 16:9, sujet à droite, mur bleu vide à gauche pour le texte. */
const SLIDES = [
  {
    id: "dose",
    label: "Mode d'emploi",
    title: "Une dose. 400 ml d'eau. 20 à 30 minutes avant.",
    cta: { label: "Voir la fiche complète", href: "/produits/cri" },
    image: "/home/section3-pot-ouvert.webp",
    alt: "La main de marbre de la statue verse une mesure de poudre rose dans le pot SCULT CRI ouvert, le couvercle posé à côté",
    position: "72% 50%",
  },
  {
    id: "methode",
    label: "La méthode",
    title: "Ce que l'Europe autorise à dire. Rien de plus.",
    cta: { label: "Lire la méthode", href: "/methode" },
    image: "/home/section3-visage.webp",
    alt: "Gros plan sur le visage de la statue de marbre qui hurle, la pierre ruisselante, devant un mur bleu",
    position: "94% 50%",
  },
];

const SLIDE_MS = 7000;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Section 3 de l'accueil : un grand panneau arrondi en slider. Chaque slide
 * porte un visuel, une phrase et un lien. Ordinateur : le texte tient dans
 * le mur bleu à gauche du sujet. Mobile : l'image au-dessus, le texte dessous.
 * Même mécanique que le hero : la fin de la barre de progression appelle la
 * slide suivante, pause au survol, rien d'automatique en mouvement réduit.
 */
export function Statue() {
  const count = SLIDES.length;
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const touchX = useRef<number | null>(null);
  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);

  return (
    <section className="border-b" aria-roledescription="carrousel" aria-label="La marque">
      <Container className="py-6 md:py-10">
        <div
          className="relative grid overflow-hidden rounded-card bg-klein text-marble md:h-[78svh]"
          onPointerEnter={(e) => e.pointerType === "mouse" && setHovered(true)}
          onPointerLeave={(e) => e.pointerType === "mouse" && setHovered(false)}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 48) go(index + (dx < 0 ? 1 : -1));
          }}
        >
          {SLIDES.map((s, i) => {
            const active = i === index;
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
                <div className="relative aspect-[5/4] md:absolute md:inset-0 md:aspect-auto">
                  <Image
                    src={s.image}
                    alt={s.alt}
                    fill
                    sizes="(min-width: 1360px) 1280px, 100vw"
                    style={{ "--pos": s.position } as React.CSSProperties}
                    className="object-cover object-(--pos) md:object-[100%_50%]"
                  />
                  <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-klein to-transparent md:inset-0 md:h-auto md:bg-gradient-to-r md:from-klein/60 md:via-klein/10" />
                </div>
                <div className="relative p-6 pb-8 pt-4 md:absolute md:inset-y-0 md:left-0 md:flex md:w-[46%] md:flex-col md:justify-center md:p-12">
                  <p className="label text-marble/85">{s.label}</p>
                  <p className="display mt-4 text-[clamp(2rem,4.2vw,4rem)]">{s.title}</p>
                  <ButtonLink href={s.cta.href} variant="marble" className="mt-7 self-start">{s.cta.label}</ButtonLink>
                </div>
              </div>
            );
          })}

          {/* Commandes : en haut à droite de l'image sur mobile, en bas à droite du panneau sur ordinateur */}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2 md:bottom-6 md:right-6 md:top-auto">
            <span className="label rounded-full bg-ink/55 px-3 py-2 tabular-nums backdrop-blur" aria-live="polite">{pad(index + 1)} / {pad(count)}</span>
            <button type="button" onClick={() => go(index - 1)} aria-label="Slide précédente" className="label flex h-10 w-10 items-center justify-center rounded-full bg-marble text-ink hover:bg-white">←</button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Slide suivante" className="label relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-marble text-ink hover:bg-white">
              →
              {/* Le compte à rebours : un filet qui se remplit sous la flèche */}
              <span
                key={index}
                aria-hidden
                onAnimationEnd={() => go(index + 1)}
                style={{ animationDuration: `${SLIDE_MS}ms`, animationPlayState: hovered ? "paused" : "running" }}
                className="hero-progress absolute inset-x-0 bottom-0 h-[3px] origin-left bg-klein"
              />
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
