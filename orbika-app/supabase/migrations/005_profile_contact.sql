begin;
-- Datos opcionales para el perfil. El rol y la identidad conservan sus reglas actuales.
alter table public.perfiles add column direccion text;
alter table public.perfiles add column foto_url text;
-- Bucket público para servir las fotos que la API guarda en carpetas por usuario.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('orbika-perfiles','orbika-perfiles',true,5242880,array['image/jpeg','image/png'])
on conflict(id) do nothing;
notify pgrst, 'reload schema';
commit;
