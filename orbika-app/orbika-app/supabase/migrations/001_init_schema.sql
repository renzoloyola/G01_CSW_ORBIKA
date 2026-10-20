-- ============================================================
-- ÓrbiKa — Esquema inicial de base de datos (Supabase/PostgreSQL)
-- Corresponde al Diagrama Entidad-Relación del SRS (sección V.3.c)
-- ============================================================

-- ---------- Extensiones ----------
create extension if not exists "pgcrypto";

-- ---------- Tabla: perfiles ----------
-- Extiende auth.users (gestionada por Supabase Auth) con los datos
-- propios de ÓrbiKa: rol, teléfono y, si es vendedor, su negocio.
create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  correo text not null,
  rol text not null check (rol in ('comprador','vendedor','administrador')),
  telefono text,
  nombre_negocio text,
  ubicacion text,
  plan_premium boolean not null default false,
  creado_en timestamptz not null default now()
);

-- Crea automáticamente el perfil cuando alguien se registra en Supabase Auth.
-- El rol y el nombre llegan en user_metadata desde el formulario de registro (CU-01).
create or replace function public.manejar_nuevo_usuario()
returns trigger as $$
begin
  insert into public.perfiles (id, nombre, correo, rol, telefono)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'rol', 'comprador'),
    new.raw_user_meta_data->>'telefono'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute procedure public.manejar_nuevo_usuario();

-- ---------- Tabla: categorias ----------
create table public.categorias (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  activa boolean not null default true
);

-- ---------- Tabla: productos ----------
create table public.productos (
  id bigint generated always as identity primary key,
  vendedor_id uuid not null references public.perfiles(id),
  categoria_id bigint not null references public.categorias(id),
  nombre text not null,
  descripcion text,
  precio_original numeric(10,2) not null check (precio_original > 0),
  precio_actual numeric(10,2) not null check (precio_actual > 0),
  fecha_vencimiento date not null,
  estado text not null default 'disponible'
    check (estado in ('disponible','proximo_a_vencer','vendido','no_disponible')),
  stock int not null check (stock >= 0),
  peso_unidad_kg numeric(6,2),
  zona text,
  modalidad_entrega text not null default 'recojo' check (modalidad_entrega in ('recojo','coordinada','ambas')),
  foto_url text,
  creado_en timestamptz not null default now(),
  constraint precio_actual_no_mayor check (precio_actual <= precio_original)
);

create index idx_productos_categoria on public.productos(categoria_id);
create index idx_productos_estado on public.productos(estado);
create index idx_productos_vendedor on public.productos(vendedor_id);

-- Calcula el % de descuento al vuelo (RF-04) sin guardarlo de más.
create or replace view public.productos_con_descuento as
select
  p.*,
  round(100 * (p.precio_original - p.precio_actual) / p.precio_original)::int as descuento_pct
from public.productos p;

-- ---------- Tabla: pedidos ----------
create table public.pedidos (
  id bigint generated always as identity primary key,
  comprador_id uuid not null references public.perfiles(id),
  producto_id bigint not null references public.productos(id),
  cantidad int not null check (cantidad > 0),
  monto_total numeric(10,2) not null,
  modalidad_entrega text not null,
  referencia_entrega text,
  estado text not null default 'creado'
    check (estado in ('creado','preparando','entregado','completado','cancelado')),
  motivo_cancelacion text,
  fecha_creacion timestamptz not null default now(),
  fecha_cancelacion timestamptz,
  fecha_finalizacion timestamptz
);

create index idx_pedidos_comprador on public.pedidos(comprador_id);
create index idx_pedidos_producto on public.pedidos(producto_id);

-- ---------- Tabla: detalle_pedidos ----------
create table public.detalle_pedidos (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos(id) on delete cascade,
  cantidad int not null check (cantidad > 0),
  precio_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null
);

-- ---------- Tabla: calificaciones ----------
create table public.calificaciones (
  id bigint generated always as identity primary key,
  pedido_id bigint not null unique references public.pedidos(id),
  puntaje int not null check (puntaje between 1 and 5),
  comentario text,
  creado_en timestamptz not null default now()
);

