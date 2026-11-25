"use client";

import Image from "next/image";
import { useState } from "react";
import { BOITE_POCHONS } from "@/lib/content/modeles-3d";
import { POCHONS, pochonsImage } from "@/lib/content/pochons";
import { Pot3D } from "./Pot3D";

const pad = (n: number) => String(n).padStart(2, "0");
const POSTER = "/models/boite-pochons-poster.webp";

/**
 * La galerie de la fiche des pochons. Comme celle du pot (ProductGallery) :
 * une grande vue, ses vignettes dessous. Deux différences :
 *  - elle est noire : la boîte est blanche, elle se perdrait sur le blanc de
 *    la page (le pot noir, lui, est sur blanc) ;
 *  - la première vue est la boîte en 3D, qu'on fait tourner. Elle reste
 *    chargée quand on regarde une image, pour revenir sans attendre.
 * Les images sont détourées (public/pochons/) et jamais recadrées.
 */
export function PochonsGallery() {
  const { views, hint, label3d, alt3d } = POCHONS.gallery;
  const [i, setI] = useState(0); // 0 : la 3D ; ensuite les images, dans l'ordre
  const count = views.length + 1;
  const view = i > 0 ? views[i - 1] : null;
  return (
    // min-w-0 : la rangée de vignettes défile dans sa colonne au lieu d'élargir la page sur mobile
    <div className="sombre min-w-0 text-texte">
      <div className="relative aspect-square overflow-hidden rounded-card bg-fond">
        <div className={`absolute inset-0 flex items-center justify-center p-[9%] transition-opacity duration-300 ${view ? "pointer-events-none opacity-0" : "opacity-100"}`} aria-hidden={view ? true : undefined} inert={Boolean(view)}>
          <Pot3D model={BOITE_POCHONS} alt={alt3d} still={POSTER} sizes="(min-width: 768px) 45vw, 90vw" orbit="-18deg 82deg 135%" className="w-full" />
        </div>
        {view && (
          <Image key={view.id} src={pochonsImage(view.id, 1100)} alt={view.alt} fill sizes="(min-width: 768px) 55vw, 100vw" className="object-contain p-[9%]" />
        )}
        <span className="label absolute left-4 top-4 rounded-full bg-surface px-2.5 py-1 tabular-nums">{pad(i + 1)} / {pad(count)}</span>
        {!view && <p className="label pointer-events-none absolute inset-x-0 bottom-4 text-center text-discret">{hint}</p>}
      </div>
      <ul className="mt-3 flex gap-2.5 overflow-x-auto p-1 no-scrollbar">
        {[null, ...views].map((v, k) => (
          <li key={v?.id ?? "3d"}>
            <button
              type="button"
              onClick={() => setI(k)}
              aria-label={v ? `Image ${k + 1}` : "La boîte en 3D"}
              aria-current={k === i}
              className={`group relative block h-20 w-20 overflow-hidden rounded-chip bg-fond ${k === i ? "ring-2 ring-rose ring-offset-2 ring-offset-white" : ""}`}
            >
              {/* La vignette reste noire ; c'est l'image qui s'éteint un peu quand elle n'est pas choisie */}
              <Image src={v ? pochonsImage(v.id, 600) : POSTER} alt="" fill sizes="80px" className={`object-contain p-2 transition-opacity ${k === i ? "" : "opacity-55 group-hover:opacity-100"}`} />
              {!v && <span className="label absolute bottom-1 right-1 rounded-full bg-rose px-1.5 !text-[0.5625rem] font-bold text-noir">{label3d}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
