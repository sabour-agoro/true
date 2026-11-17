"use client";

import { flushSync } from "react-dom";
import { MoonIcon, SunIcon } from "@/components/Icons";
import { useI18n } from "@/lib/i18n";
import { useUi } from "@/store/ui-store";

export function ThemeToggle({ tone = "theme" }: { tone?: "theme" | "light" }) {
  const { t } = useI18n();
  const theme = useUi((state) => state.theme);
  const toggleTheme = useUi((state) => state.toggleTheme);
  const nextIsLight = theme === "dark";

  function onToggle(event: React.MouseEvent<HTMLButtonElement>) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const apply = () => toggleTheme();
    if (reduce || typeof document.startViewTransition !== "function") {
      apply();
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const end = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const transition = document.startViewTransition(() => {
      flushSync(apply);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`],
        },
        {
          duration: 700,
          easing: "cubic-bezier(0.76, 0, 0.24, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={nextIsLight ? t.nav.light : t.nav.dark}
      className={tone === "light" ? "text-white" : "text-bone"}
    >
      {nextIsLight ? <SunIcon className="h-[18px] w-[18px]" /> : <MoonIcon className="h-[18px] w-[18px]" />}
    </button>
  );
}
