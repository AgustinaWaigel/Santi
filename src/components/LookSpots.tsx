"use client";

import Link from "next/link";
import { useState } from "react";

export type Spot = { x: number; y: number; slug: string; name: string; price: string };

// Puntos sobre una foto del lookbook: al tocar uno aparece la prenda con su precio y el enlace a la ficha.
export default function LookSpots({ spots }: { spots: Spot[] }) {
  const [active, setActive] = useState<number | null>(null);
  return (
    <>
      {spots.map((spot, index) => (
        <div className={`spot ${spot.x > 60 ? "spot--left" : ""} ${spot.y > 70 ? "spot--up" : ""}`} style={{ left: `${spot.x}%`, top: `${spot.y}%` }} key={index}>
          <button type="button" aria-expanded={active === index} aria-label={`Ver ${spot.name}`} onClick={() => setActive(active === index ? null : index)} />
          {active === index && <Link href={`/productos/${spot.slug}`} className="spot__card"><strong>{spot.name}</strong><span>{spot.price} · Ver prenda →</span></Link>}
        </div>
      ))}
    </>
  );
}
