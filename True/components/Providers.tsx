"use client";

import "lenis/dist/lenis.css";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { SizeGuide } from "@/components/SizeGuide";
import { useCart } from "@/store/cart-store";
import { useUi } from "@/store/ui-store";

const CartReadyContext = createContext(false);

export function useCartReady() {
  return useContext(CartReadyContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [cartReady, setCartReady] = useState(false);

  useEffect(() => {
    const theme = localStorage.getItem("true-theme") === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    useUi.setState({ theme });
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let destroy: (() => void) | undefined;
    let cancelled = false;

    void import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis();
      const loop = (time: number) => {
        lenis.raf(time);
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
      destroy = () => lenis.destroy();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      destroy?.();
    };
  }, []);

  useEffect(() => {
    const markReady = () => setCartReady(true);
    if (useCart.persist.hasHydrated()) {
      markReady();
      return;
    }
    const unsubscribe = useCart.persist.onFinishHydration(markReady);
    useCart.persist.rehydrate();
    return unsubscribe;
  }, []);

  return (
    <CartReadyContext.Provider value={cartReady}>
      <I18nProvider>
        {children}
        <SizeGuide />
        <FlightLayer />
        <ToastViewport />
      </I18nProvider>
    </CartReadyContext.Provider>
  );
}

function FlightLayer() {
  const flight = useUi((state) => state.flight);
  const clearFlight = useUi((state) => state.clearFlight);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!flight || !imageRef.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      clearFlight();
      return;
    }

    let cancelled = false;
    const started = performance.now();

    const watch = () => {
      if (cancelled) return;
      const target = document.querySelector<HTMLElement>(`[data-flight-target="${flight.slug}"]`);
      if (!target) {
        if (performance.now() - started > 1600) clearFlight();
        else requestAnimationFrame(watch);
        return;
      }

      const dest = target.getBoundingClientRect();
      target.style.opacity = "0";
      const animation = imageRef.current?.animate(
        [
          { top: `${flight.top}px`, left: `${flight.left}px`, width: `${flight.width}px`, height: `${flight.height}px` },
          { top: `${dest.top}px`, left: `${dest.left}px`, width: `${dest.width}px`, height: `${dest.height}px` },
        ],
        { duration: 700, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" },
      );
      animation?.addEventListener("finish", () => {
        target.style.opacity = "1";
        clearFlight();
      });
    };

    const frame = requestAnimationFrame(watch);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [flight, clearFlight]);

  if (!flight) return null;

  return (
    <img
      ref={imageRef}
      src={flight.src}
      alt=""
      aria-hidden="true"
      className="pointer-events-none fixed z-[60] object-contain"
      style={{ top: flight.top, left: flight.left, width: flight.width, height: flight.height }}
    />
  );
}

function ToastViewport() {
  const toast = useUi((state) => state.toast);
  const clearToast = useUi((state) => state.clearToast);
  const { t } = useI18n();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, 4200);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-20 right-4 z-[70] w-[min(100%-2rem,320px)] border border-gold/50 bg-ink/90 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-md"
    >
      <p className="text-sm text-bone">
        {toast.quantity} × {toast.name} {t.toast.added}
      </p>
      <Link href="/panier" className="mt-2 inline-block text-[11px] tracking-[0.22em] text-gold uppercase">
        {t.toast.view}
      </Link>
    </div>
  );
}
