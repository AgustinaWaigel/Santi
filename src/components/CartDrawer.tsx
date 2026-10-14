"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import FreeShippingBar from "@/components/FreeShippingBar";
import Photo from "@/components/Photo";
import { formatPrice, type Product } from "@/data/products";
import { setCartDrawer, setQty, useCart, useCartDrawer } from "@/lib/cart";

export type DrawerProduct = Pick<Product, "slug" | "name" | "price" | "images" | "stock">;

// Panel lateral que se abre al agregar una prenda, para seguir comprando sin cambiar de página.
export default function CartDrawer({ products, freeShippingFrom }: { products: DrawerProduct[]; freeShippingFrom: number }) {
  const open = useCartDrawer();
  const dialog = useRef<HTMLDialogElement>(null);
  const lines = useCart().flatMap((item) => {
    const product = products.find((candidate) => candidate.slug === item.slug);
    return product ? [{ ...item, product, left: product.stock[item.size] ?? 0 }] : [];
  });
  const subtotal = lines.reduce((total, line) => total + line.qty * line.product.price, 0);
  const close = () => setCartDrawer(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <dialog ref={dialog} className="mobile-menu cart-drawer" aria-label="Carrito" onClose={close} onClick={(event) => { if (event.target === dialog.current) close(); }}>
      <div className="mobile-menu__panel">
        <div className="cart-drawer__head">
          <span className="eyebrow">Carrito / {String(lines.reduce((total, line) => total + line.qty, 0)).padStart(2, "0")}</span>
          <button type="button" className="header-icon" aria-label="Cerrar carrito" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        {lines.length === 0 ? <p className="empty-note">Tu carrito está vacío.</p> : (
          <>
            <ul className="cart-drawer__lines">
              {lines.map(({ product, size, qty, left }) => (
                <li key={`${product.slug}-${size}`}>
                  <span className="product-photo">{product.images[0] && <Photo src={product.images[0]} alt="" fill sizes="90px" />}</span>
                  <div><strong>{product.name}</strong><span>Talle {size} · {formatPrice(product.price)}</span></div>
                  <div className="stepper">
                    <button type="button" aria-label={`Quitar una unidad de ${product.name}`} onClick={() => setQty(product.slug, size, qty - 1)}>−</button>
                    <span aria-label="Cantidad">{qty}</span>
                    <button type="button" aria-label={`Sumar una unidad de ${product.name}`} disabled={qty >= left} onClick={() => setQty(product.slug, size, qty + 1)}>+</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="cart-drawer__foot">
              <FreeShippingBar subtotal={subtotal} from={freeShippingFrom} />
              <p className="cart-drawer__total"><span>Subtotal</span><strong>{formatPrice(subtotal)}</strong></p>
              <Link href="/checkout" className="btn" onClick={close}>Finalizar compra</Link>
              <Link href="/carrito" className="btn btn--ghost" onClick={close}>Ver carrito</Link>
            </div>
          </>
        )}
      </div>
    </dialog>
  );
}
