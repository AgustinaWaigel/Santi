import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "blackfit-admin";

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

function sessionToken() {
  const password = process.env.ADMIN_PASSWORD;
  return password ? createHmac("sha256", password).update("blackfit-admin-session").digest("hex") : null;
}

function safeEqual(a: string, b: string) {
  const hash = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(hash(a), hash(b));
}

export async function isAdmin() {
  const token = sessionToken();
  const cookie = (await cookies()).get(COOKIE)?.value;
  return Boolean(token && cookie && safeEqual(cookie, token));
}

export async function signIn(password: string) {
  const token = sessionToken();
  if (!token || !safeEqual(password, process.env.ADMIN_PASSWORD!)) return false;
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return true;
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}
