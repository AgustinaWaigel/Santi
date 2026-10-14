"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";
import { ORDER_STATUSES, spotifyEmbed, type Group, type OrderStatus, type Product, type Settings, type Site } from "@/data/products";
import { isAdmin, signIn, signOut } from "@/lib/auth";
import { GROUP_KINDS, isGroupKind } from "@/lib/groups";
import { deleteUpload, mutateSite, saveUpload, UPLOAD_TYPES, VIDEO_TYPES } from "@/lib/store";

const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const MAX_VIDEO_BYTES = 40 * 1024 * 1024;
const MAX_PRODUCT_PHOTOS = 8;
const MAX_LOOKBOOK_PHOTOS = 10;
const SESSION_EXPIRED = "Tu sesión venció. Volvé a ingresar.";

// Los formularios devuelven lo que se había escrito para no perderlo cuando hay un error.
export type FormState = { error: string; saved?: boolean; values?: Record<string, string> };

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  if (!(await signIn(String(formData.get("password") ?? "")))) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: "Contraseña incorrecta." };
  }
  redirect("/admin");
}

export async function logout() {
  await signOut();
  redirect("/admin");
}

const slugify = (text: string) => text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function uniqueSlug(name: string, fallback: string, taken: string[]) {
  const base = slugify(name) || fallback;
  let slug = base;
  for (let n = 2; taken.includes(slug); n++) slug = `${base}-${n}`;
  return slug;
}

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
const textValues = (formData: FormData, names: readonly string[]) => Object.fromEntries(names.map((name) => [name, text(formData, name)]));
const photosIn = (formData: FormData, name: string) => formData.getAll(name).filter((entry): entry is File => entry instanceof File && entry.size > 0);
const amount = (value: string) => (value === "" ? 0 : Number(value));
const validAmount = (value: number) => Number.isFinite(value) && value >= 0;

function photoError(photos: File[]) {
  if (photos.some((photo) => !UPLOAD_TYPES[photo.type])) return "Las fotos tienen que ser JPG, PNG, WebP o AVIF.";
  if (photos.some((photo) => photo.size > MAX_PHOTO_BYTES)) return "Cada foto puede pesar hasta 6 MB.";
  return null;
}

function videoError(videos: File[]) {
  if (videos.some((video) => !VIDEO_TYPES[video.type])) return "El video tiene que ser MP4 o WebM.";
  if (videos.some((video) => video.size > MAX_VIDEO_BYTES)) return "El video puede pesar hasta 40 MB.";
  return null;
}

// Video que queda después de guardar: el nuevo si se subió uno, ninguno si se marcó quitar, o el que ya había.
async function nextVideo(formData: FormData, field: string, current: string) {
  const [video] = photosIn(formData, field);
  const next = video ? await saveUpload(video) : formData.get(`remove:${field}`) === "on" ? "" : current;
  if (next !== current) await deleteUpload(current);
  return next;
}

// Fotos que quedan, sin las marcadas para quitar y en el orden que indica el número de cada una.
function keptPhotos(formData: FormData, images: string[]) {
  const removed = new Set(formData.getAll("remove").map(String));
  const position = (image: string) => Number(formData.get(`order:${image}`)) || images.indexOf(image) + 1;
  return images.filter((image) => !removed.has(image)).sort((a, b) => position(a) - position(b));
}

// "S:5, M:3" → talles en orden y unidades de cada uno.
function parseStock(input: string) {
  const sizes: string[] = [];
  const stock: Record<string, number> = {};
  for (const part of input.split(",").map((item) => item.trim()).filter(Boolean)) {
    const match = part.match(/^(.+?)\s*[:=]\s*(\d+)$/);
    if (!match || sizes.includes(match[1])) return null;
    sizes.push(match[1]);
    stock[match[1]] = Number(match[2]);
  }
  return sizes.length ? { sizes, stock } : null;
}

const PRODUCT_FIELDS = ["name", "price", "compareAt", "color", "category", "collection", "family", "description", "stock", "isNew", "material", "care", "limited"] as const;

