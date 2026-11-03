import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Comprueba la interfaz compilada; API y Auth son ficticias. La concurrencia
// de PostgreSQL se ensaya separadamente en backend/scripts/test-sprint4-concurrency.js.
export async function comprobarSprint4({ origin, setup, login, producto, root }) {
  const output = process.env.ORBIKA_QA_OUTPUT || path.join(root, "test-results/sprint-04");
  await mkdir(output, { recursive: true });
  const cases = [];
  const buy = (page) => page.getByRole("button", { name: "Rescatar este alimento ahora", exact: true });
  const confirm = (page) => page.getByRole("button", { name: "Confirmar compra", exact: true });
  const success = (page) => page.getByText("¡Pedido N.° 901 generado exitosamente!", { exact: true });
  async function capture(page, name, fullPage = true) {
    await page.evaluate(async () => {
      window.scrollTo(0, 0);
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    await page.screenshot({ path: path.join(output, name), fullPage });
  }
  async function scenario(name, run) {
    const t = await setup(origin);
    try {
      t.state.rejectCompra = false;
      await login(t.page, origin, "buyer");
      await t.page.goto(`${origin}/productos/501`);
      await buy(t.page).waitFor();
      await run(t);
      assert.deepEqual(t.errors, []);
      cases.push({ caso: name, resultado: "PASS" });
      console.log(`PASS sprint 4: ${name}`);
    } finally { await t.context.close(); }
  }
  await scenario("Precio vigente antes de confirmar y stock consultado después de comprar", async ({ page, state }) => {
    await page.locator("#cantidad-input").fill("2");
    state.catalogo = [{ ...producto, precio_actual: 4 }];
    await buy(page).click();
    await page.getByRole("dialog").getByText(/total de S\/ 8.00/).waitFor();
    await capture(page, "confirmacion-precio-vigente.png", false);
    // Otro comprador consume la unidad restante: la UI debe consultar cero,
    // no restar dos al stock que recordaba (tres).
    state.otraCompra = 1;
    await confirm(page).click();
    await success(page).waitFor();
    await page.locator('#cantidad-input[max="0"]').waitFor();
    assert.equal(await page.getByRole("button", { name: "Producto agotado", exact: true }).isDisabled(), true);
    assert.equal(state.comprasConfirmadas.size, 1);
    assert.equal([...state.comprasConfirmadas.values()][0].monto_total, 8);
    await capture(page, "pedido-confirmado-stock-agotado.png");
  });
  await scenario("Oferta con menos stock detectada antes de enviar el pedido", async ({ page, state }) => {
    await page.locator("#cantidad-input").fill("2");
    state.catalogo = [{ ...producto, stock: 1 }];
    await buy(page).click();
    await page.getByText("La oferta cambió o no tiene stock suficiente. Revisa la cantidad disponible.", { exact: true }).waitFor();
    assert.equal(state.compras.length, 0);
    assert.equal(await page.locator("#cantidad-input").getAttribute("max"), "1");
    await capture(page, "stock-insuficiente.png");
  });
  await scenario("Revisar una confirmación sin enviarla vuelve a consultar el precio", async ({ page, state }) => {
    await buy(page).click();
    await page.getByRole("button", { name: "Revisar", exact: true }).click();
    state.catalogo = [{ ...producto, precio_actual: 4 }];
    await buy(page).click();
    await page.getByRole("dialog").getByText(/total de S\/ 4.00/).waitFor();
    assert.equal(state.compras.length, 0);
  });
  await scenario("Conflicto de stock entre consulta y confirmación sin éxito falso", async ({ page, state }) => {
    await buy(page).click();
    state.rejectCompra = true;
    await confirm(page).click();
    await page.getByText("Stock insuficiente", { exact: true }).first().waitFor();
    assert.equal(await success(page).count(), 0);
    assert.equal(state.comprasConfirmadas.size, 0);
    assert.equal(await page.locator("#cantidad-input").getAttribute("max"), "3");
  });
  await scenario("Doble clic, cantidad y referencia bloqueadas mientras se confirma", async ({ page, state }) => {
    state.catalogo = [{ ...producto, modalidad_entrega: "ambas" }];
    await page.reload();
    await page.locator("#cantidad-input").fill("2");
    await page.locator("select").selectOption("coordinada");
    const referencia = page.getByPlaceholder("Ej. Calle San Martín 450, cerca al mercado central");
    await referencia.fill("Referencia de prueba");
    await buy(page).click();
    state.holdCompra = true;
    // Ambos eventos se emiten en el mismo cuadro, antes del siguiente render.
    await confirm(page).evaluate((button) => { button.click(); button.click(); });
    for (let n = 0; !state.releaseCompra && n < 100; n++) await new Promise((r) => setTimeout(r, 25));
    assert.equal(typeof state.releaseCompra, "function");
    try {
      assert.equal(state.compras.length, 1);
      assert.equal(await page.locator("#cantidad-input").isDisabled(), true);
      assert.equal(await page.locator("select").isDisabled(), true);
      assert.equal(await referencia.isDisabled(), true);
      await page.keyboard.press("Escape");
      assert.equal(await page.getByRole("dialog").isVisible(), true);
      assert.equal(state.compras[0].cantidad, 2);
      assert.equal(state.compras[0].referenciaEntrega, "Referencia de prueba");
    } finally { state.releaseCompra(); }
    await success(page).waitFor();
    assert.equal(state.comprasConfirmadas.size, 1);
  });
  await scenario("Respuesta perdida: reintento con la misma clave sin duplicar pedido ni stock", async ({ page, state }) => {
    await page.locator("#cantidad-input").fill("3");
    await buy(page).click();
    state.loseResponse = true;
    await confirm(page).click();
    await page.locator('main [role="alert"]').first().waitFor();
    assert.equal(await success(page).count(), 0);
    assert.equal(state.catalogo[0].stock, 0);
    await buy(page).click();
    await confirm(page).click();
    await success(page).waitFor();
    await page.locator('#cantidad-input[max="0"]').waitFor();
    assert.equal(state.compras.length, 2);
    assert.deepEqual(state.compras[0], state.compras[1]);
    assert.equal(state.comprasConfirmadas.size, 1);
    assert.equal(state.catalogo[0].stock, 0);
  });
  await scenario("Pedido confirmado aunque falle la recarga; exige actualizar antes de otra compra", async ({ page, state }) => {
    await buy(page).click();
    state.detailError = true;
    await confirm(page).click();
    await success(page).waitFor();
    const refresh = page.getByRole("button", { name: "Actualizar disponibilidad", exact: true });
    await refresh.waitFor();
    assert.equal(await buy(page).isDisabled(), true);
    await capture(page, "pedido-confirmado-recarga-pendiente.png");
    state.detailError = false;
    await refresh.click();
    await page.locator('#cantidad-input[max="2"]').waitFor();
    assert.equal(await buy(page).isEnabled(), true);
    assert.equal(state.compras.length, 1);
  });
  await scenario("Compra en pantalla de 320 px con cantidad inválida y confirmación legible", async ({ page, state }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await page.locator("#cantidad-input").fill("1.5");
    await buy(page).click();
    await page.getByText("Por favor selecciona una cantidad válida dentro del stock.", { exact: true }).waitFor();
    assert.equal(state.compras.length, 0);
    await page.locator("#cantidad-input").fill("2");
    await buy(page).click();
    await page.getByRole("dialog").getByText(/total de S\/ 10.00/).waitFor();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await capture(page, "confirmacion-320.png", false);
  });
  await writeFile(path.join(output, "interfaz.json"), JSON.stringify({
    fecha: new Date().toISOString(), entorno: "Edge headless, compilación de producción, API/Auth simuladas", cases,
  }, null, 2));
}
