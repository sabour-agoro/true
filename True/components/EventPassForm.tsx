"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { events } from "@/data/events";
import { firstAvailableSize, isSoldOut, primaryImage, productName, products, type Size } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { PASS_PRICE, PASS_START, PASS_STEP } from "@/lib/pass-rules";

type Saved = {
  code: string;
  name: string;
  email?: string;
  outfit: string;
  size: Size;
  paid: number;
  remaining: number;
  unlocked: boolean;
};

type CheckoutPayload = {
  checkout?: boolean;
  code?: string;
  amount?: number;
  description?: string;
  phone?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  publicKey?: string;
  metadata?: Record<string, string>;
  url?: string;
  error?: string;
};

function loadFedaPay() {
  const existing = (window as unknown as { FedaPay?: { init: (options: object) => { open: () => void } } }).FedaPay;
  if (existing) return Promise.resolve(existing);
  return new Promise<{ init: (options: object) => { open: () => void } }>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.fedapay.com/checkout.js?v=1.1.7";
    script.async = true;
    script.onload = () => {
      const loaded = (window as unknown as { FedaPay?: { init: (options: object) => { open: () => void } } }).FedaPay;
      if (loaded) resolve(loaded);
      else reject(new Error("missing"));
    };
    script.onerror = () => reject(new Error("load"));
    document.body.appendChild(script);
  });
}

