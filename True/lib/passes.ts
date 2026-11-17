import { randomInt } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { PASS_PRICE, isPassAmount, normalizeCode } from "@/lib/pass-rules";
import { readBlobPasses, writeBlobPasses } from "@/lib/pass-blob";
import type { Size } from "@/data/products";

const LOCAL = path.join(process.cwd(), "data", "passes.json");
const TEMP = path.join("/tmp", "true-passes.json");

function storeFiles() {
  return process.env.VERCEL ? [TEMP] : [LOCAL, TEMP];
}
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export type PassPayment = {
  ref: string;
  amount: number;
  method: string;
  at: string;
};

export type Pass = {
  code: string;
  name: string;
  email: string;
  outfit: string;
  size: Size;
  total: number;
  paid: number;
  locale: "fr" | "en";
  payments: PassPayment[];
  pending: { ref: string; amount: number; method: string; provider: "stripe" | "fedapay" } | null;
  createdAt: string;
};

let queue: Promise<unknown> = Promise.resolve();

function update<T>(change: (passes: Pass[]) => Promise<T> | T) {
  const run = queue.then(() => changePassFile(change));
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readStore() {
  if (process.env.BLOB_READ_WRITE_TOKEN) return readBlobPasses();
  for (const file of storeFiles()) {
    try {
      const text = await fs.readFile(file, "utf8");
      const parsed = JSON.parse(text) as Pass[];
      if (Array.isArray(parsed)) return { passes: parsed, etag: null as string | null };
    } catch {
      continue;
    }
  }
  return { passes: [] as Pass[], etag: null as string | null };
}

async function writeStore(passes: Pass[], etag: string | null) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    await writeBlobPasses(passes, etag);
    return;
  }
  let saved = false;
  for (const file of storeFiles()) {
    try {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify(passes, null, 2));
      saved = true;
    } catch {
      continue;
    }
  }
  if (!saved) {
    await fs.mkdir("/tmp", { recursive: true });
    await fs.writeFile(TEMP, JSON.stringify(passes, null, 2));
  }
}

async function changePassFile<T>(change: (passes: Pass[]) => Promise<T> | T) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { passes, etag } = await readStore();
    const result = await change(passes);
    try {
      await writeStore(passes, etag);
      return result;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("pass-store");
}

async function readPasses() {
  return (await readStore()).passes;
}

function codeOf() {
  return Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

export function publicPass(pass: Pass) {
  return {
    code: pass.code,
    name: pass.name,
    outfit: pass.outfit,
    size: pass.size,
    total: pass.total,
    paid: pass.paid,
    remaining: Math.max(0, pass.total - pass.paid),
    unlocked: pass.paid >= pass.total,
  };
}

export async function findPass(code: string) {
  const normalized = normalizeCode(code);
  return (await readPasses()).find((pass) => pass.code === normalized) ?? null;
}

export async function createPass(input: { name: string; email: string; outfit: string; size: Size; locale: "fr" | "en"; code?: string }) {
  return update((passes) => {
    const requested = input.code ? normalizeCode(input.code) : "";
    const existing = requested ? passes.find((pass) => pass.code === requested) : undefined;
    if (existing) return existing;
    let code = requested || codeOf();
    while (passes.some((pass) => pass.code === code)) code = codeOf();
    const pass: Pass = {
      code,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      outfit: input.outfit,
      size: input.size,
      total: PASS_PRICE,
      paid: 0,
      locale: input.locale,
      payments: [],
      pending: null,
      createdAt: new Date().toISOString(),
    };
    passes.push(pass);
    return pass;
  });
}

export async function holdPayment(code: string, pending: NonNullable<Pass["pending"]>) {
  return update((passes) => {
    const pass = passes.find((item) => item.code === code);
    if (!pass) return null;
    pass.pending = pending;
    return pass;
  });
}

export async function recordApproved(code: string, payment: { ref: string; amount: number; method: string }) {
  return update((passes) => {
    const pass = passes.find((item) => item.code === normalizeCode(code));
    if (!pass) return { pass: null, justConfirmed: false };
    if (pass.payments.some((item) => item.ref === payment.ref)) return { pass, justConfirmed: false };
    if (!isPassAmount(pass.paid, payment.amount)) return { pass, justConfirmed: false };
    pass.paid += payment.amount;
    pass.payments.push({ ...payment, at: new Date().toISOString() });
    if (pass.pending?.ref === payment.ref) pass.pending = null;
    return { pass, justConfirmed: true };
  });
}

export async function confirmPending(code: string, ref: string, amount: number) {
  return update((passes) => {
    const pass = passes.find((item) => item.code === normalizeCode(code));
    if (!pass?.pending || pass.pending.ref !== ref || pass.pending.amount !== amount) {
      return { pass: pass ?? null, justConfirmed: false };
    }
    if (pass.payments.some((payment) => payment.ref === ref)) return { pass, justConfirmed: false };
    pass.paid += amount;
    pass.payments.push({ ref, amount, method: pass.pending.method, at: new Date().toISOString() });
    pass.pending = null;
    return { pass, justConfirmed: true };
  });
}


