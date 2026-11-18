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
  pending = false,
  retryHref,
}: {
  paid: boolean;
  email: string | null;
  amount: number;
  pending?: boolean;
  retryHref?: string;
}) {
  const { t, locale } = useI18n();
  const clear = useCart((state) => state.clear);

  useEffect(() => {
    if (paid) clear();
  }, [paid, clear]);

  const pendingTitle = locale === "en" ? "Payment pending" : "Paiement en attente";
  const pendingBody =
    locale === "en"
      ? "Confirm the request on your phone (USSD / PIN), then check again. Do not pay twice."
      : "Validez la demande sur votre téléphone (USSD / code PIN), puis vérifiez à nouveau. Ne payez pas deux fois.";

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center px-4 pt-36 pb-24 text-center">
      <HorizonMark className="h-20 w-44" />
      <h1 className="mt-8 font-serif text-5xl tracking-[0.12em] uppercase" style={{ paddingLeft: "0.12em" }}>
        {paid ? t.cart.successTitle : pending ? pendingTitle : t.cart.missing}
      </h1>
      <p className="mt-5 text-base leading-relaxed text-mist">
        {paid ? t.cart.successBody : pending ? pendingBody : t.cart.missingBody}
      </p>
      {pending && retryHref && (
        <a href={retryHref} className="mt-6 border border-gold px-6 py-3 text-[11px] tracking-[0.22em] text-gold uppercase">
          {locale === "en" ? "Check again" : "Vérifier à nouveau"}
        </a>
      )}
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
