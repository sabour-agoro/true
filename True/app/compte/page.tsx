import type { Metadata } from "next";
import { AccountView } from "@/components/SimplePages";

export const metadata: Metadata = { title: "Compte" };

export default function AccountPage() {
  return <AccountView />;
}
