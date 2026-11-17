"use client";

import { create } from "zustand";

export type Locale = "fr" | "en";
export type Theme = "dark" | "light";

export type Flight = {
  slug: string;
  src: string;
  top: number;
  left: number;
  width: number;
  height: number;
};

type Toast = {
  id: number;
  name: string;
  quantity: number;
};

type UiState = {
  locale: Locale;
  theme: Theme;
  menuOpen: boolean;
  searchOpen: boolean;
  introDone: boolean;
  sizeGuideOpen: boolean;
  sizeGuideSlug: string | null;
  toast: Toast | null;
  flight: Flight | null;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setMenuOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setIntroDone: (done: boolean) => void;
  openSizeGuide: (slug?: string | null) => void;
  closeSizeGuide: () => void;
  showToast: (name: string, quantity: number) => void;
  clearToast: () => void;
  setFlight: (flight: Flight) => void;
  clearFlight: () => void;
};

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("true-theme", theme);
}

export const useUi = create<UiState>((set, get) => ({
  locale: "fr",
  theme: "dark",
  menuOpen: false,
  searchOpen: false,
  introDone: false,
  sizeGuideOpen: false,
  sizeGuideSlug: null,
  toast: null,
  flight: null,
  setLocale: (locale) => {
    if (typeof window !== "undefined") localStorage.setItem("true-locale", locale);
    set({ locale });
  },
  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    const theme = get().theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    set({ theme });
  },
  setMenuOpen: (menuOpen) => set(menuOpen ? { menuOpen: true, searchOpen: false } : { menuOpen: false }),
  setSearchOpen: (searchOpen) => set(searchOpen ? { searchOpen: true, menuOpen: false } : { searchOpen: false }),
  setIntroDone: (introDone) => set({ introDone }),
  openSizeGuide: (slug) => set({ sizeGuideOpen: true, sizeGuideSlug: slug ?? null, menuOpen: false }),
  closeSizeGuide: () => set({ sizeGuideOpen: false }),
  showToast: (name, quantity) => set({ toast: { id: Date.now(), name, quantity } }),
  clearToast: () => set({ toast: null }),
  setFlight: (flight) => set({ flight }),
  clearFlight: () => set({ flight: null }),
}));
