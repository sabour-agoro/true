"use client";

import Link from "next/link";
import { useEffect } from "react";
import { HorizonMark } from "@/components/marks";
import { formatPrice } from "@/lib/format";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/store/cart-store";

export function CheckoutSuccess({
  paid,
  email,
  amount,
}: {
  paid: boolean;
  email: string | null;
  amount: number;
}) {
  const { t, locale } = useI18n();
  const clear = useCart((state) => state.clear);

  useEffect(() => {
    if (paid) clear();
  }, [paid, clear]);

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center px-4 pt-36 pb-24 text-center">
      <HorizonMark className="h-20 w-44" />
      <h1 className="mt-8 font-serif text-5xl tracking-[0.12em] uppercase" style={{ paddingLeft: "0.12em" }}>
        {paid ? t.cart.successTitle : t.cart.missing}
      </h1>
      <p className="mt-5 text-base leading-relaxed text-mist">{paid ? t.cart.successBody : t.cart.missingBody}</p>
      {paid && (
        <p className="mt-4 font-serif text-3xl">{formatPrice(amount, locale)}</p>
      )}
      {paid && email && <p className="mt-2 text-sm text-mist">{email}</p>}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/shop" className="bg-gold px-6 py-3 text-[11px] tracking-[0.22em] text-ink uppercase">
          {t.cart.successBack}
        </Link>
        <Link href="/evenements" className="border border-gold px-6 py-3 text-[11px] tracking-[0.22em] text-gold uppercase">
          {t.event.kicker}
        </Link>
      </div>
    </div>
  );
}
