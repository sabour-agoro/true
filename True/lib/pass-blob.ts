import { get, put } from "@vercel/blob";
import type { Pass } from "@/lib/passes";

const PATHNAME = "true-passes.json";

// L'ETag renvoyé par le CDN est parfois entre guillemets (ou préfixé W/) :
// on le normalise pour qu'il corresponde à celui attendu par `ifMatch`.
function cleanEtag(value: string | null | undefined) {
  if (!value) return null;
  const trimmed = value.trim().replace(/^W\//i, "").replace(/^"|"$/g, "");
  return trimmed || null;
}

function token() {
  const value = process.env.BLOB_READ_WRITE_TOKEN;
  if (!value) throw new Error("blob-config");
  return value;
}

export async function readBlobPasses() {
  try {
    const result = await get(PATHNAME, { access: "private", token: token(), useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return { passes: [] as Pass[], etag: null as string | null };
    const parsed = JSON.parse(await new Response(result.stream).text()) as unknown;
    return {
      passes: Array.isArray(parsed) ? (parsed as Pass[]) : [],
      etag: cleanEtag(result.blob.etag),
    };
  } catch (err) {
    console.error("readBlobPasses caught:", err instanceof Error ? err.message : err);
    return { passes: [] as Pass[], etag: null as string | null };
  }
}

export async function writeBlobPasses(passes: Pass[], etag: string | null) {
  try {
    await put(PATHNAME, JSON.stringify(passes), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
      token: token(),
      ...(etag ? { ifMatch: cleanEtag(etag) ?? undefined } : {}),
    });
  } catch (err) {
    console.error("writeBlobPasses error:", err instanceof Error ? err.message : err);
    throw err;
  }
}
