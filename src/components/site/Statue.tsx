"use client";

import { visuel } from "@/lib/content/visuels";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";

/** Les slides de la section 3. Visuels 16:9, sujet à droite, mur bleu vide à gauche pour le texte. */
type Slide = { id: string; label: string; title: string; text?: string; cta: { label: string; href: string }; image: string; /** Version verticale (4:5) pour téléphone ; sinon l'image large est recadrée avec `position`. */ imageMobile?: string; alt: string; position: string; /** Recadrage sur ordinateur (object-position) ; par défaut le sujet reste calé à droite, centré en hauteur. */ positionDesktop?: string; /** Visuel sur fond blanc : texte à l'encre, bouton noir, pas d'ombre portée. */ light?: boolean; /** Sur téléphone, le texte passe en haut de l'image (le sujet est en bas du cadre). */ top?: boolean };

const SLIDES: Slide[] = [
  {
    id: "dose",
    label: "Mode d'emploi",
    title: "Une dose. 400 ml d'eau. 20 à 30 minutes avant.",
    cta: { label: "Voir la fiche", href: "/produits/cri" },
    image: visuel("section3-dose-16x9"),
    imageMobile: visuel("section3-dose-4x5"),
    alt: "La main de marbre de la statue verse une mesure de poudre rose dans le pot SCULT CRI ouvert, le couvercle posé à côté",
    position: "50% 50%",
  },
  {
    // Le message performance : une accroche, et l'allégation autorisée qui la fonde, citée mot pour mot.
    id: "performance",
    label: "Performance · créatine 3 g par dose",
    title: "Pour les séries qui comptent.",
    text: "« La créatine améliore les capacités physiques en cas de séries successives d'exercices très intenses de courte durée. »",
    cta: { label: "Commander · 49 €", href: "/produits/cri" },
    // Essai sur fond blanc (2026-11-14). La version sur mur bleu existe aussi : "assis-16x9" et "assis-4x5", sans `light`.
    image: visuel("assis-blanc-16x9"),
    imageMobile: visuel("assis-blanc-4x5"),
    light: true,
    alt: "La statue de marbre assise sur un bloc, le menton sur le poing, tient le pot SCULT CRI posé sur son genou",
    position: "50% 50%",
    positionDesktop: "100% 6%",   // sur un écran large l'image est rognée en hauteur : on garde la tête
  },
  {
    id: "lot",
    label: "Lot 001 · 690 g · 30 doses",
    title: "Lot 001. Numéroté sur chaque pot.",
    cta: { label: "Commander CRI · 49 €", href: "/produits/cri" },
    image: visuel("trio-16x9"),
    imageMobile: visuel("trio-4x5"),
    alt: "Trois pots SCULT CRI sur fond blanc, l'un debout, les deux autres penché et couché",
    position: "50% 50%",
    // Visuel sur fond blanc (rendu depuis le modèle 3D, scripts/3d/render_trio.py) : texte à l'encre,
    // bouton noir. Sur téléphone les pots sont en bas du cadre : le texte se place au-dessus.
    light: true,
    top: true,
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
          className="relative grid aspect-[4/5] overflow-hidden bg-white text-marble md:aspect-auto md:h-[86svh]"
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
                  <Image src={s.image} alt="" fill sizes="100vw" style={{ objectPosition: s.positionDesktop ?? "100% 50%" }} className="hidden object-cover md:block" />
                </div>
                <div className={`absolute inset-y-0 left-0 flex flex-col p-5 md:justify-center md:py-12 md:pr-8 md:pl-[max(2.5rem,calc((100vw-1360px)/2+2.5rem))] ${s.top ? "w-[78%] justify-start pt-[4.75rem] md:w-[36%]" : `justify-center md:w-[46%] ${s.imageMobile ? "w-[49%]" : "w-[58%]"}`} ${s.light ? "text-ink" : "[text-shadow:0_1px_2px_rgb(11_11_15/0.55),0_0_22px_rgb(11_11_15/0.45)]"}`}>
                  <p className={`label ${s.light ? "text-stone" : "text-marble/85"}`}>{s.label}</p>
                  <p className="display mt-3 text-[clamp(1.4rem,4.2vw,4rem)] md:mt-4">{s.title}</p>
                  {s.text && <p className={`mt-3 max-w-md text-[0.74rem] leading-snug md:mt-5 md:text-[1.05rem] md:leading-relaxed ${s.light ? "text-ink/75" : "text-marble/95"}`}>{s.text}</p>}
                  <ButtonLink href={s.cta.href} variant={s.light ? "ink" : "marble"} className="mt-5 !h-10 self-start whitespace-nowrap !px-4 [text-shadow:none] md:mt-7 md:!h-12 md:!px-7">{s.cta.label}</ButtonLink>
                </div>
              </div>
            );
          })}

          {/* Commandes : en haut à droite de l'image sur mobile, en bas à droite du panneau sur ordinateur */}
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2 md:bottom-8 md:right-[max(2.5rem,calc((100vw-1360px)/2+2.5rem))] md:top-auto">
            <span className="label rounded-full bg-ink/55 px-3 py-2 tabular-nums backdrop-blur" aria-live="polite">{pad(index + 1)} / {pad(count)}</span>
            <button type="button" onClick={() => go(index - 1)} aria-label="Slide précédente" className="label flex h-10 w-10 items-center justify-center rounded-full bg-marble text-ink shadow-[0_0_0_1px_rgb(11_11_15/0.14)] hover:bg-white">←</button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Slide suivante" className="label relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-marble text-ink shadow-[0_0_0_1px_rgb(11_11_15/0.14)] hover:bg-white">
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
