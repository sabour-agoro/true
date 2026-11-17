"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CloseIcon, MenuIcon, SearchIcon } from "@/components/Icons";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/store/cart-store";
import { useUi } from "@/store/ui-store";
import { productName, products } from "@/data/products";

export function Nav() {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const menuOpen = useUi((state) => state.menuOpen);
  const searchOpen = useUi((state) => state.searchOpen);
  const setMenuOpen = useUi((state) => state.setMenuOpen);
  const setSearchOpen = useUi((state) => state.setSearchOpen);
  const openSizeGuide = useUi((state) => state.openSizeGuide);
  const lines = useCart((state) => state.lines);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [onIvory, setOnIvory] = useState(pathname === "/");

  useEffect(() => setReady(true), []);
  useEffect(() => {
    const node = document.querySelector("[data-hero='ivory']");
    if (!node) {
      setOnIvory(false);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setOnIvory(entry.isIntersecting && entry.intersectionRatio > 0.55),
      { threshold: [0, 0.55, 1] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [pathname]);
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname, setMenuOpen, setSearchOpen]);

  useEffect(() => {
    if (!menuOpen && !searchOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, searchOpen, setMenuOpen, setSearchOpen]);

  const count = ready ? lines.reduce((sum, line) => sum + line.quantity, 0) : 0;
  const links = [
    { href: "/shop", label: t.nav.collection },
    { href: "/evenements", label: t.nav.event },
  ];
  const results = products.filter((product) => productName(product, locale).toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <a href="#contenu" className="absolute -left-[999px] top-4 z-[90] bg-ink px-4 py-2 text-[11px] tracking-[0.22em] text-[#C9A24B] uppercase focus:left-4">
        {t.skip}
      </a>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 flex h-[4.5rem] items-center justify-between bg-transparent px-4 transition-opacity md:px-8",
          onIvory ? "pointer-events-none opacity-0" : "opacity-100",
        )}
      >
        <Link href="/" className="flex items-center gap-2 text-bone" aria-label="TRUE">
          <span className="grid h-5 w-5 place-items-center rounded-full border border-[#C9A24B]" aria-hidden="true">
            <span className="h-2 w-2 rounded-full bg-ink ring-1 ring-bone" />
          </span>
          <span className="font-display text-lg tracking-[0.14em]">TRUE</span>
        </Link>

        <nav className="hidden items-center gap-6 text-[13px] text-bone md:flex">
          {links.map((link) => {
            const active = link.href === "/shop" ? pathname === "/shop" : pathname === link.href;
            return (
              <Link key={link.href} href={link.href} className={cn(active && "underline decoration-[#C9A24B] underline-offset-4")}>
                {link.label}
              </Link>
            );
          })}
          <button type="button" onClick={() => openSizeGuide()}>
            {t.nav.cabin}
          </button>
          <Link href="/panier" className={cn(pathname === "/panier" && "underline decoration-[#C9A24B] underline-offset-4")}>
            {t.nav.cart} ({count})
          </Link>
          <ThemeToggle />
          <LocaleSwitch />
        </nav>

        <div className="flex items-center gap-4 text-bone md:hidden">
          <Link href="/panier" className="text-[13px]">
            {t.nav.cart} ({count})
          </Link>
          <ThemeToggle />
          <button type="button" aria-label={t.nav.openMenu} aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}>
            <MenuIcon className="h-3.5 w-5" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-ink" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
          <button type="button" className="absolute top-6 right-6 text-[#C9A24B]" aria-label={t.nav.closeMenu} onClick={() => setMenuOpen(false)}>
            <CloseIcon className="h-6 w-6" />
          </button>
          <nav className="flex h-full flex-col items-center justify-center gap-5">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="font-display text-5xl text-bone">
                {link.label}
              </Link>
            ))}
            <button type="button" className="font-display text-5xl text-bone" onClick={() => openSizeGuide()}>
              {t.nav.cabin}
            </button>
            <Link href="/panier" className="font-display text-5xl text-bone">
              {t.nav.cart} ({count})
            </Link>
            <button type="button" className="mt-4 text-bone/70" onClick={() => setSearchOpen(true)}>
              <SearchIcon className="mx-auto h-5 w-5" />
              <span className="mt-2 block text-[11px] tracking-[0.2em] uppercase">{t.nav.search}</span>
            </button>
            <ThemeToggle />
            <LocaleSwitch className="mt-4" />
          </nav>
        </div>
      )}

      {searchOpen && (
        <Search
          query={query}
          setQuery={setQuery}
          results={results.map((product) => ({ slug: product.slug, name: productName(product, locale) }))}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </>
  );
}

function Search({
  query,
  setQuery,
  results,
  onClose,
}: {
  query: string;
  setQuery: (value: string) => void;
  results: { slug: string; name: string }[];
  onClose: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 bg-ink" role="dialog" aria-modal="true" aria-label={t.search.label}>
      <button type="button" className="absolute top-6 right-6 text-[#C9A24B]" aria-label={t.nav.closeMenu} onClick={onClose}>
        <CloseIcon className="h-6 w-6" />
      </button>
      <form
        className="mx-auto flex h-full max-w-xl flex-col justify-center px-6"
        onSubmit={(event) => {
          event.preventDefault();
          router.push(query.trim() ? `/shop?q=${encodeURIComponent(query.trim())}` : "/shop");
          onClose();
        }}
      >
        <label htmlFor="search" className="sr-only">
          {t.search.label}
        </label>
        <input
          id="search"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t.search.placeholder}
          className="border-b border-[#C9A24B]/60 bg-transparent py-3 font-display text-3xl text-bone outline-none placeholder:text-bone/30"
        />
        <ul className="mt-8 space-y-3">
          {query.trim() && results.length === 0 && <li className="text-bone/50">{t.search.empty}</li>}
          {query.trim() &&
            results.map((result) => (
              <li key={result.slug}>
                <Link href={`/produit/${result.slug}`} className="text-2xl text-bone hover:text-[#C9A24B]">
                  {result.name}
                </Link>
              </li>
            ))}
        </ul>
      </form>
    </div>
  );
}
