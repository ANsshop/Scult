"use client";

import Image from "next/image";
import { createElement, useEffect, useRef, useState } from "react";
import { DEFAULT_FLAVOUR, getFlavour } from "@/lib/content/flavours";

const DEFAULT_TEXTURE = getFlavour(DEFAULT_FLAVOUR).texture;
const DEFAULT_STILL = getFlavour(DEFAULT_FLAVOUR).still;

/** Le navigateur sait-il afficher de la 3D ? Sinon on garde l'image fixe, sans charger la visionneuse. */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

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
 *
 * `texture` / `still` : le goût. Le modèle est le même pour tous les goûts ;
 * seule l'étiquette change. On remplace donc l'image de l'étiquette sur le
 * modèle déjà chargé (700 Ko, sans recharger le pot ni le faire clignoter),
 * et l'image fixe par celle du goût.
 */
type Viewer = HTMLElement & {
  model?: { materials: { name: string; pbrMetallicRoughness: { baseColorTexture: { setTexture: (t: unknown) => void } } }[] };
  createTexture: (url: string) => Promise<unknown>;
};

/** Le matériau de l'étiquette dans le modèle (scripts/3d/build_pot.py). */
const LABEL_MATERIAL = "POT_etiquette";
export function Pot3D({
  alt,
  sizes,
  interactive = true,
  onReady,
  still = DEFAULT_STILL,
  texture = null,
}: {
  alt: string;
  sizes: string;
  interactive?: boolean;
  onReady?: (viewer: HTMLElement) => void;
  still?: string;
  texture?: string | null;
}) {
  const box = useRef<HTMLDivElement>(null);
  const viewer = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);   // la visionneuse est chargée
  const [shown, setShown] = useState(false);   // le modèle est affiché
  const [calm, setCalm] = useState(false);     // mouvement réduit demandé
  const applied = useRef<string | null>(null); // l'étiquette posée sur le modèle (null : celle du fichier)
  const textures = useRef(new Map<string, Promise<unknown>>());

  useEffect(() => {
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
      setShown(true);
      onReady?.(el);
    };
    const onError = () => setShown(false); // le modèle n'a pas pu s'afficher : l'image fixe revient
    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [ready, onReady]);

  // Changer de goût : poser l'étiquette demandée sur le modèle affiché.
  useEffect(() => {
    const el = viewer.current as Viewer | null;
    if (!shown || !el || !texture || applied.current === texture) return;
    // Le fichier du modèle porte déjà l'étiquette d'origine : rien à charger tant qu'on n'en a pas changé.
    if (applied.current === null && texture === DEFAULT_TEXTURE) return;
    let stale = false;
    if (!textures.current.has(texture)) textures.current.set(texture, el.createTexture(texture));
    textures.current.get(texture)!
      .then((t) => {
        if (stale) return;
        el.model?.materials.find((m) => m.name === LABEL_MATERIAL)?.pbrMetallicRoughness.baseColorTexture.setTexture(t);
        applied.current = texture;
      })
      .catch(() => { textures.current.delete(texture); /* réseau : on garde l'étiquette en place */ });
    return () => { stale = true; };
  }, [shown, texture]);

  return (
    <div ref={box} className="relative aspect-[900/1096] -rotate-[5deg]">
      <Image
        key={still}
        src={still}
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
