import { describe, expect, it, vi } from "vitest";
import { actualizarEstadoPedido, cancelarPedido, crearPedido, listarPedidosDeUsuario } from "../../src/services/pedido.service.js";

const compra = { productoId: 1, cantidad: 1, modalidadEntrega: "recojo", claveIdempotencia: "a2000000-0000-4000-8000-000000000001" };
function queryReturning(data, error = null) {
  const result = Promise.resolve({ data, error });
  const q = {
    select: vi.fn(() => q), eq: vi.fn(() => q), update: vi.fn(() => q),
    order: vi.fn(() => result), single: vi.fn(() => result),
  };
  return q;
}
const pedido = (estado) => ({ id: 1, comprador_id: "buyer", estado, detalle_pedidos: [{ productos: { vendedor_id: "seller" } }] });

describe("servicio de pedidos", () => {
  it.each([{ id: "seller", rol: "vendedor" }, { id: "buyer", rol: "comprador", activo: false }])("impide nuevas compras a cuentas no habilitadas", async (actor) => {
    const db = { rpc: vi.fn() };
    await expect(crearPedido(actor, compra, db)).rejects.toMatchObject({ status: 403 });
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it("confirma con la identidad autenticada y conserva la clave de reintento", async () => {
    const db = { rpc: vi.fn().mockResolvedValue({ data: { id: 7 }, error: null }) };
    await expect(crearPedido({ id: "buyer", rol: "comprador" }, compra, db)).resolves.toEqual({ id: 7 });
    expect(db.rpc).toHaveBeenCalledWith("crear_pedido_transaccion", expect.objectContaining({ p_comprador_id: "buyer", p_clave_idempotencia: compra.claveIdempotencia }));
  });
  it("propaga un conflicto de stock como fracaso, sin inventar un pedido", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const db = { rpc: vi.fn().mockResolvedValue({ data: null, error: { code: "P0001", message: "Producto no disponible, vencido o sin stock suficiente" } }) };
    await expect(crearPedido({ id: "buyer", rol: "comprador" }, compra, db)).rejects.toMatchObject({ status: 409 });
    vi.restoreAllMocks();
  });
  it("normaliza la fila RPC cuando PostgREST la entrega como arreglo", async () => {
    const db = { rpc: async () => ({ data: [{ id: 7, estado: "creado" }], error: null }) };
    await expect(crearPedido({ id: "buyer", rol: "comprador" }, compra, db)).resolves.toEqual({ id: 7, estado: "creado" });
  });
  it("no confirma una respuesta vacía de persistencia", async () => {
    const db = { rpc: async () => ({ data: null, error: null }) };
    await expect(crearPedido({ id: "buyer", rol: "comprador" }, compra, db)).rejects.toMatchObject({ status: 502 });
  });
  it("cancela usando la función transaccional", async () => {
    const db = { rpc: vi.fn().mockResolvedValue({ data: { id: 7, estado: "cancelado" }, error: null }) };
    await expect(cancelarPedido(7, { id: "buyer", rol: "comprador" }, "No podré recogerlo", db)).resolves.toMatchObject({ estado: "cancelado" });
  });
  it.each([
    ["buyer", "comprador", "creado", "preparando", 403],
    ["seller", "vendedor", "entregado", "completado", 403],
    ["other", "comprador", "entregado", "completado", 403],
    ["other", "vendedor", "creado", "preparando", 403],
    ["seller", "vendedor", "creado", "entregado", 409],
    ["buyer", "comprador", "preparando", "completado", 409],
  ])("rechaza un avance indebido: %s de %s a %s", async (id, rol, estado, siguiente, status) => {
    const q = queryReturning(pedido(estado));
    await expect(actualizarEstadoPedido(1, { id, rol }, siguiente, { from: () => q })).rejects.toMatchObject({ status });
    expect(q.update).not.toHaveBeenCalled();
  });
  it.each([
    ["seller", "vendedor", "creado", "preparando"],
    ["seller", "vendedor", "preparando", "listo_para_entrega"],
    ["seller", "vendedor", "listo_para_entrega", "entregado"],
    ["buyer", "comprador", "entregado", "completado"],
  ])("permite el avance al participante correcto: %s a %s", async (id, rol, estado, siguiente) => {
    const q = queryReturning(pedido(estado));
    await actualizarEstadoPedido(1, { id, rol }, siguiente, { from: () => q });
    expect(q.update).toHaveBeenCalledWith(expect.objectContaining({ estado: siguiente }));
    expect(q.eq).toHaveBeenCalledWith("estado", estado);
    if (siguiente === "completado") expect(q.update).toHaveBeenCalledWith(expect.objectContaining({ fecha_finalizacion: expect.any(String) }));
  });
  it("acepta el detalle como objeto en una relación uno a uno de PostgREST", async () => {
    const q = queryReturning({ id: 1, comprador_id: "buyer", estado: "listo_para_entrega", detalle_pedidos: { productos: { vendedor_id: "seller" } } });
    await actualizarEstadoPedido(1, { id: "seller", rol: "vendedor" }, "entregado", { from: () => q });
    expect(q.update).toHaveBeenCalledWith({ estado: "entregado" });
  });

  it("mantiene el nombre histórico y restringe las ventas al dueño", async () => {
    const q = queryReturning([{ id: 1, detalle_pedidos: [{ nombre_producto_compra: "Nombre al comprar", productos: { nombre: "Nombre editado", vendedor_id: "seller" } }] }]);
    const rows = await listarPedidosDeUsuario("seller", "vendedor", { from: () => q });
    expect(rows[0].productos.nombre).toBe("Nombre al comprar");
    expect(q.eq).toHaveBeenCalledWith("detalle_pedidos.productos.vendedor_id", "seller");
    expect(q.select).toHaveBeenCalledWith(expect.stringContaining("productos!inner"));
  });
});
