"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { prefersReducedMotion } from "@/lib/motion";

const letters = [
  { char: "T", x: "-38vw", y: "-28vh", rotate: -16 },
  { char: "R", x: "16vw", y: "-34vh", rotate: 12 },
  { char: "U", x: "-10vw", y: "32vh", rotate: 8 },
  { char: "E", x: "40vw", y: "12vh", rotate: 18 },
];

export function PageTransition() {
  const pathname = usePathname();
  const first = useRef(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (prefersReducedMotion()) return;
    setVisible(true);
    const timer = window.setTimeout(() => setVisible(false), 880);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[75] flex items-center justify-center bg-[#EDE6D6]" aria-hidden="true">
      <p className="flex items-end text-black">
        {letters.map((letter) => (
          <motion.span
            key={letter.char}
            initial={{ x: letter.x, y: letter.y, rotate: letter.rotate }}
            animate={{ x: 0, y: 0, rotate: 0 }}
            transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[16vw] leading-[0.8]"
          >
            {letter.char}
          </motion.span>
        ))}
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.42, duration: 0.22 }}
          className="mb-[3.2vw] ml-[0.4vw] inline-block h-[1.7vw] w-[1.7vw] rounded-full bg-[#C9A24B]"
        />
      </p>
    </div>
  );
}
