import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getProduct, isSoldOut } from "@/data/products";

const MAX_BYTES = 8 * 1024 * 1024;

export class TryOnError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export async function runTryOn(photo: Buffer, slug: string) {
  if (photo.byteLength > MAX_BYTES) {
    throw new TryOnError("La photo dépasse 8 Mo.");
  }

  const product = getProduct(slug);
  if (!product) throw new TryOnError("Pièce introuvable.", 404);
  if (isSoldOut(product)) throw new TryOnError("Cette pièce est en rupture.", 409);

  const prepared = await sharp(photo)
    .rotate()
    .resize({ width: 1024, height: 1400, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 84 })
    .toBuffer();

  const key = process.env.TRYON_API_KEY;
  if (!key) {
    const image = await demoComposite(prepared, product.images.front ?? product.images.back);
    return { mode: "demo" as const, image };
  }

  const garmentPath = path.join(process.cwd(), "public", (product.images.front ?? product.images.back).replace(/^\//, ""));
  const garment = await readFile(garmentPath);
  const image = await callProvider(prepared, garment);
  return { mode: "live" as const, image };
}

async function demoComposite(photo: Buffer, publicPath: string) {
  const fitted = await sharp(photo).jpeg({ quality: 86 }).toBuffer();
  const meta = await sharp(fitted).metadata();
  const width = meta.width ?? 800;
  const height = meta.height ?? 1000;
  const probeWidth = 160;
  const probeHeight = Math.max(1, Math.round((height / width) * probeWidth));
  const probe = await sharp(fitted).resize(probeWidth, probeHeight, { fit: "fill" }).removeAlpha().raw().toBuffer();
  const found = findSubject(probe, probeWidth, probeHeight);
  const subject = {
    left: (found.left / probeWidth) * width,
    top: (found.top / probeHeight) * height,
    width: (found.width / probeWidth) * width,
    height: (found.height / probeHeight) * height,
  };
  const fullBody = subject.height > subject.width * 1.25;
  const shoulderY = subject.top + subject.height * (fullBody ? 0.14 : 0.06);
  const garmentPath = path.join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  const targetWidth = Math.round(Math.min(width * 0.94, Math.max(width * 0.42, subject.width * (fullBody ? 1.22 : 1.08))));
  const targetHeight = Math.round(Math.min(height * 0.72, subject.height * (fullBody ? 0.52 : 0.7)));
  const garment = await sharp(garmentPath).resize({ width: targetWidth, height: targetHeight, fit: "inside" }).png().toBuffer();
  const garmentMeta = await sharp(garment).metadata();
  const garmentWidth = garmentMeta.width ?? targetWidth;
  const garmentHeight = garmentMeta.height ?? targetHeight;
  const left = clamp(Math.round(subject.left + subject.width / 2 - garmentWidth / 2), 0, Math.max(0, width - garmentWidth));
  const top = clamp(Math.round(shoulderY), 0, Math.max(0, height - garmentHeight));
  const shadow = await sharp(garment).ensureAlpha().modulate({ brightness: 0 }).blur(14).png().toBuffer();
  const shadowLeft = clamp(left + 8, 0, Math.max(0, width - garmentWidth));
  const shadowTop = clamp(top + 14, 0, Math.max(0, height - garmentHeight));

  const output = await sharp(fitted)
    .composite([
      { input: shadow, left: shadowLeft, top: shadowTop },
      { input: garment, left, top },
    ])
    .jpeg({ quality: 84 })
    .toBuffer();

  return `data:image/jpeg;base64,${output.toString("base64")}`;
}

function findSubject(data: Buffer, width: number, height: number) {
  const corners = [
    [2, 2],
    [width - 3, 2],
    [2, height - 3],
    [width - 3, height - 3],
  ];
  let red = 0;
  let green = 0;
  let blue = 0;
  for (const [x, y] of corners) {
    const index = (y * width + x) * 3;
    red += data[index] ?? 0;
    green += data[index + 1] ?? 0;
    blue += data[index + 2] ?? 0;
  }
  red /= 4;
  green /= 4;
  blue /= 4;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let count = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 3;
      const distance = Math.abs((data[index] ?? 0) - red) + Math.abs((data[index + 1] ?? 0) - green) + Math.abs((data[index + 2] ?? 0) - blue);
      if (distance < 54) continue;
      count += 1;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (count < 40) {
    return { left: width * 0.18, top: height * 0.1, width: width * 0.64, height: height * 0.72 };
  }

  return {
    left: minX,
    top: minY,
    width: Math.max(1, maxX - minX),
    height: Math.max(1, maxY - minY),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

async function callProvider(photo: Buffer, garment: Buffer) {
  const base = (process.env.TRYON_API_URL || "https://api.fashn.ai/v1").replace(/\/$/, "");
  const key = process.env.TRYON_API_KEY as string;
  const model = process.env.TRYON_MODEL || "tryon-max";
  const photoUrl = `data:image/jpeg;base64,${photo.toString("base64")}`;
  const garmentUrl = `data:image/png;base64,${garment.toString("base64")}`;
  const inputs: Record<string, string | boolean> = {
    model_image: photoUrl,
    return_base64: true,
  };

  if (model.includes("max")) inputs.product_image = garmentUrl;
  else {
    inputs.garment_image = garmentUrl;
    inputs.category = "tops";
  }

  const headers = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  const runResponse = await fetch(`${base}/run`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model_name: model, inputs }),
  });

  if (!runResponse.ok) throw new TryOnError("L'essayage n'a pas pu être généré.", 502);

  const started = (await runResponse.json()) as { id?: string; error?: string | null };
  if (!started.id || started.error) throw new TryOnError("L'essayage n'a pas pu être généré.", 502);

  const deadline = Date.now() + 50_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const statusResponse = await fetch(`${base}/status/${started.id}`, { headers });
    if (!statusResponse.ok) continue;
    const status = (await statusResponse.json()) as {
      status?: string;
      output?: string[];
      error?: unknown;
    };
    if (status.status === "completed" && status.output?.[0]) return status.output[0];
    if (status.status === "failed") throw new TryOnError("L'essayage n'a pas pu être généré.", 502);
  }

  throw new TryOnError("L'essayage a pris trop de temps.", 504);
}
