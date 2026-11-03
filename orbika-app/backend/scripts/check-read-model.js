// Diagnóstico de solo lectura. No imprime identidades, claves ni pedidos.
import assert from "node:assert/strict";
import { supabaseAdmin as db } from "../src/config/supabaseClient.js";
import { listarPedidosDeUsuario } from "../src/services/pedido.service.js";
import { buscarProductos, obtenerProducto } from "../src/services/producto.service.js";

const { data, error } = await db.from("productos")
  .select("vendedor_id").limit(100).abortSignal(AbortSignal.timeout(15000));
if (error) throw new Error(`No se pudo comprobar el esquema: ${error.code || "conexión"}`);
const vendedores = [...new Set(data.map((p) => p.vendedor_id))];
let ventas = 0;
for (const id of vendedores) {
  const pedidos = await listarPedidosDeUsuario(id, "vendedor");
  assert(pedidos.every((p) => p.productos.vendedor_id === id), "Una venta pertenece a otro vendedor");
  ventas += pedidos.length;
}
const catalogo = await buscarProductos();
if (catalogo.length) await obtenerProducto(catalogo[0].id);
console.log(JSON.stringify({ comprobacion: "lectura_remota", vendedoresComprobados: vendedores.length,
  ventasLeidas: ventas, productosDisponibles: catalogo.length, detalleComprobado: catalogo.length > 0,
  escrituras: 0, resultado: "correcto" }, null, 2));
