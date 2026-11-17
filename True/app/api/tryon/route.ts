import { TryOnError, runTryOn } from "@/lib/tryon";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    if (form.get("consent") !== "true") {
      return Response.json({ error: "Le consentement est requis." }, { status: 400 });
    }

    const photo = form.get("photo");
    const slug = form.get("productId");
    if (!(photo instanceof File) || typeof slug !== "string") {
      return Response.json({ error: "Photo ou pièce manquante." }, { status: 400 });
    }

    if (!photo.type.startsWith("image/")) {
      return Response.json({ error: "Le fichier doit être une image." }, { status: 400 });
    }

    const buffer = Buffer.from(await photo.arrayBuffer());
    const result = await runTryOn(buffer, slug);
    return Response.json(result);
  } catch (error) {
    if (error instanceof TryOnError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    return Response.json({ error: "L'essayage n'a pas pu être généré." }, { status: 500 });
  }
}
