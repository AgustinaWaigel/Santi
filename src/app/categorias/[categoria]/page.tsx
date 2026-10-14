import ShopListing from "@/components/ShopListing";
import { getSite } from "@/lib/store";

export default async function CategoryPage({ params, searchParams }: PageProps<"/categorias/[categoria]">) {
  const { categoria } = await params;
  const { products, categories } = await getSite();
  const name = categories.find((category) => category.slug === categoria)?.name ?? categoria.replaceAll("-", " ");
  return <ShopListing eyebrow="Categoría" title={name} active={`/categorias/${categoria}`} products={products.filter((product) => product.category === categoria)} query={await searchParams} />;
}
