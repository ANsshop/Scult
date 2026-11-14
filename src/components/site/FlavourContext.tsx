"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_FLAVOUR, getFlavour, isFlavourId, type FlavourId } from "@/lib/content/flavours";
import type { PpImage } from "@/lib/pp/client";
import { ProductGallery } from "./ProductGallery";

type Ctx = { flavour: FlavourId; setFlavour: (id: FlavourId) => void };
const FlavourContext = createContext<Ctx | null>(null);

/**
 * Le goût choisi sur la fiche produit, partagé entre la galerie, le bloc
 * d'achat et la liste d'ingrédients. Il se lit et s'écrit dans l'adresse
 * (`?gout=ice-tea-peche`) : un lien vers la fiche peut donc ouvrir un goût
 * précis, sans que la page cesse d'être prégénérée.
 */
export function FlavourProvider({ flavours, children }: { flavours: FlavourId[]; children: React.ReactNode }) {
  const first = flavours.includes(DEFAULT_FLAVOUR) ? DEFAULT_FLAVOUR : flavours[0] ?? DEFAULT_FLAVOUR;
  const [flavour, setState] = useState<FlavourId>(first);

  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get("gout");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture one-shot de l'adresse
    if (isFlavourId(asked) && flavours.includes(asked)) setState(asked);
  }, [flavours]);

  const setFlavour = useCallback((id: FlavourId) => {
    setState(id);
    const url = new URL(window.location.href);
    if (id === first) url.searchParams.delete("gout");
    else url.searchParams.set("gout", id);
    window.history.replaceState(window.history.state, "", url);
  }, [first]);

  const value = useMemo(() => ({ flavour, setFlavour }), [flavour, setFlavour]);
  return <FlavourContext value={value}>{children}</FlavourContext>;
}

/** Le goût courant ; hors d'un <FlavourProvider>, le goût d'origine. */
export function useFlavour(): Ctx {
  return useContext(FlavourContext) ?? { flavour: DEFAULT_FLAVOUR, setFlavour: () => {} };
}

/** La galerie du goût choisi. `fallback` : les images du catalogue, si le goût n'a pas les siennes. */
export function FlavourGallery({ fallback }: { fallback: PpImage[] }) {
  const { flavour } = useFlavour();
  const images = getFlavour(flavour).images;
  return <ProductGallery images={images.length ? images : fallback} />;
}

/** La liste d'ingrédients du goût choisi. */
export function FlavourIngredients() {
  const { flavour } = useFlavour();
  return <p>{getFlavour(flavour).ingredients}</p>;
}

/** La référence du pot du goût choisi (« SCULT-CRI-690-CF »). */
export function FlavourSku({ skus, fallback }: { skus: Partial<Record<FlavourId, string>>; fallback: string }) {
  const { flavour } = useFlavour();
  return <>{skus[flavour] ?? fallback}</>;
}
