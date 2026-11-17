"use client";

import { create } from "zustand";
import type { Size } from "@/data/products";

export type TryResult = {
  slug: string;
  size: Size;
  image: string;
  mode: "demo" | "live";
};

type Tried = { slug: string; size: Size };

type FittingState = {
  photoUrl: string | null;
  photoFile: File | null;
  consent: boolean;
  selectedSlug: string | null;
  selectedSize: Size | null;
  tried: Tried[];
  result: TryResult | null;
  status: "idle" | "loading" | "done" | "error";
  error: string | null;
  setPhoto: (file: File) => void;
  setConsent: (consent: boolean) => void;
  select: (slug: string, size: Size | null) => void;
  setStatus: (status: FittingState["status"], error?: string | null) => void;
  setResult: (result: TryResult) => void;
  removeTried: (slug: string) => void;
  reset: () => void;
};

function revoke(url: string | null) {
  if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
}

export const useFitting = create<FittingState>((set, get) => ({
  photoUrl: null,
  photoFile: null,
  consent: false,
  selectedSlug: null,
  selectedSize: null,
  tried: [],
  result: null,
  status: "idle",
  error: null,
  setPhoto: (file) => {
    revoke(get().photoUrl);
    set({
      photoFile: file,
      photoUrl: URL.createObjectURL(file),
      result: null,
      status: "idle",
      error: null,
    });
  },
  setConsent: (consent) => set({ consent }),
  select: (slug, size) => set({ selectedSlug: slug, selectedSize: size, error: null }),
  setStatus: (status, error = null) => set({ status, error }),
  setResult: (result) =>
    set((state) => ({
      result,
      status: "done",
      error: null,
      tried: state.tried.some((item) => item.slug === result.slug)
        ? state.tried
        : [...state.tried, { slug: result.slug, size: result.size }],
    })),
  removeTried: (slug) =>
    set((state) => ({
      tried: state.tried.filter((item) => item.slug !== slug),
      result: state.result?.slug === slug ? null : state.result,
      selectedSlug: state.selectedSlug === slug ? null : state.selectedSlug,
    })),
  reset: () => {
    revoke(get().photoUrl);
    set({
      photoUrl: null,
      photoFile: null,
      consent: false,
      selectedSlug: null,
      selectedSize: null,
      tried: [],
      result: null,
      status: "idle",
      error: null,
    });
  },
}));
