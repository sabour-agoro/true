"use client";

import { useEffect, useState } from "react";

export function GoldCursor() {
  const [point, setPoint] = useState({ x: -40, y: -40, hot: false, on: false });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.classList.add("true-cursor");

    const move = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target instanceof Element ? event.target : null;
      const hot = Boolean(target?.closest("a, button, [data-cursor]"));
      setPoint({ x: event.clientX, y: event.clientY, hot, on: true });
    };

    window.addEventListener("pointermove", move);
    return () => {
      document.documentElement.classList.remove("true-cursor");
      window.removeEventListener("pointermove", move);
    };
  }, []);

  if (!point.on) return null;

  const size = point.hot ? 16 : 7;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[100] rounded-full bg-[#C9A24B]"
      style={{
        width: size,
        height: size,
        transform: `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`,
        transition: "width 160ms ease, height 160ms ease",
      }}
    />
  );
}
