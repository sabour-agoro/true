"use client";

import { FormEvent, useState } from "react";
import { site } from "@/data/site";
import { useI18n } from "@/lib/i18n";

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 pt-32 pb-24">
      <h1 className="font-serif text-5xl tracking-[0.14em] uppercase">{title}</h1>
      <div className="mt-8 space-y-5 leading-relaxed text-mist">{children}</div>
    </main>
  );
}

export function AccountView() {
  const { t } = useI18n();
  return (
    <Shell title={t.account.title}>
      <p>{t.account.body}</p>
    </Shell>
  );
}

export function ContactView() {
  const { t } = useI18n();
  const [state, setState] = useState<"idle" | "sent" | "offline" | "bad">("idle");
  const [mailto, setMailto] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");
    const letter = `mailto:${site.email}?subject=${encodeURIComponent(`TRUE — ${name}`)}&body=${encodeURIComponent(`${message}\n\n${name}\n${email}`)}`;
    setMailto(letter);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const payload = (await response.json()) as { delivered?: boolean };
      if (!response.ok) {
        setState("bad");
        return;
      }
      setState(payload.delivered ? "sent" : "offline");
      form.reset();
    } catch {
      setState("offline");
    }
  }

  return (
    <Shell title={t.contact.title}>
      <p>{t.contact.body}</p>
      <p>
        <a className="text-gold" href={`mailto:${site.email}`}>
          {site.email}
        </a>
      </p>
      <form onSubmit={onSubmit} className="grid gap-4 pt-4">
        <input name="name" required placeholder={t.contact.name} className="border-b border-line bg-transparent py-2 text-bone outline-none placeholder:text-mist" />
        <input name="email" type="email" required placeholder={t.contact.email} className="border-b border-line bg-transparent py-2 text-bone outline-none placeholder:text-mist" />
        <textarea name="message" required rows={5} placeholder={t.contact.message} className="border-b border-line bg-transparent py-2 text-bone outline-none placeholder:text-mist" />
        <button type="submit" className="justify-self-start bg-gold px-6 py-3 text-[11px] tracking-[0.22em] text-ink uppercase">
          {t.contact.send}
        </button>
        {state === "sent" && <p className="text-gold">{t.contact.sent}</p>}
        {state === "offline" && (
          <p>
            {t.contact.offline}{" "}
            <a className="text-gold" href={mailto || `mailto:${site.email}`}>
              {t.contact.mailto}
            </a>
            .
          </p>
        )}
        {state === "bad" && <p>{t.footer.invalid}</p>}
      </form>
    </Shell>
  );
}
