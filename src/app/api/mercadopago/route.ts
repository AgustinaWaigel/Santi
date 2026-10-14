import { revalidatePath } from "next/cache";
import { syncPayment } from "@/lib/mercadopago";

// Aviso de Mercado Pago cuando cambia un pago. Llega el número de pago en el cuerpo o en la dirección, según el formato.
export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = await request.json().catch(() => null);
  const isPayment = (body?.type ?? url.searchParams.get("topic") ?? url.searchParams.get("type")) === "payment";
  const paymentId = String(body?.data?.id ?? url.searchParams.get("data.id") ?? url.searchParams.get("id") ?? "");
  if (isPayment && paymentId) {
    await syncPayment(paymentId);
    revalidatePath("/", "layout");
  }
  return new Response(null, { status: 200 });
}
