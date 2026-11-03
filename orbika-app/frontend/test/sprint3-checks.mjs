import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export async function comprobarSprint3({ origin, setup, login, producto, browser, root }) {
  const output = process.env.ORBIKA_QA_OUTPUT || path.join(root, "test-results/sprint-03");
  await mkdir(output, { recursive: true });
  const foto = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="#e8dfc6"/><ellipse cx="320" cy="245" rx="185" ry="90" fill="#ad793d"/><text x="320" y="400" text-anchor="middle" font-family="sans-serif" font-size="24">Producto de prueba</text></svg>')}`;
  const oferta = { ...producto, nombre: "Pan integral", descripcion: "Pan integral de prueba, bolsa de seis unidades.", foto_url: foto, precio_actual: 5.25 };
  const fixtures = [oferta,
    { ...oferta, id: 502, nombre: "Pan familiar", precio_actual: 7 },
    { ...oferta, id: 503, nombre: "Pan de Pocollay", zona: "Pocollay", precio_actual: 4 },
    { ...oferta, id: 504, nombre: "Manzanas", categoria_id: 2, categorias: { nombre: "Frutas" }, precio_actual: 4 },
    { ...oferta, id: 505, nombre: "Galletas", precio_actual: 3 },
  ];
  const cards = (page) => page.locator('main a[aria-label^="Ver detalles de"]');
  const esperarTarjetas = (page, cantidad) => page.waitForFunction(
    (esperadas) => document.querySelectorAll('main a[aria-label^="Ver detalles de"]').length === esperadas,
    cantidad,
  );
  const ready = async (page, ruta) => {
    if (ruta === "/catalogo") {
      await cards(page).nth(4).waitFor();
      await page.locator('select[name="categoriaId"] option[value="2"]').waitFor({ state: "attached" });
    } else {
      await page.getByRole("heading", { name: "Pan integral", exact: true }).waitFor();
      await page.getByText("Comercio de prueba", { exact: true }).waitFor();
    }
    // Incluye imágenes visibles y dos cuadros de pintura; no solo la respuesta HTTP.
    await page.evaluate(async () => {
      const visibles = [...document.querySelectorAll("main img")].filter((img) => {
        const r = img.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0;
      });
      await Promise.all(visibles.map((img) => img.decode()));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
  };
  const t = await setup(origin);
  try {
    t.state.catalogo = fixtures;
    const p = t.page;
    await p.setViewportSize({ width: 1440, height: 1000 });
    await p.goto(`${origin}/catalogo`);
    await ready(p, "/catalogo");
    // Elegir una categoría en escritorio debe aplicarla sin un segundo clic.
    const categoriaFrutas = p.waitForResponse((r) => new URL(r.url()).searchParams.get("categoriaId") === "2");
    await p.locator('select[name="categoriaId"]').selectOption("2");
    await categoriaFrutas;
    await esperarTarjetas(p, 1);
    assert.match(await cards(p).innerText(), /Manzanas/);
    assert.equal(await p.getByRole("button", { name: "Frutas", exact: true }).getAttribute("aria-pressed"), "true");

    await p.locator('select[name="categoriaId"]').selectOption("1");
    await esperarTarjetas(p, 4);
    assert.equal(await cards(p).filter({ hasText: "Manzanas" }).count(), 0);
    // Pulsar otra vez la categoría activa no debe quitar el filtro.
    await p.getByRole("button", { name: "Panadería", exact: true }).click();
    await esperarTarjetas(p, 4);
    assert.equal(await p.locator('select[name="categoriaId"]').inputValue(), "1");
    assert.equal(t.state.catalogRequests.at(-1).categoriaId, "1");
    await p.getByRole("button", { name: "Frutas", exact: true }).click();
    await esperarTarjetas(p, 1);
    assert.match(await cards(p).innerText(), /Manzanas/);
    await p.getByRole("button", { name: "Todas", exact: true }).click();
    await ready(p, "/catalogo");

    await p.locator('[name="busqueda"]').fill("pan");
    await p.locator('select[name="categoriaId"]').selectOption("1");
    await p.locator('[name="zona"]').fill("Tacna");
    await p.locator('[name="maxPrecio"]').fill("5.25");
    assert.equal(await p.locator('[name="maxPrecio"]').evaluate((el) => el.checkValidity()), true);
    await p.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
    await cards(p).filter({ hasText: "Pan integral" }).waitFor();
    await esperarTarjetas(p, 1);
    assert.equal(await cards(p).count(), 1);
    assert.deepEqual(t.state.catalogRequests.at(-1), { busqueda: "pan", categoriaId: "1", zona: "Tacna", maxPrecio: "5.25", orden: "recientes" });
    await p.screenshot({ path: path.join(output, "filtros-combinados.png"), fullPage: true });

    await p.locator('[name="maxPrecio"]').fill("1");
    await p.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
    await p.getByText("No se encontraron productos", { exact: true }).waitFor();
    assert.equal(await cards(p).count(), 0);
    await p.screenshot({ path: path.join(output, "sin-resultados.png"), fullPage: true });
    await p.getByRole("button", { name: "Restablecer filtros", exact: true }).click();
    await ready(p, "/catalogo");

    // Retiene una búsqueda antigua hasta que la nueva ya se ha mostrado.
    t.state.slowSearch = "pan";
    await p.locator('[name="busqueda"]').fill("pan");
    await p.getByRole("button", { name: "Buscar", exact: true }).click();
    for (let n = 0; !t.state.releaseSlow && n < 100; n++) await new Promise((r) => setTimeout(r, 20));
    assert(t.state.releaseSlow, "La búsqueda retenida debe haber llegado a la API");
    await p.locator('[name="busqueda"]').fill("Manzanas");
    await p.getByRole("button", { name: "Buscar", exact: true }).click();
    await cards(p).filter({ hasText: "Manzanas" }).waitFor();
    const response = p.waitForResponse((r) => new URL(r.url()).searchParams.get("busqueda") === "pan");
    t.state.releaseSlow();
    await response;
    await p.waitForTimeout(150);
    assert.equal(await cards(p).count(), 1);
    assert.match(await cards(p).innerText(), /Manzanas/);
    t.state.slowSearch = null;

    t.state.categoriasError = true;
    t.state.catalogo = [];
    await p.reload();
    await p.getByText("No se pudieron cargar las categorías.", { exact: true }).waitFor();
    assert.equal(await p.getByText("No se encontraron productos", { exact: true }).count(), 0);
    t.state.categoriasError = false;
    t.state.catalogo = fixtures;
    await p.getByRole("button", { name: "Reintentar carga", exact: true }).click();
    await ready(p, "/catalogo");
    assert.equal(await p.getByText("No se pudieron cargar las categorías.", { exact: true }).count(), 0);

    await p.goto(`${origin}/productos/501`);
    await ready(p, "/productos/501");
    for (const texto of [oferta.descripcion, "S/ 5.25", "-47.5% OFF", "01/01/2099", "¡Últimas 3 unidades!"]) {
      assert((await p.locator("main").innerText()).includes(texto), `Detalle incompleto: ${texto}`);
    }
    assert(await p.getByRole("img", { name: "Pan integral", exact: true }).evaluate((img) => img.naturalWidth > 0));
    await p.screenshot({ path: path.join(output, "detalle.png"), fullPage: true });
    await p.goto(`${origin}/productos/999999`);
    await p.getByRole("button", { name: "Volver al catálogo", exact: true }).click();
    await p.waitForURL(`${origin}/catalogo`);

    await p.setViewportSize({ width: 320, height: 740 });
    await ready(p, "/catalogo");
    await p.getByRole("button", { name: "Abrir panel de filtros", exact: true }).click();
    const modal = p.getByRole("dialog");
    await modal.locator('select[name="categoriaId"]').selectOption("1");
    await modal.locator('[name="maxPrecio"]').fill("5.25");
    await modal.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
    await cards(p).nth(2).waitFor();
    await esperarTarjetas(p, 3);
    assert.equal(await cards(p).count(), 3);
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await p.screenshot({ path: path.join(output, "catalogo-320.png"), fullPage: true });
    await p.goto(`${origin}/productos/501`);
    await ready(p, "/productos/501");
    assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await p.screenshot({ path: path.join(output, "detalle-320.png"), fullPage: true });

    await p.setViewportSize({ width: 1440, height: 1000 });
    await login(p, origin, "seller");
    t.state.pedidos = [{ id: 901, productos: { nombre: "Pan integral" }, cantidad: 1, monto_total: 5.25,
      estado: "creado", fecha_creacion: "2026-10-25T12:00:00Z", modalidad_entrega: "recojo" }];
    await p.goto(`${origin}/mis-pedidos`);
    await p.getByRole("heading", { name: "Mis ventas y pedidos", exact: true }).waitFor();
    await p.locator("main article").waitFor();
    await p.screenshot({ path: path.join(output, "mis-ventas.png"), fullPage: true });
    t.state.pedidoError = true;
    await p.reload();
    await p.getByText("El historial de pedidos no está disponible temporalmente.", { exact: true }).waitFor();
    assert.equal(await p.getByText("Aún no tienes ventas registradas", { exact: true }).count(), 0);
    t.state.pedidoError = false; t.state.pedidos = [];
    await p.getByRole("button", { name: "Reintentar", exact: true }).click();
    await p.getByText("Aún no tienes ventas registradas", { exact: true }).waitFor();
    assert.deepEqual(t.errors, []);
  } finally { await t.context.close(); }
  console.log("PASS sprint 3: filtros combinados/decimal/vacío/móvil, respuesta obsoleta, categorías, detalle y ventas/error/reintento");

  const muestras = [];
  for (let n = 1; n <= 20; n++) {
    for (const ruta of ["/catalogo", "/productos/501"]) {
      const t = await setup(origin); // Contexto limpio: sin sesión ni caché del navegador.
      try {
        t.state.catalogo = fixtures; t.state.delay = 80;
        await t.page.setViewportSize({ width: 1440, height: 1000 });
        const inicio = performance.now();
        await t.page.goto(`${origin}${ruta}`, { waitUntil: "domcontentloaded" });
        await ready(t.page, ruta);
        muestras.push({ pagina: ruta === "/catalogo" ? "catalogo" : "detalle", muestra: n, ms: Math.round(performance.now() - inicio) });
        assert.deepEqual(t.errors, []);
      } finally { await t.context.close(); }
    }
  }
  const resumen = Object.fromEntries(["catalogo", "detalle"].map((pagina) => {
    const tiempos = muestras.filter((m) => m.pagina === pagina).map((m) => m.ms).sort((a, b) => a-b);
    return [pagina, { n: tiempos.length, p95_ms: tiempos[Math.ceil(tiempos.length * .95)-1], max_ms: Math.max(...tiempos) }];
  }));
  const reporte = { fecha: new Date().toISOString(), entorno: { sistema: `${os.platform()} ${os.release()}`, cpu: os.cpus()[0]?.model,
    ramGiB: Math.round(os.totalmem()/1024**3), node: process.version, navegador: browser.version(), build: "Vite producción, preview local",
    viewport: "1440x1000", concurrencia: 1, productos: fixtures.length, api: "Simulada; 80 ms añadidos por lectura de catálogo/detalle",
    cache: "Contexto nuevo por navegación; proceso servidor caliente", medicion: "Navegación hasta datos, imágenes visibles decodificadas y dos cuadros de pintura",
    limite: "No mide Express, Supabase, correo, red de producción ni carga concurrente. No acredita RNF-02 en despliegue real." }, resumen, muestras };
  await writeFile(path.join(output, "rendimiento.json"), JSON.stringify(reporte, null, 2));
  await writeFile(path.join(output, "tiempos.csv"), "pagina,muestra,ms\n" + muestras.map((m) => `${m.pagina},${m.muestra},${m.ms}`).join("\n") + "\n");
  console.log(JSON.stringify(resumen));
  assert(Object.values(resumen).every((r) => r.p95_ms <= 3000), "p95 supera 3 segundos en el entorno controlado");
}
