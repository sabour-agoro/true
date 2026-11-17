"use client";

import { useUi } from "@/store/ui-store";

export function rememberFlight(slug: string, src: string, element: HTMLElement) {
  const rect = element.getBoundingClientRect();
  useUi.getState().setFlight({
    slug,
    src,
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  });
}
