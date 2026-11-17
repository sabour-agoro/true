import { SIZES, getProduct, type Size } from "@/data/products";

export const PASS_PRICE = 10000;
export const PASS_START = 2000;
export const PASS_STEP = 500;

export function isSize(value: unknown): value is Size {
  return typeof value === "string" && (SIZES as readonly string[]).includes(value);
}

export function isPassAmount(paid: number, amount: number) {
  const remaining = PASS_PRICE - paid;
  if (!Number.isInteger(amount) || amount < PASS_STEP || amount > remaining) return false;
  if (amount % PASS_STEP !== 0) return false;
  if (paid === 0 && amount < PASS_START) return false;
  return true;
}

export function normalizeCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function outfitReady(slug: unknown, size: unknown) {
  if (typeof slug !== "string" || !isSize(size)) return false;
  const product = getProduct(slug);
  return Boolean(product && product.stock[size] > 0);
}
