/**
 * La flèche des blocs dépliables (FAQ, rubriques de la fiche produit) : elle
 * pointe vers le bas, et se retourne quand le bloc est ouvert. À placer dans
 * un <details className="group">.
 */
export function ToggleArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className={`h-5 w-5 shrink-0 transition-transform duration-300 ease-(--ease-scult) group-open:rotate-180 group-open:text-klein ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 3.5v13" />
      <path d="M4.5 11 10 16.5 15.5 11" />
    </svg>
  );
}
