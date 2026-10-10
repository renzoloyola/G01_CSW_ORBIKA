-- Ejecutar después de 001 y 002. La transacción preserva el esquema si falla.
begin;

alter table public.perfiles add column activo boolean not null default true;
alter table public.productos add column estado_publicacion text not null default 'publicado'
  check (estado_publicacion in ('publicado', 'retirado'));
update public.productos set estado_publicacion = 'retirado' where estado = 'no_disponible';
alter table public.pedidos drop constraint pedidos_estado_check;
alter table public.pedidos add constraint pedidos_estado_check
  check (estado in ('creado','preparando','listo_para_entrega','entregado','completado','cancelado'));
alter table public.pedidos add column clave_idempotencia uuid;
create unique index pedidos_confirmacion_unica on public.pedidos(comprador_id, clave_idempotencia);

-- D05: un producto por detalle, un único detalle por compra. No se inventan
-- el precio original ni el peso de las compras antiguas: se dejan desconocidos.
alter table public.detalle_pedidos add column producto_id bigint references public.productos(id);
alter table public.detalle_pedidos add column precio_original_compra numeric(10,2);
alter table public.detalle_pedidos add column peso_unidad_kg_compra numeric(6,2);
alter table public.detalle_pedidos add column nombre_producto_compra text;
update public.detalle_pedidos d set producto_id = p.producto_id
  from public.pedidos p where p.id = d.pedido_id;
insert into public.detalle_pedidos(pedido_id, producto_id, cantidad, precio_unitario, subtotal)
select p.id, p.producto_id, p.cantidad, p.monto_total / p.cantidad, p.monto_total
from public.pedidos p where not exists (select 1 from public.detalle_pedidos d where d.pedido_id = p.id);
alter table public.detalle_pedidos alter column producto_id set not null;
alter table public.detalle_pedidos add constraint detalle_pedido_unico unique(pedido_id);
alter table public.detalle_pedidos add constraint historico_precio_valido
  check (precio_original_compra is null or precio_original_compra >= precio_unitario);
alter table public.detalle_pedidos add constraint historico_peso_valido
  check (peso_unidad_kg_compra is null or peso_unidad_kg_compra > 0);
create index detalle_pedidos_producto on public.detalle_pedidos(producto_id);

drop policy "Pedidos: comprador y vendedor del producto los ven" on public.pedidos;
-- La función evita recursión entre las políticas de pedidos y detalle_pedidos.
create function public.puede_ver_pedido(p_id bigint)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pedidos p where p.id = p_id and (
      p.comprador_id = auth.uid() or exists (
        select 1 from public.detalle_pedidos d join public.productos pr on pr.id = d.producto_id
        where d.pedido_id = p.id and pr.vendedor_id = auth.uid()
      )
    )
  );
$$;
revoke all on function public.puede_ver_pedido(bigint) from public, anon;
grant execute on function public.puede_ver_pedido(bigint) to authenticated;
create policy "Pedidos: participantes leen" on public.pedidos for select
  to authenticated using (public.puede_ver_pedido(id));
create policy "Detalles: participantes leen" on public.detalle_pedidos for select
  to authenticated using (public.puede_ver_pedido(pedido_id));

drop function public.crear_pedido_transaccion(bigint, uuid, int, text, text);
drop function public.cancelar_pedido_transaccion(bigint, uuid, text);
alter table public.pedidos drop column producto_id;

create or replace function public.proteger_rol_perfil()
returns trigger language plpgsql set search_path = public as $$
begin
  if (new.rol is distinct from old.rol or new.activo is distinct from old.activo
      or new.plan_premium is distinct from old.plan_premium)
     and coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres','supabase_admin') then
    raise exception 'No puedes modificar permisos, estado o premium de tu perfil';
  end if;
  return new;
end;
$$;