export async function saveProduct(_state: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };

  const outfit = [...new Set(formData.getAll("outfit").map(String))];
  const values: Record<string, string> = { ...textValues(formData, PRODUCT_FIELDS), outfit: outfit.join(",") };
  const price = Number(values.price);
  const compareAt = amount(values.compareAt);
  const parsed = parseStock(values.stock);
  const photos = photosIn(formData, "photos");
  const error = await mutateSite<string | null>(async (site) => {
    if (!values.name) return [null, "Falta el nombre."];
    if (!values.price || !validAmount(price)) return [null, "El precio tiene que ser un número."];
    if (!validAmount(compareAt)) return [null, "El precio anterior tiene que ser un número."];
    if (!site.categories.some((category) => category.slug === values.category)) return [null, "Elegí una categoría."];
    if (values.collection && !site.collections.some((collection) => collection.slug === values.collection)) return [null, "Esa colección ya no existe."];
    if (!parsed) return [null, "Cargá cada talle con su stock, por ejemplo: S:5, M:3, L:0."];
    const invalid = photoError(photos) ?? videoError(photosIn(formData, "video"));
    if (invalid) return [null, invalid];

    const originalSlug = text(formData, "originalSlug");
    const existing = site.products.find((product) => product.slug === originalSlug);
    if (originalSlug && !existing) return [null, "Ese producto ya no existe."];
    const kept = keptPhotos(formData, existing?.images ?? []);
    if (kept.length + photos.length === 0) return [null, "Subí al menos una foto."];
    if (kept.length + photos.length > MAX_PRODUCT_PHOTOS) return [null, `Hasta ${MAX_PRODUCT_PHOTOS} fotos por producto.`];

    const product: Product = {
      slug: existing?.slug ?? uniqueSlug(values.name, "producto", site.products.map((item) => item.slug)),
      name: values.name, color: values.color, price, compareAt, category: values.category, collection: values.collection,
      family: slugify(values.family), description: values.description, isNew: values.isNew === "on", ...parsed,
      material: values.material, care: values.care, limited: values.limited === "on",
      outfit: outfit.filter((slug) => slug !== existing?.slug && site.products.some((item) => item.slug === slug)),
      images: [...kept, ...await Promise.all(photos.map(saveUpload))],
      video: await nextVideo(formData, "video", existing?.video ?? ""),
    };
    await Promise.all((existing?.images ?? []).filter((image) => !kept.includes(image)).map(deleteUpload));
    return [{ ...site, products: existing ? site.products.map((item) => (item === existing ? product : item)) : [product, ...site.products] }, null];
  });
  if (error) return { error, values };

  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function deleteProduct(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  await mutateSite(async (site) => {
    const product = site.products.find((item) => item.slug === formData.get("slug"));
    if (!product) return [null, null];
    await Promise.all([...product.images, product.video].map(deleteUpload));
    return [{ ...site, products: site.products.filter((item) => item !== product) }, null];
  });
  revalidatePath("/", "layout");
}

export async function saveGroup(_state: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };

  const kind = text(formData, "kind");
  const name = text(formData, "name");
  if (!isGroupKind(kind)) return { error: "Tipo desconocido." };
  const key = GROUP_KINDS[kind].key;
  const photos = photosIn(formData, "image");
  const error = await mutateSite<string | null>(async (site) => {
    if (!name) return [null, "Falta el nombre."];
    const invalid = photoError(photos);
    if (invalid) return [null, invalid];
    const groups = site[key];
    const originalSlug = text(formData, "originalSlug");
    const existing = groups.find((group) => group.slug === originalSlug);
    if (originalSlug && !existing) return [null, "Ya no existe."];
    if (!existing && photos.length === 0) return [null, "Subí una foto."];

    // La dirección no cambia al editar, así los productos asignados siguen enlazados.
    const group: Group = {
      slug: existing?.slug ?? uniqueSlug(name, GROUP_KINDS[kind].one, groups.map((item) => item.slug)),
      name,
      image: photos[0] ? await saveUpload(photos[0]) : existing!.image,
      ...(key === "categories" ? { sizeGuide: text(formData, "sizeGuide"), sizeRules: text(formData, "sizeRules") } : {}),
    };
    if (existing && existing.image !== group.image) await deleteUpload(existing.image);
    return [{ ...site, [key]: existing ? groups.map((item) => (item === existing ? group : item)) : [...groups, group] }, null];
  });
  if (error) return { error, values: textValues(formData, ["name", "sizeGuide", "sizeRules"]) };

  revalidatePath("/", "layout");
  redirect(`/admin/${kind}`);
}

