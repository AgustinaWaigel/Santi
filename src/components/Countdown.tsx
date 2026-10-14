"use client";

import Link from "next/link";
import { useActionState } from "react";
import { subscribe } from "@/app/actions";
import { useNow } from "@/lib/clock";
import { dropTime } from "@/lib/pricing";

export default function Countdown({ title, date }: { title: string; date: string }) {
  const current = useNow();
  const [state, action, pending] = useActionState(subscribe, { error: "" });
  const left = current === null ? null : Math.floor((dropTime(date) ?? 0) / 1000) - current;
  const rest = Math.max(0, left ?? 0);
  const parts = [["Días", Math.floor(rest / 86400)], ["Horas", Math.floor(rest % 86400 / 3600)], ["Min", Math.floor(rest % 3600 / 60)], ["Seg", rest % 60]] as const;

  return (
    <section className="home-section">
      <div className="tile drop">
        <div className="drop__copy">
          <span className="eyebrow">Próximo lanzamiento</span>
          <h2>{title}</h2>
        </div>
        {left !== null && left <= 0 ? <Link href="/productos" className="btn btn--light">Ya disponible · Ver tienda</Link> : (
          <>
            <div className="drop__clock" role="timer" aria-label="Tiempo restante">
              {parts.map(([label, value]) => <div key={label}><strong>{left === null ? "--" : String(value).padStart(2, "0")}</strong><span>{label}</span></div>)}
            </div>
            {state.done ? <p className="drop__done" role="status">Listo. Te avisamos cuando salga. <Link href="/acceso">¿Ya tenés código de acceso anticipado?</Link></p> : (
              <form action={action} className="drop__form">
                <label className="field"><span>Avisame cuando salga</span><input name="contact" placeholder="Email o WhatsApp" required maxLength={120} /></label>
                <button type="submit" className="btn btn--light" disabled={pending}>{pending ? "Enviando…" : "Avisame"}</button>
                <p className="form-error" role="alert">{state.error}</p>
              </form>
            )}
          </>
        )}
      </div>
    </section>
  );
}
