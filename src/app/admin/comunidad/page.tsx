import { redirect } from "next/navigation";
import CommunityForm from "@/components/admin/CommunityForm";
import DeleteButton from "@/components/admin/DeleteButton";
import Photo from "@/components/Photo";
import { isAdmin } from "@/lib/auth";
import { getSite } from "@/lib/store";
import { deleteCommunityPhoto } from "../actions";

export default async function AdminCommunityPage() {
  if (!(await isAdmin())) redirect("/admin");
  const { community, products } = await getSite();
  return (
    <main className="admin">
      <p className="eyebrow">Admin / {String(community.length).padStart(2, "0")} fotos</p>
      <h1>En la calle</h1>
      <p className="form-note admin-note">Fotos de clientes usando la marca. Aparecen en el inicio, cada una enlazada a su prenda. Subí solo fotos que te hayan autorizado a publicar.</p>
      {community.length > 0 && (
        <ul className="admin-list">
          {community.map((photo) => (
            <li className="admin-row admin-row--photo" key={photo.id}>
              <span className="admin-row__image tile"><Photo src={photo.image} alt="" fill sizes="120px" /></span>
              <div className="admin-row__info"><strong>{photo.caption || "Sin texto"}</strong><span>{products.find((product) => product.slug === photo.slug)?.name ?? "Sin enlazar"}</span></div>
              <form action={deleteCommunityPhoto}><input type="hidden" name="id" value={photo.id} /><DeleteButton name="esta foto" /></form>
            </li>
          ))}
        </ul>
      )}
      <h2>Nueva foto</h2>
      <CommunityForm products={products.map(({ slug, name }) => ({ slug, name }))} />
    </main>
  );
}
