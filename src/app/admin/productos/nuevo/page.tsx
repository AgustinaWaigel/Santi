import { redirect } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { isAdmin } from "@/lib/auth";
import { getSite } from "@/lib/store";

export default async function NewProductPage() {
  if (!(await isAdmin())) redirect("/admin");
  const { categories, collections, products } = await getSite();
  return <main className="admin"><p className="eyebrow">Admin / Nuevo</p><h1>Nuevo producto</h1><ProductForm categories={categories} collections={collections} others={products.map(({ slug, name }) => ({ slug, name }))} /></main>;
}
