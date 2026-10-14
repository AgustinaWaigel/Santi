import type { Metadata } from "next";
import { connection } from "next/server";
import CheckoutForm from "@/components/CheckoutForm";
import { mpConfigured } from "@/lib/mercadopago";
import { getSite } from "@/lib/store";

export const metadata: Metadata = { title: "Finalizar compra", robots: { index: false } };

export default async function CheckoutPage() {
  // Se arma en cada visita: depende de la configuración de pago del servidor y del stock del momento.
  await connection();
  const { products, settings } = await getSite();
  const { pickup, pickupNote, shippingDefault, shippingZones, freeShippingFrom } = settings;
  return <CheckoutForm products={products} shipping={{ pickup, pickupNote, shippingDefault, shippingZones, freeShippingFrom }} outfitPercent={settings.outfitDiscount} onlinePayment={mpConfigured()} />;
}
