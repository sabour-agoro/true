"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { eventName, getEvent, tierName } from "@/data/events";
import { getProduct, primaryImage, productName } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useCartReady } from "@/components/Providers";
import { isTicketLine, useCart } from "@/store/cart-store";
import { HorizonMark } from "@/components/marks";

export function CartView() {
  const { t, locale } = useI18n();
  const cartReady = useCartReady();
  const lines = useCart((state) => state.lines);
  const setQuantity = useCart((state) => state.setQuantity);
  const setTicketQuantity = useCart((state) => state.setTicketQuantity);
  const removeLine = useCart((state) => state.removeLine);
  const removeTicket = useCart((state) => state.removeTicket);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [method, setMethod] = useState<"mixx" | "flooz">("mixx");
  const [phone, setPhone] = useState("");

  const pieces = lines.flatMap((line) => {
    if (isTicketLine(line)) return [];
    const product = getProduct(line.slug);
    return product ? [{ line, product }] : [];
  });

  const tickets = lines.flatMap((line) => {
    if (!isTicketLine(line)) return [];
    const event = getEvent(line.event);
    const tier = event?.tiers.find((item) => item.id === line.tier);
    return event && tier ? [{ line, event, tier }] : [];
  });

  const subtotal =
    pieces.reduce((sum, item) => sum + item.product.price * item.line.quantity, 0) +
    tickets.reduce((sum, item) => sum + item.tier.price * item.line.quantity, 0);

  const isEmpty = pieces.length === 0 && tickets.length === 0;
  const unpriced = pieces.some((item) => item.product.price <= 0) || tickets.some((item) => item.tier.price <= 0);

  async function pay() {
    if (unpriced || subtotal <= 0 || paying) return;
    setPaying(true);
    setPayError(null);
    const payload = {
      locale,
      pieces: pieces.map((item) => ({ slug: item.line.slug, size: item.line.size, quantity: item.line.quantity })),
      tickets: tickets.map((item) => ({ event: item.line.event, tier: item.line.tier, quantity: item.line.quantity })),
    };
    try {
      const response = await fetch("/api/fedapay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, method, phone }),
      });
      const data = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        const message =
          data.error === "phone"
            ? t.cart.phoneInvalid
            : data.error === "config"
              ? t.cart.config
              : data.error === "auth"
                ? t.cart.auth
                : data.error === "unpriced"
                ? t.cart.unpriced
                : t.cart.payError;
        setPayError(message);
        setPaying(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setPayError(t.cart.payError);
      setPaying(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pt-28 pb-20 md:px-8">
      <h1 className="font-display text-[clamp(3.5rem,11vw,7.5rem)] leading-[0.84] uppercase">{t.cart.title}</h1>

      {!cartReady ? (
        <div className="mt-16 h-40" />
      ) : isEmpty ? (
        <div className="mt-16 text-center">
          <HorizonMark className="mx-auto h-20 w-44" />
          <p className="mt-6 font-serif text-2xl text-mist">{t.cart.empty}</p>
          <Link href="/shop" className="mt-8 inline-block border border-gold px-6 py-3 text-[11px] tracking-[0.24em] text-gold uppercase">
            {t.cart.shop}
          </Link>
        </div>
      ) : (
        <div className="mt-10">
          <ul className="divide-y divide-line">
            {pieces.map(({ line, product }) => (
              <li key={`${line.slug}-${line.size}`} className="flex gap-4 py-5">
                <div className="relative h-28 w-24 shrink-0 bg-panel">
                  <Image src={primaryImage(product)} alt="" fill sizes="96px" className="object-contain p-1" />
                </div>
                <div className="flex flex-1 flex-col">
                  <Link href={`/produit/${product.slug}`} className="font-serif text-2xl hover:text-gold">
                    {productName(product, locale)}
                  </Link>
                  <p className="text-sm text-mist">
                    {t.cart.size} {line.size}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label={t.cart.decrease} className="h-8 w-8 border border-line" onClick={() => setQuantity(line.slug, line.size, line.quantity - 1)}>
                        −
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={t.cart.increase}
                        className="h-8 w-8 border border-line"
                        disabled={line.quantity >= product.stock[line.size]}
                        onClick={() => setQuantity(line.slug, line.size, line.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <p>{formatPrice(product.price * line.quantity, locale)}</p>
                  </div>
                </div>
                <button type="button" aria-label={t.cart.remove} className="self-start text-[11px] tracking-[0.14em] text-mist uppercase" onClick={() => removeLine(line.slug, line.size)}>
                  {t.cart.remove}
                </button>
              </li>
            ))}
            {tickets.map(({ line, event, tier }) => (
              <li key={`${line.event}-${line.tier}`} className="flex gap-4 py-5">
                <div className="relative h-28 w-24 shrink-0 overflow-hidden bg-panel">
                  <Image src={event.poster} alt="" fill sizes="96px" className="object-cover" />
                </div>
                <div className="flex flex-1 flex-col">
                  <Link href="/evenements" className="font-serif text-2xl hover:text-gold">
                    {eventName(event, locale)}
                  </Link>
                  <p className="text-sm text-mist">
                    {t.cart.ticket} · {tierName(tier, locale)}
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button type="button" aria-label={t.cart.decrease} className="h-8 w-8 border border-line" onClick={() => setTicketQuantity(line.event, line.tier, line.quantity - 1)}>
                        −
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={t.cart.increase}
                        className="h-8 w-8 border border-line"
                        disabled={line.quantity >= tier.stock}
                        onClick={() => setTicketQuantity(line.event, line.tier, line.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <p>{formatPrice(tier.price * line.quantity, locale)}</p>
                  </div>
                </div>
                <button type="button" aria-label={t.cart.remove} className="self-start text-[11px] tracking-[0.14em] text-mist uppercase" onClick={() => removeTicket(line.event, line.tier)}>
                  {t.cart.remove}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
            <span className="tracking-[0.16em] text-mist uppercase">{t.cart.subtotal}</span>
            <span className="font-serif text-3xl">{formatPrice(subtotal, locale)}</span>
          </div>
          <p className="mt-8 text-[11px] tracking-[0.22em] text-gold uppercase">{t.cart.method}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(["mixx", "flooz"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMethod(option)}
                className={`border px-3 py-3 text-[11px] tracking-[0.16em] uppercase ${method === option ? "border-gold text-gold" : "border-line text-bone"}`}
              >
                {t.cart[option]}
              </button>
            ))}
          </div>
          <label className="mt-4 block text-sm text-mist">
            {t.cart.phone}
            <input
              inputMode="numeric"
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="90 00 00 00"
              className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-bone outline-none placeholder:text-mist"
            />
          </label>
          <button
            type="button"
            disabled={paying || subtotal <= 0 || unpriced}
            onClick={pay}
            className="mt-6 w-full rounded-full bg-gold py-4 text-[12px] tracking-[0.24em] text-ink uppercase disabled:cursor-not-allowed disabled:bg-gold/40"
          >
            {paying ? t.cart.paying : t.cart.checkout}
          </button>
          <p className="mt-3 text-sm text-mist">{payError ?? (unpriced ? t.cart.unpriced : t.cart.mobileNote)}</p>
        </div>
      )}
    </div>
  );
}
