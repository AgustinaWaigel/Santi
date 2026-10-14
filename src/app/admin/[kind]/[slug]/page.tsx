import { notFound, redirect } from "next/navigation";
import GroupForm from "@/components/admin/GroupForm";
import { isAdmin } from "@/lib/auth";
import { GROUP_KINDS, isGroupKind } from "@/lib/groups";
import { getSite } from "@/lib/store";

export default async function EditGroupPage({ params }: PageProps<"/admin/[kind]/[slug]">) {
  if (!(await isAdmin())) redirect("/admin");
  const { kind, slug } = await params;
  if (!isGroupKind(kind)) notFound();
  const group = (await getSite())[GROUP_KINDS[kind].key].find((item) => item.slug === slug);
  if (!group) notFound();
  return <main className="admin"><p className="eyebrow">Admin / {GROUP_KINDS[kind].title}</p><h1>{group.name}</h1><GroupForm kind={kind} group={group} /></main>;
}
