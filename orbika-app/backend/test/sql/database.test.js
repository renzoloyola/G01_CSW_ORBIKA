import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, beforeEach, afterEach, afterAll, describe, expect, it } from "vitest";

// PostgreSQL real en memoria; auth y storage se reducen a las tablas/funciones
// externas que necesita el esquema. No sustituye las pruebas de PostgREST o Auth remoto.
let db, productoId, legacyPedido;
const seller = "11111111-1111-4111-8111-111111111111";
const buyer = "22222222-2222-4222-8222-222222222222";
const other = "33333333-3333-4333-8333-333333333333";
const key = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
async function buy(id = productoId, cantidad = 1, clave = key) {
  const result = await db.query("select * from public.crear_pedido_transaccion($1,$2,$3,'recojo',null,$4)", [id, buyer, cantidad, clave]);
  return result.rows[0];
}
async function stock(id = productoId) {
  return Number((await db.query("select stock from public.productos where id=$1", [id])).rows[0].stock);
}
beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create function auth.role() returns text language sql stable as $$select current_setting('request.jwt.claim.role',true)$$;
    grant usage on schema public,auth to anon,authenticated,service_role;
    grant execute on all functions in schema auth to anon,authenticated,service_role;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
  `);
  for (const file of ["001_init_schema.sql", "002_security_and_order_transactions.sql"]) {
    await db.exec(readFileSync(new URL(`../../../supabase/migrations/${file}`, import.meta.url), "utf8"));
  }
  await db.query("insert into auth.users(id,email,raw_user_meta_data) values ($1,'seller@example.test','{\"rol\":\"vendedor\"}'),($2,'buyer@example.test','{}'),($3,'other@example.test','{}')", [seller, buyer, other]);
  await db.exec("insert into public.categorias(nombre) values('Panadería');");
  const expired = await db.query("insert into public.productos(vendedor_id,categoria_id,nombre,precio_original,precio_actual,fecha_vencimiento,stock) values($1,1,'Oferta antigua',10,5,(now() at time zone 'America/Lima')::date,2) returning id", [seller]);
  const legacy = await db.query("insert into public.pedidos(comprador_id,producto_id,cantidad,monto_total,modalidad_entrega) values($1,$2,1,5,'recojo') returning id", [buyer, expired.rows[0].id]);
  legacyPedido = legacy.rows[0].id;
  await db.exec(readFileSync(new URL("../../../supabase/migrations/003_srs_integrity_and_images.sql", import.meta.url), "utf8"));
  await db.exec("grant select,update on public.perfiles to authenticated; grant select on public.pedidos,public.detalle_pedidos,public.productos to authenticated;");
}, 30000);
beforeEach(async () => {
  await db.exec("begin;");
  const result = await db.query("insert into public.productos(vendedor_id,categoria_id,nombre,precio_original,precio_actual,fecha_vencimiento,stock,peso_unidad_kg) values($1,1,'Pan',10,5,(now() at time zone 'America/Lima')::date+5,3,0.5) returning id", [seller]);
  productoId = result.rows[0].id;
});
afterEach(async () => { await db.exec("rollback;"); });
afterAll(async () => { if (db) await db.close(); });

describe("migraciones ejecutadas en PostgreSQL", () => {
  it("migra pedidos existentes sin inventar precio original ni peso históricos", async () => {
    const result = await db.query("select * from detalle_pedidos where pedido_id=$1", [legacyPedido]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].producto_id).toBeTruthy();
    expect(result.rows[0].precio_original_compra).toBeNull();
    expect(result.rows[0].peso_unidad_kg_compra).toBeNull();
    const columns = await db.query("select column_name from information_schema.columns where table_schema='public' and table_name='pedidos'");
    expect(columns.rows.map((r) => r.column_name)).not.toContain("producto_id");
  });
  it("una confirmación repetida crea un pedido, descuenta una vez y notifica una vez", async () => {
    const first = await buy(); const retry = await buy();
    expect(retry.id).toBe(first.id);
    expect(await stock()).toBe(2);
    expect(Number((await db.query("select count(*) as n from pedidos where clave_idempotencia=$1", [key])).rows[0].n)).toBe(1);
    expect(Number((await db.query("select count(*) as n from notificaciones")).rows[0].n)).toBe(1);
  });
  it("conserva los valores históricos después de editar los precios", async () => {
    const pedido = await buy();
    await db.query("update productos set nombre='Pan editado',precio_original=12,precio_actual=6 where id=$1", [productoId]);
    const detail = (await db.query("select * from detalle_pedidos where pedido_id=$1", [pedido.id])).rows[0];
    expect(Number(detail.precio_original_compra)).toBe(10);
    expect(Number(detail.precio_unitario)).toBe(5);
    expect(Number(detail.peso_unidad_kg_compra)).toBe(0.5);
    expect(detail.nombre_producto_compra).toBe("Pan");
  });
  it("rechaza cambiar el contenido de una confirmación usada", async () => {
    await buy();
    await expect(buy(productoId, 2)).rejects.toThrow("otros datos");
  });
  it("cancelar dos veces devuelve las unidades y crea el aviso una sola vez", async () => {
    const pedido = await buy(productoId, 2);
    for (let i = 0; i < 2; i++) await db.query("select * from cancelar_pedido_transaccion($1,$2,'Cambio de planes')", [pedido.id, buyer]);
    expect(await stock()).toBe(3);
    expect(Number((await db.query("select count(*) as n from notificaciones")).rows[0].n)).toBe(2);
  });
  it("cancelar no reactiva una publicación retirada", async () => {
    const pedido = await buy();
    await db.query("update productos set estado_publicacion='retirado' where id=$1", [productoId]);
    await db.query("select * from cancelar_pedido_transaccion($1,$2,'Cambio de planes')", [pedido.id, buyer]);
    const row = (await db.query("select estado,stock from productos_con_descuento where id=$1", [productoId])).rows[0];
    expect(row.estado).toBe("no_disponible"); expect(Number(row.stock)).toBe(3);
  });
  it("cancelar un pedido antiguo de un producto vencido mantiene su indisponibilidad", async () => {
    await db.query("select * from cancelar_pedido_transaccion($1,$2,'Cambio de planes')", [legacyPedido, buyer]);
    const row = (await db.query("select estado from productos_con_descuento where nombre='Oferta antigua'")).rows[0];
    expect(row.estado).toBe("no_disponible");
  });
  it("un producto agotado vuelve a estar disponible al reponer unidades", async () => {
    await buy(productoId, 3);
    expect((await db.query("select estado from productos_con_descuento where id=$1", [productoId])).rows[0].estado).toBe("no_disponible");
    await db.query("update productos set stock=5 where id=$1", [productoId]);
    expect((await db.query("select estado from productos_con_descuento where id=$1", [productoId])).rows[0].estado).toBe("disponible");
  });
  it("no permite publicar en el día de vencimiento", async () => {
    await expect(db.query("insert into productos(vendedor_id,categoria_id,nombre,precio_original,precio_actual,fecha_vencimiento,stock) values($1,1,'Vence hoy',10,5,(now() at time zone 'America/Lima')::date,2)", [seller])).rejects.toThrow("vencimiento");
  });
  it("impide comprar una categoría inactiva", async () => {
    await db.exec("update categorias set activa=false where id=1;");
    await expect(buy()).rejects.toThrow("no disponible");
  });
  it("impide nuevas compras de una cuenta suspendida", async () => {
    await db.query("update perfiles set activo=false where id=$1", [buyer]);
    await expect(buy()).rejects.toThrow("no está habilitada");
  });
  it("no deja cancelar un pedido listo para entrega", async () => {
    const pedido = await buy();
    await db.query("update pedidos set estado='listo_para_entrega' where id=$1", [pedido.id]);
    await expect(db.query("select * from cancelar_pedido_transaccion($1,$2,'Cambio de planes')", [pedido.id, buyer])).rejects.toThrow("ya no puede cancelarse");
  });
  it("el comprador ajeno no puede cancelar", async () => {
    const pedido = await buy();
    await expect(db.query("select * from cancelar_pedido_transaccion($1,$2,'Cambio de planes')", [pedido.id, other])).rejects.toThrow("no te pertenece");
  });
  it("las políticas de lectura permiten a los participantes y excluyen a terceros sin recursión", async () => {
    const pedido = await buy();
    await db.exec("set local role authenticated;");
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [buyer]);
    expect((await db.query("select id from pedidos where id=$1", [pedido.id])).rows).toHaveLength(1);
    expect((await db.query("select id from detalle_pedidos where pedido_id=$1", [pedido.id])).rows).toHaveLength(1);
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [other]);
    expect((await db.query("select id from pedidos where id=$1", [pedido.id])).rows).toHaveLength(0);
    expect((await db.query("select id from detalle_pedidos where pedido_id=$1", [pedido.id])).rows).toHaveLength(0);
  });
  it("una cuenta pública no puede habilitarse premium", async () => {
    await db.exec("set local role authenticated; select set_config('request.jwt.claim.role','authenticated',true);");
    await db.query("select set_config('request.jwt.claim.sub',$1,true)", [buyer]);
    await expect(db.query("update perfiles set plan_premium=true where id=$1", [buyer])).rejects.toThrow("premium");
  });
  it("las funciones de compra no pueden ejecutarse como anon", async () => {
    await db.exec("set local role anon;");
    await expect(buy()).rejects.toThrow("permission denied");
  });
  it("crea el bucket público limitado a JPG/PNG de 5 MB", async () => {
    const bucket = (await db.query("select * from storage.buckets where id='orbika-productos'")).rows[0];
    expect(bucket.public).toBe(true);
    expect(Number(bucket.file_size_limit)).toBe(5242880);
    expect(bucket.allowed_mime_types).toEqual(["image/jpeg", "image/png"]);
  });
});
