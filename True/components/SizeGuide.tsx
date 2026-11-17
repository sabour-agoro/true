"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SIZES, firstAvailableSize, getProduct, primaryImage, productName, products, type Size } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useUi } from "@/store/ui-store";

type Sex = "female" | "male";
type Shoulder = "narrow" | "average" | "broad";
type Torso = "in" | "straight" | "out";
type Fit = "slim" | "regular" | "relaxed";

function clampSize(index: number) {
  return SIZES[Math.max(0, Math.min(SIZES.length - 1, index))];
}

function measureIndex(height: number, weight: number, sex: Sex) {
  let index = 2;
  if (height < 160) index = 0;
  else if (height < 168) index = 1;
  else if (height < 176) index = 2;
  else if (height < 184) index = 3;
  else if (height < 192) index = 4;
  else index = 5;
  const bmi = weight / (height / 100) ** 2;
  if (bmi < 18.5) index -= 1;
  else if (bmi >= 32) index += 2;
  else if (bmi >= 27) index += 1;
  if (sex === "female") index -= 1;
  return index;
}

function suggest(height: number, weight: number, sex: Sex, shoulder: Shoulder, torso: Torso, fit: Fit) {
  let index = measureIndex(height, weight, sex);
  if (shoulder === "narrow") index -= 1;
  if (shoulder === "broad") index += 1;
  if (torso === "in") index -= 1;
  if (torso === "out") index += 1;
  if (fit === "slim") index -= 1;
  if (fit === "relaxed") index += 1;
  return clampSize(index);
}

export function SizeGuide() {
  const open = useUi((state) => state.sizeGuideOpen);
  const slug = useUi((state) => state.sizeGuideSlug);
  const close = useUi((state) => state.closeSizeGuide);
  const { t, locale } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [piece, setPiece] = useState(slug ?? "");
  const [sex, setSex] = useState<Sex>("male");
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(70);
  const [shoulder, setShoulder] = useState<Shoulder>("average");
  const [torso, setTorso] = useState<Torso>("straight");
  const [fit, setFit] = useState<Fit>("regular");

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setPiece(slug ?? products.find((item) => item.stock && Object.values(item.stock).some((count) => count > 0))?.slug ?? "");
    setSex("male");
    setHeight(175);
    setWeight(70);
    setShoulder("average");
    setTorso("straight");
    setFit("regular");
  }, [open, slug]);

  const live = useMemo(() => clampSize(measureIndex(height, weight, sex)), [height, weight, sex]);
  const finalSize = useMemo(() => suggest(height, weight, sex, shoulder, torso, fit), [fit, height, sex, shoulder, torso, weight]);
  const product = getProduct(piece);

  if (!open) return null;

  function useSize() {
    if (!product) {
      close();
      router.push("/shop");
      return;
    }
    const available = product.stock[finalSize] > 0 ? finalSize : firstAvailableSize(product);
    close();
    router.push(available ? `/produit/${product.slug}?taille=${available}` : `/produit/${product.slug}`);
  }

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/55" role="presentation" onClick={close}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t.size.title}
        className="flex h-full w-full max-w-[460px] flex-col bg-white text-black"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between px-6 pt-6">
          <div>
            <p className="text-[11px] tracking-[0.22em] uppercase">{t.size.title}</p>
            <p className="mt-2 text-[11px] text-black/45">0{Math.min(step, 3)} / 03</p>
          </div>
          <button type="button" aria-label={t.size.close} onClick={close} className="text-2xl leading-none">
            ×
          </button>
        </header>
        <div className="mx-6 mt-4 h-px bg-black/10">
          <div className="h-px bg-black" style={{ width: `${(Math.min(step, 3) / 3) * 100}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {step === 1 && (
            <div className="mb-5 flex gap-2 overflow-x-auto">
              {products.map((item) => (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => setPiece(item.slug)}
                  className={`relative h-16 w-14 shrink-0 bg-[#f3f3f3] ${item.slug === piece ? "outline outline-1 outline-black" : ""}`}
                >
                  <Image src={primaryImage(item)} alt={productName(item, locale)} fill sizes="56px" className="object-contain p-1" />
                </button>
              ))}
            </div>
          )}
          {product && step > 1 && (
            <div className="mb-6 flex items-center gap-3">
              <span className="relative h-14 w-12 bg-[#f3f3f3]">
                <Image src={primaryImage(product)} alt="" fill sizes="48px" className="object-contain p-1" />
              </span>
              <span>
                <span className="block text-sm">{productName(product, locale)}</span>
                <span className="text-sm text-black/50">{formatPrice(product.price, locale)}</span>
              </span>
            </div>
          )}

          {step === 1 && (
            <StepMeasures
              sex={sex}
              setSex={setSex}
              height={height}
              setHeight={setHeight}
              weight={weight}
              setWeight={setWeight}
              live={live}
            />
          )}
          {step === 2 && <StepShape shoulder={shoulder} setShoulder={setShoulder} torso={torso} setTorso={setTorso} />}
          {step === 3 && <StepFit fit={fit} setFit={setFit} />}
          {step === 4 && <StepResult size={finalSize} productSlug={product?.slug} stock={product?.stock[finalSize] ?? 1} />}
        </div>

        <footer className="flex gap-2 border-t border-black/10 p-4">
          {step > 1 && (
            <button type="button" className="h-12 w-12 border border-black" onClick={() => setStep((value) => value - 1)} aria-label={t.size.back}>
              ←
            </button>
          )}
          {step < 3 && (
            <button type="button" className="h-12 flex-1 bg-black text-[12px] tracking-[0.18em] text-white uppercase" onClick={() => setStep((value) => value + 1)}>
              {t.size.next}
            </button>
          )}
          {step === 3 && (
            <button type="button" className="h-12 flex-1 bg-black text-[12px] tracking-[0.18em] text-white uppercase" onClick={() => setStep(4)}>
              {t.size.find}
            </button>
          )}
          {step === 4 && (
            <button type="button" className="h-12 flex-1 bg-black text-[12px] tracking-[0.18em] text-white uppercase" onClick={useSize}>
              {product ? t.size.use : t.size.shop}
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}

function StepMeasures({
  sex,
  setSex,
  height,
  setHeight,
  weight,
  setWeight,
  live,
}: {
  sex: Sex;
  setSex: (value: Sex) => void;
  height: number;
  setHeight: (value: number) => void;
  weight: number;
  setWeight: (value: number) => void;
  live: Size;
}) {
  const { t } = useI18n();
  return (
    <div>
      <h2 className="font-display text-4xl leading-none uppercase">{t.size.fitTitle}</h2>
      <p className="mt-2 text-sm text-black/55">{t.size.fitHint}</p>
      <div className="mt-6 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setSex("female")} className={`h-11 text-[12px] tracking-[0.14em] uppercase ${sex === "female" ? "bg-black text-white" : "border border-black/15"}`}>
          {t.size.female}
        </button>
        <button type="button" onClick={() => setSex("male")} className={`h-11 text-[12px] tracking-[0.14em] uppercase ${sex === "male" ? "bg-black text-white" : "border border-black/15"}`}>
          {t.size.male}
        </button>
      </div>
      <Meter label={t.size.height} value={height} unit="cm" min={145} max={210} onChange={setHeight} />
      <Meter label={t.size.weight} value={weight} unit="kg" min={40} max={160} onChange={setWeight} />
      <div className="mt-8 flex items-end justify-between">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase">{t.size.estimate}</p>
          <p className="text-sm text-black/45">{t.size.estimateHint}</p>
        </div>
        <p className="font-display text-5xl">{live}</p>
      </div>
    </div>
  );
}

function Meter({ label, value, unit, min, max, onChange }: { label: string; value: number; unit: string; min: number; max: number; onChange: (value: number) => void }) {
  return (
    <label className="mt-6 block">
      <span className="flex justify-between text-[11px] tracking-[0.16em] uppercase">
        {label}
        <span>
          {value} {unit}
        </span>
      </span>
      <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} className="mt-3 w-full accent-black" />
    </label>
  );
}

