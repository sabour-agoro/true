"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { HorizonMark } from "@/components/marks";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { site } from "@/data/site";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const shortYear = String(year).slice(2);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "bad">("idle");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      setState("bad");
      return;
    }
    setState("ok");
    setEmail("");
  }

  return (
    <footer className="relative overflow-hidden bg-ink text-bone">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 pt-20 pb-10 md:grid-cols-[1.3fr_0.8fr] md:px-8 md:pt-28">
        <h2 className="font-display text-[12vw] leading-[0.86] md:text-[6.4rem]">
          {t.footer.born}
          <span className="block text-bone/35">{t.footer.seen}</span>
        </h2>
        <div className="flex items-start justify-end gap-3 pt-4">
          <HorizonMark className="h-20 w-auto md:h-28" />
          <p className="font-display text-[18vw] leading-none md:text-[8rem]">©{shortYear}</p>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-10 px-5 pb-12 md:grid-cols-2 md:px-8">
        <p className="max-w-md text-sm leading-relaxed text-bone/70">{t.footer.blurb}</p>
        <form onSubmit={onSubmit}>
          <p className="text-sm font-medium">{t.footer.orbit}</p>
          <label htmlFor="newsletter" className="sr-only">
            {t.footer.email}
          </label>
          <div className="mt-4 flex items-center border-b border-bone/25">
            <input
              id="newsletter"
              type="email"
              required
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setState("idle");
              }}
              placeholder={t.footer.email}
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-bone/35"
            />
            <button type="submit" className="text-[12px] text-[#C9A24B]">
              {t.footer.subscribe} →
            </button>
          </div>
          {state === "ok" && <p className="mt-3 text-sm text-[#C9A24B]">{t.footer.joined}</p>}
          {state === "bad" && <p className="mt-3 text-sm text-bone/50">{t.footer.invalid}</p>}
        </form>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-8 border-t border-bone/10 px-5 py-8 text-sm md:grid-cols-[1.2fr_repeat(4,1fr)] md:px-8">
        <div>
          <p className="flex items-center gap-2">
            <HorizonMark className="h-5 w-5" /> TRUE studio
          </p>
          <p className="mt-2 text-bone/45">© {year} TRUE. {t.footer.rights}</p>
        </div>
        <div>
          <p className="mb-3 text-[11px] tracking-[0.16em] text-bone/40 uppercase">{t.footer.networks}</p>
          <a href={site.instagram} target="_blank" rel="noreferrer" className="block hover:text-[#C9A24B]">
            {t.footer.instagram}
          </a>
          <p className="text-bone/70">{t.footer.tiktok}</p>
        </div>
        <div>
          <p className="mb-3 text-[11px] tracking-[0.16em] text-bone/40 uppercase">{t.footer.help}</p>
          <Link href="/contact" className="block hover:text-[#C9A24B]">
            {t.footer.contact}
          </Link>
          <a href={site.whatsapp} target="_blank" rel="noreferrer" className="block hover:text-[#C9A24B]">
            {t.footer.delivery}
          </a>
        </div>
        <div>
          <p className="mb-3 text-[11px] tracking-[0.16em] text-bone/40 uppercase">{t.footer.legal}</p>
          <Link href="/evenements" className="block hover:text-[#C9A24B]">
            {t.footer.event}
          </Link>
        </div>
        <div className="flex flex-col items-start gap-4 md:items-end">
          <button type="button" className="text-bone/70 hover:text-bone" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            {t.footer.top} ↑
          </button>
          <LocaleSwitch />
        </div>
      </div>

      <p className="pointer-events-none px-4 font-display text-[28vw] leading-[0.75] text-bone/10 select-none">TRUE</p>
    </footer>
  );
}
