export function normalizarRolPublico(rol) {
  return rol === "vendedor" ? "vendedor" : "comprador";
}

export function rutaRecuperacion(origin = window.location.origin) {
  return `${origin.replace(/\/$/, "")}/actualizar-contrasena`;
}

export function validarNuevaContrasena(contrasena, confirmacion) {
  if (typeof contrasena !== "string" || contrasena.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (contrasena !== confirmacion) return "Las contraseñas no coinciden.";
  return null;
}

export function validarDatosVendedor(rol, datos) {
  if (rol !== "vendedor") return null;
  if (!datos.nombreNegocio?.trim()) return "El nombre del negocio es obligatorio.";
  if (!datos.ubicacion?.trim()) return "La ubicación del negocio es obligatoria.";
  return null;
}

