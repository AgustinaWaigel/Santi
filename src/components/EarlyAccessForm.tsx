"use client";

import Link from "next/link";
import { useActionState } from "react";
import { unlockEarly } from "@/app/actions";

const dateFormat = new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeStyle: "short", timeZone: "America/Argentina/Buenos_Aires" });

export default function EarlyAccessForm() {
  const [state, action, pending] = useActionState(unlockEarly, { error: "" });
  if (state.opensAt !== undefined) {
    return <><p>Código válido. Desde este navegador vas a poder comprar el drop a partir del <strong>{dateFormat.format(state.opensAt)}</strong>.</p><Link href="/productos" className="btn">Ir a la tienda</Link></>;
  }
  return (
    <form action={action} className="admin-form admin-form--narrow">
      <label className="field"><span>Código</span><input name="code" autoCapitalize="characters" autoComplete="off" required maxLength={60} /></label>
      <p className="form-error" role="alert">{state.error}</p>
      <button type="submit" className="btn" disabled={pending}>{pending ? "Verificando…" : "Activar acceso"}</button>
    </form>
  );
}
