import { requestOrigin } from "@/lib/stripe";

export type FedaPayMethod = "mixx" | "flooz";

const MODES: Record<FedaPayMethod, string> = {
  mixx: "togocel",
  flooz: "moov_tg",
};

export function fedapayBase() {
  return process.env.FEDAPAY_ENVIRONMENT === "sandbox" ? "https://sandbox-api.fedapay.com/v1" : "https://api.fedapay.com/v1";
}

export function normalizeTogoPhone(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^(00228|228)/, "");
  return /^\d{8}$/.test(digits) ? digits : null;
}

// Un espace ou un retour à la ligne collé avec la clé rend l'en-tête
// Authorization invalide et FedaPay répond 401.
function secretKey() {
  const raw = process.env.FEDAPAY_SECRET_KEY ?? "";
  const key = raw.trim();
  if (!key) return { key: "", problem: "absente" as const };
  const problem = key === raw ? null : ("espaces" as const);
  return { key, problem };
}

function nestedId(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.id === "number" || typeof record.id === "string") return String(record.id);
  for (const value of Object.values(record)) {
    if (value && typeof value === "object" && "id" in value) {
      const id = (value as { id?: unknown }).id;
      if (typeof id === "number" || typeof id === "string") return String(id);
    }
  }
  return null;
}

function nestedUrl(payload: unknown) {
  if (!payload || typeof payload !== "object") return null;
  const record = payload as Record<string, unknown>;
  if (typeof record.url === "string") return record.url;
  for (const value of Object.values(record)) {
    if (value && typeof value === "object" && "url" in value) {
      const url = (value as { url?: unknown }).url;
      if (typeof url === "string") return url;
    }
  }
  return null;
}

export async function createMobileCheckout({
  request,
  method,
  phone,
  amount,
  description,
  returnTo,
  customer,
  custom_metadata,
}: {
  request: Request;
  method: FedaPayMethod;
  phone: string;
  amount: number;
  description: string;
  returnTo?: string;
  customer?: { firstname: string; lastname: string; email?: string };
  custom_metadata?: Record<string, string>;
}) {
  const { key, problem } = secretKey();
  if (!key) return { error: "config" as const };
  if (problem) console.error("fedapay key", problem);

  const origin = requestOrigin(request);
  const callback = returnTo ?? `${origin}/panier/succes?provider=fedapay`;
  const headers = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const payload = {
    description,
    amount,
    currency: { iso: "XOF" },
    callback_url: callback,
    mode: MODES[method],
    custom_metadata: custom_metadata,
    customer: {
      firstname: customer?.firstname || "Client",
      lastname: customer?.lastname || "TRUE",
      email: customer?.email,
      phone_number: { number: phone, country: "tg" },
    },
  };

  const post = (body: object) => fetch(`${fedapayBase()}/transactions`, { method: "POST", headers, body: JSON.stringify(body) });
  const attempts = [
    payload,
    {
      description: payload.description,
      amount: payload.amount,
      currency: payload.currency,
      callback_url: payload.callback_url,
      custom_metadata: payload.custom_metadata,
      customer: payload.customer,
    },
    {
      description: payload.description,
      amount: payload.amount,
      currency: payload.currency,
      mode: payload.mode,
      customer: payload.customer,
    },
    {
      description: payload.description,
      amount: payload.amount,
      currency: payload.currency,
      customer: payload.customer,
    },
  ];

  let created = await post(attempts[0]);
  let createdBody = (await created.json().catch(() => null)) as unknown;
  for (const attempt of attempts.slice(1)) {
    if (created.ok || created.status === 401) break;
    created = await post(attempt);
    createdBody = (await created.json().catch(() => null)) as unknown;
  }
  if (!created.ok) {
    const prefix = key.slice(0, 8);
    const shape = prefix === "sk_live_" ? "live" : prefix === "sk_sandbox_" ? "sandbox" : prefix === "pk_" ? "publique" : "inconnue";
    console.error("fedapay create", created.status, `cle=${shape} longueur=${key.length}`, JSON.stringify(createdBody).slice(0, 200));
    return { error: created.status === 401 ? ("auth" as const) : ("fedapay" as const), reason: `create ${created.status}` };
  }

  const id = nestedId(createdBody);
  if (!id) {
    console.error("fedapay create", created.status, JSON.stringify(createdBody).slice(0, 240));
    return { error: "fedapay" as const, reason: "missing-id" };
  }

  let tokenResponse = await fetch(`${fedapayBase()}/transactions/${id}/token`, {
    method: "POST",
    headers,
    body: JSON.stringify({ mode: MODES[method] }),
  });
  if (!tokenResponse.ok) {
    tokenResponse = await fetch(`${fedapayBase()}/transactions/${id}/token`, { method: "POST", headers });
  }
  const tokenBody = (await tokenResponse.json().catch(() => null)) as unknown;
  const url = nestedUrl(tokenBody) || nestedUrl(createdBody);
  if (!url) {
    console.error("fedapay token", tokenResponse.status, JSON.stringify(tokenBody).slice(0, 240));
    return { error: "fedapay" as const, reason: `token ${tokenResponse.status}` };
  }

  return { url, id };
}

