import type { Metadata } from "next";
import { ShopExperience } from "@/components/ShopExperience";

export const metadata: Metadata = { title: "Boutique" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ cabine?: string; q?: string }>;
}) {
  const params = await searchParams;
  return (
    <main>
      <ShopExperience initialSlug={params.cabine} query={params.q} />
    </main>
  );
}
