import type { Metadata } from "next";
import TextPage from "@/components/TextPage";
import { getSite } from "@/lib/store";

export const metadata: Metadata = { title: "Términos y privacidad" };

export default async function TermsPage() {
  return <TextPage eyebrow="Legal" title="Términos y privacidad" text={(await getSite()).settings.termsText} />;
}
