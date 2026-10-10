import "dotenv/config";
import { supabaseAdmin } from "../src/config/supabaseClient.js";
import { seedDemo } from "../src/demo/seed-demo.js";
import { createSupabaseDemoRepository } from "../src/demo/supabase-demo.repository.js";

try {
  const result = await seedDemo({ repo: createSupabaseDemoRepository(supabaseAdmin) });
  console.log("Datos de demostración cargados:", result);
} catch (error) {
  console.error("No se pudo cargar la demostración:", error.message);
  process.exitCode = 1;
}

