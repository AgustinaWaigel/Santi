import Link from "next/link";
import { redirect } from "next/navigation";
import DeleteButton from "@/components/admin/DeleteButton";
import LookForm from "@/components/admin/LookForm";
import Photo from "@/components/Photo";
import { isAdmin } from "@/lib/auth";
import { getSite } from "@/lib/store";
import { deleteLook } from "../actions";

export default async function AdminLookbookPage() {
  if (!(await isAdmin())) redirect("/admin");
  const { looks } = await getSite();
  return (
    <main className="admin">
      <p className="eyebrow">Admin / {String(looks.length).padStart(2, "0")} fotos</p>
      <h1>Lookbook</h1>
      <p className="form-note admin-note">Fotos de campaña con puntos sobre cada prenda. Se ven en <code>/lookbook</code>; mientras no cargues ninguna, esa página muestra las fotos del carrusel del inicio.</p>
      {looks.length > 0 && (
        <ul className="admin-list">
          {looks.map((look, index) => (
            <li className="admin-row admin-row--photo" key={look.id}>
              <span className="admin-row__image tile"><Photo src={look.image} alt="" fill sizes="120px" /></span>
              <div className="admin-row__info"><strong>Look {index + 1}</strong><span>{look.spots.length} {look.spots.length === 1 ? "prenda marcada" : "prendas marcadas"}</span></div>
              <div className="admin-row__actions">
                <Link href={`/admin/lookbook/${look.id}`} className="admin-link">Marcar prendas</Link>
                <form action={deleteLook}><input type="hidden" name="id" value={look.id} /><DeleteButton name={`el look ${index + 1}`} /></form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <h2>Nueva foto</h2>
      <LookForm />
    </main>
  );
}
