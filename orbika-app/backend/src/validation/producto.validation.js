import {
  datoInvalido,
  enteroPositivo,
  fechaHoyLima,
  fechaISO,
  numeroPositivo,
  texto,
} from "./common.validation.js";

const MODALIDADES = new Set(["recojo", "coordinada", "ambas"]);
const CAMPOS_EDITABLES = new Set([
  "nombre", "descripcion", "precioOriginal", "precioActual",
  "stock", "zona", "modalidadEntrega", "fotoUrl",
]);

function modalidad(value) {
  if (!MODALIDADES.has(value)) throw datoInvalido("La modalidad de entrega no es válida.");
  return value;
}

function urlOpcional(value) {
  if (value == null || value === "") return null;
  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    return parsed.toString();
  } catch {
    throw datoInvalido("La foto debe ser una URL http o https válida.");
  }
}

function validarFecha(value, hoy) {
  const fecha = fechaISO(value, "fecha de vencimiento");
  if (fecha <= hoy) throw datoInvalido("La fecha de vencimiento debe ser posterior a hoy.");
  return fecha;
}

export function validarProductoNuevo(input = {}, hoy = fechaHoyLima()) {
  const precioOriginal = numeroPositivo(input.precioOriginal, "precio original");
  const precioActual = numeroPositivo(input.precioActual, "precio actual");
  if (precioActual > precioOriginal) throw datoInvalido("El precio actual no puede superar el precio original.");

  return {
    categoriaId: enteroPositivo(input.categoriaId, "categoría"),
    nombre: texto(input.nombre, "nombre", { max: 120 }),
    descripcion: texto(input.descripcion, "descripción", { requerido: false, max: 1000 }),
    precioOriginal,
    precioActual,
    fechaVencimiento: validarFecha(input.fechaVencimiento, hoy),
    stock: enteroPositivo(input.stock, "stock"),
    pesoUnidadKg: input.pesoUnidadKg == null || input.pesoUnidadKg === ""
      ? null
      : numeroPositivo(input.pesoUnidadKg, "peso por unidad"),
    zona: texto(input.zona, "zona", { max: 100 }),
    modalidadEntrega: modalidad(input.modalidadEntrega),
    fotoUrl: urlOpcional(input.fotoUrl),
  };
}

export function validarEdicionProducto(input, hoy = fechaHoyLima()) {
  const keys = Object.keys(input || {});
  if (!keys.length) throw datoInvalido("Debes enviar al menos un campo para editar.");
  const prohibido = keys.find((key) => !CAMPOS_EDITABLES.has(key));
  if (prohibido) throw datoInvalido(`El campo ${prohibido} no se puede editar.`);

  const output = {};
  if ("nombre" in input) output.nombre = texto(input.nombre, "nombre", { max: 120 });
  if ("descripcion" in input) output.descripcion = texto(input.descripcion, "descripción", { requerido: false, max: 1000 });
  if ("precioOriginal" in input) output.precioOriginal = numeroPositivo(input.precioOriginal, "precio original");
  if ("precioActual" in input) output.precioActual = numeroPositivo(input.precioActual, "precio actual");
  if ("stock" in input) output.stock = enteroPositivo(input.stock, "stock", { permitirCero: true });
  if ("zona" in input) output.zona = texto(input.zona, "zona", { max: 100 });
  if ("modalidadEntrega" in input) output.modalidadEntrega = modalidad(input.modalidadEntrega);
  if ("fotoUrl" in input) output.fotoUrl = urlOpcional(input.fotoUrl);
  if (output.precioOriginal && output.precioActual && output.precioActual > output.precioOriginal) {
    throw datoInvalido("El precio actual no puede superar el precio original.");
  }
  return output;
}

