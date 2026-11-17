"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { primaryImage, productName, products, type Product } from "@/data/products";
import { rememberFlight } from "@/lib/flight";
import { formatPrice, padIndex } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";

export function Portant() {
  const { t, locale } = useI18n();
  const offset = useMotionValue(2);
  const focusedValue = useMotionValue(0);
  const rotation = useMotionValue(0);
  const gap = useMotionValue(250);
  const target = useRef(2);
  const activeRef = useRef(2);
  const [active, setActive] = useState(2);
  const [focused, setFocused] = useState(false);
  const swipe = useRef({ x: 0, y: 0, offset: 2, armed: false, id: -1 });
  const spin = useRef({ x: 0, rot: 0, id: -1 });
  const reduce = useRef(false);

  useEffect(() => {
    reduce.current = prefersReducedMotion();
    const update = () => gap.set(window.innerWidth < 720 ? 168 : 250);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [gap]);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const current = offset.get();
      const next = current + (target.current - current) * (reduce.current ? 1 : 0.16);
      offset.set(Math.abs(next - target.current) < 0.001 ? target.current : next);
      const rounded = Math.max(0, Math.min(products.length - 1, Math.round(offset.get())));
      if (rounded !== activeRef.current) {
        activeRef.current = rounded;
        setActive(rounded);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [offset]);

  useEffect(() => {
    focusedValue.set(focused ? 1 : 0);
    if (!focused) rotation.set(0);
  }, [focused, focusedValue, rotation]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const section = document.getElementById("portant");
      if (!section?.contains(document.activeElement) && document.activeElement !== section) return;
      if (event.key === "ArrowRight") {
        target.current = Math.min(products.length - 1, activeRef.current + 1);
        setFocused(false);
      }
      if (event.key === "ArrowLeft") {
        target.current = Math.max(0, activeRef.current - 1);
        setFocused(false);
      }
      if (event.key === "Escape") setFocused(false);
      if (event.key === "Enter" && document.activeElement === section) setFocused(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const product = products[active];

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (focused) {
      spin.current = { x: event.clientX, rot: rotation.get(), id: event.pointerId };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (event.pointerType === "mouse") return;
    swipe.current = { x: event.clientX, y: event.clientY, offset: target.current, armed: false, id: event.pointerId };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (focused && spin.current.id === event.pointerId) {
      rotation.set(spin.current.rot + (event.clientX - spin.current.x) * 0.55);
      return;
    }
    if (focused) return;
    if (event.pointerType === "mouse") {
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      target.current = clamp(ratio) * (products.length - 1);
      return;
    }
    if (swipe.current.id !== event.pointerId) return;
    const dx = event.clientX - swipe.current.x;
    const dy = event.clientY - swipe.current.y;
    if (!swipe.current.armed) {
      if (Math.abs(dx) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        swipe.current.id = -1;
        return;
      }
      swipe.current.armed = true;
    }
    const width = event.currentTarget.getBoundingClientRect().width;
    target.current = clamp(swipe.current.offset - (dx / width) * (products.length - 1)) * (products.length - 1);
  }

  function onPointerUp() {
    spin.current.id = -1;
    swipe.current.id = -1;
    swipe.current.armed = false;
  }

  return (
    <section id="portant" tabIndex={0} aria-roledescription="carousel" aria-label={t.portant.title} className="relative min-h-[100svh] overflow-hidden bg-[#050505] text-white outline-none">
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,162,74,0.34),transparent_68%)] blur-3xl" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-36 w-36 -translate-x-1/2 -translate-y-[40%] rounded-full bg-ink blur-md" />

      <header className="relative z-10 px-6 pt-28 text-center">
        <h2 className="font-serif text-5xl tracking-[0.28em] uppercase md:text-6xl" style={{ paddingLeft: "0.28em" }}>
          {t.portant.title}
        </h2>
        <p className="mt-3 text-[12px] tracking-[0.28em] text-mist uppercase">
          {products.length} {t.portant.pieces} · Collection 01
        </p>
      </header>

      <div
        className="relative z-10 mt-6 h-[56vh] cursor-ew-resize touch-pan-y"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="absolute inset-x-0 top-[18%] h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
        {products.map((item, index) => (
          <Garment
            key={item.slug}
            product={item}
            index={index}
            offset={offset}
            gap={gap}
            focusedValue={focusedValue}
            rotation={rotation}
            label={productName(item, locale)}
            onChoose={() => {
              if (Math.round(offset.get()) !== index) {
                target.current = index;
                return;
              }
              setFocused(true);
            }}
          />
        ))}
      </div>

      <div className="relative z-10 -mt-2 px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={product.slug + (focused ? "-focus" : "")}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            <p className="font-serif text-3xl text-gold md:text-4xl">{productName(product, locale)}</p>
            <p className="mt-1 text-sm tracking-[0.16em] text-white/80">{formatPrice(product.price, locale)}</p>
            <Link
              href={`/produit/${product.slug}`}
              className="mt-3 inline-block text-[12px] tracking-[0.18em] text-white uppercase"
              onClick={(event) => {
                const node = document.getElementById(`rail-${product.slug}`);
                if (node) rememberFlight(product.slug, primaryImage(product), node);
                event.currentTarget.blur();
              }}
            >
              {focused ? t.portant.detail : t.portant.view} →
            </Link>
          </motion.div>
        </AnimatePresence>

        {focused && (
          <button type="button" onClick={() => setFocused(false)} className="mt-4 text-[11px] tracking-[0.2em] text-mist uppercase">
            {t.portant.close}
          </button>
        )}

        <p className="mt-8 text-[11px] tracking-[0.22em] text-mist uppercase">
          {padIndex(active + 1)} / {padIndex(products.length)}
        </p>
        <p className="mt-2 text-[11px] text-mist">{focused ? t.portant.turn : t.portant.help}</p>
        <div className="mt-4 flex justify-center gap-2" role="tablist">
          {products.map((item, index) => (
            <button
              key={item.slug}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={productName(item, locale)}
              onClick={() => {
                target.current = index;
                setFocused(false);
              }}
              className={`h-1.5 rounded-full transition-all ${index === active ? "w-6 bg-gold" : "w-1.5 bg-white/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Garment({
  product,
  index,
  offset,
  gap,
  focusedValue,
  rotation,
  label,
  onChoose,
}: {
  product: Product;
  index: number;
  offset: MotionValue<number>;
  gap: MotionValue<number>;
  focusedValue: MotionValue<number>;
  rotation: MotionValue<number>;
  label: string;
  onChoose: () => void;
}) {
  const x = useTransform([offset, gap], ([value, space]) => {
    const delta = index - Number(value);
    const push = Math.sign(delta) * Math.min(Math.abs(delta), 1) * 34;
    return delta * Number(space) + push;
  });
  const scale = useTransform([offset, focusedValue], ([value, focused]) => {
    const distance = Math.abs(index - Number(value));
    const resting = Math.max(0.68, 1.25 - distance * 0.36);
    return Number(focused) > 0.5 && distance < 0.5 ? 1.32 : resting;
  });
  const opacity = useTransform([offset, focusedValue], ([value, focused]) => {
    const distance = Math.abs(index - Number(value));
    if (Number(focused) > 0.5 && distance > 0.5) return 0;
    return Math.max(0.34, 1 - distance * 0.3);
  });
  const filter = useTransform(offset, (value) => {
    const distance = Math.abs(index - value);
    return `brightness(${Math.max(0.55, 1 - distance * 0.18)})`;
  });
  const spin = useTransform([offset, focusedValue, rotation], ([value, focused, angle]) => {
    return Number(focused) > 0.5 && Math.abs(index - Number(value)) < 0.5 ? Number(angle) : 0;
  });
  const front = product.images.front ?? product.images.back;

  return (
    <motion.button
      id={`rail-${product.slug}`}
      type="button"
      style={{ x, scale, opacity, filter, transformOrigin: "top center" }}
      className="absolute top-[18%] left-1/2 w-[210px] -ml-[105px] origin-top"
      onClick={onChoose}
      aria-label={label}
    >
      <svg viewBox="0 0 120 64" className="mx-auto h-11 w-[4.5rem] text-gold" aria-hidden="true">
        <path d="M60 6 a5 5 0 1 0 -5 5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M55 14 L60 18 L10 58 H110 L60 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
      <div className="relative -mt-2 h-[34vh] [perspective:900px]">
        <motion.div style={{ rotateY: spin, transformStyle: "preserve-3d" }} className="relative h-full w-full">
          <div className="absolute inset-0 [backface-visibility:hidden]">
            <Image src={front} alt={label} fill sizes="220px" className="object-contain object-top" />
          </div>
          <div className="absolute inset-0 [transform:rotateY(180deg)] [backface-visibility:hidden]">
            <Image src={product.images.back} alt="" fill sizes="220px" className="object-contain object-top" />
          </div>
        </motion.div>
      </div>
    </motion.button>
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}
