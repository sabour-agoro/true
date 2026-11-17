import { findPass, publicPass } from "@/lib/passes";
import { settlePass, startPassPayment } from "@/lib/pass-pay";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!rateLimit(`pass-read:${clientKey(request)}`, 30, 15 * 60 * 1000)) {
    return Response.json({ error: "rate" }, { status: 429 });
  }
  const code = new URL(request.url).searchParams.get("code") ?? "";
  const pass = await findPass(code);
  if (!pass) return Response.json({ error: "code" }, { status: 404 });
  const settled = await settlePass(pass.code);
  return Response.json(settled ?? publicPass(pass));
}

export async function POST(request: Request) {
  if (!rateLimit(`pass-pay:${clientKey(request)}`, 8, 15 * 60 * 1000)) {
    return Response.json({ error: "rate" }, { status: 429 });
  }
  try {
    const result = await startPassPayment(request);
    return Response.json(result, { status: result.status });
  } catch (error) {
    console.error("pass pay", error instanceof Error ? error.message : error);
    return Response.json({ error: "pay" }, { status: 502 });
  }
}
