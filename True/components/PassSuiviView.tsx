"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";

type PassData = {
  code: string;
  name: string;
  email?: string;
  outfit: string;
  size: string;
  total: number;
  paid: number;
  remaining: number;
  unlocked: boolean;
  pending?: { ref: string; amount: number; method: string } | null;
};

export function PassSuiviView({
  initialPass,
  outfitName,
  initialQrUrl,
}: {
  initialPass: PassData;
  outfitName: string;
  initialQrUrl?: string | null;
}) {
  const [pass, setPass] = useState<PassData>(initialPass);
  const qrUrl = initialQrUrl ?? null;
  const [isPolling, setIsPolling] = useState(!initialPass.unlocked);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-polling for Mobile Money validation
  useEffect(() => {
    if (pass.unlocked) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts += 1;
      if (attempts > 30) {
        clearInterval(interval);
        setIsPolling(false);
        return;
      }

      try {
        const res = await fetch(`/api/passes?code=${encodeURIComponent(pass.code)}`);
        if (res.ok) {
          const data = (await res.json()) as PassData;
          if (data && (data.paid !== pass.paid || data.unlocked !== pass.unlocked)) {
            setPass(data);
            if (data.unlocked) {
              clearInterval(interval);
              setIsPolling(false);
              // reload to fetch fresh QR code and attachments
              window.location.reload();
            }
          }
        }
      } catch {
        // network issue, retry next tick
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [pass.code, pass.paid, pass.unlocked]);

  function copyCode() {
    navigator.clipboard?.writeText(pass.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/passes/download?code=${encodeURIComponent(pass.code)}`);
      if (!res.ok) throw new Error("download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pass-true-${pass.code}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      window.open(`/api/passes/download?code=${encodeURIComponent(pass.code)}`, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center px-4 pt-28 pb-20 text-center">
      {/* Kicker */}
      <p className="text-[11px] tracking-[0.32em] text-gold uppercase">Lancement officiel de la marque</p>

      {/* Main Title & Status */}
      <h1 className="mt-3 font-serif text-4xl tracking-[0.08em] uppercase sm:text-5xl">
        {pass.unlocked ? "Pass Débloqué" : "Paiement en cours"}
      </h1>

      {isPolling && !pass.unlocked && (
        <div className="mt-4 flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs text-gold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-gold" />
          </span>
          <span>En attente de confirmation sur votre téléphone (USSD / PIN)…</span>
        </div>
      )}

      {/* TICKET CARD */}
      <div className="relative mt-8 w-full overflow-hidden rounded-2xl border border-gold/40 bg-[#0d0d10] p-6 text-left shadow-2xl sm:p-8">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-40 w-40 rounded-full bg-gold/5 blur-2xl" />

        {/* Card Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <span className="font-display text-2xl tracking-[0.25em] text-gold">T R U E</span>
            <p className="text-[10px] tracking-[0.2em] text-mist uppercase">Pass Lancement 2026</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wider uppercase ${
              pass.unlocked
                ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border border-amber-500/40 bg-amber-500/10 text-amber-400"
            }`}
          >
            {pass.unlocked ? "✓ Débloqué" : "En cours"}
          </span>
        </div>

        {/* Guest Details */}
        <div className="mt-6 space-y-4">
          <div>
            <p className="text-[10px] tracking-[0.2em] text-mist uppercase">Invité(e)</p>
            <p className="font-serif text-2xl text-bone">{pass.name}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] tracking-[0.2em] text-mist uppercase">Tenue réservée</p>
              <p className="text-sm font-medium text-bone">{outfitName}</p>
              <p className="text-xs text-gold">Taille {pass.size}</p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.2em] text-mist uppercase">Lieu &amp; Date</p>
              <p className="text-sm font-medium text-bone">Lomé, Togo</p>
              <p className="text-xs text-mist">03 Janvier 2026</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] tracking-[0.2em] text-mist uppercase">Code unique</p>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-[0.18em] text-gold">{pass.code}</span>
              <button
                type="button"
                onClick={copyCode}
                className="text-[11px] tracking-wider text-mist uppercase transition-colors hover:text-gold"
              >
                {copied ? "✓ Copié" : "Copier"}
              </button>
            </div>
          </div>
        </div>

        {/* QR Code Section */}
        {qrUrl && (
          <div className="mt-6 flex flex-col items-center border-t border-dashed border-white/10 pt-6">
            <div className="relative h-56 w-56 overflow-hidden rounded-xl bg-white p-3 shadow-inner">
              <Image src={qrUrl} alt={`QR Code ${pass.code}`} fill className="object-contain p-2" priority />
            </div>
            <p className="mt-3 text-xs tracking-wider text-mist uppercase">À présenter à l&apos;entrée</p>
          </div>
        )}

        {/* Progress Bar if installment */}
        {!pass.unlocked && (
          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="flex justify-between text-xs text-mist">
              <span>Payé : {formatPrice(pass.paid, "fr")}</span>
              <span>Reste : {formatPrice(pass.remaining, "fr")}</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gold transition-all duration-500"
                style={{ width: `${Math.min(100, (pass.paid / pass.total) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex w-full flex-col gap-3">
        {/* DOWNLOAD BUTTON */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-gold py-4 text-xs font-semibold tracking-[0.22em] text-ink uppercase transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          {downloading ? "Génération du billet…" : "Télécharger mon billet (PNG)"}
        </button>

        {/* Continue installment payment if not fully paid */}
        {!pass.unlocked && (
          <Link
            href={`/evenements/pass?code=${encodeURIComponent(pass.code)}`}
            className="w-full rounded-full border border-gold py-4 text-center text-xs tracking-[0.2em] text-gold uppercase transition-colors hover:bg-gold/10"
          >
            Continuer le paiement du pass
          </Link>
        )}

        <Link
          href="/evenements"
          className="mt-2 text-center text-[11px] tracking-[0.2em] text-mist uppercase hover:text-bone"
        >
          ← Retour à l&apos;événement
        </Link>
      </div>

      {/* Confirmation Note */}
      <div className="mt-6 rounded-lg bg-white/5 p-4 text-xs leading-relaxed text-mist">
        {pass.unlocked ? (
          <p>
            Un email contenant votre pass officiel et votre QR code a également été envoyé à{" "}
            <span className="text-bone font-medium">{pass.email}</span>. Gardez votre code{" "}
            <span className="text-gold font-mono font-bold">{pass.code}</span> en cas de besoin.
          </p>
        ) : (
          <p>
            Votre code de suivi est <span className="text-gold font-mono font-bold">{pass.code}</span>. Vous pouvez
            reprendre le paiement à tout moment en entrant ce code sur la page de l&apos;événement.
          </p>
        )}
      </div>
    </div>
  );
}
