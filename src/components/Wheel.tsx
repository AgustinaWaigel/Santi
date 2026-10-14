"use client";

import { usePathname } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { spinWheel } from "@/app/actions";

const KEY = "blackfit-wheel";
const COLORS = ["var(--red)", "#0a0a0a", "var(--cream)"];

// Ruleta de bienvenida: aparece una sola vez por navegador y entrega un código a cambio de un contacto.
// `percents` son los premios posibles; el código ganado lo decide y lo devuelve el servidor.
export default function Wheel({ percents }: { percents: number[] }) {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, action, pending] = useActionState(spinWheel, { error: "" });
  const quiet = pathname.startsWith("/admin") || pathname.startsWith("/checkout") || pathname.startsWith("/pedido");

  useEffect(() => {
    if (quiet) return;
    const timer = setTimeout(() => {
      try {
        if (localStorage.getItem(KEY) || dialog.current?.open) return;
        localStorage.setItem(KEY, "1");
      } catch {
        return;
      }
      dialog.current?.showModal();
    }, 9000);
    return () => clearTimeout(timer);
  }, [quiet]);

  // Con pocos premios se repiten hasta llenar la rueda.
  const count = percents.length < 6 ? Math.ceil(6 / percents.length) * percents.length : percents.length;
  const slice = 360 / count;
  const segments = Array.from({ length: count }, (_, index) => percents[index % percents.length]);
  // Tres colores alternados; si el último quedara igual al primero, usa el del medio.
  const colorAt = (index: number) => COLORS[index === count - 1 && count % COLORS.length === 1 ? 1 : index % COLORS.length];
  const stops = segments.map((_, index) => `${colorAt(index)} ${index * slice}deg ${(index + 1) * slice}deg`).join(", ");
  // La rueda frena con el premio ganado bajo la flecha de arriba.
  const turn = state.prize ? 360 * 5 + 360 - (state.prize.index + 0.5) * slice : 0;
  const close = () => dialog.current?.close();

  return (
    <dialog ref={dialog} className="wheel" aria-label="Ruleta de descuento" onClick={(event) => { if (event.target === dialog.current) close(); }}>
      <div className="wheel__panel">
        <button type="button" className="header-icon wheel__close" aria-label="Cerrar" onClick={close}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </button>
        <div className="wheel__disc-wrap" aria-hidden="true">
          <div className="wheel__disc" style={{ background: `conic-gradient(${stops})`, transform: `rotate(${turn}deg)` }}>
            {segments.map((percent, index) => <span style={{ transform: `rotate(${(index + 0.5) * slice}deg)`, color: colorAt(index) === "var(--cream)" ? "#000" : "var(--cream)" }} key={index}>{percent}%</span>)}
          </div>
        </div>
        <div className="wheel__copy">
          <span className="eyebrow">Bienvenida</span>
          {state.prize ? (
            <div className="wheel__prize" role="status">
              <h2>{state.prize.percent}% off</h2>
              <p>Tu código es <strong>{state.prize.code}</strong>. Ingresalo al finalizar la compra.</p>
              <button type="button" className="btn" onClick={close}>Seguir mirando</button>
            </div>
          ) : (
            <>
              <h2>Girá y ganá</h2>
              <p>Dejanos tu email o WhatsApp y girá la ruleta por un descuento en tu primera compra.</p>
              <form action={action}>
                <label className="field"><span>Email o WhatsApp</span><input name="contact" required maxLength={120} /></label>
                <p className="form-error" role="alert">{state.error}</p>
                <button type="submit" className="btn" disabled={pending}>{pending ? "Girando…" : "Girar"}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </dialog>
  );
}
