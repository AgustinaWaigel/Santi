import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LookEditor from "@/components/admin/LookEditor";
import { isAdmin } from "@/lib/auth";
import { getSite } from "@/lib/store";

export default async function EditLookPage({ params }: PageProps<"/admin/lookbook/[id]">) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const { looks, products } = await getSite();
  const look = looks.find((item) => item.id === id);
  if (!look) notFound();
  return (
    <main className="admin">
      <p className="eyebrow">Admin / Lookbook</p>
      <div className="admin__header"><h1>Marcar prendas</h1><Link href="/admin/lookbook" className="btn btn--ghost">Volver</Link></div>
      <LookEditor look={look} products={products.map(({ slug, name }) => ({ slug, name }))} />
    </main>
  );
}
