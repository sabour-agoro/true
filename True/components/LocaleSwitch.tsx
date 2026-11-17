"use client";

import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";

export function LocaleSwitch({ className, tone = "theme" }: { className?: string; tone?: "theme" | "light" }) {
  const { locale, setLocale } = useI18n();
  const quiet = tone === "light" ? "text-white/70 hover:text-white" : "text-bone/75 hover:text-bone";
  const active = tone === "light" ? "text-[#C9A24A]" : "text-gold";

  return (
    <div className={cn("flex items-center gap-2 text-[11px] tracking-[0.22em]", className)}>
      <button type="button" onClick={() => setLocale("fr")} className={locale === "fr" ? active : quiet} aria-pressed={locale === "fr"}>
        FR
      </button>
      <span className={tone === "light" ? "text-white/40" : "text-mist"} aria-hidden="true">
        /
      </span>
      <button type="button" onClick={() => setLocale("en")} className={locale === "en" ? active : quiet} aria-pressed={locale === "en"}>
        EN
      </button>
    </div>
  );
}
