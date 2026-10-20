import { supabaseAdmin } from "../config/supabaseClient.js";
import { AppError } from "../errors/AppError.js";
import { fechaHoyLima } from "../validation/common.validation.js";
import { validarEdicionProducto, validarProductoNuevo } from "../validation/producto.validation.js";

function exigirVendedor(actor) {
  if (!actor || actor.rol !== "vendedor" || actor.activo === false) throw new AppError(403, "FORBIDDEN", "Esta acción requiere el rol vendedor.");
}

function idValido(value, nombre = "identificador") {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", `${nombre} inválido.`);
  return id;
}

function aColumnas(datos) {
  const mapa = {
    categoriaId: "categoria_id", precioOriginal: "precio_original", precioActual: "precio_actual",
    fechaVencimiento: "fecha_vencimiento", pesoUnidadKg: "peso_unidad_kg",
    modalidadEntrega: "modalidad_entrega", fotoUrl: "foto_url",
  };
  return Object.fromEntries(Object.entries(datos).map(([key, value]) => [mapa[key] || key, value]));
}

export async function buscarProductos(filtros = {}, db = supabaseAdmin, hoy = fechaHoyLima()) {
  let query = db.from("productos_con_descuento")
    .select("*, categorias(nombre), perfiles!productos_vendedor_id_fkey(nombre_negocio)")
    .in("estado", ["disponible", "proximo_a_vencer"])
    .gt("stock", 0)
    .gt("fecha_vencimiento", hoy);
  if (filtros.busqueda?.trim()) query = query.ilike("nombre", `%${filtros.busqueda.trim().slice(0, 80)}%`);
  if (filtros.categoriaId) query = query.eq("categoria_id", idValido(filtros.categoriaId, "Categoría"));
  if (filtros.zona?.trim()) query = query.ilike("zona", filtros.zona.trim().slice(0, 100));
  if (filtros.maxPrecio != null && filtros.maxPrecio !== "") {
    const max = Number(filtros.maxPrecio);
    if (!Number.isFinite(max) || max <= 0) throw new AppError(400, "VALIDATION_ERROR", "Precio máximo inválido.");
    query = query.lte("precio_actual", max);
  }
  const ordenamientos = {
    recientes: { column: "creado_en", ascending: false },
    precio_asc: { column: "precio_actual", ascending: true },
    mayor_descuento: { column: "descuento_pct", ascending: false },
  };
  const orden = ordenamientos[filtros.orden] || ordenamientos.recientes;
  const { data, error } = await query.order(orden.column, { ascending: orden.ascending });
  if (error) throw new AppError(500, "PRODUCT_QUERY_FAILED", "No se pudo cargar el catálogo.");
  return data || [];
}

export async function obtenerProducto(id, db = supabaseAdmin) {
  const { data, error } = await db.from("productos_con_descuento")
    .select("*, categorias(nombre), perfiles!productos_vendedor_id_fkey(nombre_negocio, ubicacion)")
    .eq("id", idValido(id, "Producto")).single();
  if (error || !data) throw new AppError(404, "PRODUCT_NOT_FOUND", "Producto no encontrado.");
  return data;
}

export async function publicarProducto(actor, input, db = supabaseAdmin) {
  exigirVendedor(actor);
  const datos = validarProductoNuevo(input);
  const { data, error } = await db.from("productos")
    .insert({ vendedor_id: actor.id, ...aColumnas(datos) }).select().single();
  if (error) throw new AppError(409, "PRODUCT_CREATE_FAILED", "No se pudo publicar el producto.");
  return data;
}

export async function editarProducto(id, actor, input, db = supabaseAdmin) {
  exigirVendedor(actor);
  const productoId = idValido(id, "Producto");
  const cambios = validarEdicionProducto(input);
  const { data: actual, error: busquedaError } = await db.from("productos")
    .select("id, vendedor_id, precio_original, precio_actual, stock, estado, estado_publicacion").eq("id", productoId).single();
  if (busquedaError || !actual) throw new AppError(404, "PRODUCT_NOT_FOUND", "Producto no encontrado.");
  if (actual.vendedor_id !== actor.id) throw new AppError(403, "FORBIDDEN", "Este producto no pertenece a tu negocio.");
  const precioOriginal = cambios.precioOriginal ?? Number(actual.precio_original);
  const precioActual = cambios.precioActual ?? Number(actual.precio_actual);
  if (precioActual > precioOriginal) throw new AppError(400, "VALIDATION_ERROR", "El precio actual no puede superar el precio original.");
  const columnas = aColumnas(cambios);
  if (cambios.stock != null && actual.estado_publicacion !== "retirado") {
    columnas.estado = cambios.stock === 0 ? "vendido" : "disponible";
  }
  const { data, error } = await db.from("productos").update(columnas)
    .eq("id", productoId).eq("vendedor_id", actor.id).eq("stock", actual.stock).select().single();
  if (error || !data) throw new AppError(409, "PRODUCT_UPDATE_FAILED", "El producto cambió o no se pudo actualizar. Recarga antes de guardar.");
  return data;
}

