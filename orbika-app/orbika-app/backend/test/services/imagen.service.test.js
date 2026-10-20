import { describe, expect, it, vi } from "vitest";
import { subirImagen } from "../../src/services/imagen.service.js";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMesAAAAASUVORK5CYII=", "base64");
const seller = { id: "seller", rol: "vendedor" };
describe("imágenes de producto", () => {
  it("almacena la imagen con un nombre único y devuelve su URL", async () => {
    const bucket = { upload: vi.fn().mockResolvedValue({ error: null }), getPublicUrl: vi.fn(() => ({ data: { publicUrl: "https://example.test/foto.png" } })) };
    const storage = { from: vi.fn(() => bucket) };
    const result = await subirImagen(seller, png, "image/png", { storage });
    expect(result.url).toBe("https://example.test/foto.png");
    expect(storage.from).toHaveBeenCalledWith("orbika-productos");
    expect(bucket.upload).toHaveBeenCalledWith(expect.stringMatching(/^seller\/.+\.png$/), png, { contentType: "image/png", upsert: false });
  });
  it.each([
    [{ rol: "comprador" }, png, "image/png", 403],
    [{ ...seller, activo: false }, png, "image/png", 403],
    [seller, Buffer.from("texto"), "image/png", 400],
    [seller, png, "image/jpeg", 400],
    [seller, Buffer.alloc(5 * 1024 * 1024 + 1), "image/png", 413],
  ])("rechaza archivos o actores inválidos antes de subir", async (actor, bytes, type, status) => {
    const storage = { from: vi.fn() };
    await expect(subirImagen(actor, bytes, type, { storage })).rejects.toMatchObject({ status });
    expect(storage.from).not.toHaveBeenCalled();
  });
  it("no devuelve éxito cuando Storage falla", async () => {
    const bucket = { upload: async () => ({ error: { message: "bucket missing" } }), getPublicUrl: vi.fn() };
    await expect(subirImagen(seller, png, "image/png", { storage: { from: () => bucket } })).rejects.toMatchObject({ status: 502 });
    expect(bucket.getPublicUrl).not.toHaveBeenCalled();
  });
});
