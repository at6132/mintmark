"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";

export type WantItem = { id: string; name: string; ticker?: string; accent?: string };

type Ctx = {
  items: WantItem[];
  has: (id: string) => boolean;
  toggle: (item: WantItem) => void;
  remove: (id: string) => void;
};

const WantListContext = createContext<Ctx | null>(null);
const keyFor = (memberId: string) => `mm-bookshelf:${memberId}`;

/** The member's Bookshelf — the want list behind the conveyor's second belt. */
export function WantListProvider({ children }: { children: React.ReactNode }) {
  const { member } = useAuth();
  const [items, setItems] = useState<WantItem[]>([]);

  useEffect(() => {
    if (!member) { setItems([]); return; }
    try {
      const raw = window.localStorage.getItem(keyFor(member.id));
      setItems(raw ? (JSON.parse(raw) as WantItem[]) : []);
    } catch {
      setItems([]);
    }
  }, [member]);

  const persist = useCallback((next: WantItem[]) => {
    setItems(next);
    if (!member) return;
    try {
      window.localStorage.setItem(keyFor(member.id), JSON.stringify(next));
    } catch {
      /* storage full or blocked — the list still works for this session */
    }
  }, [member]);

  const value = useMemo<Ctx>(() => ({
    items,
    has: (id) => items.some((i) => i.id === id),
    toggle: (item) =>
      persist(items.some((i) => i.id === item.id)
        ? items.filter((i) => i.id !== item.id)
        : [...items, item]),
    remove: (id) => persist(items.filter((i) => i.id !== id)),
  }), [items, persist]);

  return <WantListContext.Provider value={value}>{children}</WantListContext.Provider>;
}

export function useWantList() {
  const ctx = useContext(WantListContext);
  if (!ctx) throw new Error("useWantList must be used within WantListProvider");
  return ctx;
}
