"use client";
import Image from "next/image";
import { useState } from "react";
import type { PpImage } from "@/lib/pp/client";

export function ProductGallery({ images }: { images: PpImage[] }) {
  const [i, setI] = useState(0);
  const main = images[i] ?? images[0];
  if (!main) return <div className="aspect-[4/5] rounded-card bg-surface" />;
  return (
    // min-w-0 : la rangée de vignettes défile dans sa colonne au lieu d'élargir la page sur mobile
    <div className="min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface">
        <Image key={main.url} src={main.url} alt={main.alt} fill priority={i === 0} sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" />
        <span className="label absolute left-4 top-4 rounded-full bg-fond/70 px-2.5 py-1 text-texte tabular-nums">{String(i + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2.5 overflow-x-auto p-1 no-scrollbar">
          {images.map((img, k) => (
            <li key={img.url + k}>
              <button type="button" onClick={() => setI(k)} aria-label={`Image ${k + 1}`} aria-current={k === i} className={`relative h-20 w-16 overflow-hidden rounded-chip bg-surface ${k === i ? "ring-2 ring-rose ring-offset-2 ring-offset-fond" : "opacity-60 hover:opacity-100"}`}>
                <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
