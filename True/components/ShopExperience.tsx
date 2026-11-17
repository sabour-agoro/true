"use client";

import { useEffect } from "react";
import { CollectionGrid } from "@/components/CollectionGrid";
import { useUi } from "@/store/ui-store";

export function ShopExperience({ initialSlug, query = "" }: { initialSlug?: string; query?: string }) {
  const openSizeGuide = useUi((state) => state.openSizeGuide);

  useEffect(() => {
    if (initialSlug) openSizeGuide(initialSlug);
  }, [initialSlug, openSizeGuide]);

  return (
    <div className="pt-24">
      <CollectionGrid variant="page" query={query} />
    </div>
  );
}
