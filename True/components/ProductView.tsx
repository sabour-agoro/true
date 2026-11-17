"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  SIZES,
  firstAvailableSize,
  galleryOf,
  isSoldOut,
  productDescription,
  productName,
  type Product,
} from "@/data/products";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/store/cart-store";
import { useUi } from "@/store/ui-store";

export function ProductView({ product }: { product: Product }) {
  const { t, locale } = useI18n();
  const gallery = galleryOf(product);
  const [index, setIndex] = useState(0);
  const [size, setSize] = useState(firstAvailableSize(product));
  const [quantity, setQuantity] = useState(1);
  const addItem = useCart((state) => state.addItem);
  const showToast = useUi((state) => state.showToast);
  const openSizeGuide = useUi((state) => state.openSizeGuide);
  const name = productName(product, locale);
  const soldOut = isSoldOut(product);
  const available = size ? product.stock[size] : 0;
  const active = gallery[index] ?? gallery[0];

  useEffect(() => {
    if (size && quantity > product.stock[size]) setQuantity(Math.max(1, product.stock[size]));
  }, [product, quantity, size]);

  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get("taille");
    if (asked && SIZES.includes(asked as (typeof SIZES)[number]) && product.stock[asked as (typeof SIZES)[number]] > 0) {
      setSize(asked as (typeof SIZES)[number]);
    }
  }, [product]);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-28 pb-20 md:px-8 lg:grid-cols-2">
      <div>
        <div data-flight-target={product.slug} className="relative aspect-[4/5] bg-panel">
          <Image src={active.src} alt={`${name} — ${locale === "en" ? active.labelEn : active.label}`} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-contain p-6" />
        </div>
        <div className="mt-3 flex gap-2">
          {gallery.map((item, itemIndex) => (
            <button
              key={`${item.src}-${item.label}`}
              type="button"
              onClick={() => setIndex(itemIndex)}
              aria-label={locale === "en" ? item.labelEn : item.label}
              className={`relative h-20 w-16 bg-panel ${itemIndex === index ? "outline outline-1 outline-gold" : ""}`}
            >
              <Image src={item.src} alt="" fill sizes="64px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <h1 className="font-display text-[clamp(2.8rem,6vw,5.2rem)] leading-[0.88] uppercase">{name}</h1>
        <p className="mt-3 text-lg text-gold">{formatPrice(product.price, locale)}</p>
        <p className="mt-6 max-w-md leading-relaxed text-mist">{productDescription(product, locale)}</p>
        <p className="mt-4 text-sm text-bone/80">{t.product.fabric}</p>

        <p className="mt-8 text-[11px] tracking-[0.22em] text-mist uppercase">{t.product.size}</p>
        <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={t.product.size}>
          {SIZES.map((option) => {
            const empty = product.stock[option] === 0;
            return (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={size === option}
                disabled={empty}
                title={empty ? t.product.unavailable : undefined}
                onClick={() => setSize(option)}
                className={`h-11 min-w-11 border px-3 text-sm ${size === option ? "border-gold bg-gold text-ink" : "border-line"} disabled:cursor-not-allowed disabled:text-mist/40 disabled:line-through`}
              >
                {option}
              </button>
            );
          })}
        </div>
        {size && (
          <p className="mt-2 text-xs text-mist">
            {available} {t.product.stock}
          </p>
        )}

        <div className="mt-6 flex items-center gap-4">
          <span className="text-[11px] tracking-[0.18em] text-mist uppercase">{t.product.qty}</span>
          <button type="button" aria-label="-" className="h-10 w-10 border border-line" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={soldOut}>
            −
          </button>
          <span className="min-w-6 text-center">{soldOut ? 0 : quantity}</span>
          <button
            type="button"
            aria-label="+"
            className="h-10 w-10 border border-line"
            disabled={soldOut || quantity >= available}
            onClick={() => setQuantity((value) => Math.min(available, value + 1))}
          >
            +
          </button>
        </div>

        <button
          type="button"
          disabled={soldOut || !size || available < 1}
          className="mt-8 w-full bg-gold py-4 text-[12px] tracking-[0.28em] text-ink uppercase disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => {
            if (!size) return;
            const added = addItem(product.slug, size, quantity);
            if (added.ok) showToast(name, added.quantity);
          }}
        >
          {t.product.add}
        </button>
        <button
          type="button"
          disabled={soldOut}
          onClick={() => openSizeGuide(product.slug)}
          className="mt-3 w-full border border-line py-4 text-[12px] tracking-[0.22em] uppercase disabled:opacity-40"
        >
          {t.product.try}
        </button>
      </div>
    </div>
  );
}
