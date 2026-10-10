import { supabaseAdmin } from "../config/supabaseClient.js";

/**
 * Verifica el token JWT que Supabase Auth emitió al iniciar sesión
 * (ver Diagrama de Secuencia — Autenticación, SAD sección 3.2.2).
 * Deja al usuario autenticado disponible en req.user y su perfil en req.perfil.
 */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "No se envió un token de sesión." });
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: "Sesión inválida o expirada." });
    }

    const { data: perfil, error: perfilError } = await supabaseAdmin
      .from("perfiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (perfilError || !perfil) {
      return res.status(401).json({ error: "No se encontró el perfil del usuario." });
    }

    req.user = data.user;
    req.perfil = perfil;
    next();
  } catch (err) {
    console.error("[auth.middleware]", err);
    res.status(500).json({ error: "Error validando la sesión." });
  }
}

/** Exige además que el perfil tenga uno de los roles indicados (ej. 'vendedor'). */
export function requireRole(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.perfil || !rolesPermitidos.includes(req.perfil.rol)) {
      return res.status(403).json({ error: "No tienes permiso para esta acción." });
    }
    next();
  };
}
