import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { seedSite, type Order, type Product, type Site } from "@/data/products";

// Dos lugares posibles para el contenido: Supabase si están cargadas sus credenciales, o la carpeta `data/` del proyecto.
// En Supabase todo el sitio vive en una fila de la tabla `site` y las fotos y videos en el bucket `uploads` (ver supabase/schema.sql).
const DATA_DIR = path.join(process.cwd(), "data");
const SITE_FILE = path.join(DATA_DIR, "site.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const TABLE = "site";
const ROW = "main";
const BUCKET = "uploads";

export const UPLOAD_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif" };
export const VIDEO_TYPES: Record<string, string> = { "video/mp4": "mp4", "video/webm": "webm" };
const UPLOAD_NAME = /^[0-9a-f-]{36}\.(jpg|png|webp|avif|mp4|webm)$/;

export const supabaseConfigured = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let client: SupabaseClient | null = null;
// La clave de servicio saltea las reglas de acceso de las tablas: solo se usa acá, del lado del servidor.
function supabase() {
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

const fail = (step: string, message: string) => new Error(`Supabase (${step}): ${message}. Revisá SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY y que hayas corrido supabase/schema.sql.`);

// Lo guardado antes de sumar un campo nuevo se completa con valores neutros.
function complete(saved: Partial<Site>): Site {
  const products = (saved.products ?? seedSite.products).map((product: Partial<Product>) => ({ collection: "", stock: {}, compareAt: 0, isNew: false, family: "", material: "", care: "", limited: false, outfit: [], video: "", ...product })) as Product[];
  const orders = (saved.orders ?? []).map((order: Partial<Order>) => ({ bundleDiscount: 0, tracking: "", ...order })) as Order[];
  return { ...seedSite, ...saved, products, orders, settings: { ...seedSite.settings, ...saved.settings } };
}

// Fila guardada en Supabase, con su número de versión; null si todavía no se guardó nada.
async function readRow(): Promise<{ data: Partial<Site>; version: number } | null> {
  const { data, error } = await supabase().from(TABLE).select("data, version").eq("id", ROW).maybeSingle();
  if (error) throw fail("leer", error.message);
  return data;
}

// Hasta el primer guardado desde el admin se muestra el contenido inicial.
export async function getSite(): Promise<Site> {
  if (supabaseConfigured()) {
    const row = await readRow();
    return row ? complete(row.data) : seedSite;
  }
  try {
    return complete(JSON.parse(await readFile(SITE_FILE, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return seedSite;
    throw error;
  }
}

type Change<T> = (site: Site) => Promise<[Site | null, T]> | [Site | null, T];

// Guarda solo si nadie modificó la fila desde que se leyó (misma versión); si otro servidor se adelantó, vuelve a leer y reintenta.
async function mutateRemote<T>(change: Change<T>): Promise<T> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const row = await readRow();
    const [next, result] = await change(row ? complete(row.data) : seedSite);
    if (!next) return result;
    if (!row) {
      const { error } = await supabase().from(TABLE).insert({ id: ROW, data: next, version: 1 });
      if (!error) return result;
      // 23505: otro servidor creó la fila en el medio.
      if (error.code !== "23505") throw fail("crear", error.message);
    } else {
      const { data, error } = await supabase().from(TABLE).update({ data: next, version: row.version + 1 }).eq("id", ROW).eq("version", row.version).select("version");
      if (error) throw fail("guardar", error.message);
      if (data.length > 0) return result;
    }
  }
  throw new Error("No se pudo guardar: hubo demasiados cambios al mismo tiempo. Probá de nuevo.");
}

async function mutateLocal<T>(change: Change<T>): Promise<T> {
  const [next, result] = await change(await getSite());
  if (next) {
    await mkdir(DATA_DIR, { recursive: true });
    // Se escribe aparte y se renombra: un corte a mitad de escritura no deja el archivo roto.
    await writeFile(`${SITE_FILE}.tmp`, JSON.stringify(next, null, 2));
    await rename(`${SITE_FILE}.tmp`, SITE_FILE);
  }
  return result;
}

let queue: Promise<unknown> = Promise.resolve();

// Lee, modifica y guarda de a un cambio por vez, para que dos pedidos simultáneos no se pisen.
// `change` devuelve el sitio nuevo (o null para no guardar) y el resultado para quien llama.
export function mutateSite<T>(change: Change<T>): Promise<T> {
  const run = queue.then(() => (supabaseConfigured() ? mutateRemote(change) : mutateLocal(change)));
  queue = run.catch(() => {});
  return run;
}

// Las fotos y videos conservan la misma dirección (/uploads/nombre) en los dos modos; la ruta /uploads resuelve dónde están.
export async function saveUpload(file: File) {
  const name = `${randomUUID()}.${UPLOAD_TYPES[file.type] ?? VIDEO_TYPES[file.type]}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  if (supabaseConfigured()) {
    const { error } = await supabase().storage.from(BUCKET).upload(name, bytes, { contentType: file.type, cacheControl: "31536000" });
    if (error) throw fail("subir archivo", error.message);
  } else {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, name), bytes);
  }
  return `/uploads/${name}`;
}

export const validUploadName = (name: string) => UPLOAD_NAME.test(name);

// Dirección pública del archivo en Supabase.
export const remoteUploadUrl = (name: string) => supabase().storage.from(BUCKET).getPublicUrl(name).data.publicUrl;

export async function readUpload(name: string) {
  if (!validUploadName(name)) return null;
  try {
    return await readFile(path.join(UPLOAD_DIR, name));
  } catch {
    return null;
  }
}

export async function deleteUpload(url: string) {
  const name = url.replace(/^\/uploads\//, "");
  if (!url.startsWith("/uploads/") || !validUploadName(name)) return;
  if (supabaseConfigured()) await supabase().storage.from(BUCKET).remove([name]);
  else await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}
