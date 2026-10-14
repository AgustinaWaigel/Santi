import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Product, Settings } from "@/data/products";
import { dropTime } from "@/lib/pricing";

const COOKIE = "blackfit-early";

// El pase queda atado al código y a la fecha: cambiar cualquiera de los dos en el admin invalida los pases anteriores.
const pass = (settings: Settings) => createHmac("sha256", process.env.ADMIN_PASSWORD ?? "blackfit").update(`early:${settings.earlyCode}:${settings.dropDate}`).digest("hex");

export async function grantEarlyAccess(settings: Settings) {
  (await cookies()).set(COOKIE, pass(settings), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 14 });
}

async function hasEarlyAccess(settings: Settings) {
  const cookie = (await cookies()).get(COOKIE)?.value ?? "";
  const expected = pass(settings);
  return cookie.length === expected.length && timingSafeEqual(Buffer.from(cookie), Buffer.from(expected));
}

export const earlyOpens = (settings: Settings) => (dropTime(settings.dropDate) ?? 0) - settings.earlyMinutes * 60_000;

// Momento desde el que se puede comprar el producto, o null si ya está habilitado para quien lo pide.
export async function lockedUntil(settings: Settings, product: Product) {
  const opens = dropTime(settings.dropDate);
  if (!settings.dropCollection || product.collection !== settings.dropCollection || opens === null || Date.now() >= opens) return null;
  if (settings.earlyCode && Date.now() >= earlyOpens(settings) && (await hasEarlyAccess(settings))) return null;
  return opens;
}