export type FedaPayTxn = {
  id: string;
  amount: number;
  status: string;
  description: string;
  mode: string;
  metadata: Record<string, string>;
};

export async function searchFedaPayTransactions() {
  const { key } = secretKey();
  if (!key) return [];
  const response = await fetch(`${fedapayBase()}/transactions/search?per_page=100`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  const list = body ? Object.values(body).find((value) => Array.isArray(value)) : null;
  if (!Array.isArray(list)) return [];
  return list.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const meta = row.custom_metadata ?? row.metadata;
    const metadata: Record<string, string> = {};
    if (meta && typeof meta === "object") {
      for (const [key, value] of Object.entries(meta)) {
        if (typeof value === "string" || typeof value === "number") metadata[key] = String(value);
      }
    }
    const amount = typeof row.amount === "number" ? row.amount : Number(row.amount);
    if (!Number.isFinite(amount)) return [];
    return [{
      id: String(row.id ?? ""),
      amount,
      status: typeof row.status === "string" ? row.status : "",
      description: typeof row.description === "string" ? row.description : "",
      mode: typeof row.mode === "string" ? row.mode : "",
      metadata,
    } satisfies FedaPayTxn];
  }).filter((row) => row.id);
}

export async function readFedaPayStatus(id: string) {
  const { key } = secretKey();
  if (!key) return null;
  const response = await fetch(`${fedapayBase()}/transactions/${id}`, {
    headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
  });
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok || !body) return null;
  const nested = Object.values(body).find((value) => value && typeof value === "object" && "status" in value) as
    | { status?: unknown; amount?: unknown }
    | undefined;
  const record = (nested ?? body) as Record<string, unknown>;
  const status = typeof body.status === "string" ? body.status : nested?.status;
  const raw = typeof body.amount === "number" || typeof body.amount === "string" ? body.amount : nested?.amount;
  const amount = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() ? Number(raw) : null;
  const meta = record.custom_metadata ?? record.metadata;
  let code = "";
  if (meta && typeof meta === "object" && "code" in meta) {
    const value = (meta as { code?: unknown }).code;
    if (typeof value === "string") code = value;
  }
  const description = typeof record.description === "string" ? record.description : "";
  if (!code && description) {
    const m = description.match(/\b([A-Z0-9]{8})\b/);
    if (m) code = m[1];
  }
  const mode = typeof record.mode === "string" ? record.mode : "";
  let seal = "";
  if (meta && typeof meta === "object" && "seal" in meta) {
    const value = (meta as { seal?: unknown }).seal;
    if (typeof value === "string") seal = value;
  }
  const isApproved = status === "approved" || status === "transferred";
  return {
    approved: isApproved,
    status: typeof status === "string" ? status : "",
    amount: typeof amount === "number" && Number.isFinite(amount) ? amount : null,
    code,
    seal,
    description,
    mode,
  };
}
