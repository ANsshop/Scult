"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem, CartLine } from "@/lib/types";
import { packKey } from "@/lib/content/flavours";

const STORAGE_KEY = "scult.cart.v1";
export const MAX_QUANTITY = 20;

type Ctx = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  /** `open: false` : ajoute sans ouvrir le tiroir (le bouton l'ouvre lui-même après son animation). */
  add: (item: CartLine, quantity?: number, options?: { open?: boolean }) => void;
  setQuantity: (sku: string, quantity: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<Ctx | null>(null);

/**
 * L'offre pack : `units` pots à l'unité valent un pack, moins cher. `singles`
 * dit quel goût est chaque SKU vendu à l'unité, `packs` donne l'article pack
 * de chaque paire de goûts (clé packKey), `known` tous les articles connus,
 * par SKU, pour rafraîchir un panier enregistré.
 */
export type BundleRule = { units: number; singles: Record<string, string>; packs: Record<string, CartLine>; known: Record<string, CartLine> };

/**
 * Applique l'offre pack : dès que le panier contient deux pots à l'unité, ils
 * sont remplacés par un pack — que le client ait choisi le pack ou ajouté les
 * pots un par un, du même goût ou non, il paie le même prix. Les pots du même
 * goût sont regroupés d'abord, les goûts restants ensuite ; un pot en trop
 * reste à l'unité.
 */
function applyBundle(items: CartItem[], rule?: BundleRule | null): CartItem[] {
  if (!rule || rule.units !== 2) return items;
  const counts = new Map<string, number>();   // pots à l'unité, par goût, dans l'ordre du panier
  const lineOf = new Map<string, CartItem>();
  for (const i of items) {
    const flavour = rule.singles[i.sku];
    if (!flavour) continue;
    counts.set(flavour, (counts.get(flavour) ?? 0) + i.quantity);
    lineOf.set(flavour, i);
  }
  if ([...counts.values()].reduce((n, q) => n + q, 0) < 2) return items;

  const made = new Map<string, number>();     // packs formés, par clé
  const take = (a: string, b: string, n: number) => {
    const key = packKey(a, b);
    if (!rule.packs[key] || n <= 0) return false;
    made.set(key, (made.get(key) ?? 0) + n);
    counts.set(a, counts.get(a)! - n);
    counts.set(b, counts.get(b)! - n);
    return true;
  };
  for (const [flavour, q] of [...counts]) take(flavour, flavour, Math.floor(q / 2));
  for (let moved = true; moved; ) {
    moved = false;
    const left = [...counts].filter(([, q]) => q > 0).map(([f]) => f);
    search: for (let i = 0; i < left.length; i++) for (let j = i + 1; j < left.length; j++) {
      if (take(left[i], left[j], 1)) { moved = true; break search; }
    }
  }
  if (made.size === 0) return items;

  const out = items.flatMap((i) => {
    const flavour = rule.singles[i.sku];
    if (!flavour) return [i];
    const q = lineOf.get(flavour) === i ? counts.get(flavour)! : 0;   // le reste du goût tient sur une ligne
    return q > 0 ? [{ ...i, quantity: q }] : [];
  });
  for (const [key, n] of made) {
    const pack = rule.packs[key];
    const hit = out.findIndex((i) => i.sku === pack.sku);
    if (hit >= 0) out[hit] = { ...out[hit], quantity: Math.min(MAX_QUANTITY, out[hit].quantity + n) };
    else out.push({ ...pack, quantity: Math.min(MAX_QUANTITY, n) });
  }
  return out;
}

/** Panier indexé par SKU : c'est la clé que /api/panier et /api/orders comprennent. */
export function CartProvider({ children, bundle }: { children: React.ReactNode; bundle?: BundleRule | null }) {
  const [raw, setRaw] = useState<CartItem[]>([]);
  // Toute modification du panier passe par l'offre pack.
  const setItems = useCallback((update: CartItem[] | ((prev: CartItem[]) => CartItem[])) => {
    setRaw((prev) => applyBundle(typeof update === "function" ? update(prev) : update, bundle));
  }, [bundle]);
  const items = raw;
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratation one-shot
      // Un panier enregistré reprend le nom, le prix et le goût actuels de chaque article connu.
      if (raw) setItems((JSON.parse(raw) as CartItem[]).map((i) => (bundle?.known[i.sku] ? { ...bundle.known[i.sku], quantity: i.quantity } : i)));
    } catch { /* stockage corrompu : on repart vide */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* plein ou bloqué */ }
  }, [items, hydrated]);

  const add = useCallback((item: CartLine, quantity = 1, options?: { open?: boolean }) => {
    setItems((prev) => {
      const hit = prev.find((i) => i.sku === item.sku);
      if (hit) return prev.map((i) => (i.sku === item.sku ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + quantity) } : i));
      return [...prev, { ...item, quantity: Math.min(MAX_QUANTITY, quantity) }];
    });
    if (options?.open !== false) setOpen(true);
  }, [setItems]);
  const setQuantity = useCallback((sku: string, quantity: number) => {
    setItems((prev) => (quantity <= 0 ? prev.filter((i) => i.sku !== sku) : prev.map((i) => (i.sku === sku ? { ...i, quantity: Math.min(MAX_QUANTITY, quantity) } : i))));
  }, [setItems]);
  const remove = useCallback((sku: string) => setItems((prev) => prev.filter((i) => i.sku !== sku)), [setItems]);
  const clear = useCallback(() => setItems([]), [setItems]);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const value = useMemo<Ctx>(() => ({
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotalCents: items.reduce((n, i) => n + i.priceCents * i.quantity, 0),
    add, setQuantity, remove, clear, isOpen, openCart, closeCart,
  }), [items, add, setQuantity, remove, clear, isOpen, openCart, closeCart]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart hors <CartProvider>");
  return ctx;
}
