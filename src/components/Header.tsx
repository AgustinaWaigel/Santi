import Link from "next/link";
import CartLink from "@/components/CartLink";
import MobileMenu from "@/components/MobileMenu";
import { getSite } from "@/lib/store";

export default async function Header() {
  const { categories, collections, settings } = await getSite();
  const groups = [
    ...collections.map((group) => ({ href: `/colecciones/${group.slug}`, name: group.name })),
    ...categories.map((group) => ({ href: `/categorias/${group.slug}`, name: group.name })),
  ];
  const pages = [{ href: "/lookbook", name: "Lookbook" }, { href: "/nosotros", name: "Nosotros" }, { href: "/contacto", name: "Contacto" }];
  return (
    <>
      {settings.promo && <div className="promo-bar">{settings.promo}</div>}
      <header className="site-header">
        <Link href="/" className="wordmark" aria-label="Blackfit Streetwear, inicio">B.<span>Streetwear</span></Link>
        <nav className="site-nav" aria-label="Principal">
          <Link href="/productos">Tienda</Link>
          {[...collections.slice(0, 1).map((group) => ({ href: `/colecciones/${group.slug}`, name: group.name })), ...categories.slice(0, 2).map((group) => ({ href: `/categorias/${group.slug}`, name: group.name })), ...pages].map((link) => <Link href={link.href} key={link.href}>{link.name}</Link>)}
        </nav>
        <div className="header-actions">
          <MobileMenu links={[{ href: "/productos", name: "Tienda" }, ...groups, { href: "/favoritos", name: "Favoritos" }, ...pages, { href: "/envios", name: "Envíos y devoluciones" }]} />
          <Link href="/favoritos" className="header-icon header-icon--wide" aria-label="Ver favoritos">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /></svg>
          </Link>
          <CartLink />
        </div>
      </header>
    </>
  );
}
