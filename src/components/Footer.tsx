import Link from "next/link";
import { getSite } from "@/lib/store";

export default async function Footer() {
  const { categories, collections } = await getSite();
  return (
    <footer className="site-footer">
      <div className="footer-logo" aria-hidden="true">Blackfit</div>
      <div className="footer-column"><strong>Tienda</strong><Link href="/productos">Todos los productos</Link>{[...collections.slice(0, 2).map((group) => ({ ...group, path: "colecciones" })), ...categories.slice(0, 3).map((group) => ({ ...group, path: "categorias" }))].map((group) => <Link href={`/${group.path}/${group.slug}`} key={`${group.path}-${group.slug}`}>{group.name}</Link>)}</div>
      <div className="footer-column"><strong>Ayuda</strong><Link href="/envios">Envíos y devoluciones</Link><Link href="/contacto">Contacto</Link><Link href="/favoritos">Favoritos</Link></div>
      <div className="footer-column"><strong>Marca</strong><Link href="/nosotros">Nosotros</Link><Link href="/terminos">Términos y privacidad</Link><Link href="/admin">Admin</Link></div>
      <span className="footer-copy">© 2026 Blackfit · Wear your identity</span>
    </footer>
  );
}
