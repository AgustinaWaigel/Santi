"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { Order } from "@/data/products";
import { createPreference, mpConfigured } from "@/lib/mercadopago";
import { earlyOpens, grantEarlyAccess, lockedUntil } from "@/lib/early";
import { bundleDiscount, shippingCost, stockOf } from "@/lib/pricing";
import { getSite, mutateSite } from "@/lib/store";

const MAX_LINES = 50;
const MAX_QTY = 20;
const MAX_SUBSCRIBERS = 5000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type CheckoutState = { error: string; redirectTo?: string; values?: Record<string, string> };
export type CouponResult = { code: string; percent: number } | { error: string };
export type SubscribeState = { error: string; done?: boolean };
export type EarlyState = { error: string; opensAt?: number };
export type WheelState = { error: string; prize?: { index: number; code: string; percent: number } };

const CUSTOMER_FIELDS = ["name", "phone", "email", "address", "city", "zip", "notes"] as const;
const text = (formData: FormData, name: string, max = 200) => String(formData.get(name) ?? "").trim().slice(0, max);
const findCoupon = (coupons: { code: string; percent: number }[], code: string) => coupons.find((coupon) => coupon.code === code.toUpperCase().replace(/[^A-Z0-9]/g, ""));

export async function applyCoupon(code: string): Promise<CouponResult> {
  const coupon = findCoupon((await getSite()).coupons, String(code).slice(0, 40));
  return coupon ?? { error: "Ese código no es válido." };
}

function parseItems(raw: string) {
  try {
    const items: unknown = JSON.parse(raw);
    if (!Array.isArray(items) || items.length === 0 || items.length > MAX_LINES) return null;
    const lines = items.map((item) => ({ slug: String(item?.slug ?? ""), size: String(item?.size ?? ""), qty: Number(item?.qty) }));
    return lines.every((line) => Number.isInteger(line.qty) && line.qty >= 1 && line.qty <= MAX_QTY) ? lines : null;
  } catch {
    return null;
  }
}

// Arma el pedido con los precios y el stock del servidor: del navegador solo llegan qué prendas, talles y cantidades.
export async function createOrder(_state: CheckoutState, formData: FormData): Promise<CheckoutState> {
  const customer = Object.fromEntries(CUSTOMER_FIELDS.map((name) => [name, text(formData, name, name === "notes" ? 500 : 200)])) as Order["customer"];
  const method = text(formData, "method") === "retiro" ? "retiro" : "envio";
  const couponCode = text(formData, "coupon", 40);
  const values = { ...customer, method, coupon: couponCode };
  const fail = (error: string): CheckoutState => ({ error, values });

  const lines = parseItems(String(formData.get("items") ?? ""));
  if (!lines) return fail("Tu carrito está vacío o no se pudo leer.");
  if (!customer.name) return fail("Falta tu nombre.");
  if (customer.phone.replace(/\D/g, "").length < 8) return fail("Dejanos un teléfono para coordinar.");
  if (customer.email && !EMAIL.test(customer.email)) return fail("Revisá el email.");
  if (method === "envio" && (!customer.address || !customer.city || customer.zip.replace(/\D/g, "").length < 4)) return fail("Completá dirección, localidad y código postal.");

  // Los productos del próximo drop no se venden antes de la fecha, salvo a quien tiene el pase de acceso anticipado.
  const current = await getSite();
  for (const product of current.products) {
    if (lines.some((line) => line.slug === product.slug) && (await lockedUntil(current.settings, product)) !== null) return fail(`${product.name} todavía no está a la venta.`);
  }

  const result = await mutateSite<Order | string>((site) => {
    if (method === "retiro" && !site.settings.pickup) return [null, "El retiro en persona no está disponible."];
    const items: Order["items"] = [];
    for (const line of lines) {
      const product = site.products.find((item) => item.slug === line.slug);
      if (!product || !product.sizes.includes(line.size)) return [null, "Una prenda de tu carrito ya no está disponible. Revisalo y probá de nuevo."];
      const wanted = lines.filter((other) => other.slug === line.slug && other.size === line.size).reduce((total, other) => total + other.qty, 0);
      if (wanted > stockOf(product, line.size)) return [null, `No queda stock suficiente de ${product.name} en talle ${line.size}.`];
      items.push({ slug: product.slug, name: product.name, size: line.size, qty: line.qty, price: product.price });
    }
    const subtotal = items.reduce((total, item) => total + item.price * item.qty, 0);
    const coupon = couponCode ? findCoupon(site.coupons, couponCode) : undefined;
    if (couponCode && !coupon) return [null, "El código de descuento no es válido."];
    const bundle = bundleDiscount(items, site.products, site.settings.outfitDiscount);
    const discount = coupon ? Math.round((subtotal - bundle) * coupon.percent / 100) : 0;
    const cost = method === "retiro" ? 0 : shippingCost(site.settings, customer.zip, subtotal - bundle - discount) ?? 0;
    const order: Order = {
      id: randomUUID(), number: Math.max(1000, ...site.orders.map((item) => item.number)) + 1, createdAt: new Date().toISOString(), status: "pendiente",
      items, subtotal, coupon: coupon?.code ?? "", discount, bundleDiscount: bundle, tracking: "", shipping: { method, cost }, total: subtotal - bundle - discount + cost, customer, paymentId: "",
    };
    // Las unidades se reservan al crear el pedido; cancelarlo desde el admin las devuelve.
    const products = site.products.map((product) => {
      const stock = { ...product.stock };
      for (const item of items) if (item.slug === product.slug) stock[item.size] -= item.qty;
      return { ...product, stock };
    });
    return [{ ...site, products, orders: [order, ...site.orders] }, order];
  });
  if (typeof result === "string") return fail(result);

  revalidatePath("/", "layout");
  const payment = mpConfigured() && result.total > 0 ? await createPreference(result) : null;
  return { error: "", redirectTo: payment ?? `/pedido/${result.id}` };
}

