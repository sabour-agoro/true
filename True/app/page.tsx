import Image from "next/image";
import Link from "next/link";
import { events } from "@/data/events";
import { site } from "@/data/site";

export default function HomePage() {
  const night = events[0];
  return (
    <main>
      <section className="relative flex min-h-screen items-end overflow-hidden">
        <Image src={night.poster} alt="" fill priority sizes="100vw" className="object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="relative mx-auto w-full max-w-5xl px-5 pb-20 md:px-8 md:pb-28">
          <p className="text-[11px] tracking-[0.32em] text-gold uppercase">{site.collection}</p>
          <h1 className="mt-3 font-display text-[clamp(3.5rem,13vw,9rem)] leading-[0.86] uppercase">{night.name}</h1>
          <p className="mt-6 max-w-xl font-serif text-xl text-bone/85">{night.description}</p>
          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-3 text-sm">
            <div>
              <dt className="text-[11px] tracking-[0.22em] text-mist uppercase">Ville</dt>
              <dd className="mt-1">{night.city}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.22em] text-mist uppercase">Date</dt>
              <dd className="mt-1">{site.eventDateLabel}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.22em] text-mist uppercase">Lieu</dt>
              <dd className="mt-1">{site.eventVenueLabel}</dd>
            </div>
            <div>
              <dt className="text-[11px] tracking-[0.22em] text-mist uppercase">Pass</dt>
              <dd className="mt-1">10 000 F CFA, chemise incluse</dd>
            </div>
          </dl>
          <Link href="/reservation" className="mt-10 inline-block bg-gold px-8 py-4 text-[11px] tracking-[0.22em] text-ink uppercase">
            Réserver ma place
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-20 md:px-8">
        <h2 className="font-display text-4xl uppercase md:text-6xl">Au programme</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {night.moments.map((moment) => (
            <li key={moment.fr} className="border border-line p-6 font-serif text-xl">
              {moment.fr}
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-xl text-mist">
          Ton pass te donne l&apos;accès à la salle. Tu choisis ta chemise (manches courtes ou longues, noire ou blanche) et ton logo, puis tu paies par mobile money.
        </p>
        <Link href="/reservation" className="mt-8 inline-block border border-gold px-8 py-4 text-[11px] tracking-[0.22em] text-gold uppercase">
          Choisir ma chemise
        </Link>
      </section>
    </main>
  );
}
