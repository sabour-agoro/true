import { get, put } from "@vercel/blob";
import type { Pass } from "@/lib/passes";

const PATHNAME = "true-passes.json";

function token() {
  const value = process.env.BLOB_READ_WRITE_TOKEN;
  if (!value) throw new Error("blob-config");
  return value;
}

export async function readBlobPasses() {
  const result = await get(PATHNAME, { access: "private", token: token(), useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return { passes: [] as Pass[], etag: null as string | null };
  const parsed = JSON.parse(await new Response(result.stream).text()) as unknown;
  return {
    passes: Array.isArray(parsed) ? (parsed as Pass[]) : [],
    etag: result.blob.etag,
  };
}

export async function writeBlobPasses(passes: Pass[], etag: string | null) {
  await put(PATHNAME, JSON.stringify(passes), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token: token(),
    ...(etag ? { ifMatch: etag } : {}),
  });
}
