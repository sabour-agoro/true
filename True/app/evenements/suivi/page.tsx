import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { events } from "@/data/events";
import { chemiseLabel } from "@/data/chemises";
import { settlePass } from "@/lib/pass-pay";
import { passQrPayload } from "@/lib/pass-seal";
import { PassSuiviView } from "@/components/PassSuiviView";

export const metadata: Metadata = { title: "Pass · Suivi & Billet" };
export const dynamic = "force-dynamic";

export default async function PassPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; session_id?: string; tx?: string; id?: string }>;
}) {
  const { code = "", session_id: sessionId, tx, id } = await searchParams;
  const txId = tx || id;
  const pass = code ? await settlePass(code, sessionId, txId) : null;
  const outfitName = pass ? chemiseLabel(pass.outfit) : "";

  let qrDataUrl: string | null = null;
  if (pass) {
    try {
      qrDataUrl = await QRCode.toDataURL(passQrPayload(pass.code), {
        width: 360,
        margin: 2,
        color: { dark: "#09090b", light: "#ffffff" },
      });
    } catch {
      qrDataUrl = null;
    }
  }

  return (
    <main className="min-h-screen">
      {pass ? (
        <PassSuiviView
          initialPass={pass}
          outfitName={outfitName}
          initialQrUrl={qrDataUrl}
        />
      ) : (
        <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-32 text-center">
          <p className="text-[11px] tracking-[0.32em] text-gold uppercase">{events[0].name}</p>
          <h1 className="mt-3 font-serif text-5xl tracking-[0.08em]">Code introuvable</h1>
          <p className="mt-6 text-mist">{"Ce pass n'existe pas encore ou le code est incorrect."}</p>
          <Link href="/evenements" className="mt-10 inline-block text-[11px] tracking-[0.22em] text-gold uppercase">
            {"← Retour à l'événement"}
          </Link>
        </div>
      )}
    </main>
  );
}
