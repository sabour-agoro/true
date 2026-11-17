"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { isSoldOut, primaryImage, productName, products, type Product } from "@/data/products";
import { formatPrice, padIndex } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { prefersReducedMotion } from "@/lib/motion";

type Filter = "all" | "shirts" | "jackets" | "stock";

export function CollectionGrid({ variant = "home", query = "" }: { variant?: "home" | "page"; query?: string }) {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState<Filter>("all");
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const update = () => setColumns(window.innerWidth >= 1024 ? 3 : 2);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((product) => {
      const name = productName(product, locale).toLowerCase();
      if (needle && !name.includes(needle)) return false;
      if (filter === "shirts") return product.slug.includes("chemise");
      if (filter === "jackets") return product.slug.includes("veste");
      if (filter === "stock") return !isSoldOut(product);
      return true;
    });
  }, [filter, locale, query]);

  const lanes = Array.from({ length: columns }, (_, lane) => visible.filter((_, index) => index % columns === lane));
  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t.shop.all },
    { id: "shirts", label: t.shop.shirts },
    { id: "jackets", label: t.shop.jackets },
    { id: "stock", label: t.shop.stock },
  ];

  return (
    <section id="collection" className="bg-ink px-4 py-16 md:px-8 md:py-24">
      <div className="mx-auto max-w-[1440px]">
        {variant === "page" && (
          <div className="mb-10 flex flex-col gap-6 md:mb-14">
            <div className="flex items-end justify-between gap-4">
              <h1 className="font-display text-[16vw] leading-[0.8] text-bone md:text-[9rem]">
                {t.nav.collection}
                <span className="ml-3 align-top text-[0.28em] tracking-normal text-bone/80">({padIndex(visible.length)})</span>
              </h1>
            </div>
            <div className="flex flex-wrap justify-end gap-5 text-[13px]">
              {filters.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={filter === item.id ? "text-bone underline decoration-[#C9A24B] underline-offset-4" : "text-bone/55 hover:text-bone"}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3">
          {lanes.map((lane, laneIndex) => (
            <Lane key={laneIndex} lane={laneIndex} items={lane} start={laneIndex} step={columns} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Lane({ lane, items, start, step }: { lane: number; items: Product[]; start: number; step: number }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!node || prefersReducedMotion()) return;
    const shift = lane % 2 === 0 ? -0.045 : 0.06;
    const onScroll = () => {
      const top = node.getBoundingClientRect().top;
      node.style.transform = `translate3d(0, ${(window.innerHeight * 0.35 - top) * shift}px, 0)`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [lane, node]);

  return (
    <div ref={setNode} className="flex flex-col gap-8 md:gap-12">
      {items.map((product, index) => (
        <ProductTile key={product.slug} product={product} index={start + index * step} />
      ))}
    </div>
  );
}

function ProductTile({ product, index }: { product: Product; index: number }) {
  const { t, locale } = useI18n();
  const name = productName(product, locale);
  const soldOut = isSoldOut(product);
  const src = primaryImage(product);

  return (
    <article className={soldOut ? "grayscale" : ""}>
      <p className="mb-2 text-[11px] tracking-[0.16em] text-bone/45">{padIndex(index + 1)}</p>
      <Link href={`/produit/${product.slug}`} data-cursor className="group relative block aspect-[4/5] overflow-hidden bg-panel">
        <Image src={src} alt={name} fill sizes="(max-width: 1024px) 50vw, 30vw" className="object-contain p-6 transition duration-500 group-hover:opacity-0" />
        <Image
          src={product.images.detail}
          alt=""
          fill
          sizes="(max-width: 1024px) 50vw, 30vw"
          className="object-contain p-4 opacity-0 transition duration-500 group-hover:opacity-100"
        />
        {soldOut && (
          <span className="absolute top-3 right-3 rounded-full border border-bone/30 px-2 py-1 text-[10px] tracking-[0.16em] text-bone uppercase">
            {t.shop.badge}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="text-sm text-bone">{name}</span>
          <span className="text-sm text-[#C9A24B]">{formatPrice(product.price, locale)}</span>
        </span>
      </Link>
    </article>
  );
}
