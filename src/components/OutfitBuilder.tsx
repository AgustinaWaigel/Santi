"use client";

import Link from "next/link";
import { useState } from "react";
import Photo from "@/components/Photo";
import { formatPrice, type Product } from "@/data/products";
import { addItem, setCartDrawer } from "@/lib/cart";

export type OutfitItem = Pick<Product, "slug" | "name" | "price" | "images" | "sizes" | "stock">;

// Conjunto armado desde el admin: se elige un talle por prenda y se agrega todo junto.
export default function OutfitBuilder({ items, percent }: { items: OutfitItem[]; percent: number }) {
  const inStock = (item: OutfitItem) => item.sizes.filter((size) => (item.stock[size] ?? 0) > 0);
  const [picked, setPicked] = useState<Record<string, string>>({});
  const total = items.reduce((sum, item) => sum + item.price, 0);
  const discount = Math.round(total * percent / 100);
  const complete = items.every((item) => inStock(item).includes(picked[item.slug]));
  const unavailable = items.some((item) => inStock(item).length === 0);

  function addAll() {
    for (const item of items) addItem(item.slug, picked[item.slug]);
    setCartDrawer(true);
  }

  return (
    <div className="outfit">
      <ul className="outfit__items">
        {items.map((item) => (
          <li key={item.slug}>
            <Link href={`/productos/${item.slug}`} className="product-photo">{item.images[0] && <Photo src={item.images[0]} alt="" fill sizes="(max-width: 800px) 40vw, 200px" />}</Link>
            <strong>{item.name}</strong>
            <span>{formatPrice(item.price)}</span>
            <label><span className="sr-only">Talle de {item.name}</span>
              <select value={picked[item.slug] ?? ""} onChange={(event) => setPicked({ ...picked, [item.slug]: event.target.value })} disabled={inStock(item).length === 0}>
                <option value="">{inStock(item).length === 0 ? "Agotado" : "Talle"}</option>
                {inStock(item).map((size) => <option key={size}>{size}</option>)}
              </select>
            </label>
          </li>
        ))}
      </ul>
      <div className="tile outfit__summary">
        <span className="eyebrow">El conjunto completo</span>
        <p className="outfit__price">{discount > 0 && <s>{formatPrice(total)}</s>}<strong>{formatPrice(total - discount)}</strong></p>
        {percent > 0 && <p className="form-note">{percent}% menos llevando las {items.length} prendas. El descuento se aplica al finalizar la compra.</p>}
        <button type="button" className="btn" onClick={addAll} disabled={!complete}>{unavailable ? "Conjunto sin stock" : complete ? "Agregar el conjunto" : "Elegí los talles"}</button>
      </div>
    </div>
  );
}
