import { describe, expect, it } from "vitest";
import { validarEdicionProducto, validarProductoNuevo } from "../../src/validation/producto.validation.js";

const base = {
  nombre: "  Canasta de verduras ",
  descripcion: " Frescas ",
  categoriaId: 2,
  precioOriginal: 20,
  precioActual: 12,
  stock: 5,
  fechaVencimiento: "2026-10-05",
  pesoUnidadKg: 1.5,
  zona: " Centro ",
  modalidadEntrega: "ambas",
  fotoUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e",
};

describe("validación de productos", () => {
  it("normaliza un producto válido sin cambiar su fecha local", () => {
    expect(validarProductoNuevo(base, "2026-10-03")).toMatchObject({
      nombre: "Canasta de verduras",
      fechaVencimiento: "2026-10-05",
      zona: "Centro",
      modalidadEntrega: "ambas",
    });
  });

  it.each([
    [{ ...base, precioActual: 21 }, "precio"],
    [{ ...base, stock: 0 }, "stock"],
    [{ ...base, fechaVencimiento: "2026-10-02" }, "vencimiento"],
    [{ ...base, fechaVencimiento: "2026-10-03" }, "vencimiento"],
    [{ ...base, modalidadEntrega: "dron" }, "modalidad"],
  ])("rechaza reglas inválidas", (input, fragmento) => {
    expect(() => validarProductoNuevo(input, "2026-10-03")).toThrow(fragmento);
  });

  it("rechaza columnas internas durante una edición", () => {
    expect(() => validarEdicionProducto({ vendedor_id: "otro" }, "2026-10-03")).toThrow("campo");
  });

  it("acepta una edición parcial permitida", () => {
    expect(validarEdicionProducto({ nombre: " Nuevo nombre ", stock: 3 }, "2026-10-03"))
      .toEqual({ nombre: "Nuevo nombre", stock: 3 });
  });

  it.each(["categoriaId", "fechaVencimiento", "pesoUnidadKg"])("conserva los datos originales de publicación: %s", (key) => {
    expect(() => validarEdicionProducto({ [key]: base[key] }, "2026-10-03")).toThrow("no se puede editar");
  });
});

