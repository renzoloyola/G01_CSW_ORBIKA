import { supabaseAdmin } from "../config/supabaseClient.js";
import { AppError } from "../errors/AppError.js";
import { texto, datoInvalido } from "../validation/common.validation.js";

export async function actualizarPerfil(actor, input, db = supabaseAdmin) {
  // El actor viene de la sesión validada y nunca se toma un ID del cuerpo enviado por el navegador.
  if (!actor?.id) throw new AppError(401, "UNAUTHORIZED", "Inicia sesión para editar tu perfil.");
  const campos = { nombre: 100, telefono: 30, direccion: 300, foto_url: 2000 };
  if (actor.rol === "vendedor") Object.assign(campos, { nombre_negocio: 150, ubicacion: 200 });
  if (!input || Array.isArray(input) || typeof input !== "object" || !Object.keys(input).length) {
    throw datoInvalido("Indica los datos que deseas actualizar.");
  }
  const cambios = {};
  // La lista permitida cambia según el rol para proteger permisos y campos de otros usuarios.
  for (const [campo, valor] of Object.entries(input)) {
    if (!Object.hasOwn(campos, campo)) throw datoInvalido(`No se permite modificar el campo ${campo}.`);
    if (typeof valor !== "string" && valor !== null) throw datoInvalido(`El campo ${campo} debe ser texto.`);
    cambios[campo] = texto(valor, campo, { requerido: campo === "nombre" || campo === "nombre_negocio", max: campos[campo] });
    if (campo === "foto_url" && cambios[campo]) {
      const { data } = db.storage.from("orbika-perfiles").getPublicUrl(`${actor.id}/`);
      if (!cambios[campo].startsWith(data.publicUrl) || /\.\.|%2e|%2f/i.test(cambios[campo])) throw datoInvalido("La fotografía debe pertenecer a tu perfil.");
    }
    if (campo === "telefono" && cambios[campo] && !/^[+\d\s()-]{6,30}$/.test(cambios[campo])) throw datoInvalido("El teléfono no es válido.");
  }
  const { data, error } = await db.from("perfiles").update(cambios).eq("id", actor.id).eq("rol", actor.rol).select().single();
  if (error || !data) throw new AppError(502, "PROFILE_UPDATE_FAILED", "No se pudo guardar el perfil. Reintenta.");
  return data;
}
