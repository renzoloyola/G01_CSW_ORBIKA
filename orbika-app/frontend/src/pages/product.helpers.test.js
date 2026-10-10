import { describe, expect, it } from "vitest";
import {
  calcularAhorro,
  calcularEstadoVencimiento,
  calcularNivelStock,
  cantidadValida,
  diasHastaVencimiento,
  fechaLocal,
  modalidadesDisponibles,
  serializarFiltros,
} from "./product.helpers.js";

describe("helpers de productos", () => {
  it("elimina filtros vacíos y convierte números", () => {
    expect(serializarFiltros({ busqueda: " tomate ", categoriaId: "2", zona: "", maxPrecio: "15.5", orden: "precio_asc" }))
      .toEqual({ busqueda: "tomate", categoriaId: 2, maxPrecio: 15.5, orden: "precio_asc" });
  });

  it.each([
    ["recojo", ["recojo"]],
    ["coordinada", ["coordinada"]],
    ["ambas", ["recojo", "coordinada"]],
  ])("calcula modalidades para %s", (modalidad, expected) => {
    expect(modalidadesDisponibles({ modalidad_entrega: modalidad })).toEqual(expected);
  });

  it("valida cantidades enteras dentro del stock", () => {
    expect(cantidadValida(2, 3)).toBe(true);
    expect(cantidadValida(0, 3)).toBe(false);
    expect(cantidadValida(4, 3)).toBe(false);
    expect(cantidadValida(1.5, 3)).toBe(false);
  });

  it("formatea una fecha sin cambiar de día por zona horaria", () => {
    expect(fechaLocal("2026-10-05")).toBe("05/10/2026");
  });

  describe("calcularAhorro", () => {
    it("calcula porcentaje y monto con valores válidos", () => {
      const res = calcularAhorro(20, 14);
      expect(res.porcentaje).toBe(30);
      expect(res.montoAhorro).toBe(6);
    });

    it("redondea decimales correctamente", () => {
      const res = calcularAhorro(15.9, 9.9);
      expect(res.montoAhorro).toBe(6);
      expect(res.porcentaje).toBe(38);
    });

    it("retorna 0 si el precio actual es mayor o igual al original", () => {
      expect(calcularAhorro(10, 10)).toEqual({ porcentaje: 0, montoAhorro: 0 });
      expect(calcularAhorro(10, 12)).toEqual({ porcentaje: 0, montoAhorro: 0 });
    });

    it("retorna 0 con valores negativos o vacíos", () => {
      expect(calcularAhorro(0, 5)).toEqual({ porcentaje: 0, montoAhorro: 0 });
      expect(calcularAhorro(-10, -5)).toEqual({ porcentaje: 0, montoAhorro: 0 });
    });
  });

  describe("calcularEstadoVencimiento", () => {
    const refDate = new Date("2026-10-04T12:00:00Z");

    it("reconoce producto vencido", () => {
      const res = calcularEstadoVencimiento("2026-10-02", refDate);
      expect(res.tipo).toBe("vencido");
      expect(res.esCritico).toBe(true);
      expect(res.texto).toContain("Venció el");
    });

    it("usa el día de Lima aunque UTC ya haya cambiado", () => {
      expect(diasHastaVencimiento("2026-10-04", new Date("2026-10-05T02:00:00Z"))).toBe(0);
      expect(diasHastaVencimiento("2026-10-04", new Date("2026-10-05T05:00:00Z"))).toBe(-1);
    });

    it("reconoce vencimiento hoy", () => {
      const res = calcularEstadoVencimiento("2026-10-04", refDate);
      expect(res.tipo).toBe("hoy");
      expect(res.esCritico).toBe(true);
      expect(res.texto).toBe("¡Vence hoy!");
    });

    it("reconoce vencimiento urgente en 1 a 3 días", () => {
      const manana = calcularEstadoVencimiento("2026-10-05", refDate);
      expect(manana.tipo).toBe("urgente");
      expect(manana.texto).toBe("¡Vence mañana!");
      expect(manana.esCritico).toBe(true);

      const tresDias = calcularEstadoVencimiento("2026-10-07", refDate);
      expect(tresDias.tipo).toBe("urgente");
      expect(tresDias.texto).toBe("Vence en 3 días");
      expect(tresDias.esCritico).toBe(true);
    });

    it("reconoce vencimiento próximo de 4 a 7 días", () => {
      const res = calcularEstadoVencimiento("2026-10-10", refDate);
      expect(res.tipo).toBe("proximo");
      expect(res.esCritico).toBe(false);
      expect(res.texto).toBe("Vence en 6 días");
    });

    it("reconoce vencimiento normal a más de 7 días", () => {
      const res = calcularEstadoVencimiento("2026-10-20", refDate);
      expect(res.tipo).toBe("normal");
      expect(res.esCritico).toBe(false);
      expect(res.texto).toContain("Consumir antes del 20/10/2026");
    });

    it("maneja fechas nulas o con formato inválido", () => {
      expect(calcularEstadoVencimiento(null)).toEqual({
        dias: null,
        tipo: "desconocido",
        texto: "Fecha no especificada",
        esCritico: false,
      });
    });
  });

  describe("calcularNivelStock", () => {
    it("detecta agotado con 0 o negativo", () => {
      expect(calcularNivelStock(0)).toEqual({ nivel: "agotado", texto: "Sin stock disponible", esCritico: true });
      expect(calcularNivelStock(-2)).toEqual({ nivel: "agotado", texto: "Sin stock disponible", esCritico: true });
    });

    it("detecta nivel crítico con 1 a 3 unidades", () => {
      expect(calcularNivelStock(1)).toEqual({ nivel: "critico", texto: "¡Solo queda 1 unidad!", esCritico: true });
      expect(calcularNivelStock(3)).toEqual({ nivel: "critico", texto: "¡Últimas 3 unidades!", esCritico: true });
    });

    it("detecta nivel disponible con más de 3 unidades", () => {
      expect(calcularNivelStock(10)).toEqual({ nivel: "disponible", texto: "10 unidades disponibles", esCritico: false });
    });
  });
});

