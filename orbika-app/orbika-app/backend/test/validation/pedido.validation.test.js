import { describe, expect, it } from "vitest";
import {
  TRANSICIONES_PEDIDO,
  validarCalificacion,
  validarCambioEstado,
  validarCancelacion,
  validarCompra,
} from "../../src/validation/pedido.validation.js";

const claveIdempotencia = "a2000000-0000-4000-8000-000000000001";

describe("validación de pedidos", () => {
  it("normaliza una compra válida", () => {
    expect(validarCompra({ claveIdempotencia, productoId: "3", cantidad: "2", modalidadEntrega: "recojo" }))
      .toEqual({ claveIdempotencia, productoId: 3, cantidad: 2, modalidadEntrega: "recojo", referenciaEntrega: null });
  });

  it.each([
    [{ productoId: 0, cantidad: 1, modalidadEntrega: "recojo" }, "producto"],
    [{ productoId: 1, cantidad: 0, modalidadEntrega: "recojo" }, "cantidad"],
    [{ productoId: 1, cantidad: 1.5, modalidadEntrega: "recojo" }, "cantidad"],
    [{ productoId: 1, cantidad: 1, modalidadEntrega: "dron" }, "modalidad"],
    [{ productoId: 1, cantidad: 1, modalidadEntrega: "coordinada" }, "referencia"],
  ])("rechaza compras inválidas", (input, fragmento) => {
    expect(() => validarCompra({ claveIdempotencia, ...input })).toThrow(fragmento);
  });

  it("exige motivo de cancelación", () => {
    expect(() => validarCancelacion({ motivo: " " })).toThrow("motivo");
  });

  it("solo acepta estados conocidos", () => {
    expect(validarCambioEstado({ estado: "preparando" })).toEqual({ estado: "preparando" });
    expect(() => validarCambioEstado({ estado: "reembolsado" })).toThrow("estado");
  });

  it("define una progresión sin saltos", () => {
    expect(TRANSICIONES_PEDIDO).toEqual({
      creado: ["preparando"],
      preparando: ["listo_para_entrega"],
      listo_para_entrega: ["entregado"],
      entregado: ["completado"],
      completado: [],
      cancelado: [],
    });
  });

  it("limita puntaje y comentario", () => {
    expect(validarCalificacion({ puntaje: "5", comentario: " Muy bien " }))
      .toEqual({ puntaje: 5, comentario: "Muy bien" });
    expect(() => validarCalificacion({ puntaje: 6 })).toThrow("puntaje");
  });
});
