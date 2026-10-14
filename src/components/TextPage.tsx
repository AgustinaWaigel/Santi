import Link from "next/link";

// Página de texto editable desde el admin; cada salto de línea doble separa un párrafo.
export default function TextPage({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  const paragraphs = text.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  return (
    <main className="simple-page text-page">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      {paragraphs.length > 0
        ? paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
        : <><p>Todavía no cargamos esta información. Escribinos y te respondemos.</p><Link href="/contacto" className="btn">Contacto</Link></>}
    </main>
  );
}
