"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HorizonMark, SpiralMark } from "@/components/marks";
import { site } from "@/data/site";
import { useI18n } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";

export function AboutStory() {
  const { t } = useI18n();
  const spiralRef = useRef<HTMLDivElement>(null);
  const horizonRef = useRef<HTMLDivElement>(null);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(prefersReducedMotion());
  }, []);

  useEffect(() => {
    if (reduce) return;
    let alive = true;
    let revert: (() => void) | undefined;

    void (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
      if (!alive) return;
      gsap.registerPlugin(ScrollTrigger);
      const context = gsap.context(() => {
        [spiralRef, horizonRef].forEach((ref) => {
          const shapes = ref.current?.querySelectorAll("path, ellipse");
          if (!shapes?.length) return;
          gsap.fromTo(
            shapes,
            { strokeDashoffset: 1 },
            {
              strokeDashoffset: 0,
              ease: "none",
              scrollTrigger: {
                trigger: ref.current,
                start: "top 80%",
                end: "center 45%",
                scrub: true,
              },
            },
          );
        });
      });
      revert = () => context.revert();
    })();

    return () => {
      alive = false;
      revert?.();
    };
  }, []);

  return (
    <div className="relative">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Image src="/hero/trou-noir.jpg" alt="" fill sizes="100vw" className="scale-110 object-cover opacity-80 blur-md" />
        <div className="story-veil absolute inset-0" />
      </div>

      <section className="flex min-h-[100svh] flex-col items-center justify-center px-6 text-center">
        <p className="text-[12px] tracking-[0.32em] text-gold uppercase">{t.about.kicker}</p>
        <h1 className="mt-6 font-display text-[clamp(5rem,16vw,11rem)] leading-[0.8]">TRUE</h1>
        <p className="mt-8 max-w-xl font-serif text-2xl leading-snug italic text-bone/90">{t.about.lead}</p>
      </section>

      <section ref={spiralRef} className="mx-auto grid min-h-[80svh] max-w-5xl items-center gap-10 px-6 py-20 md:grid-cols-2">
        <SpiralMark progress={reduce ? 1 : 0} className="mx-auto w-full max-w-sm" />
        <div>
          <h2 className="font-display text-5xl uppercase md:text-7xl">{t.about.spiralTitle}</h2>
          <p className="mt-5 text-lg leading-relaxed text-mist">{t.about.spiral}</p>
        </div>
      </section>

      <section ref={horizonRef} className="mx-auto grid min-h-[80svh] max-w-5xl items-center gap-10 px-6 py-20 md:grid-cols-2">
        <div className="md:order-2">
          <HorizonMark progress={reduce ? 1 : 0} className="mx-auto w-full max-w-md" />
        </div>
        <div>
          <h2 className="font-display text-5xl uppercase md:text-7xl">{t.about.horizonTitle}</h2>
          <p className="mt-5 text-lg leading-relaxed text-mist">{t.about.horizon}</p>
        </div>
      </section>

      <section className="flex min-h-[70svh] flex-col items-center justify-center px-6 pb-24 text-center">
        <p className="font-serif text-3xl italic md:text-4xl">{site.slogan}</p>
        <Link href="/shop" className="mt-8 border border-gold px-7 py-3 text-[11px] tracking-[0.26em] text-gold uppercase">
          {t.about.cta}
        </Link>
      </section>
    </div>
  );
}
