import type { Metadata } from "next";
import { EventExperience } from "@/components/EventExperience";

export const metadata: Metadata = { title: "Événement" };

export default function EventsPage() {
  return (
    <main>
      <EventExperience />
    </main>
  );
}
