const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  if (!EMAIL.test(email)) {
    return Response.json({ error: "invalid" }, { status: 400 });
  }

  return Response.json({ ok: true });
}
