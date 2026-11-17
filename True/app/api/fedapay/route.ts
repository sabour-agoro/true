import { createMobileCheckout, normalizeTogoPhone, type FedaPayMethod } from "@/lib/fedapay";
import { eventName, getEvent, tierName } from "@/data/events";
import { SIZES, getProduct, productName, type Size } from "@/data/products";

type PieceRequest = { slug?: unknown; size?: unknown; quantity?: unknown };
type TicketRequest = { event?: unknown; tier?: unknown; quantity?: unknown };

function quantityOf(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) ? value : 0;
}

function isSize(value: unknown): value is Size {
  return typeof value === "string" && (SIZES as readonly string[]).includes(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    locale?: unknown;
    method?: unknown;
    phone?: unknown;
    pieces?: PieceRequest[];
    tickets?: TicketRequest[];
  } | null;

  const method = body?.method === "mixx" || body?.method === "flooz" ? body.method : null;
  const phone = typeof body?.phone === "string" ? normalizeTogoPhone(body.phone) : null;
  if (!method || !phone) return Response.json({ error: "phone" }, { status: 400 });

  const locale = body?.locale === "en" ? "en" : "fr";
  const pieces = Array.isArray(body?.pieces) ? body.pieces : [];
  const tickets = Array.isArray(body?.tickets) ? body.tickets : [];
  if (pieces.length + tickets.length === 0) return Response.json({ error: "empty" }, { status: 400 });

  const names: string[] = [];
  let amount = 0;

  for (const piece of pieces) {
    if (typeof piece.slug !== "string" || !isSize(piece.size)) return Response.json({ error: "stock" }, { status: 400 });
    const product = getProduct(piece.slug);
    const quantity = quantityOf(piece.quantity);
    if (!product || quantity < 1 || quantity > product.stock[piece.size]) return Response.json({ error: "stock" }, { status: 400 });
    if (product.price <= 0) return Response.json({ error: "unpriced" }, { status: 400 });
    amount += product.price * quantity;
    names.push(productName(product, locale));
  }

  for (const ticket of tickets) {
    if (typeof ticket.event !== "string" || typeof ticket.tier !== "string") return Response.json({ error: "stock" }, { status: 400 });
    const event = getEvent(ticket.event);
    const tier = event?.tiers.find((item) => item.id === ticket.tier);
    const quantity = quantityOf(ticket.quantity);
    if (!event || !tier || quantity < 1 || quantity > tier.stock) return Response.json({ error: "stock" }, { status: 400 });
    if (tier.price <= 0) return Response.json({ error: "unpriced" }, { status: 400 });
    amount += tier.price * quantity;
    names.push(`${eventName(event, locale)} — ${tierName(tier, locale)}`);
  }

  const result = await createMobileCheckout({
    request,
    method: method as FedaPayMethod,
    phone,
    amount,
    description: names.join(", ").slice(0, 180) || "TRUE",
  });

  if ("error" in result) {
    const status = result.error === "config" || result.error === "auth" ? 503 : 502;
    return Response.json({ error: result.error }, { status });
  }
  return Response.json({ url: result.url });
}
