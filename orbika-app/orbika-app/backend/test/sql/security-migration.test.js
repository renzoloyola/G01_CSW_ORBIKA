import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(new URL("../../../supabase/migrations/002_security_and_order_transactions.sql", import.meta.url), "utf8")
  .toLowerCase()
  .replace(/\s+/g, " ");

describe("contrato de la migración de seguridad", () => {
  it("normaliza el rol público sin permitir administrador", () => {
    expect(sql).toContain("when new.raw_user_meta_data->>'rol' = 'vendedor' then 'vendedor' else 'comprador' end");
    expect(sql).toContain("new.raw_user_meta_data->>'nombre_negocio'");
    expect(sql).toContain("new.raw_user_meta_data->>'ubicacion'");
  });

  it("impide que un usuario cambie su propio rol mediante la API pública", () => {
    expect(sql).toContain("function public.proteger_rol_perfil");
    expect(sql).toContain("if new.rol is distinct from old.rol and coalesce(auth.role(), '') <> 'service_role'");
    expect(sql).toContain("before update on public.perfiles");
    expect(sql).toContain("drop policy if exists \"perfiles: cada quien ve y edita el suyo\"");
    expect(sql).toContain("on public.perfiles for select");
    expect(sql).toContain("on public.perfiles for update");
  });

  it("exige rol vendedor también en las políticas directas de productos", () => {
    expect(sql).toContain("drop policy if exists \"productos: el vendedor publica y edita los suyos\"");
    expect(sql).toContain("drop policy if exists \"productos: el vendedor actualiza los suyos\"");
    expect((sql.match(/rol = 'vendedor'/g) || []).length).toBeGreaterThanOrEqual(2);
    expect(sql).toContain("with check ( auth.uid() = vendedor_id");
  });

  it("fija search_path en todas las funciones privilegiadas", () => {
    const funciones = sql.match(/security definer set search_path = public/g) || [];
    expect(funciones.length).toBeGreaterThanOrEqual(3);
  });

  it("revoca ejecución directa y concede solo a service_role", () => {
    expect(sql).toContain("revoke all on function public.crear_pedido_transaccion");
    expect(sql).toContain("revoke all on function public.cancelar_pedido_transaccion");
    expect(sql).toContain("from public, anon, authenticated");
    expect(sql).toContain("grant execute on function public.crear_pedido_transaccion");
    expect(sql).toContain("to service_role");
  });

  it("bloquea las filas de producto y pedido", () => {
    expect((sql.match(/for update/g) || []).length).toBeGreaterThanOrEqual(2);
  });

  it("cancela y restituye stock dentro de la misma función", () => {
    const inicio = sql.indexOf("function public.cancelar_pedido_transaccion");
    const cuerpo = sql.slice(inicio);
    expect(cuerpo).toContain("set estado = 'cancelado'");
    expect(cuerpo).toContain("set stock = stock + v_pedido.cantidad");
    expect(cuerpo).toContain("if v_pedido.estado not in ('creado','preparando')");
  });
});
