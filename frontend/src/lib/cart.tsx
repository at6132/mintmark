"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  company?: string;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const KEY = "mintmark-cart-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = items.reduce((n, i) => n + i.quantity * i.price, 0);
    return {
      items,
      count,
      subtotal,
      addItem: (item, qty = 1) => {
        setItems((prev) => {
          const existing = prev.find((p) => p.id === item.id);
          if (existing) {
            return prev.map((p) => (p.id === item.id ? { ...p, quantity: p.quantity + qty } : p));
          }
          return [...prev, { ...item, quantity: qty }];
        });
      },
      setQuantity: (id, quantity) => {
        setItems((prev) =>
          prev
            .map((p) => (p.id === id ? { ...p, quantity } : p))
            .filter((p) => p.quantity > 0),
        );
      },
      removeItem: (id) => setItems((prev) => prev.filter((p) => p.id !== id)),
      clear: () => setItems([]),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
