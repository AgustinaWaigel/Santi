import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatPrice, type OrderStatus } from "@/data/products";
import { mpConfigured, syncPayment } from "@/lib/mercadopago";
import { getSite } from "@/lib/store";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

const MESSAGES: Record<OrderStatus, string> = {
  pendiente: "Recibimos tu pedido y reservamos tus prendas. Falta confirmar el pago.",
  pagado: "Pago confirmado. Estamos preparando tu pedido.",
  enviado: "Tu pedido ya salió.",
  cancelado: "Este pedido fue cancelado.",
};

export default async function OrderPage({ params, searchParams }: PageProps<"/pedido/[id]">) {
  const { id } = await params;
  // Al volver de Mercado Pago llega el número de pago: se verifica contra Mercado Pago antes de mostrar el estado.
  const { payment_id: paymentId } = await searchParams;
  if (typeof paymentId === "string") await syncPayment(paymentId);

  const { orders, settings } = await getSite();
  const order = orders.find((item) => item.id === id);
  if (!order) notFound();
  const whatsappText = encodeURIComponent(`Hola, hice el pedido #${order.number} por ${formatPrice(order.total)} y quiero coordinar el pago.`);

  return (
    <main className="shop-page order-page">
      <p className="eyebrow">Pedido #{order.number}</p>
      <h1>{order.status === "pendiente" ? "Pedido recibido" : order.status}</h1>
      <p className="order-page__message"><span className={`status status--${order.status}`}>{order.status}</span> {MESSAGES[order.status]}</p>
      <div className="tile cart__summary order-page__summary">
        <ul className="checkout__lines">
          {order.items.map((item) => <li key={`${item.slug}-${item.size}`}><span>{item.qty} × {item.name} · {item.size}</span><span>{formatPrice(item.price * item.qty)}</span></li>)}
        </ul>
        <dl>
          <div><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.bundleDiscount > 0 && <div><dt>Conjunto completo</dt><dd>−{formatPrice(order.bundleDiscount)}</dd></div>}
          {order.discount > 0 && <div><dt>Descuento {order.coupon}</dt><dd>−{formatPrice(order.discount)}</dd></div>}
          <div><dt>{order.shipping.method === "retiro" ? "Retiro en persona" : "Envío"}</dt><dd>{order.shipping.cost > 0 ? formatPrice(order.shipping.cost) : order.shipping.method === "retiro" ? "Sin costo" : "A coordinar o gratis"}</dd></div>
          <div className="cart__total"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
        {order.tracking && <p className="form-note">Seguimiento: {/^https?:\/\//.test(order.tracking) ? <a href={order.tracking} target="_blank" rel="noopener noreferrer" className="admin-link">Ver dónde está mi pedido</a> : <strong>{order.tracking}</strong>}</p>}
        {order.status === "pendiente" && mpConfigured() && <p className="form-note">Si ya pagaste, la acreditación puede tardar unos minutos. Guardá esta página para ver el estado.</p>}
        {order.status === "pendiente" && settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp}?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="btn">Coordinar por WhatsApp</a>}
        {order.shipping.method === "retiro" && settings.pickupNote && <p className="form-note">Retiro: {settings.pickupNote}</p>}
        <Link href="/productos" className="cart__clear">Seguir comprando</Link>
      </div>
    </main>
  );
}
