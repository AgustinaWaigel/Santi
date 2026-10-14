import type { Order } from "@/data/products";
import { mutateSite } from "@/lib/store";

const API = "https://api.mercadopago.com";

export const siteUrl = () => (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const mpConfigured = () => Boolean(process.env.MP_ACCESS_TOKEN);

const headers = () => ({ Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, "Content-Type": "application/json" });

// Crea el cobro en Mercado Pago y devuelve la dirección a la que hay que mandar al cliente.
export async function createPreference(order: Order): Promise<string | null> {
  const back = `${siteUrl()}/pedido/${order.id}`;
  const body = {
    // Un solo ítem por el total: así descuento y envío quedan incluidos sin recalcular nada del lado de Mercado Pago.
    items: [{ title: `Pedido #${order.number} · Blackfit`, quantity: 1, unit_price: order.total, currency_id: "ARS" }],
    external_reference: order.id,
    back_urls: { success: back, pending: back, failure: back },
    // Mercado Pago solo acepta retorno automático y avisos hacia direcciones https públicas.
    ...(back.startsWith("https://") ? { auto_return: "approved", notification_url: `${siteUrl()}/api/mercadopago` } : {}),
  };
  try {
    const response = await fetch(`${API}/checkout/preferences`, { method: "POST", headers: headers(), body: JSON.stringify(body) });
    if (!response.ok) return null;
    return (await response.json()).init_point ?? null;
  } catch {
    return null;
  }
}

// Consulta el pago directamente a Mercado Pago (nunca se confía en lo que diga el aviso) y, si está aprobado, marca el pedido como pagado.
export async function syncPayment(paymentId: string) {
  if (!mpConfigured() || !/^\d+$/.test(paymentId)) return;
  let payment: { status?: string; external_reference?: string; transaction_amount?: number };
  try {
    const response = await fetch(`${API}/v1/payments/${paymentId}`, { headers: headers(), cache: "no-store" });
    if (!response.ok) return;
    payment = await response.json();
  } catch {
    return;
  }
  if (payment.status !== "approved") return;
  await mutateSite((site) => {
    const order = site.orders.find((item) => item.id === payment.external_reference);
    if (!order || order.status !== "pendiente" || (payment.transaction_amount ?? 0) < order.total) return [null, null];
    return [{ ...site, orders: site.orders.map((item) => (item === order ? { ...order, status: "pagado" as const, paymentId } : item)) }, null];
  });
}
