"use client";

import Link from "next/link";
import FreeShippingBar from "@/components/FreeShippingBar";
import Photo from "@/components/Photo";
import { formatPrice, type Product } from "@/data/products";
import { clearCart, setQty, useCart } from "@/lib/cart";
import { stockOf } from "@/lib/pricing";

export default function CartView({ products, freeShippingFrom }: { products: Product[]; freeShippingFrom: number }) {
  const lines = useCart().flatMap((item) => {
    const product = products.find((candidate) => candidate.slug === item.slug);
    return product ? [{ ...item, product, left: stockOf(product, item.size) }] : [];
  });
  const count = lines.reduce((total, line) => total + line.qty, 0);
  const subtotal = lines.reduce((total, line) => total + line.qty * line.product.price, 0);
  const short = lines.some((line) => line.qty > line.left);

  if (lines.length === 0) {
    return <main className="simple-page"><p className="eyebrow">Carrito / 00</p><h1>Tu carrito está vacío.</h1><Link className="btn" href="/productos">Explorar colección</Link></main>;
  }

  return (
    <main className="shop-page">
      <p className="eyebrow">Carrito / {String(count).padStart(2, "0")}</p>
      <h1>Carrito</h1>
      <div className="cart">
        <ul className="cart__lines">
          {lines.map(({ product, size, qty, left }) => (
            <li className="cart-line" key={`${product.slug}-${size}`}>
              <Link href={`/productos/${product.slug}`} className="cart-line__image product-photo">{product.images[0] && <Photo src={product.images[0]} alt="" fill sizes="140px" />}</Link>
              <div className="cart-line__info">
                <Link href={`/productos/${product.slug}`}><strong>{product.name}</strong></Link>
                <span>{product.color} · Talle {size}</span>
                <span>{formatPrice(product.price)}</span>
                {qty > left && <span className="cart-line__warning">{left === 0 ? "Sin stock: quitala para continuar" : `Solo quedan ${left}`}</span>}
              </div>
              <div className="stepper">
                <button type="button" aria-label={`Quitar una unidad de ${product.name}`} onClick={() => setQty(product.slug, size, qty - 1)}>−</button>
                <span aria-label="Cantidad">{qty}</span>
                <button type="button" aria-label={`Sumar una unidad de ${product.name}`} disabled={qty >= left} onClick={() => setQty(product.slug, size, qty + 1)}>+</button>
              </div>
              <strong className="cart-line__total">{formatPrice(product.price * qty)}</strong>
              <button type="button" className="cart-line__remove" onClick={() => setQty(product.slug, size, 0)}>Quitar</button>
            </li>
          ))}
        </ul>
        <aside className="tile cart__summary">
          <span className="eyebrow">Resumen</span>
          <FreeShippingBar subtotal={subtotal} from={freeShippingFrom} />
          <dl>
            <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div><dt>Envío y descuentos</dt><dd>En el siguiente paso</dd></div>
            <div className="cart__total"><dt>Total</dt><dd>{formatPrice(subtotal)}</dd></div>
          </dl>
          {short ? <p className="form-error">Ajustá las cantidades marcadas para continuar.</p> : <Link href="/checkout" className="btn">Finalizar compra</Link>}
          <button type="button" className="cart__clear" onClick={clearCart}>Vaciar carrito</button>
        </aside>
      </div>
    </main>
  );
}
