import { redirect } from "next/navigation";
import { site } from "@/data/site";

export default function DeliveryPage() {
  redirect(site.whatsapp);
}
