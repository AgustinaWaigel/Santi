import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { seedSite, type Order, type Product, type Site } from "@/data/products";

const DATA_DIR = path.join(process.cwd(), "data");
const SITE_FILE = path.join(DATA_DIR, "site.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export const UPLOAD_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
export const VIDEO_TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm" };
const UPLOAD_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp|avif|mp4|webm)$/;

// Hasta el primer guardado desde el admin se muestra el contenido inicial.
export async function getSite(): Promise<Site> {
  try {
    const saved = JSON.parse(await readFile(SITE_FILE, "utf8"));
    // Lo guardado antes de sumar un campo nuevo se completa con valores neutros.
    const products = (saved.products ?? seedSite.products).map((product: Partial<Product>) => ({ collection: "", stock: {}, compareAt: 0, isNew: false, family: "", material: "", care: "", limited: false, outfit: [], video: "", ...product }));
    const orders = (saved.orders ?? []).map((order: Partial<Order>) => ({ bundleDiscount: 0, tracking: "", ...order }));
    return { ...seedSite, ...saved, products, orders, settings: { ...seedSite.settings, ...saved.settings } };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return seedSite;
    throw error;
  }
}

let queue: Promise<unknown> = Promise.resolve();

// Lee, modifica y guarda de a un cambio por vez, para que dos pedidos simultáneos no se pisen.
// `change` devuelve el sitio nuevo (o null para no guardar) y el resultado para quien llama.
export function mutateSite<T>(change: (site: Site) => Promise<[Site | null, T]> | [Site | null, T]): Promise<T> {
  const run = queue.then(async () => {
    const [next, result] = await change(await getSite());
    if (next) {
      await mkdir(DATA_DIR, { recursive: true });
      // Se escribe aparte y se renombra: un corte a mitad de escritura no deja el archivo roto.
      await writeFile(`${SITE_FILE}.tmp`, JSON.stringify(next, null, 2));
      await rename(`${SITE_FILE}.tmp`, SITE_FILE);
    }
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export async function saveUpload(file: File) {
  const name = `${randomUUID()}.${UPLOAD_TYPES[file.type] ?? VIDEO_TYPES[file.type]}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${name}`;
}

export async function readUpload(name: string) {
  if (!UPLOAD_NAME.test(name)) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR, name));
  } catch {
    return null;
  }
}

export async function deleteUpload(url: string) {
  const name = url.replace(/^\/uploads\//, "");
  if (!url.startsWith("/uploads/") || !UPLOAD_NAME.test(name)) return;
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}
