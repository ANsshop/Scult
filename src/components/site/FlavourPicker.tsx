"use client";

import type { CSSProperties } from "react";
import { getFlavour, type FlavourId } from "@/lib/content/flavours";

/**
 * Le choix du goût, quand il y en a plusieurs : un bouton par goût, son nom
 * sur deux lignes, en mono gras. Le goût choisi est cerclé de rose.
 *
 * `disabled` : les goûts en rupture, affichés mais non sélectionnables.
 * `compact` : boutons plus bas, pour les endroits serrés.
 */
export function FlavourPicker({
  name,
  legend,
  flavours,
  value,
  onChange,
  disabled = [],
  compact = false,
  className = "",
}: {
  name: string;
  legend: string;
  flavours: FlavourId[];
  value: FlavourId;
  onChange: (id: FlavourId) => void;
  disabled?: FlavourId[];
  compact?: boolean;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="label text-discret">
        {legend} <span style={{ color: getFlavour(value).color }}>· {getFlavour(value).label}</span>
      </legend>
      <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${flavours.length}, minmax(0, 1fr))` }}>
        {flavours.map((id) => {
          const f = getFlavour(id);
          const on = id === value;
          const off = disabled.includes(id);
          return (
            <label
              key={id}
              title={off ? `${f.label} — rupture` : f.label}
              style={{ "--gout": f.color } as CSSProperties}
              className={`relative flex items-center justify-center rounded-[1.05rem] px-2 text-center transition-all duration-300 ${compact ? "h-11" : "h-[3.5rem]"} ${off ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${on ? "bg-surface shadow-[0_0_0_2px_var(--gout)]" : "bg-surface/60 shadow-[0_0_0_1px_rgb(242_240_234/0.22)] hover:shadow-[0_0_0_1px_var(--gout)]"}`}
            >
              <input type="radio" name={name} value={id} checked={on} disabled={off} onChange={() => onChange(id)} className="peer sr-only" />
              <span className={`flex flex-col font-mono font-extrabold uppercase leading-[1.12] tracking-[0.01em] [color:var(--gout)] ${compact ? "text-[0.64rem] sm:text-[0.7rem]" : "text-[0.7rem] sm:text-[0.8rem] md:text-[0.88rem]"}`}>
                <span>{f.lines[0]}</span>
                <span>{f.lines[1]}</span>
              </span>
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[1.05rem] peer-focus-visible:shadow-[0_0_0_3px_var(--texte)]" />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
