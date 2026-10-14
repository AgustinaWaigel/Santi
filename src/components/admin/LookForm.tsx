"use client";

import { useActionState } from "react";
import { saveLook } from "@/app/admin/actions";

export default function LookForm() {
  const [state, action, pending] = useActionState(saveLook, { error: "" });
  return (
    <form action={action} className="admin-form">
      <label className="field field--wide"><span>Foto vertical · JPG, PNG, WebP o AVIF, hasta 6 MB</span><input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" required /></label>
      <p className="form-error field--wide" role="alert">{state.error}</p>
      <div className="admin-form__actions field--wide"><button type="submit" className="btn" disabled={pending}>{pending ? "Subiendo…" : "Subir y marcar prendas"}</button></div>
    </form>
  );
}
