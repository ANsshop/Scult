"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/lib/catalog/queries";
import { formatPrice } from "@/lib/utils";

/** Le petit pot qui s'envole vers le panier (200 px de large, quelques Ko). */
const FLY_IMAGE = "/home/pot-mini.webp";
const FLY_SIZE = 84;
const FLIGHT_MS = 700;

/**
 * Bouton d'ajout au panier, avec son animation : un petit pot décolle du
 * bouton et file en arc jusqu'au compteur du panier, qui rebondit à
 * l'arrivée ; le bouton passe à « Ajouté », puis le tiroir s'ouvre.
 * L'article n'entre dans le panier qu'à l'atterrissage, pour que le compteur
 * change au bon moment. Sans animation possible (mouvement réduit, compteur
 * introuvable), l'ajout est immédiat.
 */
export function AddToCart({ product, className }: { product: Product; className?: string }) {
  const { add, openCart } = useCart();
  const [state, setState] = useState<"idle" | "flying" | "added">("idle");
  if (!product.inStock) return <Button disabled className={className}>Rupture</Button>;

  const item = { sku: product.variant.sku, slug: product.slug, name: product.name, priceCents: product.priceCents, image: product.images[0]?.url ?? null };
  const settle = () => {
    setState("added");
    window.setTimeout(() => setState("idle"), 1600);
  };

  const onClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (state === "flying") return;
    const from = e.currentTarget.getBoundingClientRect();
    const badge = [...document.querySelectorAll<HTMLElement>("[data-cart-badge]")].find((el) => el.offsetParent !== null);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !badge || typeof badge.animate !== "function") {
      add(item);
      settle();
      return;
    }

    setState("flying");
    const to = badge.getBoundingClientRect();
    const startX = from.left + from.width / 2 - FLY_SIZE / 2;
    const startY = from.top - FLY_SIZE * 0.75;
    const dx = to.left + to.width / 2 - (startX + FLY_SIZE / 2);
    const dy = to.top + to.height / 2 - (startY + FLY_SIZE * 0.6);

    const pot = document.createElement("img");
    pot.src = FLY_IMAGE;
    pot.alt = "";
    pot.setAttribute("aria-hidden", "true");
    Object.assign(pot.style, {
      position: "fixed",
      left: `${startX}px`,
      top: `${startY}px`,
      width: `${FLY_SIZE}px`,
      height: "auto",
      zIndex: "60",
      pointerEvents: "none",
      filter: "drop-shadow(4px 4px 0 rgb(11 11 15 / 0.85))",
    });
    document.body.appendChild(pot);

    const land = () => {
      pot.remove();
      add(item, 1, { open: false });
      // Le compteur encaisse l'arrivée du pot.
      badge.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.7)" }, { transform: "scale(0.9)" }, { transform: "scale(1)" }],
        { duration: 460, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
      );
      settle();
      window.setTimeout(openCart, 420);
    };

    const flight = pot.animate(
      [
        { transform: "translate(0, 12px) scale(0.3) rotate(-14deg)", opacity: 0 },
        { transform: "translate(0, -14px) scale(1) rotate(-6deg)", opacity: 1, offset: 0.2 },
        { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 70}px) scale(0.72) rotate(10deg)`, opacity: 1, offset: 0.62 },
        { transform: `translate(${dx}px, ${dy}px) scale(0.14) rotate(24deg)`, opacity: 0.85 },
      ],
      { duration: FLIGHT_MS, easing: "cubic-bezier(0.3, 0.1, 0.2, 1)", fill: "forwards" },
    );
    flight.onfinish = land;
    flight.oncancel = land;
  };

  const label = product.preorderEta ? `Précommander · ${product.preorderEta}` : `Ajouter · ${formatPrice(product.priceCents)}`;
  return (
    <Button className={`${className ?? ""} ${state === "idle" ? "" : "!bg-klein"}`} onClick={onClick} aria-live="polite">
      {state === "idle" ? label : "Ajouté ✓"}
    </Button>
  );
}
