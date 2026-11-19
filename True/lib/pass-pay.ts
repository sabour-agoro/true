import { chemiseLabel } from "@/data/chemises";
import { createMobileCheckout, normalizeTogoPhone, readFedaPayStatus } from "@/lib/fedapay";
import { sendPassMails } from "@/lib/mail";
import {
  confirmPending,
  createPass,
  findPass,
  holdPayment,
  publicPass,
  recordApproved,
} from "@/lib/passes";
import { isPassAmount, isSize, outfitReady } from "@/lib/pass-rules";
import { passSeal, validPassSeal } from "@/lib/pass-seal";
import { getStripe, requestOrigin } from "@/lib/stripe";

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
  // Paiement unique : le pass se règle toujours en une fois.
  const mode = "full" as const;
  if (!method) return { error: "method" as const, status: 400 };

  const existing = typeof body?.code === "string" && body.code.trim() ? await findPass(body.code) : null;
  if (typeof body?.code === "string" && body.code.trim() && !existing) return { error: "code" as const, status: 404 };

  let pass = existing;
  if (!pass) {
    // Le champ 'name' n'est plus requis ; il peut rester vide.
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    // L'email devient optionnel : s'il est fourni, il doit être valide.
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (email && !validEmail(email)) return { error: "email" as const, status: 400 };

    if (!outfitReady(body?.outfit, body?.size) || !isSize(body?.size) || typeof body?.outfit !== "string") {
      return { error: "outfit" as const, status: 400 };
    }
    pass = await createPass({ name, email, outfit: body.outfit, size: body.size, locale });
  }

  const due = mode === "full" ? pass.total - pass.paid : amount;
  if (pass.paid >= pass.total) return { error: "paid" as const, status: 400, code: pass.code };
  if (!isPassAmount(pass.paid, due)) return { error: "amount" as const, status: 400, code: pass.code };

  const description = `Lancement officiel ${pass.code} · ${chemiseLabel(pass.outfit)} ${pass.size}`.slice(0, 180);
  const [firstname, ...rest] = pass.name.split(/\s+/);
  const lastname = rest.join(" ") || "TRUE";

  const phone = typeof body?.phone === "string" ? normalizeTogoPhone(body.phone) : null;
  if (!phone) return { error: "phone" as const, status: 400, code: pass.code };

  const origin = requestOrigin(request);
  const returnTo = `${origin}/evenements/suivi?code=${pass.code}`;
  const fedaResult = await createMobileCheckout({
    request,
    method,
    phone,
    amount: due,
    description,
    returnTo,
    customer: { firstname, lastname, email: pass.email },
    custom_metadata: {
      code: pass.code,
      seal: passSeal(pass.code),
    },
  });

  const publicKey = process.env.NEXT_PUBLIC_FEDAPAY_PUBLIC_KEY;
  const environment = process.env.FEDAPAY_ENVIRONMENT === "sandbox" ? "sandbox" : "live";

  if (!("error" in fedaResult)) {
    await holdPayment(pass.code, { ref: String(fedaResult.id), amount: due, method, provider: "fedapay" }, phone);
    return {
      checkout: true,
      url: fedaResult.url,
      txId: fedaResult.id,
      code: pass.code,
      amount: due,
      description,
      phone,
      firstname,
      lastname,
      email: pass.email,
      publicKey,
      environment,
      status: 200,
    };
  }

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
    environment,
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

  // Check FedaPay: either via explicit txId or recorded pending reference
  const checkTxId = txId || (pass.pending?.provider === "fedapay" ? pass.pending.ref : undefined);

  if (checkTxId && /^\d+$/.test(checkTxId) && !pass.payments.some((payment) => payment.ref === checkTxId)) {
    const remote = await readFedaPayStatus(checkTxId).catch(() => null);
    const codeMatch = remote?.code === pass.code || remote?.description.includes(pass.code) || pass.pending?.ref === checkTxId;
    const sealMatch = !remote?.seal || validPassSeal(pass.code, remote.seal);

    if (remote?.approved && remote.amount && codeMatch && sealMatch && isPassAmount(pass.paid, remote.amount)) {
      const method = remote.mode === "moov_tg" ? "flooz" : "mixx";
      const settled = await recordApproved(pass.code, { ref: checkTxId, amount: remote.amount, method });
      if (settled.pass && settled.justConfirmed) await sendPassMails(settled.pass).catch(() => false);
      if (settled.pass) return publicPass(settled.pass);
    }
  }

  return publicPass(pass);
}

export async function applyApprovedPayment(entity: Record<string, unknown>) {
  const meta = (entity.custom_metadata ?? entity.metadata) as Record<string, unknown> | undefined;
  let code = typeof meta?.code === "string" ? meta.code : "";
  const seal = typeof meta?.seal === "string" ? meta.seal : "";
  const amount = typeof entity.amount === "number" ? entity.amount : Number(entity.amount);
  const id = entity.id;

  if (!code && typeof entity.description === "string") {
    const m = entity.description.match(/\b([A-Z0-9]{8})\b/);
    if (m) code = m[1];
  }

  if (!code || !Number.isInteger(amount) || (typeof id !== "number" && typeof id !== "string")) return false;
  if (seal && !validPassSeal(code, seal)) return false;

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

