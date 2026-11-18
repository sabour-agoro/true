import { findPass } from "@/lib/passes";
import { generateTicketPng } from "@/lib/pass-ticket";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!rateLimit(`pass-download:${clientKey(request)}`, 30, 15 * 60 * 1000)) {
    return new Response(JSON.stringify({ error: "rate" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }
  const url = new URL(request.url);
  const code = url.searchParams.get("code")?.trim() ?? "";

  if (!code) {
    return new Response(JSON.stringify({ error: "Code requis" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const pass = await findPass(code);
  if (!pass) {
    return new Response(JSON.stringify({ error: "Pass introuvable" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const pngBuffer = await generateTicketPng(pass);
    return new Response(new Uint8Array(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="pass-true-${pass.code}.png"`,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    console.error("Error generating pass ticket png:", err);
    return new Response(JSON.stringify({ error: "Erreur lors de la génération du pass" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
