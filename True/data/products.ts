export const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;

export type Size = (typeof SIZES)[number];

export type Product = {
  slug: string;
  name: string;
  nameEn: string;
  price: number;
  description: string;
  descriptionEn: string;
  releasedAt: string;
  images: {
    back: string;
    front?: string;
    detail: string;
  };
  stock: Record<Size, number>;
};

export const products: Product[] = [
  {
    slug: "veste-noire-horizon",
    name: "Veste noire Horizon",
    nameEn: "Black Horizon Jacket",
    price: 0,
    releasedAt: "2026-10-06",
    description:
      "Coupe courte, tombé net. Dans le dos, un horizon d'or : le disque noir, les anneaux, la lumière qui ne revient pas.",
    descriptionEn:
      "A cropped, precise jacket. On the back, a gold horizon: the black disk, the rings, the light that does not return.",
    images: {
      back: "/products/veste-noire-horizon-dos.png",
      detail: "/products/veste-noire-horizon-dos-detail.png",
    },
    stock: { XS: 2, S: 4, M: 6, L: 5, XL: 3, XXL: 1 },
  },
  {
    slug: "chemise-blanche-horizon",
    name: "Chemise blanche Horizon",
    nameEn: "White Horizon Shirt",
    price: 0,
    releasedAt: "2026-10-05",
    description:
      "Chemise courte en coton souple. Le même horizon, brodé sur blanc — le trou noir devient une signature.",
    descriptionEn:
      "A cropped shirt in soft cotton. The same horizon, embroidered on white — the black hole becomes a signature.",
    images: {
      back: "/products/chemise-blanche-horizon-dos.png",
      detail: "/products/chemise-blanche-horizon-dos-detail.png",
    },
    stock: { XS: 1, S: 3, M: 4, L: 4, XL: 2, XXL: 0 },
  },
  {
    slug: "chemise-blanche-spirale",
    name: "Chemise blanche Spirale TRUE",
    nameEn: "White Spiral TRUE Shirt",
    price: 0,
    releasedAt: "2026-10-04",
    description:
      "Manches longues, col ouvert. La spirale dorée ramène le regard vers TRUE, au centre.",
    descriptionEn:
      "Long sleeves, an open collar. The gold spiral draws the eye back to TRUE, at the center.",
    images: {
      back: "/products/chemise-blanche-spirale-dos.png",
      detail: "/products/chemise-blanche-spirale-dos-detail.png",
    },
    stock: { XS: 2, S: 5, M: 6, L: 4, XL: 3, XXL: 2 },
  },
  {
    slug: "chemise-blanche-mc-spirale",
    name: "Chemise blanche manches courtes Spirale TRUE",
    nameEn: "White Short-Sleeve Spiral TRUE Shirt",
    price: 0,
    releasedAt: "2026-10-03",
    description:
      "La version courte. Même spirale, même mot, moins de tissu entre toi et l'air.",
    descriptionEn:
      "The short version. Same spiral, same word, less cloth between you and the air.",
    images: {
      back: "/products/chemise-blanche-mc-spirale-dos.png",
      detail: "/products/chemise-blanche-mc-spirale-dos-detail.png",
    },
    stock: { XS: 3, S: 5, M: 5, L: 4, XL: 2, XXL: 1 },
  },
  {
    slug: "chemise-noire-mc-spirale",
    name: "Chemise noire manches courtes Spirale TRUE",
    nameEn: "Black Short-Sleeve Spiral TRUE Shirt",
    price: 0,
    releasedAt: "2026-10-02",
    description:
      "Noire, courte. La spirale est brodée au fil d'or, TRUE en lettres claires.",
    descriptionEn:
      "Black, cropped. The spiral is embroidered in gold thread, TRUE in pale letters.",
    images: {
      back: "/products/chemise-noire-mc-spirale-dos.png",
      detail: "/products/chemise-noire-mc-spirale-dos-detail.png",
    },
    stock: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
  },
  {
    slug: "chemise-blanche-mc-true",
    name: "Chemise blanche manches courtes TRUE poitrine",
    nameEn: "White Short-Sleeve TRUE Chest Shirt",
    price: 0,
    releasedAt: "2026-10-01",
    description:
      "Le mot TRUE, brodé sur la poitrine. Rien d'autre. Le trou noir se devine.",
    descriptionEn:
      "The word TRUE, embroidered on the chest. Nothing else. The black hole is implied.",
    images: {
      front: "/products/chemise-blanche-mc-true-poitrine.png",
      back: "/products/chemise-blanche-mc-true-poitrine.png",
      detail: "/products/chemise-blanche-mc-true-poitrine-detail.png",
    },
    stock: { XS: 2, S: 0, M: 4, L: 4, XL: 2, XXL: 1 },
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function totalStock(product: Product) {
  return SIZES.reduce((sum, size) => sum + product.stock[size], 0);
}

export function isSoldOut(product: Product) {
  return totalStock(product) === 0;
}

export function firstAvailableSize(product: Product): Size | null {
  return SIZES.find((size) => product.stock[size] > 0) ?? null;
}

export function productName(product: Product, locale: "fr" | "en") {
  return locale === "en" ? product.nameEn : product.name;
}

export function productDescription(product: Product, locale: "fr" | "en") {
  return locale === "en" ? product.descriptionEn : product.description;
}

export function galleryOf(product: Product) {
  const items: { src: string; label: string; labelEn: string }[] = [];
  if (product.images.front && product.images.front !== product.images.back) {
    items.push({ src: product.images.front, label: "Face", labelEn: "Front" });
  }
  items.push({
    src: product.images.back,
    label: product.images.front && product.images.front === product.images.back ? "Face" : "Dos",
    labelEn: product.images.front && product.images.front === product.images.back ? "Front" : "Back",
  });
  if (product.images.front && product.images.front !== product.images.back) {
    // front already added first; back label stays Dos
  }
  items.push({ src: product.images.detail, label: "Détail", labelEn: "Detail" });
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.src}-${item.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function primaryImage(product: Product) {
  return product.images.front ?? product.images.back;
}
