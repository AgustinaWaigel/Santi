import { notFound, redirect } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { isAdmin } from "@/lib/auth";
import { getSite } from "@/lib/store";

export default async function EditProductPage({ params }: PageProps<"/admin/productos/[slug]">) {
  if (!(await isAdmin())) redirect("/admin");
  const { slug } = await params;
  const { products, categories, collections } = await getSite();
  const product = products.find((item) => item.slug === slug);
  if (!product) notFound();
  return <main className="admin"><p className="eyebrow">Admin / Editar</p><h1>{product.name}</h1><ProductForm product={product} categories={categories} collections={collections} others={products.filter((item) => item !== product).map(({ slug, name }) => ({ slug, name }))} /></main>;
}
