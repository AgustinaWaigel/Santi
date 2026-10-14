"use client";

import { useActionState } from "react";
import { saveCommunityPhoto } from "@/app/admin/actions";

export default function CommunityForm({ products }: { products: { slug: string; name: string }[] }) {
  const [state, action, pending] = useActionState(saveCommunityPhoto, { error: "" });
  return (
    <form action={action} className="admin-form">
      <label className="field field--wide"><span>Foto · JPG, PNG, WebP o AVIF, hasta 6 MB</span><input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" required /></label>
      <label className="field"><span>Prenda que se ve</span>
        <select name="slug" defaultValue={state.values?.slug ?? ""}>
          <option value="">Sin enlazar</option>
          {products.map((product) => <option value={product.slug} key={product.slug}>{product.name}</option>)}
        </select>
      </label>
      <label className="field"><span>Texto corto · opcional</span><input name="caption" maxLength={80} placeholder="@usuario" defaultValue={state.values?.caption ?? ""} /></label>
      <p className={`form-error field--wide ${state.saved ? "form-ok" : ""}`} role="status">{state.saved ? "Foto publicada." : state.error}</p>
      <div className="admin-form__actions field--wide"><button type="submit" className="btn" disabled={pending}>{pending ? "Subiendo…" : "Publicar foto"}</button></div>
    </form>
  );
}
