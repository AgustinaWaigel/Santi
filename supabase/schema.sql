-- Blackfit en Supabase. Pegá todo esto en el SQL Editor del proyecto y ejecutalo una vez.
-- Se puede volver a correr sin romper nada.

-- Todo el contenido del sitio (productos, pedidos, ajustes) vive en una sola fila.
-- `version` evita que dos guardados simultáneos se pisen.
create table if not exists public.site (
  id text primary key,
  data jsonb not null,
  version bigint not null default 1
);

-- Sin políticas: nadie puede leer ni escribir con la clave pública.
-- El sitio accede solo desde el servidor, con la clave de servicio (service_role).
alter table public.site enable row level security;

-- Fotos y videos subidos desde el admin. Público para lectura; la escritura también pasa por la clave de servicio.
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do update set public = true;

-- Avisa a la API que hay una tabla nueva, para que la reconozca enseguida.
notify pgrst, 'reload schema';
