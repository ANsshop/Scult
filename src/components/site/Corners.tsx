/** Les quatre labels mono aux coins d'une section — la grille de l'affiche. Sous 768 px, deux coins. */
export function Corners({ tl, tr, bl, br, className = "" }: { tl: string; tr?: string; bl?: string; br?: string; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <span className="label absolute left-5 top-5 md:left-8 md:top-7">{tl}</span>
      {tr && <span className="label absolute right-5 top-5 hidden md:block md:right-8 md:top-7">{tr}</span>}
      {bl && <span className="label absolute bottom-5 left-5 hidden md:block md:bottom-7 md:left-8">{bl}</span>}
      {br && <span className="label absolute bottom-5 right-5 md:bottom-7 md:right-8">{br}</span>}
    </div>
  );
}
