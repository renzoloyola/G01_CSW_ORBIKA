import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
export async function comprobarSprints56({ origin, setup, login, root }) {
  const output = path.join(root, "../docs/evidencias/sprints-05-06");
  await mkdir(output, { recursive: true });
  const casos = [];
  for (const actor of ["buyer", "seller"]) {
    const t = await setup(origin);
    try {
      await login(t.page, origin, actor);
      await t.page.goto(`${origin}/mi-perfil`);
      await t.page.getByLabel("Nombre completo", {exact:true}).fill("Perfil actualizado");
      await t.page.getByLabel("Teléfono", {exact:true}).fill("999123456");
      await t.page.getByLabel("Dirección (opcional)", {exact:true}).fill("Dirección de prueba");
      if (actor === "seller") {
        await t.page.getByLabel("Nombre del negocio", {exact:true}).fill("Panadería de prueba");
        await t.page.getByLabel("Ubicación del negocio", {exact:true}).fill("Tacna");
      } else assert.equal(await t.page.getByLabel("Nombre del negocio", {exact:true}).count(),0);
      t.state.profileError = true;
      await t.page.getByRole("button", {name:"Guardar cambios",exact:true}).click();
      await t.page.getByRole("alert").getByText("No se pudo guardar el perfil", {exact:true}).waitFor();
      t.state.profileError = false;
      await t.page.locator('input[type="file"]').setInputFiles({name:"perfil.png",mimeType:"image/png",buffer:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMesAAAAASUVORK5CYII=","base64")});
      await t.page.getByRole("button", {name:"Guardar cambios",exact:true}).click();
      await t.page.getByText("Tu perfil se actualizó correctamente.",{exact:true}).waitFor();
      await t.page.reload();
      await t.page.getByLabel("Nombre completo",{exact:true}).waitFor();
      assert.equal(await t.page.getByLabel("Nombre completo",{exact:true}).inputValue(),"Perfil actualizado");
      await t.page.getByRole("img",{name:"Foto de perfil",exact:true}).waitFor();
      await t.page.setViewportSize({width:320,height:740});
      assert.equal(await t.page.evaluate(()=>document.documentElement.scrollWidth > innerWidth),false);
      await t.page.screenshot({path:path.join(output,`perfil-${actor}.png`),fullPage:true});
      casos.push(`Perfil ${actor}: error, guardado, recarga y móvil`);
      if (actor === "buyer") {
        t.state.pedidos = [{id:901,estado:"creado",cantidad:2,monto_total:10,fecha_creacion:"2026-11-02T12:00:00Z",productos:{nombre:"Pan de prueba"}}];
        await t.page.goto(`${origin}/mis-pedidos`);
        await t.page.getByRole("button",{name:"Cancelar pedido",exact:true}).click();
        await t.page.getByRole("dialog").locator("textarea").fill("No podré recogerlo");
        await t.page.getByRole("button",{name:"Confirmar cancelación",exact:true}).click();
        await t.page.getByText("Motivo de cancelación:",{exact:false}).waitFor();
        assert.equal(await t.page.getByRole("button",{name:"Cancelar pedido",exact:true}).count(),0);
        await t.page.screenshot({path:path.join(output,"cancelacion.png"),fullPage:true});
        t.state.pedidos[0] = {...t.state.pedidos[0],id:902,estado:"completado",motivo_cancelacion:null};
        await t.page.reload();
        await t.page.getByRole("button",{name:"Calificar compra",exact:true}).click();
        await t.page.getByRole("radio",{name:"4 estrellas",exact:true}).click();
        await t.page.getByLabel("Comentario opcional",{exact:true}).fill("Buena atención");
        await t.page.getByRole("button",{name:"Publicar calificación",exact:true}).click();
        await t.page.getByText(/Calificación registrada: 4 de 5/).waitFor();
        await t.page.reload();
        await t.page.getByText(/Calificación registrada: 4 de 5/).waitFor();
        assert.equal(await t.page.getByRole("button",{name:"Calificar compra",exact:true}).count(),0);
        await t.page.evaluate(() => window.scrollTo(0,0));
        await t.page.screenshot({path:path.join(output,"calificacion.png"),fullPage:true});
        casos.push("Cancelación y calificación persistida; acciones repetidas ocultas");
      }
      assert.deepEqual(t.errors,[]);
    } finally { await t.context.close(); }
  }
  await writeFile(path.join(output,"interfaz.json"),JSON.stringify({fecha:new Date().toISOString(),entorno:"Edge, API y Auth simuladas",casos},null,2));
  console.log("PASS sprints 5-6: "+casos.join("; "));
}
