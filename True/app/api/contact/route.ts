import { sendContactMail } from "@/lib/mail";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!rateLimit(`contact:${clientKey(request)}`, 5, 15 * 60 * 1000)) {
    return Response.json({ error: "rate" }, { status: 429 });
  }
  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    email?: unknown;
    message?: unknown;
  } | null;

  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 120) : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const message = typeof body?.message === "string" ? body.message.trim().slice(0, 4000) : "";

  if (!name || !EMAIL.test(email) || message.length < 2) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  const delivered = await sendContactMail({ name, email, message }).catch(() => false);
  return Response.json({ delivered });
}
