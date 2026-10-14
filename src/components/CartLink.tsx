"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function CartLink() {
  const count = useCart().reduce((total, item) => total + item.qty, 0);
  return (
    <Link href="/carrito" className="header-icon" aria-label={count ? `Ver carrito, ${count} ${count === 1 ? "prenda" : "prendas"}` : "Ver carrito"}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 8h10l1 12H6L7 8Zm3 1V6a2 2 0 0 1 4 0v3" /></svg>
      {count > 0 && <span className="cart-badge" aria-hidden="true" key={count}>{count}</span>}
    </Link>
  );
}