export async function deleteGroup(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const kind = text(formData, "kind");
  if (!isGroupKind(kind)) return;
  const key = GROUP_KINDS[kind].key;
  await mutateSite(async (site) => {
    const group = site[key].find((item) => item.slug === formData.get("slug"));
    if (!group) return [null, null];
    // Los productos de una colección borrada quedan sin colección; los de una categoría borrada conservan la suya hasta que se editen.
    const products = key === "collections" ? site.products.map((product) => (product.collection === group.slug ? { ...product, collection: "" } : product)) : site.products;
    await deleteUpload(group.image);
    return [{ ...site, products, [key]: site[key].filter((item) => item !== group) }, null];
  });
  revalidatePath("/", "layout");
}

// Sube o baja un lugar un producto, una categoría o una colección.
export async function moveItem(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const list = text(formData, "list");
  if (list !== "products" && list !== "categories" && list !== "collections") return;
  await mutateSite((site) => {
    const items: { slug: string }[] = [...site[list]];
    const from = items.findIndex((item) => item.slug === formData.get("slug"));
    const to = from + (formData.get("dir") === "up" ? -1 : 1);
    if (from < 0 || to < 0 || to >= items.length) return [null, null];
    [items[from], items[to]] = [items[to], items[from]];
    return [{ ...site, [list]: items } as Site, null];
  });
  revalidatePath("/", "layout");
}

const SETTINGS_TEXT = ["spotify", "promo", "heroTagline", "manifestoTitle", "manifestoText", "email", "dropTitle", "dropDate", "pickupNote", "shippingZones", "sizeGuide", "sizeRules", "dropCollection", "earlyCode", "aboutTitle", "aboutText", "shippingText", "termsText"] as const;
const SETTINGS_FIELDS = [...SETTINGS_TEXT, "whatsapp", "instagram", "shippingDefault", "freeShippingFrom", "pickup", "outfitDiscount", "earlyMinutes", "wheelEnabled", "showRecentSales"] as const;

