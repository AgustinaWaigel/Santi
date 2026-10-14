import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import type { Product } from "@/data/products";
import { stockOf } from "@/lib/pricing";
import { getSite } from "@/lib/store";

export type ShopQuery = Record<string, string | string[] | undefined>;

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
const plain = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
const price = (value: string) => (/^\d{1,9}$/.test(value) ? Number(value) : null);

const SORTS: Record<string, { label: string; compare?: (a: Product, b: Product) => number }> = {
  "": { label: "Más nuevo" },
  "precio-asc": { label: "Menor precio", compare: (a, b) => a.price - b.price },
  "precio-desc": { label: "Mayor precio", compare: (a, b) => b.price - a.price },
};

// Listado de la tienda con buscador, orden y filtros; `active` es la ruta del filtro de colección o categoría elegido.
export default async function ShopListing({ eyebrow, title, active, products, query }: { eyebrow: string; title: string; active: string; products: Product[]; query: ShopQuery }) {
  const { categories, collections, settings } = await getSite();
  const search = one(query.q).trim().slice(0, 60);
  const sort = Object.hasOwn(SORTS, one(query.orden)) ? one(query.orden) : "";
  const sizes = [...new Set(products.flatMap((product) => product.sizes))];
  const size = sizes.includes(one(query.talle)) ? one(query.talle) : "";
  const min = price(one(query.min));
  const max = price(one(query.max));
  const filters = [
    { href: "/productos", name: "Todo" },
    ...collections.map((group) => ({ href: `/colecciones/${group.slug}`, name: group.name })),
    ...categories.map((group) => ({ href: `/categorias/${group.slug}`, name: group.name })),
  ];
  const words = plain(search).split(/\s+/).filter(Boolean);
  const found = products.filter((product) => {
    const haystack = plain(`${product.name} ${product.color} ${product.description}`);
    return words.every((word) => haystack.includes(word))
      && (!size || stockOf(product, size) > 0)
      && (min === null || product.price >= min)
      && (max === null || product.price <= max);
  });
  const compare = SORTS[sort].compare;
  const sorted = compare ? [...found].sort(compare) : found;
  const filtered = Boolean(search || sort || size || min !== null || max !== null);

  return (
    <>
    <main className="shop-page shop-page--listing">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <nav className="chip-row" aria-label="Colecciones y categorías">
        {filters.map((filter) => <Link href={filter.href} className={`chip ${filter.href === active ? "chip--active" : ""}`} aria-current={filter.href === active ? "page" : undefined} key={filter.href}>{filter.name}</Link>)}
      </nav>
      <form action={active} className="shop-tools" role="search">
        <label className="shop-tools__search"><span className="sr-only">Buscar</span><input type="search" name="q" placeholder="Buscar prenda o color" defaultValue={search} maxLength={60} /></label>
        {sizes.length > 0 && (
          <label><span className="sr-only">Talle disponible</span>
            <select name="talle" defaultValue={size}><option value="">Talle</option>{sizes.map((option) => <option key={option}>{option}</option>)}</select>
          </label>
        )}
        <label className="shop-tools__price"><span className="sr-only">Precio mínimo</span><input type="number" name="min" min="0" placeholder="$ mín" defaultValue={min ?? ""} /></label>
        <label className="shop-tools__price"><span className="sr-only">Precio máximo</span><input type="number" name="max" min="0" placeholder="$ máx" defaultValue={max ?? ""} /></label>
        <label><span className="sr-only">Ordenar por</span>
          <select name="orden" defaultValue={sort}>{Object.entries(SORTS).map(([value, option]) => <option value={value} key={value}>{option.label}</option>)}</select>
        </label>
        <button type="submit" className="chip">Aplicar</button>
        {filtered && <Link href={active} className="admin-link">Limpiar</Link>}
      </form>
      <ProductGrid products={sorted} empty={filtered ? "No encontramos prendas con esos filtros." : undefined} />
    </main>
    <SpotifyPlayer url={settings.spotify} compact />
    <div className="page-end" />
    </>
  );
}
