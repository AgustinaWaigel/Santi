import { createLocalStore } from "@/lib/local-store";

const store = createLocalStore<string>("blackfit-favorites");

export function toggleFavorite(slug: string) {
  const current = store.get();
  store.set(current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
}

export const useFavorites = store.use;
