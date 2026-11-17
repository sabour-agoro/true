import { createHmac, timingSafeEqual } from "crypto";

function secret() {
  return process.env.FEDAPAY_SECRET_KEY || "";
}

function mac(label: string, code: string) {
  return createHmac("sha256", secret()).update(`${label}:${code}`).digest("base64url");
}

function same(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function passSeal(code: string) {
  return mac("pass", code);
}

export function validPassSeal(code: string, seal: string | undefined) {
  if (!code || !seal || !secret()) return false;
  return same(passSeal(code), seal);
}

export function passQrPayload(code: string) {
  return `TRUE:${code}:${mac("qr", code)}`;
}