export async function subscribe(_state: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const contact = text(formData, "contact", 120);
  if (!EMAIL.test(contact) && contact.replace(/\D/g, "").length < 8) return { error: "Dejanos un email o un WhatsApp válido." };
  await mutateSite((site) => {
    if (site.subscribers.length >= MAX_SUBSCRIBERS || site.subscribers.some((subscriber) => subscriber.contact.toLowerCase() === contact.toLowerCase())) return [null, null];
    return [{ ...site, subscribers: [...site.subscribers, { contact, createdAt: new Date().toISOString() }] }, null];
  });
  return { error: "", done: true };
}

const validContact = (contact: string) => EMAIL.test(contact) || contact.replace(/\D/g, "").length >= 8;

// Aviso de reposición: queda anotado en el admin quién espera qué talle.
export async function notifyRestock(_state: SubscribeState, formData: FormData): Promise<SubscribeState> {
  const contact = text(formData, "contact", 120);
  const slug = text(formData, "slug");
  const size = text(formData, "size", 40);
  if (!validContact(contact)) return { error: "Dejanos un email o un WhatsApp válido." };
  const error = await mutateSite<string | null>((site) => {
    const product = site.products.find((item) => item.slug === slug);
    if (!product || !product.sizes.includes(size)) return [null, "Elegí un talle."];
    if (site.restock.length >= MAX_SUBSCRIBERS || site.restock.some((item) => item.slug === slug && item.size === size && item.contact.toLowerCase() === contact.toLowerCase())) return [null, null];
    return [{ ...site, restock: [...site.restock, { slug, size, contact, createdAt: new Date().toISOString() }] }, null];
  });
  return error ? { error } : { error: "", done: true };
}

// Canjea el código de acceso anticipado por un pase guardado en el navegador.
export async function unlockEarly(_state: EarlyState, formData: FormData): Promise<EarlyState> {
  const { settings } = await getSite();
  const code = text(formData, "code", 60).toUpperCase();
  if (!settings.earlyCode || !settings.dropDate || code !== settings.earlyCode.toUpperCase()) {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return { error: "Ese código no es válido." };
  }
  await grantEarlyAccess(settings);
  return { error: "", opensAt: earlyOpens(settings) };
}

// Ruleta de bienvenida: un giro por contacto, y el premio se sortea en el servidor entre los códigos habilitados.
export async function spinWheel(_state: WheelState, formData: FormData): Promise<WheelState> {
  const contact = text(formData, "contact", 120);
  if (!validContact(contact)) return { error: "Dejanos un email o un WhatsApp válido para girar." };
  return mutateSite<WheelState>((site) => {
    const prizes = site.coupons.filter((coupon) => coupon.wheel);
    if (!site.settings.wheelEnabled || prizes.length === 0) return [null, { error: "La ruleta no está disponible ahora." }];
    if (site.subscribers.some((item) => item.source === "ruleta" && item.contact.toLowerCase() === contact.toLowerCase())) return [null, { error: "Ese contacto ya giró la ruleta." }];
    const index = Math.floor(Math.random() * prizes.length);
    const subscribers = site.subscribers.length >= MAX_SUBSCRIBERS ? site.subscribers : [...site.subscribers, { contact, createdAt: new Date().toISOString(), source: "ruleta" as const }];
    return [{ ...site, subscribers }, { error: "", prize: { index, code: prizes[index].code, percent: prizes[index].percent } }];
  });
}
