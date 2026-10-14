import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DeleteButton from "@/components/admin/DeleteButton";
import GroupForm from "@/components/admin/GroupForm";
import MoveButtons from "@/components/admin/MoveButtons";
import Photo from "@/components/Photo";
import { isAdmin } from "@/lib/auth";
import { GROUP_KINDS, isGroupKind } from "@/lib/groups";
import { getSite } from "@/lib/store";
import { deleteGroup } from "../actions";

export default async function AdminGroupsPage({ params }: PageProps<"/admin/[kind]">) {
  if (!(await isAdmin())) redirect("/admin");
  const { kind } = await params;
  if (!isGroupKind(kind)) notFound();

  const { key, title, newLabel } = GROUP_KINDS[kind];
  const site = await getSite();
  const groups = site[key];
  const count = (slug: string) => site.products.filter((product) => (key === "categories" ? product.category : product.collection) === slug).length;
  return (
    <main className="admin">
      <p className="eyebrow">Admin / {String(groups.length).padStart(2, "0")}</p>
      <h1>{title}</h1>
      {groups.length > 0 && (
        <ul className="admin-list">
          {groups.map((group, index) => (
            <li className="admin-row" key={group.slug}>
              <span className="admin-row__image product-photo"><Photo src={group.image} alt="" fill sizes="120px" /></span>
              <div className="admin-row__info"><strong>{group.name}</strong><span>{count(group.slug)} {count(group.slug) === 1 ? "producto" : "productos"}</span></div>
              <span />
              <div className="admin-row__actions">
                <MoveButtons list={key} slug={group.slug} name={group.name} first={index === 0} last={index === groups.length - 1} />
                <Link href={`/${kind}/${group.slug}`} className="admin-link">Ver</Link>
                <Link href={`/admin/${kind}/${group.slug}`} className="admin-link">Editar</Link>
                <form action={deleteGroup}><input type="hidden" name="kind" value={kind} /><input type="hidden" name="slug" value={group.slug} /><DeleteButton name={group.name} /></form>
              </div>
            </li>
          ))}
        </ul>
      )}
      <h2>{newLabel}</h2>
      <GroupForm kind={kind} />
    </main>
  );
}
