import type { Metadata } from "next";
import EarlyAccessForm from "@/components/EarlyAccessForm";

export const metadata: Metadata = { title: "Acceso anticipado", robots: { index: false } };

export default function EarlyAccessPage() {
  return (
    <main className="simple-page">
      <p className="eyebrow">Próximo drop</p>
      <h1>Acceso anticipado</h1>
      <p>Si te anotaste para el próximo lanzamiento y recibiste un código, ingresalo acá para comprar antes que el resto.</p>
      <EarlyAccessForm />
    </main>
  );
}
