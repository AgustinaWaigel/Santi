import type { Metadata } from "next";
import { getSite } from "@/lib/store";

export const metadata: Metadata = { title: "Contacto" };

export default async function ContactPage() {
  const { whatsapp, instagram, email } = (await getSite()).settings;
  return (
    <main className="simple-page">
      <p className="eyebrow">Ayuda</p>
      <h1>Contacto</h1>
      <p>Escribinos para recibir ayuda con tu compra, envío o devolución.</p>
      <div className="contact-list">
        {whatsapp && <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn">WhatsApp</a>}
        {instagram && <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">@{instagram}</a>}
        {email && <a href={`mailto:${email}`} className="btn btn--ghost">{email}</a>}
      </div>
    </main>
  );
}
