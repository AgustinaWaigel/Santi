"use client";

import { useActionState } from "react";
import { saveCoupon } from "@/app/admin/actions";

export default function CouponForm() {
  const [state, action, pending] = useActionState(saveCoupon, { error: "" });
  return (
    <form action={action} className="admin-form">
      <label className="field"><span>Código</span><input name="code" placeholder="BLACK10" defaultValue={state.values?.code ?? ""} required /></label>
      <label className="field"><span>Descuento (%)</span><input name="percent" type="number" min="1" max="100" step="1" defaultValue={state.values?.percent ?? ""} required /></label>
      <label className="check field--wide"><input type="checkbox" name="wheel" defaultChecked={state.values?.wheel === "on"} /> Puede salir como premio en la ruleta de bienvenida</label>
      <p className={`form-error field--wide ${state.saved ? "form-ok" : ""}`} role="status">{state.saved ? "Código creado." : state.error}</p>
      <div className="admin-form__actions field--wide"><button type="submit" className="btn" disabled={pending}>{pending ? "Guardando…" : "Crear código"}</button></div>
    </form>
  );
}
