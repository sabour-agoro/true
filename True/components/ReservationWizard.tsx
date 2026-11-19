"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  CHEMISE_SIZES,
  COLORS,
  LOGOS,
  SLEEVES,
  chemiseKey,
  chemisePhoto,
  colorLabel,
  logoFile,
  logoLabel,
  sleeveLabel,
  type ChemiseSize,
  type Color,
  type Logo,
  type Sleeve,
} from "@/data/chemises";
import { cn } from "@/lib/cn";
import { PASS_PRICE } from "@/lib/pass-rules";

type FedaWidget = { init: (options: object) => { open: () => void } };

type PayResponse = {
  url?: string;
  checkout?: boolean;
  code?: string;
  amount?: number;
  description?: string;
  phone?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  publicKey?: string;
  environment?: string;
  metadata?: Record<string, string>;
  error?: string;
};

const errors: Record<string, string> = {
  method: "Choisis Mixx by Yas ou Flooz.",
  phone: "Numéro invalide : 8 chiffres, sans l'indicatif.",
  email: "Adresse e-mail invalide.",
  outfit: "Choisis la chemise, le logo et la taille.",
  amount: "Le montant du pass a changé. Recharge la page.",
  paid: "Ce pass est déjà payé.",
  config: "Le paiement n'est pas encore configuré. Écris-nous sur WhatsApp.",
  rate: "Trop d'essais. Réessaie dans quelques minutes.",
};

function loadFedaPay() {
  const existing = (window as unknown as { FedaPay?: FedaWidget }).FedaPay;
  if (existing) return Promise.resolve(existing);
  return new Promise<FedaWidget>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.fedapay.com/checkout.js?v=1.1.7";
    script.async = true;
    script.onload = () => {
      const loaded = (window as unknown as { FedaPay?: FedaWidget }).FedaPay;
      if (loaded) resolve(loaded);
      else reject(new Error("missing"));
    };
    script.onerror = () => reject(new Error("load"));
    document.body.appendChild(script);
  });
}

function getValidLogos(sleeve: Sleeve, color: Color): Logo[] {
  if (sleeve === "longues" && color === "noire") return ["horizon"];
  if (sleeve === "longues" && color === "blanche") return ["horizon", "spirale"];
  if (sleeve === "courtes" && color === "noire") return ["spirale"];
  if (sleeve === "courtes" && color === "blanche") return ["spirale", "true"];
  return ["spirale"];
}

