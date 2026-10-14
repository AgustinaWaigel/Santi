// Copia a Supabase lo que hoy está en la carpeta data/: el contenido del sitio y las fotos y videos subidos.
// Uso, desde la raíz del proyecto y después de correr supabase/schema.sql:
//   node --env-file=.env.local scripts/migrar-a-supabase.mjs
// No borra nada local. Si en Supabase ya hay contenido guardado, no lo pisa salvo que agregues --pisar.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Faltan SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.");
  process.exit(1);
}

const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif", mp4: "video/mp4", webm: "video/webm" };
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const stop = (step, error) => { console.error(`No se pudo ${step}: ${error.message}`); process.exit(1); };

const existing = await supabase.from("site").select("version").eq("id", "main").maybeSingle();
if (existing.error) stop("leer la tabla site (¿corriste supabase/schema.sql?)", existing.error);
if (existing.data && !process.argv.includes("--pisar")) {
  console.error("En Supabase ya hay contenido guardado. Para reemplazarlo con el local, volvé a correr con --pisar.");
  process.exit(1);
}

let site = null;
try {
  site = JSON.parse(await readFile(path.join("data", "site.json"), "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  console.log("No hay data/site.json: el sitio todavía usa el contenido inicial, no hay nada que copiar.");
}

const files = await readdir(path.join("data", "uploads")).catch(() => []);
for (const name of files) {
  const type = TYPES[name.split(".").pop()];
  if (!type) continue;
  const { error } = await supabase.storage.from("uploads").upload(name, await readFile(path.join("data", "uploads", name)), { contentType: type, cacheControl: "31536000", upsert: true });
  if (error) stop(`subir ${name}`, error);
  console.log(`Subido ${name}`);
}

if (site) {
  const { error } = await supabase.from("site").upsert({ id: "main", data: site, version: (existing.data?.version ?? 0) + 1 });
  if (error) stop("guardar el contenido", error);
  console.log(`Contenido copiado: ${site.products?.length ?? 0} productos, ${site.orders?.length ?? 0} pedidos.`);
}
console.log(`Listo. ${files.length} archivos revisados.`);
