"use client";

import { useEffect } from "react";
import { useUi } from "@/store/ui-store";

export function IntroLoader() {
  const setIntroDone = useUi((state) => state.setIntroDone);

  useEffect(() => {
    setIntroDone(true);
  }, [setIntroDone]);

  return null;
}
