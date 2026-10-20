import { describe, expect, it, vi } from "vitest";
vi.mock("./api", () => ({ api: {} }));
vi.mock("./supabaseClient", () => ({ supabase: {} }));
import { createMarketplace } from "./marketplace";

function service(demo = false) {
  const client = { get: vi.fn(), post: vi.fn(), put: vi.fn() };
  return { client, market: createMarketplace({ client, demo, loadCategories: async () => [] }) };
}
describe("separación entre datos reales y demostración", () => {
  it("respeta un catálogo o historial vacío", async () => {
    const { client, market } = service();
    client.get.mockResolvedValue({ data: [] });
    expect(await market.listarProductos()).toEqual([]);
    expect(await market.listarPedidos()).toEqual([]);
  });
  it("no añade productos ficticios a los reales", async () => {
    const { client, market } = service();
    client.get.mockResolvedValue({ data: [{ id: 500, nombre: "Real" }] });
    expect(await market.listarProductos()).toEqual([{ id: 500, nombre: "Real" }]);
  });
  it.each(["listarProductos", "listarPedidos", "obtenerProducto"])("propaga los fallos de lectura: %s", async (method) => {
    const { client, market } = service();
    client.get.mockRejectedValue(new Error("API no disponible"));
    await expect(market[method](1)).rejects.toThrow("API no disponible");
  });
  it.each(["comprarProducto", "publicarProducto", "editarProducto", "subirFoto"])("no convierte un rechazo en éxito: %s", async (method) => {
    const { client, market } = service();
    client.post.mockRejectedValue(new Error("Operación rechazada"));
    client.put.mockRejectedValue(new Error("Operación rechazada"));
    await expect(market[method](1, {})).rejects.toThrow("Operación rechazada");
  });
  it("una ficha inexistente de demo conserva el error", async () => {
    const { market } = service(true);
    await expect(market.obtenerProducto(999999)).rejects.toThrow("Producto no encontrado");
  });
  it("la demo lee solo datos de ejemplo y bloquea todas las escrituras", async () => {
    const { client, market } = service(true);
    expect((await market.listarProductos()).length).toBeGreaterThan(0);
    expect((await market.listarPedidos()).length).toBeGreaterThan(0);
    for (const method of ["comprarProducto", "publicarProducto", "editarProducto", "subirFoto"]) {
      await expect(market[method]({}, {})).rejects.toThrow("solo lectura");
    }
    expect(client.get).not.toHaveBeenCalled();
    expect(client.post).not.toHaveBeenCalled();
    expect(client.put).not.toHaveBeenCalled();
  });
});
