import Link from "next/link";
import { site } from "@/data/site";

export function Footer() {
  return (
    <footer className="border-t border-line bg-ink text-bone">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-10 text-sm md:flex-row md:items-center md:justify-between md:px-8">
        <p className="font-display text-xl tracking-[0.14em]">TRUE</p>
        <nav className="flex flex-wrap gap-6 text-mist">
          <Link href="/reservation" className="hover:text-bone">
            Réserver
          </Link>
          <a href={site.whatsapp} className="hover:text-bone" target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <a href={`mailto:${site.email}`} className="hover:text-bone">
            {site.email}
          </a>
        </nav>
        <p className="text-xs text-mist">© {new Date().getFullYear()} TRUE</p>
      </div>
    </footer>
  );
}