export function ReservationWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Étape 1 : Manches & Couleur
  const [sleeve, setSleeve] = useState<Sleeve>("courtes");
  const [color, setColor] = useState<Color>("noire");

  // Étape 2 : Logo & Taille
  const [logo, setLogo] = useState<Logo>("spirale");
  const [size, setSize] = useState<ChemiseSize>("M");

  // Étape 3 : Coordonnées & Paiement
  const [name, setName] = useState("");
  const [method, setMethod] = useState<"mixx" | "flooz">("mixx");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchroniser le logo si la combinaison manche/couleur change
  useEffect(() => {
    const valid = getValidLogos(sleeve, color);
    if (!valid.includes(logo)) {
      setLogo(valid[0]);
    }
  }, [sleeve, color, logo]);

  const photo = chemisePhoto(sleeve, color, logo);
  const availableLogos = getValidLogos(sleeve, color);

  async function pay() {
    if (paying) return;
    if (!size) {
      setError(errors.outfit);
      return;
    }
    setPaying(true);
    setError(null);
    try {
      const response = await fetch("/api/passes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: "fr",
          name,
          outfit: chemiseKey(sleeve, color, logo),
          size,
          mode: "full",
          amount: PASS_PRICE,
          method,
          phone,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as PayResponse;
      if (!response.ok || (!data.url && !data.checkout)) {
        setError(errors[data.error ?? ""] ?? "Le paiement n'a pas pu s'ouvrir. Réessaie dans un instant.");
        setPaying(false);
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      if (data.publicKey && data.amount && data.code && data.phone) {
        const fedapay = await loadFedaPay();
        const code = data.code;
        const widget = fedapay.init({
          public_key: data.publicKey,
          environment: data.environment ?? "live",
          locale: "fr",
          currency: { iso: "XOF" },
          transaction: { amount: data.amount, description: data.description, custom_metadata: data.metadata ?? { code } },
          customer: {
            email: data.email ?? "client@true.tg",
            firstname: data.firstname ?? name,
            lastname: data.lastname ?? "",
            phone_number: { number: data.phone, country: "tg" },
          },
          onComplete(result: { transaction?: { id?: number | string } }) {
            const id = result?.transaction?.id;
            window.location.assign(`/evenements/suivi?code=${code}${id ? `&tx=${id}` : ""}`);
          },
        });
        widget.open();
        setPaying(false);
        return;
      }
      setError("Le paiement n'a pas pu s'ouvrir. Réessaie dans un instant.");
      setPaying(false);
    } catch {
      setError("Le paiement n'a pas pu s'ouvrir. Vérifie ta connexion et réessaie.");
      setPaying(false);
    }
  }

  const steps = [
    { num: 1, label: "Manches & Couleur" },
    { num: 2, label: "Logo & Taille" },
    { num: 3, label: "Paiement" },
  ];

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-start">
      {/* Aperçu grand format à gauche */}
      <div className="md:sticky md:top-28">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden border border-line bg-panel shadow-2xl">
          {photo ? (
            <Image
              src={photo}
              alt={`Chemise ${colorLabel[color].toLowerCase()} ${sleeveLabel[sleeve].toLowerCase()}, logo ${logoLabel[logo]}`}
              fill
              sizes="(min-width: 768px) 440px, 90vw"
              className="object-contain p-4 transition-all duration-300"
              priority
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-8 bg-panel">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoFile[logo]} alt={`Logo ${logoLabel[logo]}`} className="max-h-36 w-auto" />
            </div>
          )}

          {/* Badges d'information */}
          <span className="absolute top-3 left-3 bg-ink/80 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase text-gold backdrop-blur-md border border-gold/40">
            {sleeveLabel[sleeve]} · {colorLabel[color]}
          </span>
          <span className="absolute top-3 right-3 bg-ink/80 px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase text-bone backdrop-blur-md border border-line">
            Logo {logoLabel[logo]}
          </span>
        </div>

        <div className="mt-4 text-center">
          <h3 className="font-serif text-2xl text-bone">
            Chemise {colorLabel[color].toLowerCase()} {sleeveLabel[sleeve].toLowerCase()}
          </h3>
          <p className="mt-1 text-sm text-gold">
            Logo {logoLabel[logo]} · Taille {size} · Pass {PASS_PRICE.toLocaleString("fr-FR")} F CFA
          </p>
        </div>
      </div>

      {/* Étapes à droite */}
      <div>
        {/* Navigation des étapes en haut */}
        <div className="mb-8 flex border-b border-line pb-3 gap-4 sm:gap-6 text-[11px] tracking-[0.2em] uppercase">
          {steps.map((item) => (
            <button
              key={item.num}
              type="button"
              onClick={() => {
                // Permettre de naviguer aux étapes déjà débloquées
                if (item.num <= step) setStep(item.num as 1 | 2 | 3);
              }}
              className={cn(
                "pb-1 transition-all text-left",
                step === item.num
                  ? "border-b-2 border-gold text-gold font-bold"
                  : item.num < step
                    ? "text-bone/80 hover:text-gold cursor-pointer"
                    : "text-mist cursor-default",
              )}
            >
              {item.num}. {item.label}
            </button>
          ))}
        </div>

        {/* ======================================================== */}
        {/* ÉTAPE 1 : MANCHES & COULEUR                              */}
        {/* ======================================================== */}
        {step === 1 && (
          <section className="space-y-8">
            {/* Choix des manches */}
            <div>
              <h2 className="font-display text-2xl uppercase tracking-wider">1. Type de manches</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {SLEEVES.map((item) => {
                  const active = sleeve === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setSleeve(item)}
                      className={cn(
                        "p-5 text-left border transition-all duration-150 active:scale-[0.98]",
                        active
                          ? "border-gold bg-gold/15 text-bone ring-1 ring-gold shadow-[0_0_15px_rgba(201,162,75,0.25)]"
                          : "border-line text-bone/70 hover:border-gold/50 hover:bg-white/5",
                      )}
                    >
                      <span className="block text-sm font-bold tracking-[0.14em] uppercase">{sleeveLabel[item]}</span>
                      <span className="mt-1 block text-xs text-mist">
                        {item === "courtes" ? "Coupe fluide et légère" : "Coupe ajustée élégante"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Choix de la couleur */}
            <div>
              <h2 className="font-display text-2xl uppercase tracking-wider">2. Couleur</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {COLORS.map((item) => {
                  const active = color === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setColor(item)}
                      className={cn(
                        "p-5 text-left border transition-all duration-150 active:scale-[0.98] flex items-center justify-between",
                        active
                          ? "border-gold bg-gold/15 text-bone ring-1 ring-gold shadow-[0_0_15px_rgba(201,162,75,0.25)]"
                          : "border-line text-bone/70 hover:border-gold/50 hover:bg-white/5",
                      )}
                    >
                      <div>
                        <span className="block text-sm font-bold tracking-[0.14em] uppercase">{colorLabel[item]}</span>
                        <span className="mt-1 block text-xs text-mist">
                          {item === "noire" ? "Tissu noir profond" : "Coton blanc pur"}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "h-5 w-5 rounded-full border",
                          item === "noire" ? "bg-black border-line" : "bg-white border-black/20",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bouton Continuer */}
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full bg-gold py-4 px-6 text-center text-[12px] font-bold tracking-[0.24em] text-ink uppercase transition-all duration-150 hover:bg-gold/90 active:scale-[0.98] shadow-lg"
            >
              Continuer vers le logo & taille →
            </button>
          </section>
        )}

        {/* ======================================================== */}
        {/* ÉTAPE 2 : LOGO & TAILLE                                  */}
        {/* ======================================================== */}
        {step === 2 && (
          <section className="space-y-8">
            {/* Choix du logo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display text-2xl uppercase tracking-wider">Choisis ton logo</h2>
                <span className="text-xs text-mist">
                  Pour chemise {colorLabel[color].toLowerCase()} {sleeveLabel[sleeve].toLowerCase()}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableLogos.map((item) => {
                  const active = logo === item;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLogo(item)}
                      className={cn(
                        "p-4 border text-left transition-all duration-150 active:scale-[0.98] flex items-center gap-4",
                        active
                          ? "border-gold bg-gold/15 text-bone ring-1 ring-gold shadow-[0_0_15px_rgba(201,162,75,0.25)]"
                          : "border-line text-bone/70 hover:border-gold/50 hover:bg-white/5",
                      )}
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden bg-panel/80 p-2 border border-line">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logoFile[item]}
                          alt={logoLabel[item]}
                          className={cn("h-full w-full object-contain", color === "noire" && item === "true" && "invert")}
                        />
                      </div>
                      <div>
                        <span className="block text-sm font-bold tracking-[0.14em] uppercase text-bone">
                          Logo {logoLabel[item]}
                        </span>
                        <span className="mt-0.5 block text-xs text-mist">
                          {item === "horizon" && "Horizon d'or brodé au dos"}
                          {item === "spirale" && "Spirale dorée brodée au dos"}
                          {item === "true" && "TRUE brodé sur la poitrine"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Choix de la taille */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display text-2xl uppercase tracking-wider">Choisis ta taille</h2>
                <span className="text-xs text-gold">Taille sélectionnée : {size}</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {CHEMISE_SIZES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setSize(option)}
                    className={cn(
                      "h-12 border text-sm font-semibold tracking-wider transition-all duration-150 active:scale-95",
                      size === option
                        ? "border-gold bg-gold text-ink font-bold shadow-[0_0_12px_rgba(201,162,75,0.4)]"
                        : "border-line text-bone/80 hover:border-gold/50 hover:text-bone active:bg-white/5",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="border border-line px-6 py-4 text-[11px] tracking-[0.22em] uppercase transition hover:border-gold/60 hover:text-bone active:scale-[0.98]"
              >
                ← Retour
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 bg-gold py-4 px-6 text-center text-[12px] font-bold tracking-[0.24em] text-ink uppercase transition-all duration-150 hover:bg-gold/90 active:scale-[0.98] shadow-lg"
              >
                Continuer vers le paiement →
              </button>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* ÉTAPE 3 : PAIEMENT                                       */}
        {/* ======================================================== */}
        {step === 3 && (
          <section className="space-y-6">
            {/* Récapitulatif sélection */}
            <div className="border border-gold/40 bg-gold/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-mist uppercase tracking-wider">Ta sélection</p>
                <p className="font-serif text-lg text-bone">
                  Chemise {colorLabel[color].toLowerCase()} {sleeveLabel[sleeve].toLowerCase()} · Logo {logoLabel[logo]}
                </p>
                <p className="text-xs text-gold font-medium mt-0.5">
                  Taille {size} · Pass complet 10 000 F CFA
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-gold underline underline-offset-4 hover:text-bone transition"
              >
                Modifier
              </button>
            </div>

            {/* Coordonnées */}
            <div className="space-y-4">
              <h2 className="font-display text-2xl uppercase tracking-wider">Tes informations</h2>

              <div>
                <label className="block text-xs tracking-[0.16em] text-mist uppercase mb-1.5">
                  Nom complet (facultatif)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Koffi Mensah"
                  autoComplete="name"
                  className="w-full border border-line bg-transparent px-4 py-3 text-bone outline-none focus:border-gold transition"
                />
              </div>
            </div>

            {/* Mode de paiement */}
            <div className="space-y-4 pt-2 border-t border-line">
              <h2 className="font-display text-2xl uppercase tracking-wider">Paiement Mobile Money</h2>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod("mixx")}
                  className={cn(
                    "p-4 border text-left transition-all active:scale-[0.98]",
                    method === "mixx"
                      ? "border-gold bg-gold/15 text-bone ring-1 ring-gold"
                      : "border-line text-bone/70 hover:border-gold/50",
                  )}
                >
                  <span className="block text-sm font-semibold tracking-wide">Mixx by Yas</span>
                  <span className="text-[11px] text-mist mt-1 block">Togocom</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod("flooz")}
                  className={cn(
                    "p-4 border text-left transition-all active:scale-[0.98]",
                    method === "flooz"
                      ? "border-gold bg-gold/15 text-bone ring-1 ring-gold"
                      : "border-line text-bone/70 hover:border-gold/50",
                  )}
                >
                  <span className="block text-sm font-semibold tracking-wide">Flooz</span>
                  <span className="text-[11px] text-mist mt-1 block">Moov Africa</span>
                </button>
              </div>

              <div>
                <label className="block text-xs tracking-[0.16em] text-mist uppercase mb-1.5">
                  Numéro Mobile Money (8 chiffres)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="90 12 34 56"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  className="w-full border border-line bg-transparent px-4 py-3 text-lg font-mono tracking-wider text-bone outline-none focus:border-gold transition"
                />
                <p className="mt-2 text-xs text-mist leading-relaxed">
                  Tu recevras une notification sur ton téléphone pour valider le paiement avec ton code secret.
                </p>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div role="alert" className="border border-red-500/60 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="border border-line px-6 py-4 text-[11px] tracking-[0.22em] uppercase transition hover:border-gold/60 hover:text-bone active:scale-[0.98]"
              >
                ← Retour
              </button>

              <button
                type="button"
                onClick={pay}
                disabled={paying}
                className="flex-1 bg-gold py-4 px-6 text-center text-[12px] font-bold tracking-[0.24em] text-ink uppercase transition-all duration-150 hover:bg-gold/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {paying ? "Ouverture du paiement…" : `Payer ${PASS_PRICE.toLocaleString("fr-FR")} F CFA`}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
