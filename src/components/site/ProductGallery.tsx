"use client";
import Image from "next/image";
import { useState } from "react";
import type { PpImage } from "@/lib/pp/client";

export function ProductGallery({ images }: { images: PpImage[] }) {
  const [i, setI] = useState(0);
  const main = images[i] ?? images[0];
  if (!main) return <div className="aspect-[4/5] bg-klein" />;
  return (
    <div>
      <div className="relative aspect-[4/5] overflow-hidden bg-klein">
        <Image key={main.url} src={main.url} alt={main.alt} fill priority={i === 0} sizes="(min-width: 768px) 55vw, 100vw" className="object-cover" />
        <span className="label absolute left-4 top-4 text-marble tabular-nums">{String(i + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
      </div>
      {images.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {images.map((img, k) => (
            <li key={img.url + k}>
              <button type="button" onClick={() => setI(k)} aria-label={`Image ${k + 1}`} aria-current={k === i} className={`relative h-20 w-16 overflow-hidden bg-klein ${k === i ? "ring-2 ring-ruby" : "opacity-70 hover:opacity-100"}`}>
                <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
