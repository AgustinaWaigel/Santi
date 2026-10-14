import type { Product, Settings } from "@/data/products";

export type ShippingConfig = Pick<Settings, "pickup" | "pickupNote" | "shippingDefault" | "shippingZones" | "freeShippingFrom">;

export const stockOf = (product: Product, size: string) => product.stock[size] ?? 0;
export const totalStock = (product: Product) => product.sizes.reduce((total, size) => total + stockOf(product, size), 0);
export const onSale = (product: Product) => product.compareAt > product.price;

// La fecha del drop se carga sin zona horaria: se toma como hora de Argentina (UTC−3) en el servidor y en el navegador.
export const dropTime = (dropDate: string) => (dropDate ? new Date(`${dropDate}:00-03:00`).getTime() : null);

// Descuento por llevar un conjunto completo: el producto y todos los que tiene marcados para combinar.
export function bundleDiscount(lines: { slug: string; qty: number }[], products: Product[], percent: number) {
  if (percent <= 0) return 0;
  const left = new Map<string, number>();
  for (const line of lines) left.set(line.slug, (left.get(line.slug) ?? 0) + line.qty);
  let discount = 0;
  for (const product of products) {
    const members = [product, ...product.outfit.flatMap((slug) => products.find((item) => item.slug === slug) ?? [])];
    if (product.outfit.length === 0 || members.length !== product.outfit.length + 1) continue;
    // Cada unidad cuenta para un solo conjunto.
    const sets = Math.min(...members.map((member) => left.get(member.slug) ?? 0));
    if (sets <= 0) continue;
    for (const member of members) left.set(member.slug, left.get(member.slug)! - sets);
    discount += Math.round(sets * members.reduce((total, member) => total + member.price, 0) * percent / 100);
  }
  return discount;
}

export type Fit = "justo" | "normal" | "oversize";
type SizeRule = { size: string; height: [number, number]; weight: [number, number] };

const parseSizeRules = (text: string): SizeRule[] => text.split("\n").flatMap((line) => {
  const match = line.match(/^\s*(.+?)\s*:\s*(\d+)\s*-\s*(\d+)\D+(\d+)\s*-\s*(\d+)/);
  return match ? [{ size: match[1], height: [Number(match[2]), Number(match[3])], weight: [Number(match[4]), Number(match[5])] }] : [];
});

export const hasSizeRules = (rules: string, sizes: string[]) => parseSizeRules(rules).some((rule) => sizes.includes(rule.size));

// Talle sugerido: el que mejor encaja por peso (pesa más, define el ancho) y altura, corrido según el calce preferido.
export function recommendSize(rules: string, sizes: string[], height: number, weight: number, fit: Fit) {
  const usable = parseSizeRules(rules).filter((rule) => sizes.includes(rule.size));
  if (usable.length === 0) return null;
  const miss = (value: number, [min, max]: [number, number]) => (value < min ? min - value : value > max ? value - max : 0) / (max - min || 1);
  const scores = usable.map((rule) => miss(weight, rule.weight) * 1.5 + miss(height, rule.height));
  let index = scores.indexOf(Math.min(...scores));
  const [min, max] = usable[index].weight;
  if (fit === "oversize") index = Math.min(index + 1, usable.length - 1);
  if (fit === "justo" && weight < min + (max - min) / 3) index = Math.max(index - 1, 0);
  return usable[index].size;
}

// Etiqueta de la tarjeta: lo más urgente gana.
export function productTag(product: Product, collectionName?: string) {
  if (totalStock(product) === 0) return "Agotado";
  if (onSale(product)) return `−${Math.round((1 - product.price / product.compareAt) * 100)}%`;
  if (product.isNew) return "Nuevo";
  return collectionName;
}

const parseZones = (text: string) => text.split("\n").flatMap((line) => {
  const match = line.match(/^\s*(\d+)\s*-\s*(\d+)\s*[:=]\s*(\d+)/);
  return match ? [{ from: Number(match[1]), to: Number(match[2]), cost: Number(match[3]) }] : [];
});

// Devuelve null mientras el código postal no tenga al menos cuatro números.
export function shippingCost(config: ShippingConfig, zip: string, subtotal: number) {
  const digits = zip.replace(/\D/g, "");
  if (digits.length < 4) return null;
  if (config.freeShippingFrom > 0 && subtotal >= config.freeShippingFrom) return 0;
  const code = Number(digits.slice(0, 4));
  return parseZones(config.shippingZones).find((zone) => code >= zone.from && code <= zone.to)?.cost ?? config.shippingDefault;
}

// Sin zonas ni costo base no hay tarifa cargada: el envío se acuerda después.
export const shippingToArrange = (config: ShippingConfig) => config.shippingDefault === 0 && parseZones(config.shippingZones).length === 0;
