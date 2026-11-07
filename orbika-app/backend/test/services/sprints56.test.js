import { describe, it, expect, vi } from "vitest";
import { actualizarPerfil } from "../../src/services/perfil.service.js";
import { calificarPedido } from "../../src/services/pedido.service.js";
const buyer = { id: "buyer", rol: "comprador" };
function database(estado = "completado", comprador = "buyer", error = null) {
  const q = { select: () => q, eq: vi.fn(() => q), single: async () => ({ data: { estado, comprador_id: comprador }, error: null }),
    insert: vi.fn(() => ({ select: () => ({ single: async () => ({ data: error ? null : { id: 1, puntaje: 5 }, error }) }) })) };
  return { from: () => q, q };
}
describe("Sprint 6: titularidad y calificación", () => {
  it("rechaza asociar una fotografía de otro titular", async () => {
    const db = {storage:{from:()=>({getPublicUrl:()=>({data:{publicUrl:"https://example.test/buyer/"}})})},from:vi.fn()};
    await expect(actualizarPerfil(buyer,{foto_url:"https://example.test/other/foto.png"},db)).rejects.toMatchObject({status:400});
    expect(db.from).not.toHaveBeenCalled();
  });
  it.each([{ id: "other" }, { rol: "administrador" }, { activo: true }, { plan_premium: true }, { correo: "otro@example.test" }, { nombre_negocio: "Negocio" }, { nombre: " " }, { telefono: {} }])("rechaza cambios de perfil no permitidos %j", async input => {
    const db = { from: vi.fn() };
    await expect(actualizarPerfil(buyer, input, db)).rejects.toMatchObject({ status: 400 });
    expect(db.from).not.toHaveBeenCalled();
  });
  it("actualiza exclusivamente al titular y admite campos del vendedor", async () => {
    const q = { update: vi.fn(() => q), eq: vi.fn(() => q), select: () => q, single: async () => ({ data: { id: "seller", nombre_negocio: "Pan" } }) };
    await actualizarPerfil({ id: "seller", rol: "vendedor" }, { nombre_negocio: " Pan ", ubicacion: "Tacna" }, { from: () => q });
    expect(q.eq).toHaveBeenCalledWith("id", "seller");
    expect(q.update).toHaveBeenCalledWith({ nombre_negocio: "Pan", ubicacion: "Tacna" });
  });
  it.each([0, 6, 1.5, true, [5], null])("rechaza puntaje %j sin persistir", async score => {
    const db = database();
    await expect(calificarPedido(1, buyer, score, "", db)).rejects.toMatchObject({ status: 400 });
    expect(db.q.insert).not.toHaveBeenCalled();
  });
  it.each(["creado", "preparando", "listo_para_entrega", "entregado", "cancelado"])("rechaza pedido %s", async estado => {
    const db = database(estado);
    await expect(calificarPedido(1, buyer, 5, "", db)).rejects.toMatchObject({ status: 409 });
    expect(db.q.insert).not.toHaveBeenCalled();
  });
  it("rechaza un comprador ajeno", async () => {
    await expect(calificarPedido(1, buyer, 5, "", database("completado", "other"))).rejects.toMatchObject({ status: 403 });
  });
  it("guarda una calificación y distingue duplicado de caída de servicio", async () => {
    await expect(calificarPedido(1, buyer, 5, "Bien", database())).resolves.toMatchObject({ puntaje: 5 });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try { await expect(calificarPedido(1, buyer, 5, "", database("completado", "buyer", { code: "23505" }))).rejects.toMatchObject({ status: 409 }); }
    finally { log.mockRestore(); }
    await expect(calificarPedido(1, buyer, 5, "", database("completado", "buyer", { code: "08006" }))).rejects.toMatchObject({ status: 502 });
  });
});
