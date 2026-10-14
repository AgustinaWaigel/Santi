import type { Metadata } from "next";
import CartView from "@/components/CartView";
import { getSite } from "@/lib/store";

export const metadata: Metadata = { title: "Carrito" };

export default async function CartPage() {
  const { products, settings } = await getSite();
  return <CartView products={products} freeShippingFrom={settings.freeShippingFrom} />;
}
