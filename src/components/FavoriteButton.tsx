"use client";

import { toggleFavorite, useFavorites } from "@/lib/favorites";

export default function FavoriteButton({ slug, name }: { slug: string; name: string }) {
  const active = useFavorites().includes(slug);
  return (
    <button type="button" className={`fav-button ${active ? "is-active" : ""}`} aria-pressed={active} aria-label={active ? `Quitar ${name} de favoritos` : `Guardar ${name} en favoritos`} onClick={() => toggleFavorite(slug)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>
    </button>
  );
}
