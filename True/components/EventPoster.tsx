import Image from "next/image";

export function EventPoster({
  src,
  meta,
  priority = false,
}: {
  src: string;
  meta: string;
  priority?: boolean;
}) {
  return (
    <div className="relative aspect-[3/4.15] w-full overflow-hidden bg-[#050505] shadow-[0_28px_70px_rgba(0,0,0,0.4)]">
      <Image src={src} alt="" fill priority={priority} sizes="(max-width: 768px) 86vw, 420px" className="object-cover object-[center_42%]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/75" />
      <div className="pointer-events-none absolute inset-3 border border-[#C9A24A]/55" />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-6 pt-6 text-white md:px-7 md:pt-7">
        <p className="text-[10px] tracking-[0.42em]">TRUE</p>
        <p className="text-[10px] tracking-[0.32em] text-[#C9A24A]">01</p>
      </div>
      <div className="absolute inset-x-0 bottom-0 px-6 pb-6 text-white md:px-7 md:pb-7">
        <p className="text-[11px] tracking-[0.46em] text-[#C9A24A]">NUIT</p>
        <p className="mt-1 font-serif text-[2.7rem] leading-none tracking-[0.16em] md:text-6xl">HORIZON</p>
        <p className="mt-4 text-[11px] tracking-[0.18em] text-white/85">{meta}</p>
      </div>
    </div>
  );
}
