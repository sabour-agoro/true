"use client";

import Link from "next/link";
import { EventPoster } from "@/components/EventPoster";
import { eventName, events } from "@/data/events";
import { useI18n } from "@/lib/i18n";

function formatWhen(iso: string, locale: "fr" | "en") {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return { day, time, poster: `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()}` };
}

export function EventExperience() {
  const { t, locale } = useI18n();
  const night = events[0];
  const when = formatWhen(night.startsAt, locale);

  return (
    <div className="mx-auto grid min-h-screen max-w-6xl items-start gap-12 px-4 pt-32 pb-24 md:grid-cols-[minmax(0,420px)_minmax(0,1fr)] md:px-8">
      <EventPoster src={night.poster} meta={`${when.poster} · ${when.time} · ${night.city.toUpperCase()}`} priority />

      <div>
        <p className="text-[11px] tracking-[0.32em] text-gold uppercase">{t.event.kicker}</p>
        <h1 className="mt-3 font-serif text-5xl tracking-[0.12em] uppercase md:text-6xl" style={{ paddingLeft: "0.12em" }}>
          {eventName(night, locale)}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-mist">{locale === "en" ? night.descriptionEn : night.description}</p>

        <dl className="mt-8 grid gap-4 border-y border-line py-6 sm:grid-cols-2">
          <div>
            <dt className="text-[11px] tracking-[0.22em] text-gold uppercase">{t.event.when}</dt>
            <dd className="mt-2 font-serif text-2xl capitalize">{when.day}</dd>
            <dd className="text-sm text-mist">{when.time}</dd>
          </div>
          <div>
            <dt className="text-[11px] tracking-[0.22em] text-gold uppercase">{t.event.where}</dt>
            <dd className="mt-2 font-serif text-2xl">{night.city}</dd>
            <dd className="text-sm text-mist">{locale === "en" ? night.venueEn : night.venue}</dd>
          </div>
        </dl>

        <Link href="/evenements/pass" className="mt-8 inline-block bg-gold px-6 py-3 text-[11px] tracking-[0.24em] text-ink uppercase">
          {t.event.take}
        </Link>
      </div>
    </div>
  );
}

export function EventTeaser() {
  const { t, locale } = useI18n();
  const night = events[0];
  const when = formatWhen(night.startsAt, locale);

  return (
    <section className="border-t border-line bg-ink">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:px-8 lg:py-28">
        <EventPoster src={night.poster} meta={`${when.poster} · ${night.city.toUpperCase()}`} />
        <div>
          <p className="text-[11px] tracking-[0.32em] text-gold uppercase">{t.event.kicker}</p>
          <h2 className="mt-3 font-serif text-5xl tracking-[0.12em] uppercase md:text-6xl" style={{ paddingLeft: "0.12em" }}>
            {eventName(night, locale)}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-mist">{t.event.teaser}</p>
          <p className="mt-4 text-sm tracking-[0.14em] text-bone uppercase">{when.day} · {night.city}</p>
          <Link href="/evenements" className="mt-8 inline-block border border-gold px-6 py-3 text-[11px] tracking-[0.24em] text-gold uppercase">
            {t.event.take}
          </Link>
        </div>
      </div>
    </section>
  );
}
