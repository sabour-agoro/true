import { createHmac, timingSafeEqual } from "crypto";

const TOLERANCE_SECONDS = 5 * 60;

function same(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyFedaPaySignature(payload: string, header: string | null, secret: string) {
  if (!header || !secret) return false;
  const parts = new Map(
    header.split(",").map((part) => {
      const index = part.indexOf("=");
      return [part.slice(0, index).trim(), part.slice(index + 1).trim()] as const;
    }),
  );
  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature || !/^\d+$/.test(timestamp)) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (age > TOLERANCE_SECONDS) return false;
  const signed = `${timestamp}.${payload}`;
  const hex = createHmac("sha256", secret).update(signed).digest("hex");
  const base64 = createHmac("sha256", secret).update(signed).digest("base64");
  return same(signature, hex) || same(signature, base64);
}
