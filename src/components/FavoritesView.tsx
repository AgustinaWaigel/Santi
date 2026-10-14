"use client";

import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import type { Group, Product } from "@/data/products";
import { useFavorites } from "@/lib/favorites";

export default function FavoritesView({ products, collections }: { products: Product[]; collections: Group[] }) {
  const favorites = useFavorites();
  const saved = products.filter((product) => favorites.includes(product.slug));

  if (saved.length === 0) {
    return <main className="simple-page"><p className="eyebrow">Favoritos / 00</p><h1>Todavía no guardaste nada.</h1><p>Tocá el corazón de una prenda para tenerla a mano acá.</p><Link className="btn" href="/productos">Explorar colección</Link></main>;
  }
  return (
    <main className="shop-page">
      <p className="eyebrow">Favoritos / {String(saved.length).padStart(2, "0")}</p>
      <h1>Favoritos</h1>
      <div className="product-grid">
        {saved.map((product) => <ProductCard product={product} collection={collections.find((collection) => collection.slug === product.collection)?.name} key={product.slug} />)}
      </div>
    </main>
  );
}
