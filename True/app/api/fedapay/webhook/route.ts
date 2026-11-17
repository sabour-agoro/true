import { applyApprovedPayment } from "@/lib/pass-pay";
import { verifyFedaPaySignature } from "@/lib/fedapay-signature";

export const runtime = "nodejs";

type FedaEvent = {
  name?: string;
  entity?: Record<string, unknown>;
  data?: { entity?: Record<string, unknown> };
};

export async function POST(request: Request) {
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: "config" }, { status: 503 });

  const payload = await request.text();
  if (!verifyFedaPaySignature(payload, request.headers.get("x-fedapay-signature"), secret)) {
    return Response.json({ error: "signature" }, { status: 400 });
  }

  let event: FedaEvent;
  try {
    event = JSON.parse(payload) as FedaEvent;
  } catch {
    return Response.json({ error: "payload" }, { status: 400 });
  }

  if (event.name === "transaction.approved") {
    const entity = event.entity ?? event.data?.entity;
    if (entity) {
      try {
        await applyApprovedPayment(entity);
      } catch (error) {
        console.error("fedapay webhook", error instanceof Error ? error.message : error);
        return Response.json({ error: "store" }, { status: 500 });
      }
    }
  }

  return Response.json({ received: true });
}
