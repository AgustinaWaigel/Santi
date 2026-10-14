"use client";

import Link from "next/link";
import { useActionState } from "react";
import { saveGroup } from "@/app/admin/actions";
import Photo from "@/components/Photo";
import type { Group } from "@/data/products";
import type { GroupKind } from "@/lib/groups";

export default function GroupForm({ kind, group }: { kind: GroupKind; group?: Group }) {
  const [state, action, pending] = useActionState(saveGroup, { error: "" });

  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="kind" value={kind} />
      {group && <input type="hidden" name="originalSlug" value={group.slug} />}
      <label className="field field--wide"><span>Nombre</span><input name="name" defaultValue={state.values?.name ?? group?.name ?? ""} required /></label>
      {group && (
        <div className="field field--wide photo-list">
          <span className="photo-list__item"><span className="product-photo"><Photo src={group.image} alt="" fill sizes="160px" /></span><span>Foto actual</span></span>
        </div>
      )}
      <label className="field field--wide"><span>{group ? "Reemplazar foto" : "Foto"} · JPG, PNG, WebP o AVIF, hasta 6 MB</span><input type="file" name="image" accept="image/jpeg,image/png,image/webp,image/avif" /></label>

      {kind === "categorias" && (
        <>
          <label className="field field--wide"><span>Guía de talles de esta categoría · una fila por línea, columnas separadas por | · vacío usa la general</span><textarea name="sizeGuide" rows={4} placeholder={"Talle | Cintura (cm) | Largo (cm)\n38 | 76 | 102"} defaultValue={state.values?.sizeGuide ?? group?.sizeGuide ?? ""} /></label>
          <label className="field field--wide"><span>Calculadora de talles · talle: altura, peso de quien lo usa · vacío usa la general</span><textarea name="sizeRules" rows={4} placeholder={"38: 160-172 cm, 55-68 kg\n40: 168-180 cm, 66-78 kg"} defaultValue={state.values?.sizeRules ?? group?.sizeRules ?? ""} /></label>
        </>
      )}
      <p className="form-error field--wide" role="alert">{state.error}</p>
      <div className="admin-form__actions field--wide">
        <button type="submit" className="btn" disabled={pending}>{pending ? "Guardando…" : group ? "Guardar cambios" : "Crear"}</button>
        {group && <Link href={`/admin/${kind}`} className="btn btn--ghost">Cancelar</Link>}
      </div>
    </form>
  );
}
