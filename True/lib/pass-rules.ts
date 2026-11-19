import { CHEMISE_SIZES, parseChemiseKey } from "@/data/chemises";

export const PASS_PRICE = 10000;
// Anciens paiements échelonnés (boutique) : conservés pour compatibilité, plus utilisés.
export const PASS_START = 2000;
export const PASS_STEP = 500;

export type Size = (typeof CHEMISE_SIZES)[number];

export function isSize(value: unknown): value is Size {
  return typeof value === "string" && (CHEMISE_SIZES as readonly string[]).includes(value);
}

/** Paiement unique : le montant doit être exactement le reste à payer. */
export function isPassAmount(paid: number, amount: number) {
  const remaining = PASS_PRICE - paid;
  return Number.isInteger(amount) && remaining > 0 && amount === remaining;
}

export function normalizeCode(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function outfitReady(key: unknown, size: unknown) {
  return parseChemiseKey(key) !== null && isSize(size);
}
