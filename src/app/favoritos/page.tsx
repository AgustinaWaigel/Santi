import type { Metadata } from "next";
import FavoritesView from "@/components/FavoritesView";
import { getSite } from "@/lib/store";

export const metadata: Metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const { products, collections } = await getSite();
  return <FavoritesView products={products} collections={collections} />;
}