export async function saveSettings(_state: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };

  const values = textValues(formData, SETTINGS_FIELDS);
  const shippingDefault = amount(values.shippingDefault);
  const freeShippingFrom = amount(values.freeShippingFrom);
  const outfitDiscount = amount(values.outfitDiscount);
  const earlyMinutes = amount(values.earlyMinutes);
  const heroPhotos = photosIn(formData, "heroImage");
  const lookbookPhotos = photosIn(formData, "lookbook");
  const error = await mutateSite<string | null>(async (site) => {
    const invalid = photoError([...heroPhotos, ...lookbookPhotos]) ?? videoError(photosIn(formData, "heroVideo"));
    if (invalid) return [null, invalid];
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return [null, "Revisá el email."];
    if (!validAmount(shippingDefault) || !validAmount(freeShippingFrom)) return [null, "Los costos de envío tienen que ser números."];
    if (values.dropDate && Number.isNaN(Date.parse(values.dropDate))) return [null, "Revisá la fecha del drop."];
    if (values.spotify && !spotifyEmbed(values.spotify)) return [null, "El enlace de Spotify no es válido. Copialo desde Compartir → Copiar enlace."];
    if (!validAmount(outfitDiscount) || outfitDiscount > 90) return [null, "El descuento por conjunto va de 0 a 90."];
    if (!validAmount(earlyMinutes)) return [null, "Los minutos de acceso anticipado tienen que ser un número."];
    if (values.dropCollection && !site.collections.some((collection) => collection.slug === values.dropCollection)) return [null, "La colección del drop ya no existe."];
    const kept = keptPhotos(formData, site.settings.lookbook);
    if (kept.length + lookbookPhotos.length > MAX_LOOKBOOK_PHOTOS) return [null, `Hasta ${MAX_LOOKBOOK_PHOTOS} fotos en el carrusel.`];

    const settings: Settings = {
      ...site.settings,
      ...textValues(formData, SETTINGS_TEXT),
      whatsapp: values.whatsapp.replace(/\D/g, ""),
      instagram: values.instagram.replace(/[^A-Za-z0-9._]/g, ""),
      shippingDefault, freeShippingFrom, outfitDiscount, earlyMinutes, pickup: values.pickup === "on",
      wheelEnabled: values.wheelEnabled === "on", showRecentSales: values.showRecentSales === "on",
      heroVideo: await nextVideo(formData, "heroVideo", site.settings.heroVideo),
      heroImage: heroPhotos[0] ? await saveUpload(heroPhotos[0]) : site.settings.heroImage,
      lookbook: [...kept, ...await Promise.all(lookbookPhotos.map(saveUpload))],
    };
    const stillUsed = new Set([settings.heroImage, ...settings.lookbook]);
    await Promise.all([site.settings.heroImage, ...site.settings.lookbook].filter((image) => !stillUsed.has(image)).map(deleteUpload));
    return [{ ...site, settings }, null];
  });
  if (error) return { error, values };

  revalidatePath("/", "layout");
  return { error: "", saved: true };
}

export async function saveCoupon(_state: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };
  const values = textValues(formData, ["code", "percent", "wheel"]);
  const code = values.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const percent = Number(values.percent);
  const error = await mutateSite<string | null>((site) => {
    if (code.length < 3) return [null, "El código necesita al menos 3 letras o números."];
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) return [null, "El descuento va de 1 a 100."];
    if (site.coupons.some((coupon) => coupon.code === code)) return [null, "Ese código ya existe."];
    return [{ ...site, coupons: [...site.coupons, { code, percent, wheel: values.wheel === "on" }] }, null];
  });
  if (error) return { error, values };
  revalidatePath("/admin/cupones");
  return { error: "", saved: true };
}

export async function deleteCoupon(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  await mutateSite((site) => [{ ...site, coupons: site.coupons.filter((coupon) => coupon.code !== formData.get("code")) }, null]);
  revalidatePath("/admin/cupones");
}

export async function updateOrder(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const status = text(formData, "status") as OrderStatus;
  const tracking = text(formData, "tracking").slice(0, 300);
  if (!ORDER_STATUSES.includes(status)) return;
  await mutateSite((site) => {
    const order = site.orders.find((item) => item.id === formData.get("id"));
    if (!order || (order.status === status && order.tracking === tracking)) return [null, null];
    // Cancelar devuelve las unidades al stock; reactivar un pedido cancelado las vuelve a descontar.
    const change = status === order.status ? 0 : status === "cancelado" ? 1 : order.status === "cancelado" ? -1 : 0;
    const products = change === 0 ? site.products : site.products.map((product) => {
      const stock = { ...product.stock };
      for (const item of order.items) if (item.slug === product.slug && item.size in stock) stock[item.size] = Math.max(0, stock[item.size] + change * item.qty);
      return { ...product, stock };
    });
    return [{ ...site, products, orders: site.orders.map((item) => (item === order ? { ...order, status, tracking } : item)) }, null];
  });
  revalidatePath("/", "layout");
}

export async function deleteSubscriber(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  await mutateSite((site) => [{ ...site, subscribers: site.subscribers.filter((subscriber) => subscriber.contact !== formData.get("contact")) }, null]);
  revalidatePath("/admin/pedidos");
}

