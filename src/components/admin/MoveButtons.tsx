import { moveItem } from "@/app/admin/actions";

export default function MoveButtons({ list, slug, name, first, last }: { list: "products" | "categories" | "collections"; slug: string; name: string; first: boolean; last: boolean }) {
  return (
    <form action={moveItem} className="move-buttons">
      <input type="hidden" name="list" value={list} />
      <input type="hidden" name="slug" value={slug} />
      <button type="submit" name="dir" value="up" disabled={first} aria-label={`Subir ${name}`}>↑</button>
      <button type="submit" name="dir" value="down" disabled={last} aria-label={`Bajar ${name}`}>↓</button>
    </form>
  );
}