-- ---------- Tabla: notificaciones ----------
create table public.notificaciones (
  id bigint generated always as identity primary key,
  usuario_id uuid not null references public.perfiles(id),
  mensaje text not null,
  leida boolean not null default false,
  enlace_destino text,
  creado_en timestamptz not null default now()
);

create index idx_notificaciones_usuario on public.notificaciones(usuario_id, leida);

-- ============================================================
-- Función transaccional de compra (CU-05)
-- Referenciada en el Diagrama de Secuencia del SAD: paso 8,
-- rpc('crear_pedido_transaccion', datos)
-- ============================================================
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
as $$
declare
  v_producto public.productos%rowtype;
  v_pedido public.pedidos%rowtype;
begin
  -- Bloquea la fila del producto para evitar condiciones de carrera.
  select * into v_producto from public.productos
    where id = p_producto_id for update;

  if v_producto.id is null then
    raise exception 'Producto no encontrado';
  end if;
  if v_producto.estado <> 'disponible' or v_producto.stock < p_cantidad then
    raise exception 'Producto no disponible o stock insuficiente';
  end if;

  insert into public.pedidos (comprador_id, producto_id, cantidad, monto_total,
                               modalidad_entrega, referencia_entrega, estado)
  values (p_comprador_id, p_producto_id, p_cantidad,
          v_producto.precio_actual * p_cantidad,
          p_modalidad_entrega, p_referencia_entrega, 'creado')
  returning * into v_pedido;

  insert into public.detalle_pedidos (pedido_id, cantidad, precio_unitario, subtotal)
  values (v_pedido.id, p_cantidad, v_producto.precio_actual,
          v_producto.precio_actual * p_cantidad);

  update public.productos
    set stock = stock - p_cantidad,
        estado = case when stock - p_cantidad <= 0 then 'vendido' else estado end
    where id = p_producto_id;

  insert into public.notificaciones (usuario_id, mensaje, enlace_destino)
  values (v_producto.vendedor_id,
          'Nuevo pedido recibido por ' || v_producto.nombre,
          '/pedidos/' || v_pedido.id);

  return v_pedido;
end;
$$;

-- ============================================================
-- Función de apoyo: restituir stock al cancelar un pedido (RF-17 / RN-10)
-- ============================================================
create or replace function public.incrementar_stock(
  p_producto_id bigint,
  p_cantidad int
)
returns void
language plpgsql
security definer
as $$
begin
  update public.productos
    set stock = stock + p_cantidad,
        estado = case when estado = 'vendido' then 'disponible' else estado end
    where id = p_producto_id;
end;
$$;

-- ============================================================
-- Row-Level Security (RLS)
-- ============================================================
alter table public.perfiles enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.pedidos enable row level security;
alter table public.detalle_pedidos enable row level security;
alter table public.calificaciones enable row level security;
alter table public.notificaciones enable row level security;

create policy "Perfiles: cada quien ve y edita el suyo"
  on public.perfiles for all
  using (auth.uid() = id);

create policy "Categorias: lectura pública"
  on public.categorias for select
  using (true);

create policy "Productos: lectura pública"
  on public.productos for select
  using (true);

create policy "Productos: el vendedor publica y edita los suyos"
  on public.productos for insert
  with check (auth.uid() = vendedor_id);

create policy "Productos: el vendedor actualiza los suyos"
  on public.productos for update
  using (auth.uid() = vendedor_id);

create policy "Pedidos: comprador y vendedor del producto los ven"
  on public.pedidos for select
  using (
    auth.uid() = comprador_id
    or auth.uid() = (select vendedor_id from public.productos where id = producto_id)
  );

create policy "Notificaciones: cada quien ve las suyas"
  on public.notificaciones for select
  using (auth.uid() = usuario_id);

create policy "Calificaciones: lectura pública"
  on public.calificaciones for select
  using (true);
