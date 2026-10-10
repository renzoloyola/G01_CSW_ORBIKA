import { describe, expect, it, vi } from "vitest";
import { AppError } from "../src/errors/AppError.js";
import { errorHandler } from "../src/middlewares/error.middleware.js";

function responseDouble() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

describe("manejo HTTP de errores", () => {
  it.each([400, 403, 404, 409])("conserva el estado seguro %s", (status) => {
    const res = responseDouble();
    errorHandler(new AppError(status, "REGLA", "Mensaje seguro"), {}, res, vi.fn());
    expect(res.statusCode).toBe(status);
    expect(res.body).toEqual({ error: "Mensaje seguro", code: "REGLA" });
  });

  it("oculta detalles internos al navegador", () => {
    const res = responseDouble();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    errorHandler(new Error("SUPABASE_SERVICE_ROLE_KEY=secreto"), {}, res, vi.fn());
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: "Error interno del servidor.", code: "INTERNAL_ERROR" });
    expect(JSON.stringify(res.body)).not.toContain("secreto");
    spy.mockRestore();
  });
});
