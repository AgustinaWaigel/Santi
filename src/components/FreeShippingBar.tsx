import { formatPrice } from "@/data/products";

export default function FreeShippingBar({ subtotal, from }: { subtotal: number; from: number }) {
  if (from <= 0) return null;
  const missing = from - subtotal;
  return (
    <div className="free-shipping">
      <p>{missing > 0 ? <>Te faltan <strong>{formatPrice(missing)}</strong> para el envío gratis</> : <strong>Tenés envío gratis</strong>}</p>
      <progress max={from} value={Math.min(subtotal, from)} aria-label="Progreso hacia el envío gratis" />
    </div>
  );
}
