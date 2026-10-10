// Pruebas de interfaz en navegador aislado. API y Auth se simulan; no acceden
// a la base remota. ORBIKA_PLAYWRIGHT_ENTRYPOINT permite usar el runtime de Codex.
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
const { chromium } = await import(process.env.ORBIKA_PLAYWRIGHT_ENTRYPOINT
  ? pathToFileURL(process.env.ORBIKA_PLAYWRIGHT_ENTRYPOINT).href : "playwright");
const root = fileURLToPath(new URL("..", import.meta.url));
const servers = [];
let browser;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMesAAAAASUVORK5CYII=", "base64");
const producto = { id: 501, nombre: "Alimento de prueba", descripcion: "Oferta de prueba", precio_original: 10, precio_actual: 5,
  fecha_vencimiento: "2099-01-01", stock: 3, estado: "disponible", categoria_id: 1,
  categorias: { nombre: "Panadería" }, vendedor_id: "seller", perfiles: { nombre_negocio: "Comercio de prueba", ubicacion: "Tacna" },
  modalidad_entrega: "recojo", zona: "Tacna", foto_url: null };
async function start(port, demo) {
  const proc = spawn(process.execPath, [path.join(root, "node_modules/vite/bin/vite.js"), "--host", "127.0.0.1", "--port", String(port), "--strictPort"], {
    cwd: root, windowsHide: true, stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, VITE_DEMO_MODE: String(demo), VITE_SUPABASE_URL: "http://127.0.0.1:54329", VITE_SUPABASE_ANON_KEY: "local-test-key", VITE_API_URL: "http://127.0.0.1:4019/api" },
  });
  servers.push(proc);
  let output = "";
  proc.stdout.on("data", (data) => { output += data; });
  proc.stderr.on("data", (data) => { output += data; });
  const origin = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 100; i++) {
    if (proc.exitCode != null) throw new Error(`Vite no arrancó: ${output}`);
    try { if ((await fetch(origin)).ok) return origin; } catch { /* esperando */ }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Vite tardó demasiado: ${output}`);
}
async function setup(origin) {
  const context = await browser.newContext();
  const state = { actor: "buyer", catalogo: [producto], catalogError: false, rejectCompra: true, rejectPublicacion: true, compras: [], publicaciones: [], imagenes: 0, apiCalls: 0, supabaseCalls: 0 };
  await context.route("**/*", async (route) => {
    const req = route.request(); const url = new URL(req.url());
    if (url.origin === origin) return route.continue();
    const json = (body, status = 200) => route.fulfill({ status, json: body, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*" } });
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: { "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET, POST, PUT, PATCH, OPTIONS" } });
    if (url.pathname.startsWith("/auth/v1/") || url.pathname.startsWith("/rest/v1/")) state.supabaseCalls++;
    if (url.port === "54329") {
      if (url.pathname === "/auth/v1/token") {
        const email = req.postDataJSON().email;
        state.actor = email.startsWith("seller") ? "seller" : "buyer";
        const user = { id: state.actor, email, aud: "authenticated", role: "authenticated", app_metadata: { provider: "email" }, user_metadata: {}, created_at: new Date().toISOString() };
        const enc = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
        const exp = Math.floor(Date.now() / 1000) + 3600;
        return json({ access_token: `${enc({ alg: "HS256", typ: "JWT" })}.${enc({ sub: state.actor, aud: "authenticated", role: "authenticated", exp })}.test`, token_type: "bearer", expires_in: 3600, expires_at: exp, refresh_token: "test-refresh", user });
      }
      if (url.pathname === "/rest/v1/perfiles") return json({ id: state.actor, nombre: "Cuenta de prueba", rol: state.actor === "seller" ? "vendedor" : "comprador", activo: true });
      if (url.pathname === "/rest/v1/categorias") return json([{ id: 1, nombre: "Panadería" }]);
      return json({});
    }
    if (url.port === "4019") {
      state.apiCalls++;
      if (url.pathname === "/api/productos" && req.method() === "GET") return state.catalogError ? json({ error: "Catálogo sin conexión" }, 503) : json(state.catalogo);
      if (url.pathname === "/api/productos/501" && req.method() === "GET") return json(producto);
      if (url.pathname.startsWith("/api/productos/") && req.method() === "GET") return json({ error: "Producto no encontrado" }, 404);
      if (url.pathname === "/api/pedidos" && req.method() === "GET") return json([]);
      if (url.pathname === "/api/pedidos" && req.method() === "POST") {
        state.compras.push(req.postDataJSON());
        return state.rejectCompra ? json({ error: "Stock insuficiente" }, 409) : json({ id: 901, estado: "creado", monto_total: 5 });
      }
      if (url.pathname === "/api/imagenes") {
        assert.equal(req.headers()["content-type"], "image/png");
        assert.deepEqual(req.postDataBuffer(), png);
        state.imagenes++;
        return json({ url: "https://example.test/foto.png" }, 201);
      }
      if (url.pathname === "/api/productos" && req.method() === "POST") {
        state.publicaciones.push(req.postDataJSON());
        return state.rejectPublicacion ? json({ error: "Publicación rechazada" }, 409) : json({ id: 502 }, 201);
      }
      return json({ error: "Ruta de prueba no encontrada" }, 404);
    }
    // Ninguna petición externa de fuentes o imágenes sale del navegador de prueba.
    return route.fulfill({ status: 200, body: png, contentType: "image/png" });
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.setDefaultTimeout(10000);
  return { context, page, state, errors };
}
async function login(page, origin, actor) {
  await page.goto(`${origin}/iniciar-sesion`);
  await page.locator('input[name="correo"]').fill(`${actor}@example.test`);
  await page.locator('input[name="contrasena"]').fill("TestPassword123!");
  await page.getByRole("button", { name: "Ingresar a mi cuenta", exact: true }).click();
  await page.getByText("Cuenta de prueba", { exact: true }).first().waitFor();
}
try {
  const liveOrigin = await start(5187, false);
  const demoOrigin = await start(5188, true);
  browser = await chromium.launch({ channel: process.env.ORBIKA_BROWSER_CHANNEL || "msedge", headless: true });
  const live = await setup(liveOrigin);
  const { page, state } = live;
  state.catalogo = [];
  await page.goto(`${liveOrigin}/catalogo`);
  await page.getByText("No se encontraron productos", { exact: true }).waitFor();
  assert.equal(await page.locator("main article").count(), 0);
  state.catalogError = true;
  await page.reload();
  await page.getByText("Catálogo sin conexión", { exact: true }).waitFor();
  assert.equal(await page.locator("main article").count(), 0);
  state.catalogError = false; state.catalogo = [producto];
  await page.goto(`${liveOrigin}/registrarse`);
  await page.getByRole("radio", { name: "Comercio / Vendedor", exact: true }).click();
  assert.equal(await page.locator('[name="rol"]').inputValue(), "vendedor");
  await page.getByRole("radio", { name: "Comprador", exact: true }).click();
  assert.equal(await page.locator('[name="rol"]').inputValue(), "comprador");
  await login(page, liveOrigin, "buyer");
  await page.goto(`${liveOrigin}/productos/999999`);
  await page.getByText("Producto no encontrado", { exact: true }).waitFor();
  await page.goto(`${liveOrigin}/mis-pedidos`);
  await page.getByText("Todavía no tienes pedidos", { exact: true }).waitFor();
  assert.equal(await page.locator("main article").count(), 0);
  await page.goto(`${liveOrigin}/productos/501`);
  await page.getByRole("button", { name: "Rescatar este alimento ahora", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar compra", exact: true }).click();
  await page.getByText("Stock insuficiente", { exact: true }).first().waitFor();
  assert.equal(await page.getByText(/generado exitosamente/).count(), 0);
  assert.equal(await page.locator("#cantidad-input").getAttribute("max"), "3");
  state.rejectCompra = false;
  await page.getByRole("button", { name: "Rescatar este alimento ahora", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar compra", exact: true }).click();
  await page.getByText("¡Pedido N.° 901 generado exitosamente!", { exact: true }).waitFor();
  assert.equal(state.compras[0].claveIdempotencia, state.compras[1].claveIdempotencia);
  assert.equal(await page.locator("#cantidad-input").getAttribute("max"), "2");
  assert.deepEqual(live.errors, []);
  await live.context.close();
  console.log("PASS interfaz comprador: vacío, error, 404, compra rechazada y reintento confirmado");

  const seller = await setup(liveOrigin);
  await login(seller.page, liveOrigin, "seller");
  await seller.page.goto(`${liveOrigin}/publicar`);
  for (const [name, value] of Object.entries({ nombre: "Pan de prueba", precioOriginal: "10", precioActual: "5", stock: "2", fechaVencimiento: "2099-01-01", zona: "Tacna" })) {
    await seller.page.locator(`[name="${name}"]`).fill(value);
  }
  await seller.page.locator('[name="categoriaId"]').selectOption("1");
  await seller.page.locator('input[type="file"]').setInputFiles({ name: "prueba.png", mimeType: "image/png", buffer: png });
  await seller.page.getByRole("button", { name: "Publicar en el catálogo", exact: true }).click();
  await seller.page.getByText("Publicación rechazada", { exact: true }).waitFor();
  assert.equal(new URL(seller.page.url()).pathname, "/publicar");
  assert.equal(seller.state.publicaciones[0].fotoUrl, "https://example.test/foto.png");
  seller.state.rejectPublicacion = false;
  await seller.page.getByRole("button", { name: "Publicar en el catálogo", exact: true }).click();
  await seller.page.waitForURL(`${liveOrigin}/catalogo`);
  assert.equal(seller.state.imagenes, 1);
  await seller.page.goto(`${liveOrigin}/productos/501/editar`);
  for (const name of ["categoriaId", "fechaVencimiento", "pesoUnidadKg"]) {
    assert.equal(await seller.page.locator(`[name="${name}"]`).isDisabled(), true);
  }
  assert.equal(await seller.page.locator('[name="stock"]').getAttribute("min"), "0");
  assert.deepEqual(seller.errors, []);
  await seller.context.close();
  console.log("PASS interfaz vendedor: imagen binaria, rechazo visible y publicación confirmada");

  const demo = await setup(demoOrigin);
  await demo.page.setViewportSize({ width: 320, height: 740 });
  await demo.page.goto(`${demoOrigin}/catalogo`);
  await demo.page.getByText(/Demostración de solo lectura · Productos/).waitFor();
  await demo.page.getByText("Pack de Pan Artesanal de Masa Madre", { exact: true }).first().waitFor();
  assert.equal(await demo.page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false);
  if (process.env.ORBIKA_QA_OUTPUT) {
    await mkdir(process.env.ORBIKA_QA_OUTPUT, { recursive: true });
    await demo.page.screenshot({ path: path.join(process.env.ORBIKA_QA_OUTPUT, "catalogo-mobile.png"), fullPage: true });
    await demo.page.screenshot({ path: path.join(process.env.ORBIKA_QA_OUTPUT, "catalogo-mobile-viewport.png") });
  }
  await demo.page.goto(`${demoOrigin}/productos/1`);
  assert.equal(await demo.page.getByRole("button", { name: "Demostración: solo lectura", exact: true }).isDisabled(), true);
  await demo.page.goto(`${demoOrigin}/mis-pedidos`);
  await demo.page.locator("main article").first().waitFor();
  assert.equal(await demo.page.getByRole("button", { name: "Cancelar pedido", exact: true }).count(), 0);
  assert.equal(demo.state.apiCalls, 0);
  assert.equal(demo.state.supabaseCalls, 0);
  assert.deepEqual(demo.errors, []);
  await demo.context.close();
  console.log("PASS demostración: datos de ejemplo, escrituras deshabilitadas y ninguna llamada a la API");
} finally {
  if (browser) await browser.close();
  for (const server of servers) server.kill();
}
