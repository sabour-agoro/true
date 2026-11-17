export function formatPrice(value: number, _locale?: "fr" | "en") {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
    currencyDisplay: "symbol",
    maximumFractionDigits: 0,
  }).format(value);
}

export function padIndex(value: number) {
  return String(value).padStart(2, "0");
}
