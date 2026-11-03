// Medición pública de solo lectura: frontend compilado + Express + Supabase real.
// No inicia sesiones ni crea productos o pedidos. No imprime claves/identidades.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import { chromium } from "playwright";
import dotenv from "../../backend/node_modules/dotenv/lib/main.js";

const root = fileURLToPath(new URL("..", import.meta.url));
dotenv.config({ path: path.join(root, "../backend/.env") });
const origin = "http://127.0.0.1:5190";
process.env.FRONTEND_URL = origin;
const { createApp } = await import("../../backend/src/app.js");
const { supabaseAdmin: db } = await import("../../backend/src/config/supabaseClient.js");
const { buscarProductos, obtenerProducto } = await import("../../backend/src/services/producto.service.js");
const output = process.env.ORBIKA_QA_OUTPUT || path.join(root, "test-results/sprint-03");
let server, preview, browser;
const children = [];
function vite(args, env) {
  const child = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), ...args], { cwd: root, env, windowsHide: true, stdio: "pipe" });
  children.push(child);
  return child;
}
try {
  const catalogo = await buscarProductos();
  const { data, error } = await db.from("productos").select("id").order("id").limit(1).abortSignal(AbortSignal.timeout(15000));
  assert(!error && data?.length, "Se necesita al menos un producto persistido para medir el detalle.");
  const producto = await obtenerProducto(catalogo[0]?.id || data[0].id);
  const env = { ...process.env, VITE_API_URL: "http://127.0.0.1:4119/api", VITE_DEMO_MODE: "false" };
  await new Promise((resolve, reject) => {
    const build = vite(["build", "--outDir", "test-results/performance-live-build"], env);
    let output = "";
    build.stderr.on("data", (d) => { output += d; });
    build.on("error", reject);
    build.on("exit", (code) => code === 0 ? resolve() : reject(new Error(output)));
  });
  server = await new Promise((resolve, reject) => {
    const s = createApp().listen(4119, "127.0.0.1", () => resolve(s)); s.on("error", reject);
  });
  preview = vite(["preview", "--host", "127.0.0.1", "--port", "5190", "--strictPort", "--outDir", "test-results/performance-live-build"], env);
  let ready = false;
  for (let n = 0; n < 100; n++) {
    assert(preview.exitCode == null, "El servidor de prueba no pudo iniciar.");
    try { if ((await fetch(origin)).ok) { ready = true; break; } } catch { /* inicio */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  assert(ready, "El servidor no respondió.");
  browser = await chromium.launch({ channel: process.env.ORBIKA_BROWSER_CHANNEL || "msedge", headless: true });
  const muestras = [];
  for (let n = 1; n <= 20; n++) {
    for (const pagina of ["catalogo", "detalle"]) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(30000);
        const fallos = [];
        page.on("pageerror", (error) => fallos.push(error.message));
        const inicio = performance.now();
        await page.goto(`${origin}/${pagina === "catalogo" ? "catalogo" : `productos/${producto.id}`}`, { waitUntil: "domcontentloaded" });
        if (pagina === "catalogo") {
          if (catalogo.length) await page.locator('main a[aria-label^="Ver detalles de"]').first().waitFor();
          else await page.getByText("No se encontraron productos", { exact: true }).waitFor();
          await page.locator('select[name="categoriaId"] option').nth(1).waitFor({ state: "attached" });
        } else await page.getByRole("heading", { name: producto.nombre, exact: true }).waitFor();
        const imagenesFallidas = await page.evaluate(async () => {
          const images = [...document.querySelectorAll("main img")].filter((img) => { const r = img.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; });
          const results = await Promise.allSettled(images.map((img) => img.decode()));
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          return results.filter((r) => r.status === "rejected").length;
        });
        assert.deepEqual(fallos, []);
        muestras.push({ pagina, muestra: n, ms: Math.round(performance.now()-inicio), imagenesFallidas });
      } finally { await context.close(); }
    }
    if (n % 5 === 0) console.log(`Medición real: ${n}/20 muestras por página`);
  }
  const resumen = Object.fromEntries(["catalogo", "detalle"].map((pagina) => {
    const values = muestras.filter((m) => m.pagina === pagina).map((m) => m.ms).sort((a,b) => a-b);
    return [pagina, { n: values.length, p95_ms: values[Math.ceil(values.length*.95)-1], max_ms: Math.max(...values) }];
  }));
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, "rendimiento-remoto.json"), JSON.stringify({ fecha: new Date().toISOString(), entorno: {
    sistema: `${os.platform()} ${os.release()}`, cpu: os.cpus()[0]?.model, ramGiB: Math.round(os.totalmem()/1024**3),
    node: process.version, navegador: browser.version(), viewport: "1440x1000", concurrencia: 1,
    aplicacion: "Vite compilado y Express locales; Supabase alojado real; sin interceptar peticiones",
    cache: "Contexto nuevo por navegación; servidor caliente tras lecturas iniciales; sin limitar CPU/red",
    medicion: "Navegación hasta datos, categorías, imágenes visibles decodificadas y dos cuadros de pintura",
    productosDisponibles: catalogo.length, estadoDetalle: producto.estado,
    limitacion: "Catálogo medido con los datos actualmente disponibles. No acredita catálogo poblado bajo concurrencia ni despliegue web remoto completo."
  }, resumen, muestras }, null, 2));
  await writeFile(path.join(output, "tiempos-remotos.csv"), "pagina,muestra,ms,imagenes_fallidas\n" + muestras.map((m) => `${m.pagina},${m.muestra},${m.ms},${m.imagenesFallidas}`).join("\n") + "\n");
  console.log(JSON.stringify(resumen));
  if (Object.values(resumen).some((r) => r.p95_ms > 3000) || muestras.some((m) => m.imagenesFallidas)) process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  for (const child of children) if (child.exitCode == null) child.kill();
  if (server) await new Promise((r) => server.close(r));
}
