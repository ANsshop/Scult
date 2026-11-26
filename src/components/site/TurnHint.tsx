/**
 * L'invitation à faire tourner un modèle 3D : une pastille « 360° » et un
 * doigt qui glisse de gauche à droite (`invite-geste`, globals.css). Sans
 * elle, rien ne dit qu'on peut toucher au pot — testé : les visiteurs ne le
 * tournaient pas.
 *
 * `gone` : le visiteur a tourné le pot, l'invitation s'efface. Elle ne capte
 * aucun geste : on attrape le pot à travers. Noire cernée de blanc : lisible
 * sur le blanc d'une galerie comme sur le noir du pot.
 */
export function TurnHint({ label, gone = false, className = "", style }: { label: string; gone?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <p
      aria-hidden={gone || undefined}
      style={style}
      className={`label pointer-events-none flex w-max items-center gap-2 rounded-full bg-noir/90 py-1.5 pl-1.5 pr-3.5 !text-[0.6875rem] text-white shadow-[0_0_0_1.5px_rgb(255_255_255/0.85)] transition-opacity duration-500 ${gone ? "opacity-0" : "opacity-100"} ${className}`}
    >
      <span className="rounded-full bg-rose px-2 py-1 font-bold text-noir">360°</span>
      <svg aria-hidden viewBox="0 0 30 14" className="invite-geste h-3.5 w-[1.875rem] shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 3 2 7l4 4M24 3l4 4-4 4" />
        <circle cx="15" cy="7" r="3.4" fill="currentColor" stroke="none" />
      </svg>
      <span>{label}</span>
    </p>
  );
}
