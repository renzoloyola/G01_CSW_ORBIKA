import { datoInvalido, enteroPositivo, texto } from "./common.validation.js";

export const TRANSICIONES_PEDIDO = Object.freeze({
  // Define el flujo permitido. La cancelación se procesa por su función transaccional propia.
  creado: ["preparando"],
  preparando: ["listo_para_entrega"],
  listo_para_entrega: ["entregado"],
  entregado: ["completado"],
  completado: [],
  cancelado: [],
});

export function validarCompra(input) {
  // Rechaza valores incompatibles con las columnas numéricas y los límites de PostgreSQL.
  for (const campo of ["productoId", "cantidad"]) {
    const valor = input?.[campo];
    if (!["number", "string"].includes(typeof valor) || !Number.isSafeInteger(Number(valor))
      || Number(valor) <= 0 || (campo === "cantidad" && Number(valor) > 2147483647)) {
      throw datoInvalido(`El campo ${campo === "productoId" ? "producto" : campo} debe ser un entero positivo válido.`);
    }
  }
  const modalidadEntrega = input?.modalidadEntrega;
  if (!["recojo", "coordinada"].includes(modalidadEntrega)) {
    throw datoInvalido("La modalidad de entrega no es válida.");
  }
  const referenciaEntrega = texto(input?.referenciaEntrega, "referencia de entrega", {
    requerido: modalidadEntrega === "coordinada",
    max: 300,
  });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input?.claveIdempotencia || "")) {
    throw datoInvalido("La clave de confirmación de compra no es válida.");
  }
  return {
    claveIdempotencia: input.claveIdempotencia,
    productoId: enteroPositivo(input?.productoId, "producto"),
    cantidad: enteroPositivo(input?.cantidad, "cantidad"),
    modalidadEntrega,
    referenciaEntrega,
  };
}

export function validarCancelacion(input) {
  return { motivo: texto(input?.motivo, "motivo de cancelación", { max: 300 }) };
}

export function validarCambioEstado(input) {
  const estado = input?.estado;
  if (!Object.hasOwn(TRANSICIONES_PEDIDO, estado) || estado === "creado" || estado === "cancelado") {
    throw datoInvalido("El estado solicitado no es válido.");
  }
  return { estado };
}

export function validarCalificacion(input) {
  // Puntaje y comentario se normalizan antes de llegar a la base de datos.
  if (!["number", "string"].includes(typeof input?.puntaje)) throw datoInvalido("El puntaje debe ser un entero entre 1 y 5.");
  const puntaje = enteroPositivo(input?.puntaje, "puntaje");
  if (puntaje > 5) throw datoInvalido("El puntaje debe estar entre 1 y 5.");
  return {
    puntaje,
    comentario: texto(input?.comentario, "comentario", { requerido: false, max: 1000 }),
  };
}
