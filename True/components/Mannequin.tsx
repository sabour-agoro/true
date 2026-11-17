"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n";

const figures = [
  {
    id: "homme" as const,
    src: "/mannequin/homme.png",
    width: 735,
    height: 1105,
    top: "17.5%",
    left: "17%",
    garmentWidth: "66%",
  },
  {
    id: "femme" as const,
    src: "/mannequin/femme.png",
    width: 408,
    height: 767,
    top: "12%",
    left: "11%",
    garmentWidth: "78%",
  },
];

export function Mannequin({ garment, name }: { garment?: string; name?: string }) {
  const { t } = useI18n();

  return (
    <div className="grid grid-cols-2 gap-3">
      {figures.map((figure) => (
        <figure key={figure.id} className="min-w-0">
          <div
            className="relative w-full overflow-hidden rounded-2xl bg-[#0c0c0c]"
            style={{ aspectRatio: `${figure.width} / ${figure.height}` }}
          >
            <Image
              src={figure.src}
              alt=""
              fill
              sizes="200px"
              className="object-fill"
              priority={figure.id === "homme"}
            />
            {garment ? (
              <img
                key={garment}
                src={garment}
                alt={name ?? ""}
                className="pointer-events-none absolute h-auto drop-shadow-[0_14px_16px_rgba(0,0,0,0.55)] motion-safe:animate-[dress_0.45s_ease]"
                style={{ top: figure.top, left: figure.left, width: figure.garmentWidth }}
              />
            ) : null}
          </div>
          <figcaption className="mt-2 text-center text-[10px] tracking-[0.22em] text-mist uppercase">
            {t.cabin[figure.id]}
          </figcaption>
        </figure>
      ))}
      <style>{`@keyframes dress { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }`}</style>
    </div>
  );
}
