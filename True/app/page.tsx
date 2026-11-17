import { CollectionGrid } from "@/components/CollectionGrid";
import { EventTeaser } from "@/components/EventExperience";
import { Hero } from "@/components/Hero";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <CollectionGrid />
      <EventTeaser />
    </main>
  );
}
