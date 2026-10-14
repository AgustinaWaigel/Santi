import type { Metadata } from "next";
import ShopListing from "@/components/ShopListing";
import { getSite } from "@/lib/store";

export const metadata: Metadata = { title: "Tienda" };

export default async function ProductosPage({ searchParams }: PageProps<"/productos">) {
  const { products } = await getSite();
  return <ShopListing eyebrow={`${String(products.length).padStart(2, "0")} prendas`} title="Tienda" active="/productos" products={products} query={await searchParams} />;
}
