import type { Metadata } from "next";
import { CheckoutSuccess } from "@/components/CheckoutSuccess";
import { getStripe } from "@/lib/stripe";
import { readFedaPayStatus } from "@/lib/fedapay";

export const metadata: Metadata = { title: "Paiement" };
export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; id?: string; status?: string; provider?: string }>;
}) {
  const { session_id: sessionId, id: fedaId, status: fedaStatus } = await searchParams;
  const stripe = getStripe();
  let paid = false;
  let email: string | null = null;
  let amount = 0;

  if (stripe && sessionId?.startsWith("cs_")) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      paid = session.payment_status === "paid";
      email = session.customer_details?.email ?? null;
      amount = session.amount_total ?? 0;
    } catch (error) {
      console.error("stripe session", error instanceof Error ? error.message : error);
    }
  } else if (fedaId && /^\d+$/.test(fedaId)) {
    try {
      const remote = await readFedaPayStatus(fedaId);
      if (remote?.approved) {
        paid = true;
        amount = remote.amount ?? 0;
      } else if (fedaStatus === "approved") {
        paid = true;
      }
    } catch (error) {
      console.error("fedapay session check", error instanceof Error ? error.message : error);
      if (fedaStatus === "approved") paid = true;
    }
  }

  // Paiement mobile encore non approuvé (validation USSD en cours) : on propose de revérifier.
  const pending = !paid && Boolean(fedaId && /^\d+$/.test(fedaId));
  const retryHref = pending ? `/panier/succes?id=${fedaId}&provider=fedapay` : undefined;

  return (
    <main>
      <CheckoutSuccess paid={paid} email={email} amount={amount} pending={pending} retryHref={retryHref} />
    </main>
  );
}
