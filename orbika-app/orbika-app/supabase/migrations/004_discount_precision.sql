-- Ejecutar después de 003. Conserva la vista, sus permisos y dependencias.
begin;

-- PostgreSQL no permite cambiar el tipo de una columna con CREATE OR REPLACE
-- VIEW. Se conserva la columna entera para dependencias previas y se añade el
-- descuento decimal con el nombre que ya consumen la API y el catálogo.
alter view public.productos_con_descuento
  rename column descuento_pct to descuento_pct_entero;

create or replace view public.productos_con_descuento with (security_invoker = true) as
select p.id, p.vendedor_id, p.categoria_id, p.nombre, p.descripcion,
  p.precio_original, p.precio_actual, p.fecha_vencimiento,
  case when p.estado_publicacion <> 'publicado' or p.stock <= 0
      or p.fecha_vencimiento <= (now() at time zone 'America/Lima')::date
      or not exists (select 1 from public.categorias c where c.id=p.categoria_id and c.activa)
      or not exists (select 1 from public.perfiles u where u.id=p.vendedor_id and u.activo and u.rol='vendedor')
    then 'no_disponible'
    when p.fecha_vencimiento <= (now() at time zone 'America/Lima')::date + 3 then 'proximo_a_vencer'
    else 'disponible' end as estado,
  p.stock, p.peso_unidad_kg, p.zona, p.modalidad_entrega, p.foto_url, p.creado_en,
  round(100 * (p.precio_original - p.precio_actual) / p.precio_original)::int as descuento_pct_entero,
  p.estado_publicacion,
  round(100 * (p.precio_original - p.precio_actual) / p.precio_original, 1) as descuento_pct
from public.productos p;

notify pgrst, 'reload schema';
commit;
