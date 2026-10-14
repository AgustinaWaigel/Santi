"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export type RecentSale = { city: string; name: string; at: string };

const WEEK = 7 * 24 * 60 * 60 * 1000;

function ago(at: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(at).getTime()) / 60_000));
  if (minutes < 60) return `hace ${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
  const days = Math.round(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}

// Cartel discreto con compras reales de la última semana: solo ciudad y prenda, nunca el nombre del cliente.
export default function SalesToast({ sales }: { sales: RecentSale[] }) {
  const pathname = usePathname();
  const [text, setText] = useState<string | null>(null);
  const quiet = pathname.startsWith("/admin") || pathname.startsWith("/checkout") || pathname.startsWith("/pedido");

  useEffect(() => {
    if (quiet) return;
    const timers = sales.slice(0, 3).flatMap((sale, index) => {
      const start = 12_000 + index * 28_000;
      return [
        setTimeout(() => { if (Date.now() - new Date(sale.at).getTime() < WEEK) setText(`Alguien${sale.city ? ` en ${sale.city}` : ""} compró ${sale.name} ${ago(sale.at)}`); }, start),
        setTimeout(() => setText(null), start + 7_000),
      ];
    });
    return () => timers.forEach(clearTimeout);
  }, [sales, quiet]);

  if (!text || quiet) return null;
  return <p className="sales-toast" role="status"><span aria-hidden="true" />{text}</p>;
}
