"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function Nav() {
  const pathname = usePathname();
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-[4.5rem] items-center justify-between px-4 md:px-8">
      <Link href="/" className="flex items-center gap-2 text-bone" aria-label="TRUE, accueil">
        <span className="grid h-5 w-5 place-items-center rounded-full border border-[#C9A24B]" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-ink ring-1 ring-bone" />
        </span>
        <span className="font-display text-lg tracking-[0.14em]">TRUE</span>
      </Link>
      <Link
        href="/reservation"
        className={cn(
          "border border-[#C9A24B] px-5 py-2 text-[11px] tracking-[0.22em] text-bone uppercase transition hover:bg-[#C9A24B] hover:text-ink",
          pathname === "/reservation" && "bg-[#C9A24B] text-ink",
        )}
      >
        Réserver
      </Link>
    </header>
  );
}
