"use client";

import Link from "next/link";
import { useActionState, useEffect, useState, useTransition } from "react";
import { applyCoupon, createOrder } from "@/app/actions";
import { formatPrice, type Product } from "@/data/products";
import { clearCart, useCart } from "@/lib/cart";
import { bundleDiscount, shippingCost, shippingToArrange, type ShippingConfig } from "@/lib/pricing";

export default function CheckoutForm({ products, shipping, outfitPercent, onlinePayment }: { products: Product[]; shipping: ShippingConfig; outfitPercent: number; onlinePayment: boolean }) {
  const cart = useCart();
  const [state, action, pending] = useActionState(createOrder, { error: "" });
  const [method, setMethod] = useState<"envio" | "retiro">("envio");
  const [zip, setZip] = useState("");
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [checking, startChecking] = useTransition();

  // Pedido creado: se vacía el carrito y se sigue al pago o a la página del pedido.
  useEffect(() => {
    if (!state.redirectTo) return;
    clearCart();
    window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  const lines = cart.flatMap((item) => {
    const product = products.find((candidate) => candidate.slug === item.slug);
    return product ? [{ ...item, product }] : [];
  });
  if (state.redirectTo) return <main className="simple-page"><p className="eyebrow">Pedido creado</p><h1>Un segundo…</h1><p>Te estamos llevando al siguiente paso.</p></main>;
  if (lines.length === 0) return <main className="simple-page"><p className="eyebrow">Checkout</p><h1>Tu carrito está vacío.</h1><Link className="btn" href="/productos">Explorar colección</Link></main>;

  const subtotal = lines.reduce((total, line) => total + line.qty * line.product.price, 0);
  const bundle = bundleDiscount(lines, products, outfitPercent);
  const discount = coupon ? Math.round((subtotal - bundle) * coupon.percent / 100) : 0;
  const arrange = shippingToArrange(shipping);
  const quote = method === "retiro" ? 0 : shippingCost(shipping, zip, subtotal - bundle - discount);
  const total = subtotal - bundle - discount + (quote ?? 0);
  const value = (name: string) => state.values?.[name] ?? "";

  function checkCoupon() {
    startChecking(async () => {
      const result = await applyCoupon(code);
      if ("error" in result) { setCoupon(null); setCouponError(result.error); } else { setCoupon(result); setCouponError(""); }
    });
  }

  return (
    <main className="shop-page">
      <p className="eyebrow">Checkout</p>
      <h1>Finalizar</h1>
      <form action={action} className="cart checkout">
        <input type="hidden" name="items" value={JSON.stringify(cart)} />
        <input type="hidden" name="coupon" value={coupon?.code ?? ""} />
        <div className="admin-form checkout__fields">
          <h2 className="field--wide">Tus datos</h2>
          <label className="field"><span>Nombre y apellido</span><input name="name" autoComplete="name" defaultValue={value("name")} required /></label>
          <label className="field"><span>Teléfono / WhatsApp</span><input name="phone" type="tel" autoComplete="tel" defaultValue={value("phone")} required /></label>
          <label className="field field--wide"><span>Email · opcional</span><input name="email" type="email" autoComplete="email" defaultValue={value("email")} /></label>

          <h2 className="field--wide">Entrega</h2>
          <div className="field--wide chip-row" role="radiogroup" aria-label="Forma de entrega">
            <label className={`chip ${method === "envio" ? "chip--active" : ""}`}><input type="radio" name="method" value="envio" className="sr-only" checked={method === "envio"} onChange={() => setMethod("envio")} /> Envío a domicilio</label>
            {shipping.pickup && <label className={`chip ${method === "retiro" ? "chip--active" : ""}`}><input type="radio" name="method" value="retiro" className="sr-only" checked={method === "retiro"} onChange={() => setMethod("retiro")} /> Retiro en persona</label>}
          </div>
          {method === "envio" ? (
            <>
              <label className="field field--wide"><span>Dirección</span><input name="address" autoComplete="street-address" defaultValue={value("address")} required /></label>
              <label className="field"><span>Localidad</span><input name="city" autoComplete="address-level2" defaultValue={value("city")} required /></label>
              <label className="field"><span>Código postal</span><input name="zip" inputMode="numeric" autoComplete="postal-code" value={zip} onChange={(event) => setZip(event.target.value)} required /></label>
            </>
          ) : shipping.pickupNote && <p className="form-note field--wide">{shipping.pickupNote}</p>}
          <label className="field field--wide"><span>Notas · opcional</span><textarea name="notes" rows={3} defaultValue={value("notes")} /></label>
        </div>

        <aside className="tile cart__summary">
          <span className="eyebrow">Tu pedido</span>
          <ul className="checkout__lines">
            {lines.map((line) => <li key={`${line.slug}-${line.size}`}><span>{line.qty} × {line.product.name} · {line.size}</span><span>{formatPrice(line.product.price * line.qty)}</span></li>)}
          </ul>
          <div className="checkout__coupon">
            <label className="field"><span>Código de descuento</span><input value={code} onChange={(event) => setCode(event.target.value)} autoCapitalize="characters" /></label>
            <button type="button" className="chip" onClick={checkCoupon} disabled={checking || !code.trim()}>{checking ? "…" : "Aplicar"}</button>
          </div>
          <p className={`form-note ${coupon ? "form-ok" : "form-error"}`} role="status">{coupon ? `${coupon.code}: ${coupon.percent}% de descuento aplicado.` : couponError}</p>
          <dl>
            <div><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            {bundle > 0 && <div><dt>Conjunto completo</dt><dd>−{formatPrice(bundle)}</dd></div>}
            {discount > 0 && <div><dt>Descuento</dt><dd>−{formatPrice(discount)}</dd></div>}
            <div><dt>{method === "retiro" ? "Retiro" : "Envío"}</dt><dd>{method === "retiro" ? "Sin costo" : quote === null ? "Ingresá tu código postal" : quote === 0 ? (arrange ? "A coordinar" : "Gratis") : formatPrice(quote)}</dd></div>
            <div className="cart__total"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
          </dl>
          <p className="form-error" role="alert">{state.error}</p>
          <button type="submit" className="btn" disabled={pending}>{pending ? "Procesando…" : onlinePayment ? "Pagar con Mercado Pago" : "Confirmar pedido"}</button>
          <Link href="/carrito" className="cart__clear">Volver al carrito</Link>
        </aside>
      </form>
    </main>
  );
}
