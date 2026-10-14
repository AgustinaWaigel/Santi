import type { Metadata } from "next";
import TextPage from "@/components/TextPage";
import { getSite } from "@/lib/store";

export const metadata: Metadata = { title: "Nosotros" };

export default async function AboutPage() {
  const { aboutTitle, aboutText } = (await getSite()).settings;
  return <TextPage eyebrow="Blackfit / La marca" title={aboutTitle || "Nosotros"} text={aboutText} />;
}
