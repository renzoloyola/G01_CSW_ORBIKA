import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase para el navegador: usa la clave "anon" (pública) y
// queda sujeto a las políticas de Row-Level Security definidas en
// supabase/migrations/001_init_schema.sql.
const demo = import.meta.env.VITE_DEMO_MODE === "true";
export const supabase = createClient(
  demo ? "https://demo.invalid" : import.meta.env.VITE_SUPABASE_URL,
  demo ? "demo-only" : import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: !demo, persistSession: !demo, detectSessionInUrl: !demo } }
);
