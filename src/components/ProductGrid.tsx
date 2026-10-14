import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import type { Product } from "@/data/products";
import { dropTime } from "@/lib/pricing";
import { getSite } from "@/lib/store";

export default async function ProductGrid({ products, scroll = false, empty = "Todavía no hay prendas acá." }: { products: Product[]; scroll?: boolean; empty?: string }) {
  if (products.length === 0) return <p className="empty-note">{empty}</p>;
  const { collections, settings } = await getSite();
  const dropAt = (product: Product) => (settings.dropCollection && product.collection === settings.dropCollection ? dropTime(settings.dropDate) : null);
  return (
    <Reveal stagger className={`product-grid ${scroll ? "product-grid--scroll" : ""}`}>
      {products.map((product) => <ProductCard product={product} collection={collections.find((collection) => collection.slug === product.collection)?.name} dropAt={dropAt(product)} key={product.slug} />)}
    </Reveal>
  );
}
