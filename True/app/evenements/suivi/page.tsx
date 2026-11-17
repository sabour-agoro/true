import type { Metadata } from "next";
import Link from "next/link";
import { events } from "@/data/events";
import { getProduct, productName } from "@/data/products";
import { formatPrice } from "@/lib/format";
import { settlePass } from "@/lib/pass-pay";

export const metadata: Metadata = { title: "Pass" };
export const dynamic = "force-dynamic";

export default async function PassPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; session_id?: string; tx?: string }>;
}) {
  const { code = "", session_id: sessionId, tx } = await searchParams;
  const pass = code ? await settlePass(code, sessionId, tx) : null;
  const outfit = pass ? getProduct(pass.outfit) : undefined;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-32">
      <p className="text-[11px] tracking-[0.32em] text-gold uppercase">{events[0].name}</p>
      {pass ? (
        <>
          <h1 className="mt-3 font-serif text-5xl tracking-[0.08em]">{pass.unlocked ? "Pass débloqué" : "Paiement en cours"}</h1>
          <p className="mt-6 font-serif text-3xl tracking-[0.2em]">{pass.code}</p>
          <p className="mt-4 text-mist">
            {pass.name} · {outfit ? productName(outfit, "fr") : pass.outfit} · {pass.size}
          </p>
          <p className="mt-2 text-bone">
            {formatPrice(pass.paid, "fr")} payés · {formatPrice(pass.remaining, "fr")} restants
          </p>
          <p className="mt-6 text-sm leading-relaxed text-mist">
            {pass.unlocked
              ? "Le QR part par email. Montre-le à l'entrée."
              : "Un email reprend ce code, la somme payée et ce qu'il reste. Tu ressaisis le code pour continuer."}
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-3 font-serif text-5xl tracking-[0.08em]">Code introuvable</h1>
          <p className="mt-6 text-mist">{"Ce pass n'existe pas encore."}</p>
        </>
      )}
      <Link href="/evenements" className="mt-10 text-[11px] tracking-[0.22em] text-gold uppercase">
        {"Retour à l'événement"}
      </Link>
    </main>
  );
}
