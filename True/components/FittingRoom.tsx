"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { TrashIcon } from "@/components/Icons";
import { Mannequin } from "@/components/Mannequin";
import {
  SIZES,
  firstAvailableSize,
  getProduct,
  isSoldOut,
  productName,
  products,
  type Size,
} from "@/data/products";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/store/cart-store";
import { useFitting } from "@/store/fitting-store";
import { useUi } from "@/store/ui-store";

export function FittingRoom({ initialSlug }: { initialSlug?: string }) {
  const { t, locale } = useI18n();
  const photoUrl = useFitting((state) => state.photoUrl);
  const photoFile = useFitting((state) => state.photoFile);
  const consent = useFitting((state) => state.consent);
  const selectedSlug = useFitting((state) => state.selectedSlug);
  const selectedSize = useFitting((state) => state.selectedSize);
  const tried = useFitting((state) => state.tried);
  const result = useFitting((state) => state.result);
  const status = useFitting((state) => state.status);
  const error = useFitting((state) => state.error);
  const setPhoto = useFitting((state) => state.setPhoto);
  const setConsent = useFitting((state) => state.setConsent);
  const select = useFitting((state) => state.select);
  const setStatus = useFitting((state) => state.setStatus);
  const setResult = useFitting((state) => state.setResult);
  const removeTried = useFitting((state) => state.removeTried);
  const reset = useFitting((state) => state.reset);
  const addItem = useCart((state) => state.addItem);
  const showToast = useUi((state) => state.showToast);

  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [split, setSplit] = useState(58);

  useEffect(() => {
    if (initialSlug) {
      const product = getProduct(initialSlug);
      const size = product && !isSoldOut(product) ? firstAvailableSize(product) : null;
      if (product && size) {
        select(product.slug, size);
        return;
      }
    }
    if (useFitting.getState().selectedSlug) return;
    const piece = products.find((item) => !isSoldOut(item));
    const size = piece ? firstAvailableSize(piece) : null;
    if (piece && size) select(piece.slug, size);
  }, [initialSlug, select]);

  useEffect(() => () => useFitting.getState().reset(), []);

  useEffect(() => {
    if (!cameraOn || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
  }, [cameraOn]);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
    } catch {
      setStatus("error", t.cabin.cameraError);
      cameraRef.current?.click();
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      setPhoto(new File([blob], "true-essayage.jpg", { type: "image/jpeg" }));
      stopCamera();
    }, "image/jpeg", 0.9);
  }

  async function tryOn() {
    if (!photoFile) {
      setStatus("error", t.cabin.missingPhoto);
      return;
    }
    if (!consent) {
      setStatus("error", t.cabin.missingConsent);
      return;
    }
    if (!selectedSlug || !selectedSize) {
      setStatus("error", t.cabin.missingPiece);
      return;
    }
    setStatus("loading");
    try {
      const body = new FormData();
      body.set("photo", photoFile);
      body.set("productId", selectedSlug);
      body.set("consent", "true");
      const response = await fetch("/api/tryon", { method: "POST", body });
      const data = (await response.json().catch(() => ({}))) as { image?: string; mode?: "demo" | "live"; error?: string };
      if (!response.ok || !data.image || !data.mode) {
        setStatus("error", data.error || t.cabin.need);
        return;
      }
      setResult({ slug: selectedSlug, size: selectedSize, image: data.image, mode: data.mode });
    } catch {
      setStatus("error", t.cabin.need);
    }
  }

  const selected = selectedSlug ? getProduct(selectedSlug) : undefined;

  return (
    <aside className="h-fit rounded-[22px] bg-panel p-5 lg:sticky lg:top-24">
      <h2 className="font-serif text-3xl tracking-[0.12em]">{t.cabin.title}</h2>
      <p className="mt-6 text-[11px] tracking-[0.24em] text-gold uppercase">{t.cabin.mannequin}</p>
      <div className="mt-3">
        <Mannequin />
      </div>
      <p className="mt-3 text-center text-xs text-mist">{t.cabin.mannequinHint}</p>

      <p className="mt-6 text-[11px] tracking-[0.24em] text-gold uppercase">{t.cabin.photo}</p>
      <div
        className="mt-3 rounded-xl border border-dashed border-gold/70 p-4 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file?.type.startsWith("image/")) setPhoto(file);
        }}
      >
        <button type="button" onClick={() => fileRef.current?.click()} className="w-full">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="mx-auto max-h-56 w-full object-contain" />
          ) : (
            <p className="font-serif text-xl">{t.cabin.hint}</p>
          )}
          <p className="mt-2 text-xs text-mist">{t.cabin.tips}</p>
        </button>
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" onClick={() => fileRef.current?.click()} className="border border-gold/70 px-4 py-2 text-[11px] tracking-[0.16em] text-gold uppercase">
            {t.cabin.import}
          </button>
          <button type="button" onClick={openCamera} className="border border-line px-4 py-2 text-[11px] tracking-[0.16em] uppercase">
            {t.cabin.camera}
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) setPhoto(file);
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="user"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) setPhoto(file);
          }}
        />
      </div>

      <label className="mt-4 flex items-start gap-3 text-xs leading-relaxed text-mist">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-0.5 accent-[#C9A24A]"
        />
        {t.cabin.consent}
      </label>

      <p className="mt-8 text-[11px] tracking-[0.24em] text-gold uppercase">{t.cabin.available}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {products.map((product) => {
          const soldOut = isSoldOut(product);
          const active = selectedSlug === product.slug;
          return (
            <button
              key={product.slug}
              type="button"
              disabled={soldOut}
              onClick={() => select(product.slug, firstAvailableSize(product))}
              className={`relative aspect-[3/4] overflow-hidden rounded-lg bg-panel ${active ? "outline outline-1 outline-gold" : ""} ${soldOut ? "cursor-not-allowed" : ""}`}
            >
              <Image
                src={product.images.back}
                alt={productName(product, locale)}
                fill
                sizes="100px"
                className="object-contain p-1"
              />
            </button>
          );
        })}
      </div>

      {selected && selectedSize && (
        <div className="mt-4">
          <p className="font-serif text-xl">{productName(selected, locale)}</p>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={t.product.size}>
            {SIZES.map((size) => {
              const empty = selected.stock[size] === 0;
              return (
                <button
                  key={size}
                  type="button"
                  role="radio"
                  aria-checked={selectedSize === size}
                  disabled={empty}
                  onClick={() => select(selected.slug, size)}
                  className={`h-9 min-w-9 border px-2 text-xs ${selectedSize === size ? "border-gold text-gold" : "border-line text-bone"} disabled:text-mist/40`}
                >
                  {size}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-mist">
            {selected.stock[selectedSize]} {t.cabin.stock} · {selectedSize}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={tryOn}
        disabled={status === "loading"}
        className="mt-6 w-full bg-gold py-4 text-[12px] tracking-[0.28em] text-ink uppercase disabled:opacity-60"
      >
        {status === "loading" ? t.cabin.dressing : t.cabin.try}
      </button>
      {error && <p className="mt-3 text-sm text-gold-soft">{error}</p>}

      {result && photoUrl && (
        <div className="mt-6">
          <div className="relative aspect-[3/4] overflow-hidden bg-panel">
            <img src={result.image} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            </div>
            <span className="absolute top-2 left-2 text-[10px] tracking-[0.16em] text-bone uppercase">{t.cabin.before}</span>
            <span className="absolute top-2 right-2 text-[10px] tracking-[0.16em] text-bone uppercase">{t.cabin.after}</span>
          </div>
          <label className="sr-only" htmlFor="compare">
            {t.cabin.compare}
          </label>
          <input
            id="compare"
            type="range"
            min={5}
            max={95}
            value={split}
            onChange={(event) => setSplit(Number(event.target.value))}
            className="mt-3 w-full accent-[#C9A24A]"
          />
          {result.mode === "demo" && <p className="mt-2 text-xs text-mist">{t.cabin.demo}</p>}
          <button
            type="button"
            className="mt-4 w-full border border-gold py-3 text-[11px] tracking-[0.22em] text-gold uppercase"
            onClick={() => {
              const added = addItem(result.slug, result.size as Size, 1);
              const piece = getProduct(result.slug);
              if (added.ok && piece) showToast(productName(piece, locale), added.quantity);
            }}
          >
            {t.cabin.add}
          </button>
        </div>
      )}

      <p className="mt-8 text-[11px] tracking-[0.24em] text-gold uppercase">{t.cabin.choices}</p>
      <ul className="mt-3 space-y-2">
        {tried.map((item) => {
          const piece = getProduct(item.slug);
          if (!piece) return null;
          return (
            <li key={item.slug} className="flex items-center justify-between gap-3 text-sm">
              <span>
                {productName(piece, locale)} · {item.size}
              </span>
              <button type="button" aria-label={t.cabin.remove} onClick={() => removeTried(item.slug)} className="text-mist hover:text-gold">
                <TrashIcon className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={reset} className="mt-4 text-[11px] tracking-[0.18em] text-mist uppercase">
        {t.cabin.restart}
      </button>
      <p className="mt-6 text-xs text-mist">{t.cabin.privacy}</p>

      {cameraOn && (
        <div className="fixed inset-0 z-[75] grid place-items-center bg-ink/90 p-4">
          <div className="w-full max-w-md">
            <video ref={videoRef} autoPlay playsInline muted className="aspect-[3/4] w-full bg-black object-cover" />
            <div className="mt-4 flex justify-center gap-3">
              <button type="button" onClick={capture} className="bg-gold px-5 py-3 text-[11px] tracking-[0.2em] text-ink uppercase">
                {t.cabin.capture}
              </button>
              <button type="button" onClick={stopCamera} className="border border-line px-5 py-3 text-[11px] tracking-[0.2em] uppercase">
                {t.cabin.closeCamera}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
