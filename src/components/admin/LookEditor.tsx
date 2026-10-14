"use client";

import { useActionState, useState, type MouseEvent } from "react";
import { saveLookSpots } from "@/app/admin/actions";
import Photo from "@/components/Photo";
import type { Look } from "@/data/products";

// Editor de puntos: se elige la prenda y se hace clic sobre la foto donde aparece.
export default function LookEditor({ look, products }: { look: Look; products: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveLookSpots, { error: "" });
  const [spots, setSpots] = useState(look.spots);
  const [slug, setSlug] = useState(products[0]?.slug ?? "");
  const nameOf = (value: string) => products.find((product) => product.slug === value)?.name ?? value;

  function place(event: MouseEvent<HTMLDivElement>) {
    if (!slug || spots.length >= 12) return;
    const box = event.currentTarget.getBoundingClientRect();
    const round = (value: number) => Math.round(Math.min(100, Math.max(0, value)) * 10) / 10;
    setSpots([...spots, { x: round((event.clientX - box.left) / box.width * 100), y: round((event.clientY - box.top) / box.height * 100), slug }]);
  }

  return (
    <form action={action} className="look-editor">
      <input type="hidden" name="id" value={look.id} />
      <input type="hidden" name="spots" value={JSON.stringify(spots)} />
      <div className="tile look look-editor__photo" onClick={place}>
        <Photo src={look.image} alt="Foto del lookbook" fill sizes="(max-width: 800px) 100vw, 50vw" />
        {spots.map((spot, index) => <div className="spot" style={{ left: `${spot.x}%`, top: `${spot.y}%` }} key={index}><span>{index + 1}</span></div>)}
      </div>
      <div className="look-editor__side">
        <label className="field"><span>Prenda a marcar · elegila y hacé clic sobre la foto</span>
          <select value={slug} onChange={(event) => setSlug(event.target.value)}>{products.map((product) => <option value={product.slug} key={product.slug}>{product.name}</option>)}</select>
        </label>
        {spots.length === 0 ? <p className="form-note">Todavía no hay puntos en esta foto.</p> : (
          <ol className="look-editor__spots">
            {spots.map((spot, index) => <li key={index}><span>{nameOf(spot.slug)}</span><button type="button" className="admin-link admin-link--danger" onClick={() => setSpots(spots.filter((_, position) => position !== index))}>Quitar</button></li>)}
          </ol>
        )}
        <p className={`form-error ${state.saved ? "form-ok" : ""}`} role="status">{state.saved ? "Puntos guardados." : state.error}</p>
        <button type="submit" className="btn" disabled={pending}>{pending ? "Guardando…" : "Guardar puntos"}</button>
      </div>
    </form>
  );
}
