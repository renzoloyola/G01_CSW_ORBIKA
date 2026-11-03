import { describe, expect, it, vi } from "vitest";
import { buscarProductos, obtenerProducto, editarProducto, publicarProducto } from "../../src/services/producto.service.js";

function queryReturning(data = []) {
  const promise = Promise.resolve({ data, error: null });
  const q = {
    select: vi.fn(() => q), eq: vi.fn(() => q), in: vi.fn(() => q),
    gte: vi.fn(() => q), gt: vi.fn(() => q), lte: vi.fn(() => q),
    ilike: vi.fn(() => q), order: vi.fn(() => promise), single: vi.fn(() => promise),
    insert: vi.fn(() => q), update: vi.fn(() => q), then: promise.then.bind(promise),
  };
  return q;
}

describe("servicio de productos", () => {
  it("combina nombre, categoría, zona y precio máximo sin perder el orden", async () => {
    const q = queryReturning([]);
    await buscarProductos({ busqueda: " pan ", categoriaId: "2", zona: " Tacna ", maxPrecio: "5.25", orden: "mayor_descuento" }, { from: () => q });
    expect(q.ilike).toHaveBeenCalledWith("nombre", "%pan%");
    expect(q.ilike).toHaveBeenCalledWith("zona", "Tacna");
    expect(q.eq).toHaveBeenCalledWith("categoria_id", 2);
    expect(q.lte).toHaveBeenCalledWith("precio_actual", 5.25);
    expect(q.order).toHaveBeenCalledWith("descuento_pct", { ascending: false });
  });
  it.each([{ busqueda: ["pan"] }, { zona: {} }, { categoriaId: [1] }, { maxPrecio: [] }, { busqueda: "a".repeat(81) }])("rechaza filtros malformados sin error interno: %j", async (filtros) => {
    await expect(buscarProductos(filtros, { from: () => queryReturning() })).rejects.toMatchObject({ status: 400 });
  });
  it("no confunde una caída de datos con un producto inexistente", async () => {
    const q = queryReturning();
    q.single = async () => ({ data: null, error: { code: "08006" } });
    await expect(obtenerProducto(1, { from: () => q })).rejects.toMatchObject({ status: 502 });
    q.single = async () => ({ data: null, error: { code: "PGRST116" } });
    await expect(obtenerProducto(1, { from: () => q })).rejects.toMatchObject({ status: 404 });
  });
  it("el catálogo exige productos comprables y admite búsqueda", async () => {
    const q = queryReturning([]);
    const db = { from: vi.fn(() => q) };
    await buscarProductos({ busqueda: "tomate", orden: "precio_asc" }, db, "2026-10-03");
    expect(q.in).toHaveBeenCalledWith("estado", ["disponible", "proximo_a_vencer"]);
    expect(q.gt).toHaveBeenCalledWith("stock", 0);
    expect(q.gt).toHaveBeenCalledWith("fecha_vencimiento", "2026-10-03");
    expect(q.ilike).toHaveBeenCalledWith("nombre", "%tomate%");
  });

  it("solo un vendedor puede publicar", async () => {
    await expect(publicarProducto({ id: "buyer", rol: "comprador" }, {}, { from: vi.fn() }))
      .rejects.toMatchObject({ status: 403 });
  });

  it("rechaza campos internos antes de editar", async () => {
    await expect(editarProducto(1, { id: "seller", rol: "vendedor" }, { vendedor_id: "otro" }, { from: vi.fn() }))
      .rejects.toMatchObject({ status: 400 });
  });

  it("impide editar un producto ajeno", async () => {
    const q = queryReturning({ id: 1, vendedor_id: "otro", precio_original: 10, precio_actual: 5 });
    const db = { from: vi.fn(() => q) };
    await expect(editarProducto(1, { id: "seller", rol: "vendedor" }, { nombre: "Cambio" }, db))
      .rejects.toMatchObject({ status: 403 });
  });

  it("repone stock de un producto agotado sin sobrescribir una compra concurrente", async () => {
    const q = queryReturning({ id: 1, vendedor_id: "seller", precio_original: 10, precio_actual: 5, stock: 0, estado: "vendido", estado_publicacion: "publicado" });
    await editarProducto(1, { id: "seller", rol: "vendedor" }, { stock: 5 }, { from: () => q });
    expect(q.update).toHaveBeenCalledWith({ stock: 5, estado: "disponible" });
    expect(q.eq).toHaveBeenCalledWith("stock", 0);
  });

  it("reponer stock no reactiva una publicación retirada", async () => {
    const q = queryReturning({ id: 1, vendedor_id: "seller", precio_original: 10, precio_actual: 5, stock: 0, estado: "no_disponible", estado_publicacion: "retirado" });
    await editarProducto(1, { id: "seller", rol: "vendedor" }, { stock: 5 }, { from: () => q });
    expect(q.update).toHaveBeenCalledWith({ stock: 5 });
  });
});
