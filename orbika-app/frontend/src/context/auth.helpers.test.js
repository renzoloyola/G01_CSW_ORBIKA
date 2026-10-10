import { describe, expect, it } from "vitest";
import { normalizarRolPublico, rutaRecuperacion, validarDatosVendedor, validarNuevaContrasena } from "./auth.helpers.js";

describe("helpers de autenticación", () => {
  it.each([
    ["vendedor", "vendedor"],
    ["comprador", "comprador"],
    ["administrador", "comprador"],
    [undefined, "comprador"],
  ])("normaliza %s como %s", (input, expected) => {
    expect(normalizarRolPublico(input)).toBe(expected);
  });

  it("crea la ruta de retorno para restablecer contraseña", () => {
    expect(rutaRecuperacion("https://orbika.pe/")).toBe("https://orbika.pe/actualizar-contrasena");
  });

  it("exige una contraseña robusta y coincidente", () => {
    expect(validarNuevaContrasena("DemoNueva2026!", "DemoNueva2026!")).toBeNull();
    expect(validarNuevaContrasena("corta", "corta")).toContain("8");
    expect(validarNuevaContrasena("DemoNueva2026!", "otra")).toContain("coinciden");
  });

  it("exige negocio y ubicación únicamente al vendedor", () => {
    expect(validarDatosVendedor("comprador", {})).toBeNull();
    expect(validarDatosVendedor("vendedor", { nombreNegocio: "", ubicacion: "Centro" })).toContain("negocio");
    expect(validarDatosVendedor("vendedor", { nombreNegocio: "Bodega", ubicacion: "" })).toContain("ubicación");
  });
});
