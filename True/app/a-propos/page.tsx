import type { Metadata } from "next";
import { AboutStory } from "@/components/AboutStory";

export const metadata: Metadata = { title: "À propos" };

export default function AboutPage() {
  return (
    <main>
      <AboutStory />
    </main>
  );
}