function StepShape({
  shoulder,
  setShoulder,
  torso,
  setTorso,
}: {
  shoulder: Shoulder;
  setShoulder: (value: Shoulder) => void;
  torso: Torso;
  setTorso: (value: Torso) => void;
}) {
  const { t } = useI18n();
  const shoulders: { id: Shoulder; label: string }[] = [
    { id: "narrow", label: t.size.narrow },
    { id: "average", label: t.size.average },
    { id: "broad", label: t.size.broad },
  ];
  const torsos: { id: Torso; label: string }[] = [
    { id: "in", label: t.size.waistIn },
    { id: "straight", label: t.size.waistStraight },
    { id: "out", label: t.size.waistOut },
  ];
  return (
    <div>
      <h2 className="font-display text-4xl leading-none uppercase">{t.size.shapeTitle}</h2>
      <p className="mt-6 text-[11px] tracking-[0.16em] uppercase">{t.size.shoulders}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {shoulders.map((item) => (
          <button key={item.id} type="button" onClick={() => setShoulder(item.id)} className={`h-20 text-sm ${shoulder === item.id ? "bg-black text-white" : "border border-black/15"}`}>
            {item.label}
          </button>
        ))}
      </div>
      <p className="mt-6 text-[11px] tracking-[0.16em] uppercase">{t.size.waist}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {torsos.map((item) => (
          <button key={item.id} type="button" onClick={() => setTorso(item.id)} className={`h-20 text-sm ${torso === item.id ? "bg-black text-white" : "border border-black/15"}`}>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepFit({ fit, setFit }: { fit: Fit; setFit: (value: Fit) => void }) {
  const { t } = useI18n();
  const options: { id: Fit; label: string; note: string }[] = [
    { id: "slim", label: t.size.slim, note: t.size.slimNote },
    { id: "regular", label: t.size.regular, note: t.size.regularNote },
    { id: "relaxed", label: t.size.relaxed, note: t.size.relaxedNote },
  ];
  return (
    <div>
      <h2 className="font-display text-4xl leading-none uppercase">{t.size.preferTitle}</h2>
      <p className="mt-2 text-sm text-black/55">{t.size.preferHint}</p>
      <div className="mt-6 space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setFit(option.id)}
            className={`flex w-full items-center justify-between px-4 py-4 text-left ${fit === option.id ? "bg-[#f4f4f4] outline outline-1 outline-black" : "border border-black/10"}`}
          >
            <span>
              <span className="block text-sm tracking-[0.12em] uppercase">{option.label}</span>
              <span className="text-sm text-black/50">{option.note}</span>
            </span>
            {fit === option.id && <span className="h-2 w-2 rounded-full bg-black" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepResult({ size, productSlug, stock }: { size: Size; productSlug?: string; stock: number }) {
  const { t } = useI18n();
  return (
    <div className="text-center">
      <p className="text-[11px] tracking-[0.2em] uppercase">{t.size.match}</p>
      <p className="mt-4 font-display text-8xl">{size}</p>
      <p className="mx-auto mt-4 max-w-xs text-sm text-black/55">{t.size.note}</p>
      {productSlug && stock < 1 && <p className="mt-4 text-sm">{t.size.gone}</p>}
    </div>
  );
}
