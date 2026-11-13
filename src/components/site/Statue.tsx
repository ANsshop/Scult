"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";

/** Les slides de la section 3. Visuels 16:9, sujet à droite, mur bleu vide à gauche pour le texte. */
type Slide = { id: string; label: string; title: string; text?: string; cta: { label: string; href: string }; image: string; /** Version verticale (4:5) pour téléphone ; sinon l'image large est recadrée avec `position`. */ imageMobile?: string; alt: string; position: string; full?: boolean };

const SLIDES: Slide[] = [
  {
    id: "dose",
    label: "Mode d'emploi",
    title: "Une dose. 400 ml d'eau. 20 à 30 minutes avant.",
    cta: { label: "Voir la fiche complète", href: "/produits/cri" },
    image: "/home/section3-pot-ouvert.webp",
    alt: "La main de marbre de la statue verse une mesure de poudre rose dans le pot SCULT CRI ouvert, le couvercle posé à côté",
    position: "52% 50%",
  },
  {
    // Le message performance : une accroche, et l'allégation autorisée qui la fonde, citée mot pour mot.
    id: "performance",
    label: "Performance · créatine 3 g par dose",
    title: "Pour les séries qui comptent.",
    text: "« La créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée. »",
    cta: { label: "Commander · 49 €", href: "/produits/cri" },
    image: "/home/hero-2-16x9.webp",
    imageMobile: "/home/section3-barre-4x5.webp",
    alt: "Le poing de marbre de la statue, strap rouge au poignet, serre une barre couverte de craie à côté d'un pot SCULT CRI",
    position: "50% 50%",
  },
  {
    id: "lot",
    label: "Lot 001 · 690 g · 30 doses",
    title: "Lot 001. Numéroté sur chaque pot.",
    cta: { label: "Commander CRI · 49 €", href: "/produits/cri" },
    image: "/home/section3-pots-fond-noir.webp",
    alt: "Un mur de pots SCULT CRI serrés les uns contre les autres, cadrés en diagonale",
    position: "50% 50%",
    // Le visuel remplit tout le cadre (pas de mur bleu vide à gauche) : l'ombre du texte est plus marquée.
    full: true,
  },
];

const SLIDE_MS = 7000;
const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Section 3 de l'accueil : un slider pleine largeur, bord à bord. Chaque slide
 * porte un visuel, une phrase et un lien. Le texte est posé sur le côté
 * gauche du visuel, sur ordinateur comme sur mobile (cadrage resserré : voir
 * `position`, qui garde le sujet à droite du texte). Aucun voile ni dégradé
 * derrière le texte : seule une ombre portée le détache de l'image.
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
        {/* Pleine largeur, bord à bord : ni marges ni coins arrondis */}
        <div
          className="relative grid aspect-[4/5] overflow-hidden bg-klein text-marble md:aspect-auto md:h-[86svh]"
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
                <div className="absolute inset-0">
                  {/* Téléphone : la version verticale si elle existe, sinon l'image large recadrée (affichée ~2× la largeur de l'écran) */}
                  <Image
                    src={s.imageMobile ?? s.image}
                    alt={s.alt}
                    fill
                    sizes={s.imageMobile ? "100vw" : "200vw"}
                    style={{ "--pos": s.position } as React.CSSProperties}
                    className="object-cover object-(--pos) md:hidden"
                  />
                  <Image src={s.image} alt="" fill sizes="100vw" className="hidden object-cover object-[100%_50%] md:block" />
                </div>
                <div className={`absolute inset-y-0 left-0 flex ${s.imageMobile ? "w-[49%]" : "w-[58%]"} flex-col justify-center p-5 md:w-[46%] md:py-12 md:pr-12 md:pl-[max(2.5rem,calc((100vw-1360px)/2+2.5rem))] ${s.full ? "[text-shadow:0_2px_3px_rgb(11_11_15/0.9),0_0_26px_rgb(11_11_15/0.85)]" : "[text-shadow:0_1px_2px_rgb(11_11_15/0.55),0_0_22px_rgb(11_11_15/0.45)]"}`}>
                  <p className="label text-marble/85">{s.label}</p>
                  <p className="display mt-3 text-[clamp(1.4rem,4.2vw,4rem)] md:mt-4">{s.title}</p>
                  {s.text && <p className="mt-3 max-w-md text-[0.74rem] leading-snug text-marble/95 md:mt-5 md:text-[1.05rem] md:leading-relaxed">{s.text}</p>}
                  <ButtonLink href={s.cta.href} variant="marble" className="mt-5 !h-10 self-start whitespace-nowrap !px-4 [text-shadow:none] md:mt-7 md:!h-12 md:!px-7">{s.cta.label}</ButtonLink>
                </div>
              </div>
            );
          })}

          {/* Commandes : en haut à droite de l'image sur mobile, en bas à droite du panneau sur ordinateur */}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2 md:bottom-8 md:right-[max(2.5rem,calc((100vw-1360px)/2+2.5rem))] md:top-auto">
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
    </section>
  );
}
