"use client";

import Image from "next/image";
import { createElement, useEffect, useRef, useState } from "react";

/** Le navigateur sait-il afficher de la 3D ? Sinon on garde l'image fixe, sans charger la visionneuse. */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Ce qu'on règle sur les matériaux du modèle une fois chargé (API de model-viewer). */
type TextureSlot = { texture: unknown; setTexture: (t: unknown) => void };
type Material = {
  name: string;
  pbrMetallicRoughness: {
    baseColorTexture: TextureSlot | null;
    metallicRoughnessTexture: TextureSlot | null;
    setRoughnessFactor: (v: number) => void;
    setMetallicFactor: (v: number) => void;
  };
  emissiveTexture: TextureSlot | null;
  setEmissiveFactor: (rgb: [number, number, number]) => void;
};
type Viewer = HTMLElement & { model?: { materials: Material[] }; createTexture: (url: string) => Promise<unknown> };

/**
 * L'éclairage du pot. Le modèle (scripts/3d/build-bouffon.sh) est mat et ses
 * couleurs viennent de photos : éclairé tel quel, il sort terne. On lui rend
 * du nerf ici, sans toucher au fichier :
 *  - le rose métallisé devient du vrai métal : une carte par matériau
 *    (scripts/3d/pot-bouffon-metal.mjs) dit où l'étiquette est chromée ; là, le
 *    pot réfléchit le décor et la lumière glisse quand il tourne ; ailleurs il
 *    reste mat ;
 *  - chaque matériau texturé émet un peu de sa propre image, pour que les
 *    blancs et le rose gardent leur éclat quel que soit l'angle.
 * L'exposition se règle sur la balise (EXPOSURE).
 */
const METAL_MAPS: Record<string, string> = {
  POT_etiquette: "/models/pot-scult-metal-etiquette.jpg",
  POT_dessus: "/models/pot-scult-metal-dessus.jpg",
};
const EMISSIVE = 0.3;
const ROUGHNESS = 0.42; // matériaux sans carte
const EXPOSURE = "1.3";

async function relight(viewer: Viewer) {
  for (const m of viewer.model?.materials ?? []) {
    try {
      const pbr = m.pbrMetallicRoughness;
      const base = pbr.baseColorTexture?.texture;
      if (base && m.emissiveTexture) {
        m.emissiveTexture.setTexture(base);
        m.setEmissiveFactor([EMISSIVE, EMISSIVE, EMISSIVE]);
      }
      const map = METAL_MAPS[m.name];
      if (map && pbr.metallicRoughnessTexture) {
        // La carte porte les valeurs ; les facteurs à 1 la laissent parler.
        pbr.metallicRoughnessTexture.setTexture(await viewer.createTexture(map));
        pbr.setMetallicFactor(1);
        pbr.setRoughnessFactor(1);
      } else {
        pbr.setRoughnessFactor(ROUGHNESS);
      }
    } catch { /* réglage impossible (réseau, matériau) : le matériau reste tel quel */ }
  }
}

/**
 * Le pot en 3D (public/models/pot-scult.glb, 0,8 Mo).
 *
 * La visionneuse (@google/model-viewer) et le modèle ne se chargent qu'à
 * l'approche du bloc, jamais au premier affichage. `still` : l'image fixe
 * montrée en attendant, et pour toujours si le navigateur n'a pas de 3D ;
 * sans `still`, rien n'est affiché avant le modèle (utile quand le pot est
 * posé sur une image qui le montre déjà).
 *
 * `interactive` : on fait tourner le pot à la souris ou au doigt. Sans, le
 * pot ne capte aucun geste (la page défile par-dessus) et c'est le parent qui
 * le tourne, via l'élément reçu dans `onReady`.
 * `orbit` : l'angle de vue de départ (« 0deg 80deg 135% » : de face, légèrement du dessus).
 */
export function Pot3D({
  alt,
  sizes = "40vw",
  interactive = true,
  onReady,
  still = null,
  orbit = "0deg 80deg 135%",
  className = "",
}: {
  alt: string;
  sizes?: string;
  interactive?: boolean;
  onReady?: (viewer: HTMLElement) => void;
  still?: string | null;
  orbit?: string;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);   // la visionneuse est chargée
  const [shown, setShown] = useState(false);   // le modèle est affiché
  const [calm, setCalm] = useState(false);     // mouvement réduit demandé

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture one-shot du réglage système
    setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const el = box.current;
    if (!el || !hasWebGL()) return;
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
      // Le pot s'affiche une fois éclairé, pour ne pas changer d'aspect sous les yeux.
      relight(el as Viewer).finally(() => {
        setShown(true);
        onReady?.(el);
      });
    };
    const onError = () => setShown(false); // le modèle n'a pas pu s'afficher : l'image fixe revient
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [ready, onReady]);

  return (
    <div ref={box} className={`relative aspect-[900/1096] ${className}`}>
      {still && (
        <Image
          src={still}
          alt={alt}
          width={900}
          height={1096}
          sizes={sizes}
          className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-500 ${shown ? "pointer-events-none opacity-0" : "opacity-100"}`}
        />
      )}
      {ready &&
        createElement("model-viewer", {
          ref: viewer,
          src: "/models/pot-scult.glb",
          alt,
          ...(interactive ? { "camera-controls": "", "disable-zoom": "", "disable-pan": "", "touch-action": "pan-y" } : {}),
          "interaction-prompt": interactive && !calm ? "auto" : "none",
          "interaction-prompt-style": "wiggle",
          "interaction-prompt-threshold": "1800",
          "interpolation-decay": "70",
          "camera-orbit": orbit,
          "min-camera-orbit": "auto 60deg auto",
          "max-camera-orbit": "auto 96deg 300%",
          "field-of-view": "20deg",
          "environment-image": "neutral",
          "tone-mapping": "neutral",
          exposure: EXPOSURE,
          "shadow-intensity": "0",
          class: `absolute -inset-[14%] transition-opacity duration-500 ${interactive ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"} ${shown ? "opacity-100" : "opacity-0"}`,
          style: { width: "128%", height: "128%", background: "transparent", "--poster-color": "transparent", "--progress-bar-color": "transparent" },
        })}
    </div>
  );
}