export function EventPassForm() {
  const { t, locale } = useI18n();
  const night = events[0];
  const open = products.filter((product) => !isSoldOut(product));
  const [outfit, setOutfit] = useState(open[0]?.slug ?? "");
  const [size, setSize] = useState<Size | "">(open[0] ? firstAvailableSize(open[0]) ?? "" : "");

  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"full" | "part">("full");
  const [amount, setAmount] = useState(PASS_START);
  const [method, setMethod] = useState<"mixx" | "flooz">("mixx");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [saved, setSaved] = useState<Saved | null>(null);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);

  const piece = products.find((product) => product.slug === (saved?.outfit ?? outfit));
  const paid = saved?.paid ?? 0;
  const remaining = saved?.remaining ?? PASS_PRICE;
  const due = mode === "full" ? remaining : Math.min(amount, remaining);

  useEffect(() => {
    const initial = new URLSearchParams(window.location.search).get("code");
    if (initial) {
      setCode(initial);
      void lookup(initial);
    }
    // The code in the address is the only resume signal on first paint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function chooseOutfit(slug: string) {
    const product = products.find((item) => item.slug === slug);
    setOutfit(slug);
    setSize(product ? firstAvailableSize(product) ?? "" : "");
    setSaved(null);
  }

  async function lookup(value = code) {
    setError(null);
    const response = await fetch(`/api/passes?code=${encodeURIComponent(value)}`);
    const data = (await response.json().catch(() => ({}))) as Saved & { error?: string };
    if (!response.ok) {
      setSaved(null);
      setError(t.event.badCode);
      return;
    }
    setSaved(data);
    setStep(2);
    setEmail(data.email ?? "");
    setOutfit(data.outfit);
    setSize(data.size);
    const nextMin = data.paid > 0 ? Math.min(PASS_STEP, data.remaining) : Math.min(PASS_START, data.remaining);
    setAmount(nextMin);
    if (data.paid > 0) setMode("part");
  }

  async function pay() {
    if (paying || remaining <= 0) return;
    setPaying(true);
    setError(null);
    try {
      const response = await fetch("/api/passes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          email,
          outfit: saved?.outfit ?? outfit,
          size: saved?.size ?? size,
          mode,
          amount: due,
          method,
          phone,
          code: saved?.code,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as CheckoutPayload;
      if (data.code) setCode(data.code);
      if (!response.ok || (!data.url && !data.checkout)) {
        setError(messageFor(data.error, t.event, t.cart.phoneInvalid));
        setPaying(false);
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      if (data.checkout && data.publicKey && data.amount && data.code && data.phone) {
        const fedapay = await loadFedaPay();
        const widget = fedapay.init({
          public_key: data.publicKey,
          environment: (data as CheckoutPayload & { environment?: string }).environment ?? "live",
          locale,
          currency: { iso: "XOF" },
          transaction: {
            amount: data.amount,
            description: data.description,
            custom_metadata: data.metadata ?? { code: data.code },
          },
          customer: {
            email: data.email,
            firstname: data.firstname,
            lastname: data.lastname,
            phone_number: { number: data.phone, country: "tg" },
          },
          onComplete(result: { transaction?: { id?: number | string; status?: string } }) {
            const id = result?.transaction?.id;
            if (id) {
              window.location.assign(`/evenements/suivi?code=${data.code}&tx=${id}`);
              return;
            }
            setPaying(false);
          },
        });
        widget.open();
        setPaying(false);
        return;
      }
      window.location.assign(data.url ?? "/evenements");
    } catch {
      setError(t.event.payError);
      setPaying(false);
    }
  }

  const minPart = paid === 0 ? PASS_START : Math.min(PASS_STEP, remaining);

  return (
    <div>
      <p className="text-[11px] tracking-[0.22em] text-gold uppercase">0{step} / 02</p>
      <h1 className="mt-3 font-display text-5xl leading-none uppercase md:text-6xl">{step === 1 ? t.event.outfit : t.event.take}</h1>
      <p className="mt-3 text-sm text-mist">{formatPrice(night.tiers[0]?.price ?? PASS_PRICE, locale)} · {t.event.passNote}</p>

      {step === 1 && (
        <>
          <div className="mt-8 grid grid-cols-3 gap-2">
            {open.map((product) => (
              <button
                key={product.slug}
                type="button"
                onClick={() => chooseOutfit(product.slug)}
                className={`relative aspect-[3/4] overflow-hidden bg-panel ${product.slug === outfit ? "outline outline-1 outline-bone" : ""}`}
              >
                <Image src={primaryImage(product)} alt={productName(product, locale)} fill sizes="120px" className="object-contain p-1" />
              </button>
            ))}
          </div>
          {piece && <p className="mt-3 font-serif text-xl">{productName(piece, locale)}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {piece &&
              (Object.keys(piece.stock) as Size[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  disabled={piece.stock[option] < 1}
                  onClick={() => setSize(option)}
                  className={`h-10 min-w-10 border px-2 text-sm ${option === size ? "border-gold text-gold" : "border-line"} disabled:cursor-not-allowed disabled:line-through disabled:opacity-30`}
                >
                  {option}
                </button>
              ))}
          </div>
          <button type="button" disabled={!size} onClick={() => setStep(2)} className="mt-8 w-full bg-gold py-4 text-[12px] tracking-[0.24em] text-ink uppercase disabled:opacity-40">
            {t.event.next}
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <button type="button" onClick={() => setStep(1)} className="mt-6 text-[11px] tracking-[0.16em] text-gold uppercase">
            ← {t.event.back}
          </button>
          {piece && (
            <p className="mt-4 text-sm text-mist">
              {productName(piece, locale)} · {saved?.size ?? size}
            </p>
          )}
          {!saved && (
            <>
              <label className="mt-4 block text-sm text-mist">
                {t.event.mail}
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-bone outline-none" />
              </label>
            </>
          )}

          <label className="mt-6 block text-[11px] tracking-[0.18em] text-gold uppercase">
            {t.event.resume}
            <span className="mt-2 flex gap-2 normal-case">
              <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} className="w-full border border-line bg-transparent px-3 py-3 tracking-[0.16em] text-bone outline-none" />
              <button type="button" onClick={() => lookup()} className="border border-gold px-4 text-[11px] tracking-[0.16em] text-gold uppercase">
                {t.event.find}
              </button>
            </span>
          </label>
          {saved && (
            <p className="mt-4 text-sm text-bone">
              {t.event.paidLabel} {formatPrice(saved.paid, locale)} · {t.event.remainLabel} {formatPrice(saved.remaining, locale)}
            </p>
          )}

          <div className="mt-8 grid gap-2 sm:grid-cols-2">
            {(["full", "part"] as const).map((option) => (
              <button key={option} type="button" onClick={() => setMode(option)} className={`border px-3 py-3 text-left ${mode === option ? "border-bone" : "border-line"}`}>
                <span className="block text-[11px] tracking-[0.16em] uppercase">{option === "full" ? t.event.full : t.event.part}</span>
                <span className="mt-1 block text-sm text-mist">{option === "full" ? t.event.fullNote : t.event.partNote}</span>
              </button>
            ))}
          </div>
          {mode === "part" && remaining > 0 && (
            <div className="mt-4 flex items-center justify-between border border-line px-4 py-3">
              <button type="button" aria-label={t.cart.decrease} className="h-10 w-10 border border-line" disabled={amount <= minPart} onClick={() => setAmount((value) => Math.max(minPart, value - PASS_STEP))}>
                −
              </button>
              <span>{formatPrice(Math.min(amount, remaining), locale)}</span>
              <button type="button" aria-label={t.cart.increase} className="h-10 w-10 border border-line" disabled={amount >= remaining} onClick={() => setAmount((value) => Math.min(remaining, value + PASS_STEP))}>
                +
              </button>
            </div>
          )}
          <p className="mt-8 text-[11px] tracking-[0.22em] text-gold uppercase">{t.cart.method}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {(["mixx", "flooz"] as const).map((option) => (
              <button key={option} type="button" onClick={() => setMethod(option)} className={`border px-3 py-3 text-[11px] tracking-[0.16em] uppercase ${method === option ? "border-bone" : "border-line"}`}>
                {t.cart[option]}
              </button>
            ))}
          </div>
          <label className="mt-4 block text-sm text-mist">
            {t.cart.phone}
            <input inputMode="numeric" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="90 00 00 00" className="mt-2 w-full border border-line bg-transparent px-3 py-3 text-bone outline-none" />
          </label>
          <button type="button" disabled={paying || remaining <= 0 || !size} onClick={pay} className="mt-6 w-full bg-gold py-4 text-[12px] tracking-[0.24em] text-ink uppercase disabled:cursor-not-allowed disabled:opacity-40">
            {remaining <= 0 ? t.event.unlocked : paying ? t.event.paying : `${t.event.pay} · ${formatPrice(due, locale)}`}
          </button>
          <p className="mt-3 text-sm text-mist">{error ?? (remaining <= 0 ? t.event.unlockedNote : t.event.keep)}</p>
        </>
      )}
    </div>
  );
}

function messageFor(
  error: string | undefined,
  copy: { badCode: string; badName: string; badMail: string; badOutfit: string; badAmount: string; payError: string },
  phoneInvalid: string,
) {
  if (error === "code") return copy.badCode;
  if (error === "email") return copy.badMail;
  if (error === "name") return copy.badName;
  if (error === "outfit") return copy.badOutfit;
  if (error === "amount" || error === "paid") return copy.badAmount;
  if (error === "phone") return phoneInvalid;
  return copy.payError;
}
