"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="font-serif text-7xl tracking-[0.28em]" style={{ paddingLeft: "0.28em" }}>
          {t.notFound.title}
        </p>
        <p className="mt-4 text-mist">{t.notFound.body}</p>
        <Link href="/" className="mt-8 inline-block text-[11px] tracking-[0.22em] text-gold uppercase">
          {t.notFound.back}
        </Link>
      </div>
    </main>
  );
}
