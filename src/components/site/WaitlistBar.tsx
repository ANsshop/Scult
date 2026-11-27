"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Avant la sortie, la barre collée en bas de la fiche produit : la date, et un
 * bouton qui ramène au formulaire de la liste d'attente (`#liste`). Elle se
 * cache quand le formulaire est à l'écran — même principe que la barre
 * d'achat (BuyButton), dont elle tient la place.
 */
export function WaitlistBar({ title, when }: { title: string; when: string }) {
  const [away, setAway] = useState<boolean | null>(null);

  useEffect(() => {
    const el = document.getElementById("liste");
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setAway(!entry.isIntersecting), { rootMargin: "-88px 0px 0px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (away === null) return null;
  return createPortal(
    <div aria-hidden={!away} inert={!away} data-barre-liste className={`sombre fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-fond/95 backdrop-blur transition-transform duration-300 ease-(--ease-scult) ${away ? "translate-y-0" : "translate-y-full"}`}>
      <div className="mx-auto flex max-w-[1360px] items-center gap-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 md:gap-5 md:px-10">
        <p className="min-w-0 flex-1">
          <span className="display block truncate text-[1.2rem] leading-none md:text-[1.4rem]">{title}</span>
          <span className="label mt-1.5 block truncate !text-[0.65rem] text-doux">Sortie · {when}</span>
        </p>
        <ButtonLink href="#liste" className="shrink-0 !px-5 md:w-80">Préviens-moi</ButtonLink>
      </div>
    </div>,
    document.body,
  );
}
