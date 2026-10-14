"use client";

import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <form action={action} className="admin-form admin-form--narrow">
      <label className="field"><span>Contraseña</span><input type="password" name="password" autoComplete="current-password" required autoFocus /></label>
      <p className="form-error" role="alert">{state.error}</p>
      <button type="submit" className="btn" disabled={pending}>{pending ? "Ingresando…" : "Ingresar"}</button>
    </form>
  );
}
