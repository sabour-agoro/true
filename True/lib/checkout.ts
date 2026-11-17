import type Stripe from "stripe";
import { eventName, getEvent, tierName } from "@/data/events";
import { SIZES, getProduct, primaryImage, productName, type Size } from "@/data/products";
import { getStripe, requestOrigin } from "@/lib/stripe";

export type CheckoutError = "empty" | "unpriced" | "stock" | "config" | "stripe";

type PieceRequest = { slug?: unknown; size?: unknown; quantity?: unknown };
type TicketRequest = { event?: unknown; tier?: unknown; quantity?: unknown };

const SHIP_TO: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] = [
  "CI",
  "SN",
  "BF",
  "ML",
  "BJ",
  "TG",
  "NE",
  "GW",
  "FR",
];

function quantityOf(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : 0;
}

function isSize(value: unknown): value is Size {
  return typeof value === "string" && (SIZES as readonly string[]).includes(value);
}

export async function createCheckout(request: Request): Promise<{ url: string } | { error: CheckoutError }> {
  const body = (await request.json().catch(() => null)) as {
    locale?: unknown;
    pieces?: PieceRequest[];
    tickets?: TicketRequest[];
  } | null;

  const locale = body?.locale === "en" ? "en" : "fr";
  const pieces = Array.isArray(body?.pieces) ? body.pieces : [];
  const tickets = Array.isArray(body?.tickets) ? body.tickets : [];
  if (pieces.length + tickets.length === 0) return { error: "empty" };

  const origin = requestOrigin(request);
  const publicImages = origin.startsWith("https://");
  const lineItems: {
    quantity: number;
    price_data: {
      currency: "xof";
      unit_amount: number;
      product_data: { name: string; description?: string; images?: string[] };
    };
  }[] = [];

  for (const piece of pieces) {
    if (typeof piece.slug !== "string" || !isSize(piece.size)) return { error: "stock" };
    const product = getProduct(piece.slug);
    const quantity = quantityOf(piece.quantity);
    if (!product || quantity < 1 || quantity > product.stock[piece.size]) return { error: "stock" };
    if (product.price <= 0) return { error: "unpriced" };
    const image = primaryImage(product);
    lineItems.push({
      quantity,
      price_data: {
        currency: "xof",
        // XOF has no cents. 10 000 F CFA is unit_amount 10000.
        unit_amount: product.price,
        product_data: {
          name: productName(product, locale),
          description: `${piece.size}`,
          images: publicImages ? [`${origin}${image}`] : undefined,
        },
      },
    });
  }

  for (const ticket of tickets) {
    if (typeof ticket.event !== "string" || typeof ticket.tier !== "string") return { error: "stock" };
    const event = getEvent(ticket.event);
    const tier = event?.tiers.find((item) => item.id === ticket.tier);
    const quantity = quantityOf(ticket.quantity);
    if (!event || !tier || quantity < 1 || quantity > tier.stock) return { error: "stock" };
    if (tier.price <= 0) return { error: "unpriced" };
    lineItems.push({
      quantity,
      price_data: {
        currency: "xof",
        unit_amount: tier.price,
        product_data: {
          name: `${eventName(event, locale)} — ${tierName(tier, locale)}`,
          description: locale === "en" ? tier.noteEn : tier.note,
          images: publicImages ? [`${origin}${event.poster}`] : undefined,
        },
      },
    });
  }

  const hasPieces = pieces.length > 0;
  const stripe = getStripe();
  if (!stripe) return { error: "config" };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale,
      line_items: lineItems,
      billing_address_collection: "auto",
      shipping_address_collection: hasPieces ? { allowed_countries: SHIP_TO } : undefined,
      success_url: `${origin}/panier/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/panier`,
      metadata: {
        pieces: pieces
          .map((piece) => `${piece.slug}:${piece.size}x${piece.quantity}`)
          .join(",")
          .slice(0, 450),
        tickets: tickets
          .map((ticket) => `${ticket.event}:${ticket.tier}x${ticket.quantity}`)
          .join(",")
          .slice(0, 450),
      },
    });
    if (!session.url) return { error: "stripe" };
    return { url: session.url };
  } catch (error) {
    console.error("stripe checkout", error instanceof Error ? error.message : error);
    return { error: "stripe" };
  }
}
