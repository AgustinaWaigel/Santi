import Link from "next/link";
import DeleteButton from "@/components/admin/DeleteButton";
import LoginForm from "@/components/admin/LoginForm";
import MoveButtons from "@/components/admin/MoveButtons";
import Photo from "@/components/Photo";
import { formatPrice } from "@/data/products";
import { adminConfigured, isAdmin } from "@/lib/auth";
import { totalStock } from "@/lib/pricing";
import { getSite, supabaseConfigured } from "@/lib/store";
import { deleteProduct } from "./actions";

export default async function AdminPage() {
  if (!adminConfigured()) {
    return <main className="simple-page"><p className="eyebrow">Admin</p><h1>Falta configurar.</h1><p>Definí <code>ADMIN_PASSWORD</code> en el archivo <code>.env.local</code> y reiniciá el servidor para habilitar el panel.</p></main>;
  }
  if (!(await isAdmin())) {
    return <main className="admin"><p className="eyebrow">Admin</p><h1>Ingresar</h1><LoginForm /></main>;
  }

  const { products, categories, collections, orders } = await getSite();
  const month = new Date().toISOString().slice(0, 7);
  const sales = orders.filter((order) => (order.status === "pagado" || order.status === "enviado") && order.createdAt.startsWith(month));
  const pending = orders.filter((order) => order.status === "pendiente").length;
  const low = products.filter((product) => totalStock(product) <= 3);
  const nameOf = (groups: typeof categories, slug: string) => groups.find((group) => group.slug === slug)?.name;
  return (
    <main className="admin">
      <div className="stats">
        <div className="tile"><span className="eyebrow">Ventas del mes</span><strong>{formatPrice(sales.reduce((total, order) => total + order.total, 0))}</strong><span>{sales.length} {sales.length === 1 ? "pedido cobrado" : "pedidos cobrados"}</span></div>
        <Link href="/admin/pedidos" className="tile"><span className="eyebrow">Pedidos pendientes</span><strong>{pending}</strong><span>Ver pedidos →</span></Link>
        <div className="tile"><span className="eyebrow">Poco stock</span><strong>{low.length}</strong><span>{low.length === 0 ? "Todo con más de 3 unidades" : low.slice(0, 3).map((product) => product.name).join(", ") + (low.length > 3 ? "…" : "")}</span></div>
      </div>
      <p className="form-note stats__storage">Contenido guardado en: {supabaseConfigured() ? "Supabase" : "archivos de este servidor (carpeta data/)"}</p>
      <p className="eyebrow">Admin / {String(products.length).padStart(2, "0")} productos</p>
      <div className="admin__header"><h1>Productos</h1><Link href="/admin/productos/nuevo" className="btn">Nuevo producto</Link></div>
      {products.length === 0 ? <p className="empty-note">Todavía no hay productos. Cargá el primero.</p> : (
        <ul className="admin-list">
          {products.map((product, index) => (
            <li className="admin-row" key={product.slug}>
              <span className="admin-row__image product-photo">{product.images[0] && <Photo src={product.images[0]} alt="" fill sizes="120px" />}</span>
              <div className="admin-row__info"><strong>{product.name}</strong><span>{[nameOf(categories, product.category) ?? "Sin categoría", nameOf(collections, product.collection), product.color, totalStock(product) === 0 ? "Agotado" : `Stock ${totalStock(product)}`].filter(Boolean).join(" · ")}</span></div>
              <span className="admin-row__price">{formatPrice(product.price)}</span>
              <div className="admin-row__actions">
                <MoveButtons list="products" slug={product.slug} name={product.name} first={index === 0} last={index === products.length - 1} />
                <Link href={`/productos/${product.slug}`} className="admin-link">Ver</Link>
                <Link href={`/admin/productos/${product.slug}`} className="admin-link">Editar</Link>
                <form action={deleteProduct}><input type="hidden" name="slug" value={product.slug} /><DeleteButton name={product.name} /></form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
