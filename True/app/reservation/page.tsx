import type { Metadata } from "next";
import { ReservationWizard } from "@/components/ReservationWizard";

export const metadata: Metadata = { title: "Réserver ma place" };

export default function ReservationPage() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pt-28 pb-20 md:px-8">
      <p className="text-[11px] tracking-[0.32em] text-gold uppercase">Lancement officiel</p>
      <h1 className="mt-3 mb-10 font-display text-[clamp(2.5rem,8vw,5rem)] leading-[0.9] uppercase">Réserver ma place</h1>
      <ReservationWizard />
    </main>
  );
}
