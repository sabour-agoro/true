export type TicketTier = {
  id: string;
  name: string;
  nameEn: string;
  price: number;
  stock: number;
  note: string;
  noteEn: string;
};

export type EventNight = {
  slug: string;
  name: string;
  nameEn: string;
  startsAt: string;
  city: string;
  venue: string;
  venueEn: string;
  poster: string;
  description: string;
  descriptionEn: string;
  moments: { fr: string; en: string }[];
  tiers: TicketTier[];
};

export const events: EventNight[] = [
  {
    slug: "nuit-horizon",
    name: "Lancement officiel de la marque",
    nameEn: "Official brand launch",
    startsAt: "2027-01-03T20:00:00+00:00",
    city: "Lomé",
    venue: "Lieu à définir",
    venueEn: "Venue to be announced",
    poster: "/hero/trou-noir.jpg",
    description:
      "Lancement officiel de la marque TRUE, à Lomé. Le pass ouvre la salle.",
    descriptionEn:
      "Official launch of the TRUE brand, in Lomé. The pass opens the room.",
    moments: [
      { fr: "Ouverture de l'horizon", en: "Opening of the horizon" },
      { fr: "Défilé Collection 01", en: "Collection 01 show" },
      { fr: "Musique jusqu'à la dernière orbite", en: "Music until the last orbit" },
    ],
    tiers: [
      {
        id: "pass",
        name: "Pass",
        nameEn: "Pass",
        price: 10000,
        stock: 200,
        note: "10 000 F CFA. Tout d'un coup, ou à partir de 2 000 puis par 500.",
        noteEn: "10,000 F CFA. All at once, or from 2,000 then in steps of 500.",
      },
    ],
  },
];

export function getEvent(slug: string) {
  return events.find((event) => event.slug === slug);
}

export function eventName(event: EventNight, locale: "fr" | "en") {
  return locale === "en" ? event.nameEn : event.name;
}

export function tierName(tier: TicketTier, locale: "fr" | "en") {
  return locale === "en" ? tier.nameEn : tier.name;
}
