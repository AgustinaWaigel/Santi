"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useNow } from "@/lib/clock";
import { dropTime } from "@/lib/pricing";

// En la última hora antes de un lanzamiento todo el sitio pasa a rojo y la cuenta regresiva queda fija arriba.
export default function DropMode({ title, date }: { title: string; date: string }) {
  const current = useNow();
  const left = current === null ? null : Math.floor((dropTime(date) ?? 0) / 1000) - current;
  const active = left !== null && left > 0 && left <= 3600;

  useEffect(() => {
    document.documentElement.classList.toggle("drop-mode", active);
    return () => document.documentElement.classList.remove("drop-mode");
  }, [active]);

  if (!active) return null;
  return (
    <Link href="/productos" className="drop-bar" role="timer">
      <span>{title} sale en</span>
      <strong>{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</strong>
    </Link>
  );
}
