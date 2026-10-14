"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import AddToCart from "@/components/AddToCart";
import Photo from "@/components/Photo";
import { formatPrice, type Product } from "@/data/products";
import { onSale } from "@/lib/pricing";

// Ventana para elegir talle y agregar al carrito sin salir del listado.
// `dropAt` es la hora de lanzamiento si la prenda pertenece al próximo drop.
export default function QuickView({ product, dropAt }: { product: Product; dropAt: number | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [opensAt, setOpensAt] = useState<number | null>(null);
  const close = () => dialog.current?.close();

  function open() {
    setOpensAt(dropAt !== null && Date.now() < dropAt ? dropAt : null);
    dialog.current?.showModal();
  }

  return (
    <>
      <button type="button" className="quick-button" onClick={open} aria-label={`Vista rápida de ${product.name}`}>Vista rápida</button>
      <dialog ref={dialog} className="quick" aria-label={product.name} onClick={(event) => { if (event.target === dialog.current) close(); }}>
        <div className="quick__panel">
          <button type="button" className="header-icon quick__close" aria-label="Cerrar" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
          <div className="quick__image product-photo">{product.images[0] && <Photo src={product.images[0]} alt={product.name} fill sizes="(max-width: 800px) 90vw, 420px" />}</div>
          <div className="quick__info">
            <h2>{product.name}</h2>
            <p className="product-page__price">{onSale(product) && <s>{formatPrice(product.compareAt)}</s>}{formatPrice(product.price)} {product.color && <span>· {product.color}</span>}</p>
            <AddToCart slug={product.slug} sizes={product.sizes} stock={product.stock} sizeRules="" opensAt={opensAt} compact />
            <Link href={`/productos/${product.slug}`} className="admin-link" onClick={close}>Ver ficha completa</Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
