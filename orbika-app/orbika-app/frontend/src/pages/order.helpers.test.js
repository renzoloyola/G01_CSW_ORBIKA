import { describe, expect, it } from "vitest";
import { accionesPermitidas } from "./order.helpers.js";

describe("acciones de pedido", () => {
  it.each([
    ["comprador", "creado", ["cancelar"]],
    ["comprador", "preparando", ["cancelar"]],
    ["comprador", "completado", ["calificar"]],
    ["vendedor", "creado", ["preparando"]],
    ["vendedor", "preparando", ["listo_para_entrega"]],
    ["vendedor", "listo_para_entrega", ["entregado"]],
    ["vendedor", "entregado", []],
    ["comprador", "entregado", ["completado"]],
    ["comprador", "listo_para_entrega", []],
    ["vendedor", "cancelado", []],
  ])("%s con estado %s", (rol, estado, expected) => {
    expect(accionesPermitidas(rol, estado)).toEqual(expected);
  });
});
