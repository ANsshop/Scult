"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "scult.cart.v1";
export const MAX_QUANTITY = 20;

type Ctx = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  /** `open: false` : ajoute sans ouvrir le tiroir (le bouton l'ouvre lui-même après son animation). */
  add: (item: Omit<CartItem, "quantity">, quantity?: number, options?: { open?: boolean }) => void;
  setQuantity: (sku: string, quantity: number) => void;
  /** Retire `quantity` exemplaires de `fromSku` et ajoute un `item` à la place (un pot → un pack). */
  swap: (fromSku: string, quantity: number, item: Omit<CartItem, "quantity">) => void;
  remove: (sku: string) => void;
  clear: () => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<Ctx | null>(null);

/** Le pack d'un produit : `units` exemplaires de `fromSku` valent un `item` (moins cher). */
export type BundleRule = { fromSku: string; units: number; item: Omit<CartItem, "quantity"> };

/**
 * Applique l'offre pack : dès que le panier contient `units` exemplaires du
 * produit à l'unité, ils sont remplacés par un pack — que le client ait choisi
 * le pack ou ajouté les pots un par un, il paie le même prix. Un pot en trop
 * reste à l'unité.
 */
function applyBundle(items: CartItem[], rule?: BundleRule | null): CartItem[] {
  if (!rule) return items;
  const single = items.find((i) => i.sku === rule.fromSku);
  if (!single || single.quantity < rule.units) return items;
  const packs = Math.floor(single.quantity / rule.units);
  const left = single.quantity % rule.units;
  const rest = items.flatMap((i) => (i.sku !== rule.fromSku ? [i] : left > 0 ? [{ ...i, quantity: left }] : []));
  const hit = rest.find((i) => i.sku === rule.item.sku);
  if (hit) return rest.map((i) => (i.sku === rule.item.sku ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + packs) } : i));
  return [...rest, { ...rule.item, quantity: Math.min(MAX_QUANTITY, packs) }];
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
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch { /* stockage corrompu : on repart vide */ }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* plein ou bloqué */ }
  }, [items, hydrated]);

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1, options?: { open?: boolean }) => {
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
  const swap = useCallback((fromSku: string, quantity: number, item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const rest = prev.flatMap((i) => (i.sku !== fromSku ? [i] : i.quantity > quantity ? [{ ...i, quantity: i.quantity - quantity }] : []));
      const hit = rest.find((i) => i.sku === item.sku);
      if (hit) return rest.map((i) => (i.sku === item.sku ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + 1) } : i));
      return [...rest, { ...item, quantity: 1 }];
    });
  }, [setItems]);
  const remove = useCallback((sku: string) => setItems((prev) => prev.filter((i) => i.sku !== sku)), [setItems]);
  const clear = useCallback(() => setItems([]), [setItems]);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);

  const value = useMemo<Ctx>(() => ({
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotalCents: items.reduce((n, i) => n + i.priceCents * i.quantity, 0),
    add, setQuantity, swap, remove, clear, isOpen, openCart, closeCart,
  }), [items, add, setQuantity, swap, remove, clear, isOpen, openCart, closeCart]);

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart hors <CartProvider>");
  return ctx;
}
