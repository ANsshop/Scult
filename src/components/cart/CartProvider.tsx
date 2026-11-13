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

/** Panier indexé par SKU : c'est la clé que /api/panier et /api/orders comprennent. */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
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
  }, []);
  const setQuantity = useCallback((sku: string, quantity: number) => {
    setItems((prev) => (quantity <= 0 ? prev.filter((i) => i.sku !== sku) : prev.map((i) => (i.sku === sku ? { ...i, quantity: Math.min(MAX_QUANTITY, quantity) } : i))));
  }, []);
  const swap = useCallback((fromSku: string, quantity: number, item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const rest = prev.flatMap((i) => (i.sku !== fromSku ? [i] : i.quantity > quantity ? [{ ...i, quantity: i.quantity - quantity }] : []));
      const hit = rest.find((i) => i.sku === item.sku);
      if (hit) return rest.map((i) => (i.sku === item.sku ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + 1) } : i));
      return [...rest, { ...item, quantity: 1 }];
    });
  }, []);
  const remove = useCallback((sku: string) => setItems((prev) => prev.filter((i) => i.sku !== sku)), []);
  const clear = useCallback(() => setItems([]), []);
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
