"use client";

import Link from "next/link";
import { useState } from "react";
import RestockForm from "@/components/RestockForm";
import SizeCalculator from "@/components/SizeCalculator";
import { addItem, setCartDrawer, useCart } from "@/lib/cart";
import { hasSizeRules } from "@/lib/pricing";

const dateFormat = new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" });

// `compact` (vista rápida) deja solo talles y botón, sin calculadora ni aviso de reposición.
export default function AddToCart({ slug, sizes, stock, sizeRules, opensAt, compact = false }: { slug: string; sizes: string[]; stock: Record<string, number>; sizeRules: string; opensAt: number | null; compact?: boolean }) {
  const cart = useCart();
  const [size, setSize] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "missing" | "limit">("idle");
  const left = (option: string) => stock[option] ?? 0;
  const soldOut = sizes.every((option) => left(option) === 0);
  const missing = sizes.filter((option) => left(option) === 0);

  function add() {
    if (!size) return setStatus("missing");
    const inCart = cart.find((item) => item.slug === slug && item.size === size)?.qty ?? 0;
    if (inCart >= left(size)) return setStatus("limit");
    addItem(slug, size);
    setCartDrawer(true);
  }

  return (
    <div className="add-to-cart">
      <div className="add-to-cart__sizes">
        <span className="eyebrow">Talle</span>
        <div className="chip-row" role="group" aria-label="Talle">
          {sizes.map((option) => (
            <button type="button" className={`chip ${option === size ? "chip--active" : ""}`} aria-pressed={option === size} disabled={left(option) === 0} title={left(option) === 0 ? "Sin stock" : undefined} onClick={() => { setSize(option); setStatus("idle"); }} key={option}>{option}</button>
          ))}
        </div>
      </div>
      {hasSizeRules(sizeRules, sizes) && <SizeCalculator rules={sizeRules} sizes={sizes} stock={stock} onPick={(picked) => { setSize(picked); setStatus("idle"); }} />}
      {opensAt !== null ? (
        <div className="add-to-cart__locked">
          <p><strong>Disponible el {dateFormat.format(opensAt)}.</strong></p>
          <Link href="/acceso" className="admin-link">Tengo código de acceso anticipado</Link>
        </div>
      ) : (
        <>
          <div className="add-to-cart__actions">
            <button type="button" className="btn" onClick={add} disabled={soldOut}>{soldOut ? "Agotado" : "Agregar al carrito"}</button>
          </div>
          <p className="add-to-cart__status" role="status">
            {status === "missing" && "Elegí un talle para agregarla."}
            {status === "limit" && "Ya tenés en el carrito todas las unidades disponibles de ese talle."}
            {status === "idle" && size && left(size) <= 3 && `Últimas ${left(size)} en talle ${size}.`}
          </p>
        </>
      )}
      {missing.length > 0 && !compact && <RestockForm slug={slug} sizes={missing} />}
    </div>
  );
}
