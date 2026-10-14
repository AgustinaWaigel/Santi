import { redirect } from "next/navigation";
import SettingsForm from "@/components/admin/SettingsForm";
import { isAdmin } from "@/lib/auth";
import { getSite } from "@/lib/store";

export default async function AdminSitePage() {
  if (!(await isAdmin())) redirect("/admin");
  const { settings, collections } = await getSite();
  return <main className="admin"><p className="eyebrow">Admin / Sitio</p><h1>Sitio</h1><SettingsForm settings={settings} collections={collections} /></main>;
}
