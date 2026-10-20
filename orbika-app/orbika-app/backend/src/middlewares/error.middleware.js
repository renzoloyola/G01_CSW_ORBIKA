import { AppError } from "../errors/AppError.js";

export function errorHandler(err, _req, res, _next) {
  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "El archivo o solicitud supera el tamaño permitido.", code: "PAYLOAD_TOO_LARGE" });
  }
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "La solicitud JSON no es válida.", code: "INVALID_JSON" });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code });
  }

  console.error("[api]", err);
  return res.status(500).json({
    error: "Error interno del servidor.",
    code: "INTERNAL_ERROR",
  });
}

