import type { Metadata } from "next";
import TextPage from "@/components/TextPage";
import { getSite } from "@/lib/store";

export const metadata: Metadata = { title: "Envíos y devoluciones" };

export default async function ShippingPage() {
  return <TextPage eyebrow="Ayuda" title="Envíos y devoluciones" text={(await getSite()).settings.shippingText} />;
}
