-- Categorías iniciales (ver mockup / SRS, sección de catálogo)
insert into public.categorias (nombre) values
  ('Frutas y verduras'),
  ('Panadería'),
  ('Lácteos'),
  ('Carnes'),
  ('Alimentos preparados'),
  ('Otros')
on conflict (nombre) do nothing;
