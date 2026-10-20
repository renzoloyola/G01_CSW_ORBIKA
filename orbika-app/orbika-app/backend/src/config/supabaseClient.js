import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// El backend usa la service_role key: puede saltarse RLS cuando lo necesite
// (por ejemplo, para crear notificaciones a nombre de otro usuario),
// por eso esta clave NUNCA debe llegar al frontend.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    "[ÓrbiKa] Falta configurar SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en backend/.env"
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
