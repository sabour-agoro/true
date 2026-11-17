"use client";

export function buildSpiralPath() {
  const cx = 120;
  const cy = 108;
  const turns = 2.2;
  const steps = 200;
  const outer = 96;
  const inner = 8;
  const start = -Math.PI / 2 - 0.45;
  let path = "";

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const radius = outer + (inner - outer) * Math.pow(t, 0.88);
    const angle = start + t * turns * Math.PI * 2;
    const x = cx + Math.cos(angle) * radius * 1.05;
    const y = cy + Math.sin(angle) * radius * 0.9;
    path += `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  return path;
}

export const SPIRAL_PATH = buildSpiralPath();

type MarkProps = {
  className?: string;
  progress?: number;
  color?: string;
  center?: string;
};

export function SpiralMark({ className, progress = 1, color = "#C9A24A", center = "var(--ink)" }: MarkProps) {
  const visible = Math.max(0, Math.min(1, progress));

  return (
    <svg viewBox="0 0 240 230" className={className} aria-hidden="true">
      <path
        d={SPIRAL_PATH}
        fill="none"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - visible}
      />
      <circle cx="120" cy="108" r="7.5" fill={center} opacity={visible > 0.92 ? (visible - 0.92) / 0.08 : 0} />
    </svg>
  );
}

export function HorizonMark({ className, progress = 1, color = "#C9A24A" }: MarkProps) {
  const visible = Math.max(0, Math.min(1, progress));

  return (
    <svg viewBox="0 0 360 160" className={className} aria-hidden="true">
      <g
        fill="none"
        stroke={color}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - visible}
      >
        <path d="M18 80 C70 80 96 74 118 80" strokeWidth="1.1" />
        <path d="M242 80 C264 74 290 80 342 80" strokeWidth="1.1" />
        <path d="M34 80 C78 68 112 66 128 80 C112 94 78 92 34 80" strokeWidth="0.8" />
        <path d="M326 80 C282 68 248 66 232 80 C248 94 282 92 326 80" strokeWidth="0.8" />
        <ellipse cx="180" cy="80" rx="62" ry="54" strokeWidth="1.15" />
        <ellipse cx="180" cy="80" rx="54" ry="47" strokeWidth="0.7" />
        <ellipse cx="180" cy="80" rx="46" ry="40" strokeWidth="1.35" />
      </g>
      <circle cx="180" cy="80" r="31" fill="var(--ink)" opacity={visible} />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return <span className={className}>TRUE</span>;
}
