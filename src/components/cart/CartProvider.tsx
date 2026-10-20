"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "scult.cart.v1";
export const MAX_QUANTITY = 20;

type Ctx = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  add: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (sku: string, quantity: number) => void;
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

  const add = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems((prev) => {
      const hit = prev.find((i) => i.sku === item.sku);
      if (hit) return prev.map((i) => (i.sku === item.sku ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + quantity) } : i));
      return [...prev, { ...item, quantity: Math.min(MAX_QUANTITY, quantity) }];
    });
    setOpen(true);
  }, []);
  const setQuantity = useCallback((sku: string, quantity: number) => {
    setItems((prev) => (quantity <= 0 ? prev.filter((i) => i.sku !== sku) : prev.map((i) => (i.sku === sku ? { ...i, quantity: Math.min(MAX_QUANTITY, quantity) } : i))));
  }, []);
  const remove = useCallback((sku: string) => setItems((prev) => prev.filter((i) => i.sku !== sku)), []);
  const clear = useCallback(() => setItems([]), []);
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
