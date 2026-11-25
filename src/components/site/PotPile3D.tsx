"use client";

import { Pot3D } from "./Pot3D";

/** L'image fixe montrée avant la 3D, et pour toujours sans WebGL : le pot détouré, sur n'importe quel fond. */
const STILL = "/models/pot-scult-poster.webp";

/** Le cadre d'un pot : la hauteur vient du parent, la largeur des proportions du pot (celles de Pot3D), jamais l'inverse. */
const BOX = "block aspect-[900/1096]";

/**
 * La vignette d'un choix d'achat : le pot en 3D, ou deux pots qui se
 * chevauchent pour un pack. Le parent donne la hauteur (un bloc en `relative`).
 * Les pots ne captent aucun geste — la carte entière reste cliquable — et
 * tournent lentement quand `spin` est vrai (la carte choisie). `hold` : on
 * garde l'image fixe sans charger la 3D (voir Pot3D) ; `sizes` : la largeur
 * d'un pot à l'écran, pour l'image fixe.
 */
export function PotPile3D({ count = 1, spin = false, hold = false, sizes = "120px", className = "" }: { count?: number; spin?: boolean; hold?: boolean; sizes?: string; className?: string }) {
  if (count > 1) {
    return (
      <span aria-hidden className={`relative block aspect-[1.32] ${className}`}>
        <span className={`${BOX} absolute left-0 top-[4%] h-[90%] -rotate-[8deg]`}><Pot3D alt="" interactive={false} still={STILL} sizes={sizes} hold={hold} orbit="-24deg 80deg 135%" spin={spin} className="h-full w-full" /></span>
        <span className={`${BOX} absolute right-0 top-[8%] h-[92%] rotate-[7deg]`}><Pot3D alt="" interactive={false} still={STILL} sizes={sizes} hold={hold} orbit="22deg 80deg 135%" spin={spin} className="h-full w-full" /></span>
      </span>
    );
  }
  return (
    <span aria-hidden className={`${BOX} -rotate-[4deg] ${className}`}>
      <Pot3D alt="" interactive={false} still={STILL} sizes={sizes} hold={hold} orbit="-14deg 80deg 135%" spin={spin} className="h-full w-full" />
    </span>
  );
}
