"use client";

import Image from "next/image";
import { getFlavour, type FlavourId } from "@/lib/content/flavours";

/**
 * Le choix du goût. Chaque bouton reprend la pastille de goût du pot : la
 * photo du fruit à gauche, fondue dans le papier, le nom sur deux lignes à
 * droite, dans la même typo. On choisit donc le goût en choisissant
 * l'étiquette qu'on verra sur le pot.
 *
 * `disabled` : les goûts en rupture, affichés mais non sélectionnables.
 * `compact` : pastilles plus basses, pour les endroits serrés.
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
      <legend className="label text-stone">
        {legend} <span className="text-ink">· {getFlavour(value).label}</span>
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
              className={`relative flex items-center overflow-hidden rounded-[1.05rem] transition-all duration-300 ${compact ? "h-11" : "h-[3.25rem]"} ${off ? "cursor-not-allowed opacity-40" : "cursor-pointer"} ${on ? "bg-white shadow-[0_0_0_2px_var(--color-klein),0_10px_22px_-12px_rgb(18_56_199/0.6)]" : "bg-white/70 shadow-[0_0_0_1px_rgb(11_11_15/0.28)] hover:bg-white hover:shadow-[0_0_0_1px_rgb(11_11_15/0.6)]"}`}
            >
              <input type="radio" name={name} value={id} checked={on} disabled={off} onChange={() => onChange(id)} className="peer sr-only" />
              <Image
                src={f.swatch}
                alt=""
                width={160}
                height={160}
                sizes="64px"
                className={`absolute inset-y-0 left-0 h-full w-[40%] object-cover transition-[filter] duration-300 [mask-image:linear-gradient(to_right,#000_62%,transparent)] ${on ? "" : "saturate-[0.85]"}`}
              />
              <span className={`relative ml-[42%] flex flex-col pr-1 font-mono font-bold uppercase leading-[1.18] tracking-[0.01em] text-ink ${compact ? "text-[0.58rem] sm:text-[0.62rem]" : "text-[0.6rem] sm:text-[0.68rem] md:text-[0.74rem]"}`}>
                <span>{f.lines[0]}</span>
                <span>{f.lines[1]}</span>
              </span>
              <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[1.05rem] peer-focus-visible:shadow-[0_0_0_3px_var(--color-ruby)]" />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