create function public.validar_publicacion()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_activo boolean; v_categoria boolean; v_hoy date := (now() at time zone 'America/Lima')::date;
begin
  if tg_op = 'UPDATE' and (new.categoria_id is distinct from old.categoria_id
       or new.fecha_vencimiento is distinct from old.fecha_vencimiento
       or new.peso_unidad_kg is distinct from old.peso_unidad_kg) then
    raise exception 'La categoría, el vencimiento y el peso requieren una nueva publicación';
  end if;
  select activo into v_activo from public.perfiles where id = new.vendedor_id and rol = 'vendedor';
  select activa into v_categoria from public.categorias where id = new.categoria_id;
  if tg_op = 'INSERT' and (v_activo is distinct from true or v_categoria is distinct from true
      or new.fecha_vencimiento <= v_hoy or new.stock <= 0) then
    raise exception 'Vendedor, categoría, vencimiento o stock no habilitados para publicar';
  end if;
  if new.estado_publicacion = 'retirado' or v_activo is distinct from true
     or v_categoria is distinct from true or new.fecha_vencimiento <= v_hoy then
    new.estado := 'no_disponible';
  elsif new.stock = 0 then new.estado := 'vendido';
  elsif new.fecha_vencimiento <= v_hoy + 3 then new.estado := 'proximo_a_vencer';
  else new.estado := 'disponible';
  end if;
  return new;
end;
$$;
create trigger validar_publicacion before insert or update on public.productos
  for each row execute function public.validar_publicacion();

-- Mantiene la disponibilidad correcta aunque el día cambie sin un UPDATE.
-- El servicio consulta esta vista; los precios nunca cambian por la fecha.
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
  round(100 * (p.precio_original - p.precio_actual) / p.precio_original)::int as descuento_pct,
  p.estado_publicacion
from public.productos p;

-- El navegador no modifica productos directamente: todas las escrituras
-- pasan por validación, autorización y control de concurrencia del backend.
drop policy "Productos: solo vendedores publican" on public.productos;
drop policy "Productos: solo el vendedor dueño actualiza" on public.productos;
revoke insert, update, delete on public.productos from anon, authenticated;

create function public.crear_pedido_transaccion(
  p_producto_id bigint, p_comprador_id uuid, p_cantidad int,
  p_modalidad_entrega text, p_referencia_entrega text, p_clave_idempotencia uuid
)
returns public.pedidos language plpgsql security definer set search_path = public as $$
declare
  v_producto public.productos%rowtype;
  v_pedido public.pedidos%rowtype;
  v_detalle public.detalle_pedidos%rowtype;
  v_hoy date := (now() at time zone 'America/Lima')::date;
