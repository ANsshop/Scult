import { useId } from "react";

/** Les rectangles du wordmark (même dessin que public/brand/logo.svg), sur une grille de 24. */
const BLOCKS: [number, number, number, number][] = [
  [0, 0, 96, 24], [0, 0, 24, 72], [0, 48, 96, 24], [72, 48, 24, 72], [0, 96, 96, 24],   // S
  [116, 0, 96, 24], [116, 0, 24, 120], [116, 96, 96, 24],                               // C
  [232, 0, 24, 120], [304, 0, 24, 120], [232, 96, 96, 24],                              // U
  [348, 0, 24, 120], [348, 96, 96, 24],                                                 // L
  [464, 0, 96, 24], [500, 0, 24, 120],                                                  // T
];

/**
 * Le wordmark SCULT, inline pour hériter de la couleur du texte.
 * Au survol (du logo ou du lien qui le contient), un reflet de lumière le
 * traverse en diagonale, découpé dans la forme des lettres (`.logo-shine`
 * dans globals.css). Rien ne bouge en mouvement réduit.
 */
export function Wordmark({ className = "" }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 560 120" className={`logo-shine ${className}`} fill="currentColor" role="img" aria-label="SCULT">
      <defs>
        <clipPath id={`${id}-lettres`}>
          {BLOCKS.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}
        </clipPath>
        <linearGradient id={`${id}-reflet`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="logo-corps">
        {BLOCKS.map(([x, y, w, h], i) => <rect key={i} x={x} y={y} width={w} height={h} />)}
      </g>
      <g clipPath={`url(#${id}-lettres)`} aria-hidden>
        <rect className="logo-reflet" x="0" y="-40" width="190" height="200" fill={`url(#${id}-reflet)`} />
      </g>
    </svg>
  );
}
