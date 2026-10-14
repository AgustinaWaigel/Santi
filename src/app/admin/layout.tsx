import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { logout } from "./actions";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      {(await isAdmin()) && (
        <nav className="admin-nav" aria-label="Admin">
          <Link href="/admin" className="chip">Productos</Link>
          <Link href="/admin/pedidos" className="chip">Pedidos</Link>
          <Link href="/admin/categorias" className="chip">Categorías</Link>
          <Link href="/admin/colecciones" className="chip">Colecciones</Link>
          <Link href="/admin/cupones" className="chip">Descuentos</Link>
          <Link href="/admin/lookbook" className="chip">Lookbook</Link>
          <Link href="/admin/comunidad" className="chip">En la calle</Link>
          <Link href="/admin/sitio" className="chip">Sitio</Link>
          <form action={logout}><button type="submit" className="chip">Salir</button></form>
        </nav>
      )}
      {children}
    </>
  );
}
