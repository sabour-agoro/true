import type { Metadata } from "next";
import { EventPassForm } from "@/components/EventPassForm";

export const metadata: Metadata = { title: "Pass" };

export default function PassPage() {
  return (
    <main className="mx-auto min-h-screen max-w-xl px-4 pt-28 pb-20">
      <EventPassForm />
    </main>
  );
}
