"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { imageSize } from "@/lib/content/images";
import { SLIDES } from "@/lib/content/site";
import { Picture } from "./Picture";
import { Pot3D } from "./Pot3D";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Le slider de l'accueil (ancre #bouffon), sous la section « formule » : des
 * visuels plein cadre, bord à bord. Les slides sont dans lib/content/site.ts.
 *
 * Chaque slide a une « scène » aux proportions exactes de son visuel : tout ce
 * qu'on pose dessus se place en pourcentages de l'image et tombe donc au même
 * endroit à toutes les tailles. Ordinateur : la scène occupe toute la largeur.
 * Mobile : le cadre est en 4:5 et la scène, plus large que lui, est centrée
 * sur son pot.
 *
 * Le pot 3D (`pot`) recouvre le pot central peint dans le visuel ; on le fait
 * tourner à la souris ou au doigt. Sans 3D, il n'y a rien à recouvrir : le pot
 * peint reste. Les slides se changent aux flèches (pas au glissement du doigt,
 * réservé au pot), et les commandes n'apparaissent qu'à partir de deux slides.
 */
export function Slider() {
  const count = SLIDES.length;
  const [index, setIndex] = useState(0);
  const go = (i: number) => setIndex(((i % count) + count) % count);

  return (
    <section id="bouffon" aria-roledescription="carrousel" aria-label="À la une" className="relative scroll-mt-(--entete) overflow-hidden border-b bg-surface">
      <div className="relative grid">
        {SLIDES.map((s, i) => {
          const active = i === index;
          const { width, height } = imageSize(s.image);
          // La scène : aux proportions du visuel ; sur mobile, glissée pour centrer le pot dans le cadre.
          const stage = { aspectRatio: `${width} / ${height}`, "--centre": `-${s.pot?.x ?? 50}%` } as CSSProperties;
          return (
            <div
              key={s.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} sur ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={`relative col-start-1 row-start-1 aspect-[4/5] overflow-hidden transition-opacity duration-700 ease-(--ease-scult) md:aspect-auto ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <div style={stage} className="absolute left-1/2 top-0 h-full translate-x-(--centre) md:relative md:left-0 md:h-auto md:w-full md:translate-x-0">
                <Picture name={s.image} alt={s.alt} sizes="(min-width: 768px) 100vw, 222vw" className="absolute inset-0 h-full w-full object-cover" />
                {s.pot && (
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${s.pot.x}%`, top: `${s.pot.y}%`, width: `${s.pot.width}%`, rotate: `${s.pot.tilt}deg` }}
                  >
                    <Pot3D alt="" orbit={s.pot.orbit} />
                  </div>
                )}
              </div>
              {/* Le bouton est dans un bloc en absolu : la classe du reflet lui impose `position: relative` */}
              <div className="absolute bottom-5 left-5 md:bottom-10 md:left-[max(2.5rem,calc((100vw-1360px)/2+2.5rem))]">
                <ButtonLink href={s.cta.href} className="md:h-14 md:px-10">{s.cta.label}</ButtonLink>
              </div>
            </div>
          );
        })}

        {count > 1 && (
          <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2 md:bottom-10 md:right-10">
            <span className="label rounded-full bg-fond/80 px-3 py-2 tabular-nums" aria-live="polite">{pad(index + 1)} / {pad(count)}</span>
            <button type="button" onClick={() => go(index - 1)} aria-label="Slide précédente" className="label flex h-10 w-10 items-center justify-center rounded-full bg-fond/80 hover:bg-rose hover:text-noir">←</button>
            <button type="button" onClick={() => go(index + 1)} aria-label="Slide suivante" className="label flex h-10 w-10 items-center justify-center rounded-full bg-fond/80 hover:bg-rose hover:text-noir">→</button>
          </div>
        )}
      </div>
    </section>
  );
}
