import { getProduct, productName } from "@/data/products";
import { normalizeTogoPhone, readFedaPayStatus } from "@/lib/fedapay";
import { sendPassMails } from "@/lib/mail";
import {
  confirmPending,
  createPass,
  findPass,
  publicPass,
  recordApproved,
} from "@/lib/passes";
import { isPassAmount, isSize, outfitReady } from "@/lib/pass-rules";
import { passSeal, validPassSeal } from "@/lib/pass-seal";
import { getStripe } from "@/lib/stripe";

type PayBody = {
  locale?: unknown;
  name?: unknown;
  email?: unknown;
  outfit?: unknown;
  size?: unknown;
  mode?: unknown;
  amount?: unknown;
  method?: unknown;
  phone?: unknown;
  code?: unknown;
};

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function startPassPayment(request: Request) {
  const body = (await request.json().catch(() => null)) as PayBody | null;
  const locale = body?.locale === "en" ? "en" : "fr";
  const method = body?.method === "mixx" || body?.method === "flooz" ? body.method : null;
  const amount = typeof body?.amount === "number" && Number.isInteger(body.amount) ? body.amount : 0;
  const mode = body?.mode === "full" ? "full" : "part";
  if (!method) return { error: "method" as const, status: 400 };

  const existing = typeof body?.code === "string" && body.code.trim() ? await findPass(body.code) : null;
  if (typeof body?.code === "string" && body.code.trim() && !existing) return { error: "code" as const, status: 404 };

  let pass = existing;
  if (!pass) {
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (name.length < 2) return { error: "name" as const, status: 400 };
    if (!validEmail(email)) return { error: "email" as const, status: 400 };
    if (!outfitReady(body?.outfit, body?.size) || !isSize(body?.size) || typeof body?.outfit !== "string") {
      return { error: "outfit" as const, status: 400 };
    }
    pass = await createPass({ name, email, outfit: body.outfit, size: body.size, locale });
  }

  const due = mode === "full" ? pass.total - pass.paid : amount;
  if (pass.paid >= pass.total) return { error: "paid" as const, status: 400, code: pass.code };
  if (!isPassAmount(pass.paid, due)) return { error: "amount" as const, status: 400, code: pass.code };

  const outfit = getProduct(pass.outfit);
  const description = `Lancement officiel ${pass.code} · ${outfit ? productName(outfit, "fr") : pass.outfit} ${pass.size}`.slice(0, 180);
  const [firstname, ...rest] = pass.name.split(/\s+/);
  const lastname = rest.join(" ") || "TRUE";

  const phone = typeof body?.phone === "string" ? normalizeTogoPhone(body.phone) : null;
  if (!phone) return { error: "phone" as const, status: 400, code: pass.code };
  const publicKey = process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY;
  if (!publicKey) return { error: "config" as const, status: 503, code: pass.code };
  return {
    checkout: true,
    code: pass.code,
    amount: due,
    description,
    phone,
    firstname,
    lastname,
    email: pass.email,
    publicKey,
    metadata: {
      code: pass.code,
      seal: passSeal(pass.code),
      name: pass.name,
      email: pass.email,
      outfit: pass.outfit,
      size: pass.size,
      locale: pass.locale,
      createdAt: pass.createdAt,
    },
    status: 200,
  };
}

export async function settlePass(code: string, sessionId?: string, txId?: string) {
  const pass = await findPass(code);
  if (!pass) return null;

  if (pass.pending?.provider === "stripe" && sessionId && sessionId === pass.pending.ref) {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === "paid" && session.amount_total === pass.pending.amount) {
          const settled = await confirmPending(pass.code, sessionId, pass.pending.amount);
          if (settled.pass && settled.justConfirmed) await sendPassMails(settled.pass).catch(() => false);
          if (settled.pass) return publicPass(settled.pass);
        }
      } catch (error) {
        console.error("stripe pass session", error instanceof Error ? error.message : error);
      }
    }
  }

  if (pass.pending?.provider === "fedapay") {
    const remote = await readFedaPayStatus(pass.pending.ref).catch(() => null);
    if (remote?.approved && remote.amount === pass.pending.amount) {
      const settled = await confirmPending(pass.code, pass.pending.ref, pass.pending.amount);
      if (settled.pass && settled.justConfirmed) await sendPassMails(settled.pass).catch(() => false);
      if (settled.pass) return publicPass(settled.pass);
    }
  }

  if (txId && /^\d+$/.test(txId) && !pass.payments.some((payment) => payment.ref === txId)) {
    const remote = await readFedaPayStatus(txId).catch(() => null);
    const matches = remote?.code === pass.code && validPassSeal(pass.code, remote.seal);
    if (remote?.approved && remote.amount && matches && isPassAmount(pass.paid, remote.amount)) {
      const method = remote.mode === "moov_tg" ? "flooz" : "mixx";
      const settled = await recordApproved(pass.code, { ref: txId, amount: remote.amount, method });
      if (settled.pass && settled.justConfirmed) await sendPassMails(settled.pass).catch(() => false);
      if (settled.pass) return publicPass(settled.pass);
    }
  }

  return publicPass(pass);
}

export async function applyApprovedPayment(entity: Record<string, unknown>) {
  const meta = (entity.custom_metadata ?? entity.metadata) as Record<string, unknown> | undefined;
  const code = typeof meta?.code === "string" ? meta.code : "";
  const seal = typeof meta?.seal === "string" ? meta.seal : "";
  const amount = typeof entity.amount === "number" ? entity.amount : Number(entity.amount);
  const id = entity.id;
  if (!validPassSeal(code, seal) || !Number.isInteger(amount) || (typeof id !== "number" && typeof id !== "string")) return false;

  const outfit = typeof meta?.outfit === "string" ? meta.outfit : "";
  const size = meta?.size;
  const email = typeof meta?.email === "string" ? meta.email : "";
  const name = typeof meta?.name === "string" ? meta.name : "";
  let pass = await findPass(code);
  if (!pass) {
    if (!outfitReady(outfit, size) || !isSize(size) || name.length < 2 || !email.includes("@")) return false;
    pass = await createPass({
      name,
      email,
      outfit,
      size,
      locale: meta?.locale === "en" ? "en" : "fr",
      code,
    });
  }

  const method = entity.mode === "moov_tg" ? "flooz" : "mixx";
  const settled = await recordApproved(pass.code, { ref: String(id), amount, method });
  if (settled.pass && settled.justConfirmed) await sendPassMails(settled.pass).catch(() => false);
  return Boolean(settled.pass);
}

