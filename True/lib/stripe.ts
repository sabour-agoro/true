import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

export function requestOrigin(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0]?.trim();
  const proto = (request.headers.get("x-forwarded-proto") ?? "https").split(",")[0]?.trim();
  if (host) return `${proto === "http" ? "http" : "https"}://${host}`;
  return new URL(request.url).origin;
}
