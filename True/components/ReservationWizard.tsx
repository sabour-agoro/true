"use client";

import Image from "next/image";
import { useState } from "react";
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

function Choice({
  active,
  onClick,
  children,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  sub?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "border px-4 py-4 text-left transition",
        active ? "border-gold bg-gold/10 text-bone" : "border-line text-bone/70 hover:border-gold/60",
      )}
    >
      <span className="block text-[13px] tracking-[0.14em] uppercase">{children}</span>
      {sub && <span className="mt-1 block text-xs text-mist">{sub}</span>}
    </button>
  );
}

function Preview({ sleeve, color, logo }: { sleeve: Sleeve; color: Color; logo: Logo }) {
  const photo = chemisePhoto(sleeve, color, logo);
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden border border-line bg-panel">
      {photo ? (
        <Image src={photo} alt={`Chemise ${colorLabel[color].toLowerCase()} ${sleeveLabel[sleeve].toLowerCase()}, logo ${logoLabel[logo]}`} fill sizes="(min-width: 768px) 384px, 90vw" className="object-contain" priority />
      ) : (
        <div className={cn("flex h-full w-full flex-col items-center justify-center gap-5 p-8", color === "noire" ? "bg-[#0a0a0a]" : "bg-[#f4f0e8]")}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoFile[logo]}
            alt={`Logo ${logoLabel[logo]}`}
            className={cn("max-h-40 w-auto", color === "noire" && logo === "true" && "invert")}
          />
          <p className={cn("text-center text-[11px] tracking-[0.2em] uppercase", color === "noire" ? "text-bone/60" : "text-[#141414]/60")}>
            Aperçu du logo · photo de la chemise à venir
          </p>
        </div>
      )}
    </div>
  );
}

export function ReservationWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sleeve, setSleeve] = useState<Sleeve>("courtes");
  const [color, setColor] = useState<Color>("noire");
  const [logo, setLogo] = useState<Logo>("spirale");
  const [size, setSize] = useState<ChemiseSize | "">("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [method, setMethod] = useState<"mixx" | "flooz">("mixx");
  const [phone, setPhone] = useState("");
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          email,
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
            email: data.email,
            firstname: data.firstname,
            lastname: data.lastname,
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

  const steps = ["Chemise", "Logo", "Paiement"];

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_1fr] md:items-start">
      <div className="md:sticky md:top-28">
        <Preview sleeve={sleeve} color={color} logo={logo} />
        <p className="mt-4 text-center text-sm text-mist">
          {`Chemise ${colorLabel[color].toLowerCase()}, ${sleeveLabel[sleeve].toLowerCase()}, logo ${logoLabel[logo]}`}
          {size ? ` · taille ${size}` : ""}
        </p>
      </div>

      <div>
        <ol className="mb-8 flex gap-3 text-[11px] tracking-[0.22em] uppercase">
          {steps.map((label, index) => (
            <li key={label} className={cn("border-b pb-2", step === index + 1 ? "border-gold text-gold" : "border-line text-mist")}>
              {index + 1}. {label}
            </li>
          ))}
        </ol>

        {step === 1 && (
          <section className="space-y-8">
            <div>
              <h2 className="font-display text-3xl uppercase">Manches</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {SLEEVES.map((item) => (
                  <Choice key={item} active={sleeve === item} onClick={() => setSleeve(item)}>
                    {sleeveLabel[item]}
                  </Choice>
                ))}
              </div>
            </div>
            <div>
              <h2 className="font-display text-3xl uppercase">Couleur</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {COLORS.map((item) => (
                  <Choice key={item} active={color === item} onClick={() => setColor(item)}>
                    {colorLabel[item]}
                  </Choice>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => setStep(2)} className="w-full bg-gold px-6 py-4 text-[11px] tracking-[0.22em] text-ink uppercase">
              Continuer
            </button>
          </section>
        )}

        {step === 2 && (
          <section className="space-y-8">
            <div>
              <h2 className="font-display text-3xl uppercase">Logo</h2>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {LOGOS.map((item) => (
                  <Choice key={item} active={logo === item} onClick={() => setLogo(item)}>
                    {logoLabel[item]}
                  </Choice>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="border border-line px-6 py-4 text-[11px] tracking-[0.22em] uppercase">
                Retour
              </button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 bg-gold px-6 py-4 text-[11px] tracking-[0.22em] text-ink uppercase">
                Continuer
              </button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="space-y-6">
            <div>
              <h2 className="font-display text-3xl uppercase">Taille</h2>
              <div className="mt-4 grid grid-cols-6 gap-2">
                {CHEMISE_SIZES.map((item) => (
                  <Choice key={item} active={size === item} onClick={() => setSize(item)}>
                    {item}
                  </Choice>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs tracking-[0.18em] text-mist uppercase">
                Nom (facultatif)
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="mt-2 w-full border border-line bg-transparent px-4 py-3 text-base text-bone outline-none focus:border-gold" />
              </label>
              <label className="block text-xs tracking-[0.18em] text-mist uppercase">
                E-mail (pour recevoir ton billet)
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="mt-2 w-full border border-line bg-transparent px-4 py-3 text-base text-bone outline-none focus:border-gold" />
              </label>
            </div>

            <div>
              <h2 className="font-display text-3xl uppercase">Paiement</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Choice active={method === "mixx"} onClick={() => setMethod("mixx")}>
                  Mixx by Yas
                </Choice>
                <Choice active={method === "flooz"} onClick={() => setMethod("flooz")}>
                  Flooz
                </Choice>
              </div>
              <label className="mt-4 block text-xs tracking-[0.18em] text-mist uppercase">
                Numéro mobile money (8 chiffres)
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="90 00 00 00"
                  className="mt-2 w-full border border-line bg-transparent px-4 py-3 text-base text-bone outline-none focus:border-gold"
                />
              </label>
              <p className="mt-3 text-xs text-mist">Tu reçois la demande sur ton téléphone, puis tu valides avec ton code secret.</p>
            </div>

            {error && (
              <p role="alert" className="border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-bone">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="border border-line px-6 py-4 text-[11px] tracking-[0.22em] uppercase">
                Retour
              </button>
              <button
                type="button"
                onClick={pay}
                disabled={paying}
                className="flex-1 bg-gold px-6 py-4 text-[11px] tracking-[0.22em] text-ink uppercase disabled:opacity-50"
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