export async function deleteRestock(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  const same = (item: Site["restock"][number]) => item.slug === formData.get("slug") && item.size === formData.get("size") && item.contact === formData.get("contact");
  await mutateSite((site) => [{ ...site, restock: site.restock.filter((item) => !same(item)) }, null]);
  revalidatePath("/admin/pedidos");
}

export async function saveCommunityPhoto(_state: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };
  const values = textValues(formData, ["slug", "caption"]);
  const photos = photosIn(formData, "image");
  const error = await mutateSite<string | null>(async (site) => {
    if (photos.length === 0) return [null, "Subí una foto."];
    const invalid = photoError(photos);
    if (invalid) return [null, invalid];
    if (values.slug && !site.products.some((product) => product.slug === values.slug)) return [null, "Ese producto ya no existe."];
    if (site.community.length >= 60) return [null, "Hasta 60 fotos. Borrá alguna para sumar otra."];
    const photo = { id: randomUUID(), image: await saveUpload(photos[0]), slug: values.slug, caption: values.caption.slice(0, 80) };
    return [{ ...site, community: [photo, ...site.community] }, null];
  });
  if (error) return { error, values };
  revalidatePath("/", "layout");
  return { error: "", saved: true };
}

export async function deleteCommunityPhoto(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  await mutateSite(async (site) => {
    const photo = site.community.find((item) => item.id === formData.get("id"));
    if (!photo) return [null, null];
    await deleteUpload(photo.image);
    return [{ ...site, community: site.community.filter((item) => item !== photo) }, null];
  });
  revalidatePath("/", "layout");
}

export async function saveLook(_state: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };
  const photos = photosIn(formData, "image");
  const result = await mutateSite<{ error: string } | { id: string }>(async (site) => {
    if (photos.length === 0) return [null, { error: "Subí una foto." }];
    const invalid = photoError(photos);
    if (invalid) return [null, { error: invalid }];
    if (site.looks.length >= 30) return [null, { error: "Hasta 30 fotos en el lookbook." }];
    const look = { id: randomUUID(), image: await saveUpload(photos[0]), spots: [] };
    return [{ ...site, looks: [...site.looks, look] }, { id: look.id }];
  });
  if ("error" in result) return result;
  revalidatePath("/", "layout");
  redirect(`/admin/lookbook/${result.id}`);
}

export async function saveLookSpots(_state: FormState, formData: FormData): Promise<FormState> {
  if (!(await isAdmin())) return { error: SESSION_EXPIRED };
  let spots: { x: number; y: number; slug: string }[];
  try {
    const raw: unknown = JSON.parse(String(formData.get("spots") ?? "[]"));
    if (!Array.isArray(raw) || raw.length > 12) throw new Error();
    spots = raw.map((spot) => ({ x: Number(spot?.x), y: Number(spot?.y), slug: String(spot?.slug ?? "") }));
    if (spots.some((spot) => !(spot.x >= 0 && spot.x <= 100 && spot.y >= 0 && spot.y <= 100))) throw new Error();
  } catch {
    return { error: "No se pudieron leer los puntos (máximo 12)." };
  }
  const error = await mutateSite<string | null>((site) => {
    const look = site.looks.find((item) => item.id === formData.get("id"));
    if (!look) return [null, "Esa foto ya no existe."];
    if (spots.some((spot) => !site.products.some((product) => product.slug === spot.slug))) return [null, "Uno de los puntos apunta a una prenda que ya no existe."];
    return [{ ...site, looks: site.looks.map((item) => (item === look ? { ...look, spots } : item)) }, null];
  });
  if (error) return { error };
  revalidatePath("/", "layout");
  return { error: "", saved: true };
}

export async function deleteLook(formData: FormData) {
  if (!(await isAdmin())) redirect("/admin");
  await mutateSite(async (site) => {
    const look = site.looks.find((item) => item.id === formData.get("id"));
    if (!look) return [null, null];
    await deleteUpload(look.image);
    return [{ ...site, looks: site.looks.filter((item) => item !== look) }, null];
  });
  revalidatePath("/", "layout");
}
