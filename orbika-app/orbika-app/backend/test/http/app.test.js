import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const db = vi.hoisted(() => ({ auth: { getUser: vi.fn() }, from: vi.fn(), rpc: vi.fn(), storage: { from: vi.fn() } }));
vi.mock("../../src/config/supabaseClient.js", () => ({ supabaseAdmin: db }));
import { createApp } from "../../src/app.js";
const app = createApp();
const clave = "a2000000-0000-4000-8000-000000000001";
function query(data) {
  const q = { select: () => q, eq: () => q, update: vi.fn(() => q), single: async () => ({ data, error: null }) };
  return q;
}
beforeEach(() => {
  vi.clearAllMocks();
  db.auth.getUser.mockImplementation(async (token) => ({ data: { user: { id: token } }, error: null }));
  db.from.mockImplementation((table) => table === "perfiles"
    ? { select() { return this; }, eq(_field, id) { this.id = id; return this; }, async single() { return { data: { id: this.id, rol: this.id === "seller" ? "vendedor" : "comprador", activo: true }, error: null }; } }
    : query({ id: 1, comprador_id: "buyer", estado: "entregado", detalle_pedidos: [{ productos: { vendedor_id: "seller" } }] }));
});
describe("API HTTP con autenticación y persistencia controladas", () => {
  it("comprar sin sesión devuelve 401", async () => {
    expect((await request(app).post("/api/pedidos").send({})).status).toBe(401);
    expect(db.rpc).not.toHaveBeenCalled();
  });
  it("un comprador no puede publicar", async () => {
    expect((await request(app).post("/api/productos").set("Authorization", "Bearer buyer").send({})).status).toBe(403);
  });
  it("la API devuelve 409 cuando la compra no se registra", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.rpc.mockResolvedValue({ data: null, error: { code: "P0001", message: "Stock insuficiente" } });
    const response = await request(app).post("/api/pedidos").set("Authorization", "Bearer buyer")
      .send({ productoId: 1, cantidad: 1, modalidadEntrega: "recojo", claveIdempotencia: clave });
    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: "Stock insuficiente", code: "DATA_CONFLICT" });
    vi.restoreAllMocks();
  });
  it("el vendedor no puede completar y el comprador sí confirma la recepción", async () => {
    const denied = await request(app).patch("/api/pedidos/1/estado").set("Authorization", "Bearer seller").send({ estado: "completado" });
    expect(denied.status).toBe(403);
    const accepted = await request(app).patch("/api/pedidos/1/estado").set("Authorization", "Bearer buyer").send({ estado: "completado" });
    expect(accepted.status).toBe(200);
  });
  it("rechaza una imagen falsa y una que excede 5 MB", async () => {
    expect((await request(app).post("/api/imagenes").set("Authorization", "Bearer seller").set("Content-Type", "image/png").send(Buffer.from("texto"))).status).toBe(400);
    expect((await request(app).post("/api/imagenes").set("Authorization", "Bearer seller").set("Content-Type", "image/png").send(Buffer.alloc(5 * 1024 * 1024 + 1))).status).toBe(413);
    expect(db.storage.from).not.toHaveBeenCalled();
  });
  it("rechaza JSON inválido sin devolver un error interno", async () => {
    const response = await request(app).post("/api/productos").set("Content-Type", "application/json").send("{");
    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_JSON");
  });
});
