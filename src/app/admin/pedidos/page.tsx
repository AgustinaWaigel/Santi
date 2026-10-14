import { redirect } from "next/navigation";
import DeleteButton from "@/components/admin/DeleteButton";
import { formatPrice, ORDER_STATUSES } from "@/data/products";
import { isAdmin } from "@/lib/auth";
import { mpConfigured } from "@/lib/mercadopago";
import { getSite } from "@/lib/store";
import { deleteRestock, deleteSubscriber, updateOrder } from "../actions";

const date = (iso: string) => new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" });

export default async function AdminOrdersPage() {
  if (!(await isAdmin())) redirect("/admin");
  const { orders, subscribers, restock, products, settings } = await getSite();
  const pending = orders.filter((order) => order.status === "pendiente").length;
  return (
    <main className="admin">
      <p className="eyebrow">Admin / {pending} {pending === 1 ? "pendiente" : "pendientes"}</p>
      <h1>Pedidos</h1>
      {!mpConfigured() && <p className="form-note admin-note">Mercado Pago no está configurado: los pedidos entran como pendientes y el pago se coordina por WhatsApp. Para cobrar online, definí <code>MP_ACCESS_TOKEN</code> y <code>SITE_URL</code> en <code>.env.local</code>.</p>}
      {orders.length === 0 ? <p className="empty-note">Todavía no entró ningún pedido.</p> : (
        <ul className="admin-list">
          {orders.map((order) => (
            <li className="order" key={order.id}>
              <details>
                <summary>
                  <strong>#{order.number}</strong>
                  <span>{date(order.createdAt)}</span>
                  <span className="order__name">{order.customer.name}</span>
                  <strong>{formatPrice(order.total)}</strong>
                  <span className={`status status--${order.status}`}>{order.status}</span>
                </summary>
                <div className="order__body">
                  <ul>
                    {order.items.map((item) => <li key={`${item.slug}-${item.size}`}>{item.qty} × {item.name} · Talle {item.size} — {formatPrice(item.price * item.qty)}</li>)}
                    {order.bundleDiscount > 0 && <li>Descuento por conjunto — −{formatPrice(order.bundleDiscount)}</li>}
                    {order.discount > 0 && <li>Descuento {order.coupon} — −{formatPrice(order.discount)}</li>}
                    <li>{order.shipping.method === "retiro" ? "Retiro en persona" : `Envío — ${formatPrice(order.shipping.cost)}`}</li>
                  </ul>
                  <dl>
                    <div><dt>Teléfono</dt><dd>{order.customer.phone}</dd></div>
                    {order.customer.email && <div><dt>Email</dt><dd>{order.customer.email}</dd></div>}
                    {order.shipping.method === "envio" && <div><dt>Dirección</dt><dd>{order.customer.address}, {order.customer.city} (CP {order.customer.zip})</dd></div>}
                    {order.customer.notes && <div><dt>Notas</dt><dd>{order.customer.notes}</dd></div>}
                    {order.paymentId && <div><dt>Pago Mercado Pago</dt><dd>{order.paymentId}</dd></div>}
                  </dl>
                  <form action={updateOrder} className="order__status">
                    <input type="hidden" name="id" value={order.id} />
                    <label className="field"><span>Estado</span>
                      <select name="status" defaultValue={order.status}>{ORDER_STATUSES.map((status) => <option value={status} key={status}>{status}</option>)}</select>
                    </label>
                    <label className="field order__tracking"><span>Seguimiento · código o enlace del correo</span><input name="tracking" defaultValue={order.tracking} maxLength={300} /></label>
                    <button type="submit" className="btn btn--ghost">Actualizar</button>
                  </form>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <h2>Avisos de reposición</h2>
      {restock.length === 0 ? <p className="empty-note">Nadie está esperando un talle agotado.</p> : (
        <ul className="admin-list">
          {restock.map((request) => (
            <li className="admin-row admin-row--plain" key={`${request.slug}-${request.size}-${request.contact}`}>
              <div className="admin-row__info"><strong>{products.find((product) => product.slug === request.slug)?.name ?? request.slug} · Talle {request.size}</strong><span>{request.contact} · {date(request.createdAt)}</span></div>
              <form action={deleteRestock}><input type="hidden" name="slug" value={request.slug} /><input type="hidden" name="size" value={request.size} /><input type="hidden" name="contact" value={request.contact} /><DeleteButton name={`el aviso de ${request.contact}`} /></form>
            </li>
          ))}
        </ul>
      )}

      <h2>Contactos · drop y ruleta</h2>
      {settings.earlyCode && <p className="form-note admin-note">Código de acceso anticipado para enviarles: <code>{settings.earlyCode}</code> · se activa en <code>/acceso</code>.</p>}
      {subscribers.length === 0 ? <p className="empty-note">Nadie pidió que le avisen todavía.</p> : (
        <ul className="admin-list">
          {subscribers.map((subscriber) => (
            <li className="admin-row admin-row--plain" key={`${subscriber.contact}-${subscriber.source ?? "drop"}`}>
              <div className="admin-row__info"><strong>{subscriber.contact}</strong><span>{date(subscriber.createdAt)}{subscriber.source === "ruleta" ? " · vino por la ruleta" : ""}</span></div>
              <form action={deleteSubscriber}><input type="hidden" name="contact" value={subscriber.contact} /><DeleteButton name={subscriber.contact} /></form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
