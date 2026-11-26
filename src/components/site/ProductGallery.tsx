"use client";
import Image from "next/image";
import { useCallback, useState } from "react";
import type { PpImage } from "@/lib/pp/client";
import { Pot3D } from "./Pot3D";
import { TurnHint } from "./TurnHint";

const pad = (n: number) => String(n).padStart(2, "0");
/** L'image fixe du pot 3D : montrée avant le modèle, et dans sa vignette. */
const POSTER = "/models/pot-scult-poster.webp";

/**
 * La galerie de la fiche produit : une grande vue et ses vignettes, sur
 * blanc, cernées d'un filet. Les photos ne sont jamais recadrées ni déformées
 * (`object-contain`) : le pot garde ses proportions dans le cadre 4:5.
 *
 * `pot3d` : la première vue est le pot en 3D, qu'on fait tourner à la souris
 * ou au doigt ; les photos suivent. Il tourne seul et porte une invitation
 * (« 360° · Faites tourner le pot ») tant qu'on ne l'a pas touché ; ensuite il
 * reste là où on l'a laissé. Il reste chargé quand on regarde une photo, pour
 * y revenir sans attendre. Sans 3D dans le navigateur, l'image fixe reste.
 */
export function ProductGallery({ images, pot3d = false }: { images: PpImage[]; pot3d?: boolean }) {
  const [i, setI] = useState(0);
  const [touched, setTouched] = useState(false);
  const onTouch = useCallback(() => setTouched(true), []);
  const views: (PpImage | null)[] = pot3d ? [null, ...images] : images;
  const view = views[i] ?? views[0];
  if (views.length === 0) return <div className="aspect-[4/5] rounded-card border bg-white" />;
  return (
    // min-w-0 : la rangée de vignettes défile dans sa colonne au lieu d'élargir la page sur mobile
    <div className="min-w-0">
      {/* Ordinateur : le cadre ne dépasse pas l'écran — vignettes et invitation restent visibles, au-dessus de la barre d'achat */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-card border bg-white md:max-h-[max(22rem,calc(100svh-18rem))] md:w-full">
        {pot3d && (
          <div className={`absolute inset-0 flex items-center justify-center p-[7%] transition-opacity duration-300 ${view ? "pointer-events-none opacity-0" : "opacity-100"}`} aria-hidden={view ? true : undefined} inert={Boolean(view)}>
            <Pot3D
              alt={images[0]?.alt ?? "Le pot en 3D"}
              still={POSTER}
              priority
              sizes="(min-width: 768px) 48vw, 80vw"
              spin={!touched}
              onTouch={onTouch}
              className="h-full"
            />
          </div>
        )}
        {view && <Image key={view.url} src={view.url} alt={view.alt} fill priority={i === 0} sizes="(min-width: 768px) 55vw, 100vw" className="object-contain" />}
        <span className="label absolute left-4 top-4 rounded-full bg-surface px-2.5 py-1 text-texte tabular-nums">{pad(i + 1)} / {pad(views.length)}</span>
        {pot3d && !view && <TurnHint label="Faites tourner le pot" gone={touched} className="absolute bottom-4 left-1/2 -translate-x-1/2" />}
      </div>
      {views.length > 1 && (
        <ul className="mt-3 flex gap-2.5 overflow-x-auto p-1 no-scrollbar">
          {views.map((img, k) => (
            <li key={(img?.url ?? "3d") + k}>
              <button type="button" onClick={() => setI(k)} aria-label={img ? `Image ${k + 1}` : "Le pot en 3D"} aria-current={k === i} className={`relative block h-20 w-16 overflow-hidden rounded-chip border bg-white ${k === i ? "ring-2 ring-rose ring-offset-2 ring-offset-fond" : "opacity-70 hover:opacity-100"}`}>
                <Image src={img?.url ?? POSTER} alt="" fill sizes="64px" className={img ? "object-contain" : "object-contain p-1.5"} />
                {!img && <span className="label absolute bottom-1 right-1 rounded-full bg-rose px-1.5 !text-[0.5625rem] font-bold text-noir">3D</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
