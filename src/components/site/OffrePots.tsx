"use client";

import { useEffect, useRef, useState } from "react";
import { PotPile3D } from "./PotPile3D";

/** Le balancement des deux pots : angle de repos, amplitude et durée d'un aller-retour. */
const REST = [-22, 20];
const SWING = 30;
const PERIOD = 7000;

type Viewer = HTMLElement & { loaded?: boolean; cameraOrbit?: string };

/**
 * Les deux pots en 3D de la slide « offre » du hero. Ils ne sont pas visibles
 * à l'arrivée : tant que la slide n'a pas été montrée une première fois, on
 * garde leur image fixe et on ne charge ni la visionneuse ni le modèle, pour
 * ne rien prendre au premier affichage de la page.
 *
 * Quand la slide est à l'écran, ils se balancent lentement de part et d'autre
 * de la face, l'un à contretemps de l'autre : l'étiquette reste lisible (une
 * rotation complète montrerait le dos la moitié du temps). Rien ne bouge en
 * mouvement réduit, ni quand la slide n'est plus à l'écran.
 */
export function OffrePots({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    // HeroSlider pose `inert` sur les slides qui ne sont pas à l'écran.
    const slide = ref.current?.closest('[aria-roledescription="slide"]');
    if (!slide) { setSeen(true); setActive(true); return; }
    const check = () => {
      const on = !slide.hasAttribute("inert");
      setActive(on);
      if (on) setSeen(true);
    };
    const observer = new MutationObserver(check);
    observer.observe(slide, { attributes: true, attributeFilter: ["inert"] });
    check();
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!active || !el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const swing = Math.sin(((now - start) / PERIOD) * 2 * Math.PI) * SWING;
      el.querySelectorAll<Viewer>("model-viewer").forEach((viewer, i) => {
        if (viewer.loaded) viewer.cameraOrbit = `${(REST[i] ?? 0) + (i % 2 ? -swing : swing)}deg 80deg 135%`;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return (
    <div ref={ref} className={className}>
      <PotPile3D count={2} hold={!seen} sizes="(min-width: 1024px) 30vw, 50vw" className="h-full" />
    </div>
  );
}
