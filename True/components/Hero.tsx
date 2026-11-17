"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";

export function Hero() {
  const { t } = useI18n();
  const stageRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);
  const [reduce, setReduce] = useState(false);
  const loaded = progress >= 1;

  useEffect(() => {
    const reduced = prefersReducedMotion();
    setReduce(reduced);
    if (reduced) {
      setProgress(1);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const value = Math.min(1, (now - start) / 2200);
      setProgress(value);
      if (value < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const count = String(Math.round(progress * 100)).padStart(3, "0");

  return (
    <section ref={stageRef} data-hero="ivory" className="relative flex h-[100svh] flex-col overflow-hidden bg-[#EDE6D6] text-[#1a1a1a]">
      <header className="relative z-20 flex items-center justify-between px-5 py-6 text-[11px] tracking-[0.22em] uppercase md:px-8">
        <p className="font-display tracking-[0.16em]">TRUE®</p>
        <p>{t.intro.mode}</p>
        <p>{t.intro.place} — {new Date().getFullYear()}</p>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4">
        <LetterMask />
        <p className="absolute right-[7vw] font-display text-[clamp(3.2rem,7vw,6.4rem)] leading-none text-[#C9A24B] md:right-[9vw]">
          <span className="mr-1 align-top text-[0.32em]">%</span>
          {count}
        </p>
      </div>

      <footer className="relative z-20 px-5 pb-6 md:px-8">
        {!loaded && (
          <div className="mb-3 flex items-end justify-between text-[11px] tracking-[0.16em] uppercase">
            <p>{t.intro.loading}</p>
            <button
              type="button"
              onClick={() => document.getElementById("collection")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth" })}
            >
              {t.intro.prepare}
            </button>
          </div>
        )}
        <div className="h-px w-full bg-black/15">
          <div className="h-px bg-[#C9A24B]" style={{ width: `${progress * 100}%` }} />
        </div>
      </footer>
    </section>
  );
}

function LetterMask() {
  return (
    <svg viewBox="0 0 1000 250" className="h-[30vh] w-full max-w-[1100px] md:h-[38vh]" role="img" aria-label="TRUE">
      <defs>
        <mask id="home-true-letters" maskUnits="userSpaceOnUse">
          <rect width="1000" height="250" fill="black" />
          <text x="500" y="205" textAnchor="middle" fontFamily="Anton, Impact, sans-serif" fontSize="230" fill="white">
            TRUE
          </text>
        </mask>
      </defs>
      <image href="/hero/ecrit-fond.jpg" x="0" y="-560" width="1000" height="1776" preserveAspectRatio="none" mask="url(#home-true-letters)" />
    </svg>
  );
}
