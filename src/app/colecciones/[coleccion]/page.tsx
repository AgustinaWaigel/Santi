import { notFound } from "next/navigation";
import ShopListing from "@/components/ShopListing";
import { getSite } from "@/lib/store";

export default async function CollectionPage({ params, searchParams }: PageProps<"/colecciones/[coleccion]">) {
  const { coleccion } = await params;
  const { products, collections } = await getSite();
  const collection = collections.find((item) => item.slug === coleccion);
  if (!collection) notFound();
  return <ShopListing eyebrow="Colección" title={collection.name} active={`/colecciones/${coleccion}`} products={products.filter((product) => product.collection === coleccion)} query={await searchParams} />;
}
