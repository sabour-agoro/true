export const SLEEVES = ["courtes", "longues"] as const;
export const COLORS = ["noire", "blanche"] as const;
export const LOGOS = ["horizon", "spirale", "true"] as const;
export const CHEMISE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type Sleeve = (typeof SLEEVES)[number];
export type Color = (typeof COLORS)[number];
export type Logo = (typeof LOGOS)[number];
export type ChemiseSize = (typeof CHEMISE_SIZES)[number];

export const sleeveLabel: Record<Sleeve, string> = {
  courtes: "Manches courtes",
  longues: "Manches longues",
};

export const colorLabel: Record<Color, string> = {
  noire: "Noire",
  blanche: "Blanche",
};

export const logoLabel: Record<Logo, string> = {
  horizon: "Horizon",
  spirale: "Spirale",
  true: "TRUE",
};

export const logoFile: Record<Logo, string> = {
  horizon: "/logos/logo-horizon.png",
  spirale: "/logos/logo-spirale.png",
  true: "/logos/logo-true.svg",
};

/** Visuels réels fournis pour la marque. Clé : manches-couleur-logo. */
const photos: Record<string, string> = {
  "longues-blanche-horizon": "/products/chemise-blanche-horizon-dos.png",
  "longues-blanche-spirale": "/products/chemise-blanche-spirale-dos.png",
  "longues-noire-horizon": "/products/chemise-noire-horizon-dos.jpg",
  "courtes-blanche-spirale": "/products/chemise-blanche-mc-spirale-dos.png",
  "courtes-blanche-true": "/products/chemise-blanche-mc-true-poitrine.png",
  "courtes-noire-spirale": "/products/chemise-noire-mc-spirale-dos.png",
};

export type OutfitItem = {
  key: string;
  sleeve: Sleeve;
  color: Color;
  logo: Logo;
  name: string;
  photo: string;
};

export const AVAILABLE_OUTFITS: OutfitItem[] = [
  {
    key: "longues-blanche-horizon",
    sleeve: "longues",
    color: "blanche",
    logo: "horizon",
    name: "Chemise blanche manches longues · Horizon",
    photo: "/products/chemise-blanche-horizon-dos.png",
  },
  {
    key: "longues-noire-horizon",
    sleeve: "longues",
    color: "noire",
    logo: "horizon",
    name: "Chemise noire manches longues · Horizon",
    photo: "/products/chemise-noire-horizon-dos.jpg",
  },
  {
    key: "courtes-blanche-spirale",
    sleeve: "courtes",
    color: "blanche",
    logo: "spirale",
    name: "Chemise blanche manches courtes · Spirale",
    photo: "/products/chemise-blanche-mc-spirale-dos.png",
  },
  {
    key: "courtes-noire-spirale",
    sleeve: "courtes",
    color: "noire",
    logo: "spirale",
    name: "Chemise noire manches courtes · Spirale",
    photo: "/products/chemise-noire-mc-spirale-dos.png",
  },
  {
    key: "longues-blanche-spirale",
    sleeve: "longues",
    color: "blanche",
    logo: "spirale",
    name: "Chemise blanche manches longues · Spirale",
    photo: "/products/chemise-blanche-spirale-dos.png",
  },
  {
    key: "courtes-blanche-true",
    sleeve: "courtes",
    color: "blanche",
    logo: "true",
    name: "Chemise blanche manches courtes · TRUE poitrine",
    photo: "/products/chemise-blanche-mc-true-poitrine.png",
  },
];

/** Identifiant stocké dans le pass : « courtes-noire-spirale ». */
export function chemiseKey(sleeve: Sleeve, color: Color, logo: Logo) {
  return `${sleeve}-${color}-${logo}`;
}

export function parseChemiseKey(value: unknown): { sleeve: Sleeve; color: Color; logo: Logo } | null {
  if (typeof value !== "string") return null;
  const [sleeve, color, logo, extra] = value.split("-");
  if (extra !== undefined) return null;
  if (!(SLEEVES as readonly string[]).includes(sleeve)) return null;
  if (!(COLORS as readonly string[]).includes(color)) return null;
  if (!(LOGOS as readonly string[]).includes(logo)) return null;
  return { sleeve: sleeve as Sleeve, color: color as Color, logo: logo as Logo };
}

export function chemisePhoto(sleeve: Sleeve, color: Color, logo: Logo) {
  return photos[chemiseKey(sleeve, color, logo)] ?? null;
}

export function chemiseLabel(value: string) {
  const parsed = parseChemiseKey(value);
  if (!parsed) return value;
  return `Chemise ${colorLabel[parsed.color].toLowerCase()} ${sleeveLabel[parsed.sleeve].toLowerCase()}, logo ${logoLabel[parsed.logo]}`;
}
