import { AppError } from "../errors/AppError.js";

export function datoInvalido(message) {
  return new AppError(400, "VALIDATION_ERROR", message);
}

export function texto(value, nombre, { requerido = true, max = 500 } = {}) {
  const normalizado = typeof value === "string" ? value.trim() : "";
  if (requerido && !normalizado) throw datoInvalido(`El campo ${nombre} es obligatorio.`);
  if (normalizado.length > max) throw datoInvalido(`El campo ${nombre} es demasiado largo.`);
  return normalizado || null;
}

export function enteroPositivo(value, nombre, { permitirCero = false } = {}) {
  const numero = Number(value);
  const minimo = permitirCero ? 0 : 1;
  if (!Number.isInteger(numero) || numero < minimo) {
    throw datoInvalido(`El campo ${nombre} debe ser un entero ${permitirCero ? "no negativo" : "positivo"}.`);
  }
  return numero;
}

export function numeroPositivo(value, nombre) {
  const numero = Number(value);
  if (!Number.isFinite(numero) || numero <= 0) {
    throw datoInvalido(`El campo ${nombre} debe ser mayor que cero.`);
  }
  return numero;
}

export function fechaHoyLima() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function fechaISO(value, nombre) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw datoInvalido(`El campo ${nombre} debe tener formato YYYY-MM-DD.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw datoInvalido(`El campo ${nombre} contiene una fecha inválida.`);
  }
  return value;
}

