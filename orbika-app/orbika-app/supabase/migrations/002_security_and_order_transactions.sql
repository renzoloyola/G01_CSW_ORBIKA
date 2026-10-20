-- ÓrbiKa: endurecimiento de roles y operaciones transaccionales.

create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre, correo, rol, telefono, nombre_negocio, ubicacion)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'nombre'), ''), split_part(new.email, '@', 1)),
    new.email,
    case when new.raw_user_meta_data->>'rol' = 'vendedor' then 'vendedor' else 'comprador' end,
    nullif(trim(new.raw_user_meta_data->>'telefono'), ''),
    nullif(trim(new.raw_user_meta_data->>'nombre_negocio'), ''),
    nullif(trim(new.raw_user_meta_data->>'ubicacion'), '')
  )
  on conflict (id) do update set
    nombre = excluded.nombre,
    correo = excluded.correo,
    telefono = excluded.telefono,
    nombre_negocio = coalesce(public.perfiles.nombre_negocio, excluded.nombre_negocio),
    ubicacion = coalesce(public.perfiles.ubicacion, excluded.ubicacion);
  return new;
end;
$$;

create or replace function public.proteger_rol_perfil()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.rol is distinct from old.rol
     and coalesce(auth.role(), '') <> 'service_role'
     and current_user not in ('postgres', 'supabase_admin') then
    raise exception 'No puedes modificar el rol de tu perfil';
  end if;
  return new;
end;
$$;

drop trigger if exists proteger_rol_perfil on public.perfiles;
create trigger proteger_rol_perfil
  before update on public.perfiles
  for each row execute procedure public.proteger_rol_perfil();

drop policy if exists "Perfiles: cada quien ve y edita el suyo" on public.perfiles;
create policy "Perfiles: cada quien ve el suyo"
  on public.perfiles for select
  using (auth.uid() = id);
create policy "Perfiles: cada quien actualiza el suyo"
  on public.perfiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Productos: el vendedor publica y edita los suyos" on public.productos;
drop policy if exists "Productos: el vendedor actualiza los suyos" on public.productos;

create policy "Productos: solo vendedores publican"
  on public.productos for insert
  with check (
    auth.uid() = vendedor_id
    and exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'vendedor'
    )
  );

create policy "Productos: solo el vendedor dueño actualiza"
  on public.productos for update
  using (
    auth.uid() = vendedor_id
    and exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'vendedor'
    )
  )
  with check (
    auth.uid() = vendedor_id
    and exists (
      select 1 from public.perfiles
      where id = auth.uid() and rol = 'vendedor'
    )
  );

create or replace function public.crear_pedido_transaccion(
  p_producto_id bigint,
  p_comprador_id uuid,
  p_cantidad int,
  p_modalidad_entrega text,
  p_referencia_entrega text
)
returns public.pedidos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto public.productos%rowtype;
  v_pedido public.pedidos%rowtype;
  v_rol text;
begin
  if p_cantidad is null or p_cantidad <= 0 then
    raise exception 'Cantidad inválida';
  end if;

  select rol into v_rol from public.perfiles where id = p_comprador_id;
  if v_rol is distinct from 'comprador' then
    raise exception 'Solo un comprador puede crear pedidos';
  end if;

  select * into v_producto
  from public.productos
  where id = p_producto_id
  for update;

  if v_producto.id is null then
    raise exception 'Producto no encontrado';
  end if;
  if v_producto.vendedor_id = p_comprador_id then
    raise exception 'No puedes comprar tu propio producto';
  end if;
  if v_producto.estado not in ('disponible','proximo_a_vencer') or v_producto.stock < p_cantidad then
    raise exception 'Producto no disponible o stock insuficiente';
  end if;
  if v_producto.fecha_vencimiento < current_date then
    raise exception 'El producto está vencido';
  end if;
  if p_modalidad_entrega not in ('recojo','coordinada') then
    raise exception 'Modalidad de entrega inválida';
  end if;
  if v_producto.modalidad_entrega <> 'ambas' and v_producto.modalidad_entrega <> p_modalidad_entrega then
    raise exception 'Modalidad de entrega no disponible';
  end if;
  if p_modalidad_entrega = 'coordinada' and nullif(trim(p_referencia_entrega), '') is null then
    raise exception 'La referencia de entrega es obligatoria';
  end if;

  insert into public.pedidos (
    comprador_id, producto_id, cantidad, monto_total,
    modalidad_entrega, referencia_entrega, estado
  ) values (
    p_comprador_id, p_producto_id, p_cantidad,
    v_producto.precio_actual * p_cantidad,
    p_modalidad_entrega, nullif(trim(p_referencia_entrega), ''), 'creado'
  ) returning * into v_pedido;

  insert into public.detalle_pedidos (pedido_id, cantidad, precio_unitario, subtotal)
  values (v_pedido.id, p_cantidad, v_producto.precio_actual, v_producto.precio_actual * p_cantidad);

  update public.productos
  set stock = stock - p_cantidad,
      estado = case when stock - p_cantidad = 0 then 'vendido' else estado end
  where id = p_producto_id;

  insert into public.notificaciones (usuario_id, mensaje, enlace_destino)
  values (v_producto.vendedor_id, 'Nuevo pedido recibido por ' || v_producto.nombre, '/mis-pedidos');

  return v_pedido;
end;
$$;

create or replace function public.cancelar_pedido_transaccion(
  p_pedido_id bigint,
  p_comprador_id uuid,
  p_motivo text
)
returns public.pedidos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pedido public.pedidos%rowtype;
begin
  select * into v_pedido
  from public.pedidos
  where id = p_pedido_id
  for update;

  if v_pedido.id is null then
    raise exception 'Pedido no encontrado';
  end if;
  if v_pedido.comprador_id <> p_comprador_id then
    raise exception 'No tienes permiso para cancelar este pedido';
  end if;
  if v_pedido.estado not in ('creado','preparando') then
    raise exception 'Este pedido ya no puede cancelarse';
  end if;
  if nullif(trim(p_motivo), '') is null then
    raise exception 'El motivo de cancelación es obligatorio';
  end if;

  update public.pedidos
  set estado = 'cancelado',
      motivo_cancelacion = trim(p_motivo),
      fecha_cancelacion = now()
  where id = p_pedido_id
  returning * into v_pedido;

  update public.productos
  set stock = stock + v_pedido.cantidad,
      estado = case when estado = 'vendido' then 'disponible' else estado end
  where id = v_pedido.producto_id;

  return v_pedido;
end;
$$;

revoke all on function public.crear_pedido_transaccion(bigint, uuid, int, text, text)
  from public, anon, authenticated;
revoke all on function public.cancelar_pedido_transaccion(bigint, uuid, text)
  from public, anon, authenticated;
revoke all on function public.incrementar_stock(bigint, int)
  from public, anon, authenticated;

grant execute on function public.crear_pedido_transaccion(bigint, uuid, int, text, text)
  to service_role;
grant execute on function public.cancelar_pedido_transaccion(bigint, uuid, text)
  to service_role;

-- Impide pedidos duplicados accidentales durante reintentos inmediatos del cliente.
create index if not exists idx_pedidos_estado on public.pedidos(estado);
