import type { Metadata } from "next";
import { CheckoutSuccess } from "@/components/CheckoutSuccess";
import { getStripe } from "@/lib/stripe";

export const metadata: Metadata = { title: "Paiement" };
export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
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
  }

  return (
    <main>
      <CheckoutSuccess paid={paid} email={email} amount={amount} />
    </main>
  );
}
