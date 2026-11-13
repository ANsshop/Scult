"use client";

import Image from "next/image";
import { createElement, useEffect, useRef, useState } from "react";

/**
 * Le pot en 3D.
 *
 * L'image fixe reste affichée tant que le modèle n'est pas prêt (et pour
 * toujours si le navigateur n'a pas de 3D) : on ne montre jamais de vide. La
 * visionneuse (@google/model-viewer) et le modèle (public/models/pot-cri.glb,
 * 1,4 Mo) ne se chargent qu'à l'approche du bloc.
 *
 * `interactive` : on fait tourner le pot à la souris ou au doigt. Sans, le
 * pot ne capte aucun geste (la page défile par-dessus) et c'est le parent qui
 * le tourne, via l'élément reçu dans `onReady`.
 */
export function Pot3D({
  alt,
  sizes,
  interactive = true,
  onReady,
}: {
  alt: string;
  sizes: string;
  interactive?: boolean;
  onReady?: (viewer: HTMLElement) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);   // la visionneuse est chargée
  const [shown, setShown] = useState(false);   // le modèle est affiché
  const [calm, setCalm] = useState(false);     // mouvement réduit demandé

  useEffect(() => {
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        import("@google/model-viewer").then(() => setReady(true)).catch(() => { /* pas de 3D : l'image reste */ });
      },
      { rootMargin: "600px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const el = viewer.current;
    if (!ready || !el) return;
    const onLoad = () => {
      setShown(true);
      onReady?.(el);
    };
    el.addEventListener("load", onLoad);
    return () => el.removeEventListener("load", onLoad);
  }, [ready, onReady]);

  return (
    <div ref={box} className="relative aspect-[900/1096] -rotate-[5deg]">
      <Image
        src="/home/pot-detoure.webp"
        alt={alt}
        width={900}
        height={1096}
        sizes={sizes}
        className={`flash-shadow absolute inset-0 h-full w-full transition-opacity duration-500 ${shown ? "pointer-events-none opacity-0" : "opacity-100"}`}
      />
      {ready &&
        createElement("model-viewer", {
          ref: viewer,
          src: "/models/pot-cri.glb",
          alt,
          ...(interactive ? { "camera-controls": "", "disable-zoom": "", "disable-pan": "", "touch-action": "pan-y" } : {}),
          "interaction-prompt": interactive && !calm ? "auto" : "none",
          "interaction-prompt-style": "wiggle",
          "interaction-prompt-threshold": "1800",
          "interpolation-decay": "70",
          "camera-orbit": "0deg 84deg 120%",
          "min-camera-orbit": "auto 66deg auto",
          "max-camera-orbit": "auto 96deg auto",
          "field-of-view": "20deg",
          "environment-image": "neutral",
          "tone-mapping": "neutral",
          exposure: "1.05",
          "shadow-intensity": "0",
          class: `flash-shadow absolute -inset-[14%] transition-opacity duration-500 ${interactive ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"} ${shown ? "opacity-100" : "opacity-0"}`,
          style: { width: "128%", height: "128%", background: "transparent", "--poster-color": "transparent", "--progress-bar-color": "transparent" },
        })}
    </div>
  );
}
