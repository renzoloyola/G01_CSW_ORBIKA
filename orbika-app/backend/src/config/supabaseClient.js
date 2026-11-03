import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// El backend usa una clave secreta (sb_secret_) o service_role: puede saltarse RLS
// (por ejemplo, para crear notificaciones a nombre de otro usuario),
// por eso esta clave NUNCA debe llegar al frontend.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey || /TU-PROYECTO/i.test(supabaseUrl)
  || (!supabaseServiceKey.startsWith("sb_secret_") && supabaseServiceKey.split(".").length !== 3)) {
  throw new Error(
    "[ÓrbiKa] Configura la URL real y la clave secreta de Supabase en backend/.env (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). No uses los valores de ejemplo."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
