"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { eventName, getEvent, tierName } from "@/data/events";
import { getProduct, type Size } from "@/data/products";

export type PieceLine = {
  kind?: "piece";
  slug: string;
  size: Size;
  quantity: number;
};

export type TicketLine = {
  kind: "ticket";
  event: string;
  tier: string;
  quantity: number;
};

export type CartLine = PieceLine | TicketLine;

export function isTicketLine(line: CartLine): line is TicketLine {
  return line.kind === "ticket";
}

type CartState = {
  lines: CartLine[];
  wishlist: string[];
  addItem: (slug: string, size: Size, quantity?: number) => { ok: boolean; name: string; quantity: number };
  addTicket: (event: string, tier: string, quantity?: number) => { ok: boolean; name: string; quantity: number };
  setQuantity: (slug: string, size: Size, quantity: number) => void;
  setTicketQuantity: (event: string, tier: string, quantity: number) => void;
  removeLine: (slug: string, size: Size) => void;
  removeTicket: (event: string, tier: string) => void;
  toggleWish: (slug: string) => void;
  count: () => number;
  clear: () => void;
};

function samePiece(line: CartLine, slug: string, size: Size) {
  return !isTicketLine(line) && line.slug === slug && line.size === size;
}

function sameTicket(line: CartLine, event: string, tier: string) {
  return isTicketLine(line) && line.event === event && line.tier === tier;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      wishlist: [],
      addItem: (slug, size, quantity = 1) => {
        const product = getProduct(slug);
        if (!product) return { ok: false, name: "", quantity: 0 };
        const available = product.stock[size];
        if (available <= 0 || quantity <= 0) return { ok: false, name: product.name, quantity: 0 };

        let added = 0;
        set((state) => {
          const lines = state.lines.map((line) => ({ ...line }));
          const line = lines.find((item) => samePiece(item, slug, size));
          const current = line?.quantity ?? 0;
          const next = Math.min(available, current + quantity);
          added = next - current;
          if (added <= 0) return state;
          if (line && !isTicketLine(line)) line.quantity = next;
          else lines.push({ kind: "piece", slug, size, quantity: next });
          return { lines };
        });

        return { ok: added > 0, name: product.name, quantity: added };
      },
      addTicket: (eventSlug, tierId, quantity = 1) => {
        const event = getEvent(eventSlug);
        const tier = event?.tiers.find((item) => item.id === tierId);
        if (!event || !tier || tier.stock <= 0 || quantity <= 0) return { ok: false, name: "", quantity: 0 };

        let added = 0;
        set((state) => {
          const lines = state.lines.map((line) => ({ ...line }));
          const line = lines.find((item) => sameTicket(item, eventSlug, tierId));
          const current = line?.quantity ?? 0;
          const next = Math.min(tier.stock, current + quantity);
          added = next - current;
          if (added <= 0) return state;
          if (line && isTicketLine(line)) line.quantity = next;
          else lines.push({ kind: "ticket", event: eventSlug, tier: tierId, quantity: next });
          return { lines };
        });

        return { ok: added > 0, name: `${eventName(event, "fr")} · ${tierName(tier, "fr")}`, quantity: added };
      },
      setQuantity: (slug, size, quantity) => {
        const product = getProduct(slug);
        if (!product) return;
        const next = Math.max(0, Math.min(product.stock[size], quantity));
        set((state) => ({
          lines:
            next === 0
              ? state.lines.filter((line) => !samePiece(line, slug, size))
              : state.lines.map((line) => (samePiece(line, slug, size) ? { ...line, quantity: next } : line)),
        }));
      },
      setTicketQuantity: (eventSlug, tierId, quantity) => {
        const event = getEvent(eventSlug);
        const tier = event?.tiers.find((item) => item.id === tierId);
        if (!tier) return;
        const next = Math.max(0, Math.min(tier.stock, quantity));
        set((state) => ({
          lines:
            next === 0
              ? state.lines.filter((line) => !sameTicket(line, eventSlug, tierId))
              : state.lines.map((line) => (sameTicket(line, eventSlug, tierId) ? { ...line, quantity: next } : line)),
        }));
      },
      removeLine: (slug, size) =>
        set((state) => ({
          lines: state.lines.filter((line) => !samePiece(line, slug, size)),
        })),
      removeTicket: (event, tier) =>
        set((state) => ({
          lines: state.lines.filter((line) => !sameTicket(line, event, tier)),
        })),
      toggleWish: (slug) =>
        set((state) => ({
          wishlist: state.wishlist.includes(slug)
            ? state.wishlist.filter((item) => item !== slug)
            : [...state.wishlist, slug],
        })),
      count: () => get().lines.reduce((sum, line) => sum + line.quantity, 0),
      clear: () => set({ lines: [] }),
    }),
    {
      name: "true-cart",
      skipHydration: true,
    },
  ),
);