begin
  if p_clave_idempotencia is null or p_cantidad is null or p_cantidad <= 0 then
    raise exception 'Confirmación o cantidad inválida';
  end if;
  -- Serializa reintentos de la misma confirmación, incluidos los concurrentes.
  perform pg_advisory_xact_lock(hashtextextended(p_comprador_id::text || p_clave_idempotencia::text, 0));
  select * into v_pedido from public.pedidos
    where comprador_id = p_comprador_id and clave_idempotencia = p_clave_idempotencia;
  if found then
    select * into v_detalle from public.detalle_pedidos where pedido_id = v_pedido.id;
    if v_detalle.producto_id <> p_producto_id or v_detalle.cantidad <> p_cantidad
       or v_pedido.modalidad_entrega is distinct from p_modalidad_entrega
       or v_pedido.referencia_entrega is distinct from nullif(trim(p_referencia_entrega),'') then
      raise exception 'La confirmación ya fue usada con otros datos';
    end if;
    return v_pedido;
  end if;
  if not exists (select 1 from public.perfiles where id=p_comprador_id and rol='comprador' and activo) then
    raise exception 'La cuenta no está habilitada para comprar';
  end if;
  select * into v_producto from public.productos where id=p_producto_id for update;
  if not found then raise exception 'Producto no encontrado'; end if;
  if v_producto.vendedor_id = p_comprador_id then raise exception 'No puedes comprar tu propio producto'; end if;
  if v_producto.estado_publicacion <> 'publicado' or v_producto.stock < p_cantidad
      or v_producto.fecha_vencimiento <= v_hoy
      or not exists (select 1 from public.categorias where id=v_producto.categoria_id and activa)
      or not exists (select 1 from public.perfiles where id=v_producto.vendedor_id and activo and rol='vendedor') then
    raise exception 'Producto no disponible, vencido o sin stock suficiente';
  end if;
  if p_modalidad_entrega is null or p_modalidad_entrega not in ('recojo','coordinada')
      or (v_producto.modalidad_entrega <> 'ambas' and v_producto.modalidad_entrega <> p_modalidad_entrega) then
    raise exception 'Modalidad de entrega no disponible';
  end if;
  if p_modalidad_entrega = 'coordinada' and nullif(trim(p_referencia_entrega),'') is null then
    raise exception 'La referencia de entrega es obligatoria';
  end if;
  insert into public.pedidos(comprador_id, cantidad, monto_total, modalidad_entrega,
    referencia_entrega, clave_idempotencia)
  values(p_comprador_id, p_cantidad, v_producto.precio_actual*p_cantidad, p_modalidad_entrega,
    nullif(trim(p_referencia_entrega),''), p_clave_idempotencia) returning * into v_pedido;
  insert into public.detalle_pedidos(pedido_id, producto_id, cantidad, precio_unitario, subtotal,
    precio_original_compra, peso_unidad_kg_compra, nombre_producto_compra)
  values(v_pedido.id, v_producto.id, p_cantidad, v_producto.precio_actual,
    v_producto.precio_actual*p_cantidad, v_producto.precio_original,
    v_producto.peso_unidad_kg, v_producto.nombre);
  update public.productos set stock=stock-p_cantidad where id=v_producto.id;
  insert into public.notificaciones(usuario_id, mensaje, enlace_destino)
    values(v_producto.vendedor_id, 'Nuevo pedido recibido por ' || v_producto.nombre, '/mis-pedidos');
  return v_pedido;
end;
$$;

create function public.cancelar_pedido_transaccion(p_pedido_id bigint, p_comprador_id uuid, p_motivo text)
returns public.pedidos language plpgsql security definer set search_path = public as $$
declare v_pedido public.pedidos%rowtype; v_detalle public.detalle_pedidos%rowtype; v_vendedor uuid;
begin
  select * into v_pedido from public.pedidos where id=p_pedido_id for update;
  if not found then raise exception 'Pedido no encontrado'; end if;
  if v_pedido.comprador_id <> p_comprador_id then raise exception 'Este pedido no te pertenece'; end if;
  if v_pedido.estado = 'cancelado' then return v_pedido; end if;
  if v_pedido.estado not in ('creado','preparando') then raise exception 'Este pedido ya no puede cancelarse'; end if;
  if nullif(trim(p_motivo),'') is null then raise exception 'El motivo de cancelación es obligatorio'; end if;
  select * into strict v_detalle from public.detalle_pedidos where pedido_id=v_pedido.id;
  update public.pedidos set estado='cancelado', motivo_cancelacion=trim(p_motivo), fecha_cancelacion=now()
    where id=v_pedido.id returning * into v_pedido;
  update public.productos set stock=stock+v_detalle.cantidad where id=v_detalle.producto_id
    returning vendedor_id into v_vendedor;
  insert into public.notificaciones(usuario_id, mensaje, enlace_destino)
    values(v_vendedor, 'Pedido N.° ' || v_pedido.id || ' cancelado por el comprador', '/mis-pedidos');
  return v_pedido;
end;
$$;

revoke all on function public.crear_pedido_transaccion(bigint, uuid, int, text, text, uuid) from public, anon, authenticated;
revoke all on function public.cancelar_pedido_transaccion(bigint, uuid, text) from public, anon, authenticated;
grant execute on function public.crear_pedido_transaccion(bigint, uuid, int, text, text, uuid) to service_role;
grant execute on function public.cancelar_pedido_transaccion(bigint, uuid, text) to service_role;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values('orbika-productos','orbika-productos',true,5242880,array['image/jpeg','image/png'])
on conflict(id) do update set public=excluded.public, file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- Actualiza las relaciones y firmas RPC en PostgREST tras el cambio de esquema.
notify pgrst, 'reload schema';
commit;
