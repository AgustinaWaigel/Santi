"use client";

import { useActionState } from "react";
import { notifyRestock } from "@/app/actions";

export default function RestockForm({ slug, sizes }: { slug: string; sizes: string[] }) {
  const [state, action, pending] = useActionState(notifyRestock, { error: "" });
  return (
    <details className="size-guide">
      <summary>Avisame cuando vuelva mi talle</summary>
      {state.done ? <p className="size-calc__result form-ok" role="status">Listo. Te avisamos apenas reponemos.</p> : (
        <form action={action} className="size-calc__body">
          <input type="hidden" name="slug" value={slug} />
          <label className="field"><span>Talle</span><select name="size">{sizes.map((size) => <option key={size}>{size}</option>)}</select></label>
          <label className="field"><span>Email o WhatsApp</span><input name="contact" required maxLength={120} /></label>
          <button type="submit" className="btn btn--ghost" disabled={pending}>{pending ? "Enviando…" : "Avisame"}</button>
          <p className="form-error" role="alert">{state.error}</p>
        </form>
      )}
    </details>
  );
}
