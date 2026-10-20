import { supabaseAdmin } from "../config/supabaseClient.js";
import { AppError } from "../errors/AppError.js";
import { TRANSICIONES_PEDIDO, validarCalificacion, validarCambioEstado, validarCancelacion, validarCompra } from "../validation/pedido.validation.js";

function detalleDe(pedido) {
  return Array.isArray(pedido.detalle_pedidos) ? pedido.detalle_pedidos[0] : pedido.detalle_pedidos;
}

function exigirRol(actor, rol) {
  if (!actor || actor.rol !== rol) throw new AppError(403, "FORBIDDEN", `Esta acción requiere el rol ${rol}.`);
}

function conflicto(error, mensaje = "No se pudo completar la operación.") {
  if (error) console.error("[supabase]", error);
  return new AppError(409, "DATA_CONFLICT", mensaje);
}

function pedidoConfirmado(data) {
  const pedido = Array.isArray(data) ? data[0] : data;
  if (!pedido?.id) throw new AppError(502, "INVALID_ORDER_RESPONSE", "No se recibió la confirmación del pedido. Reintenta sin cambiar los datos.");
  return pedido;
}

export async function crearPedido(actor, input, db = supabaseAdmin) {
  exigirRol(actor, "comprador");
  const datos = validarCompra(input);
  if (actor.activo === false) throw new AppError(403, "FORBIDDEN", "La cuenta no está habilitada para nuevas compras.");
  const { data, error } = await db.rpc("crear_pedido_transaccion", {
    p_producto_id: datos.productoId, p_comprador_id: actor.id, p_cantidad: datos.cantidad,
    p_modalidad_entrega: datos.modalidadEntrega, p_referencia_entrega: datos.referenciaEntrega,
    p_clave_idempotencia: datos.claveIdempotencia,
  });
  if (error) {
    if (error.code === "P0001") throw conflicto(error, error.message);
    throw new AppError(502, "ORDER_CREATE_FAILED", "No se pudo confirmar la compra. Reintenta sin cambiar los datos.");
  }
  return pedidoConfirmado(data);
}

export async function listarPedidosDeUsuario(usuarioId, rol, db = supabaseAdmin) {
  let query = db.from("pedidos");
  const relacion = rol === "vendedor"
    ? "*, detalle_pedidos!inner(*, productos!inner(nombre, foto_url, vendedor_id))"
    : "*, detalle_pedidos!inner(*, productos(nombre, foto_url, vendedor_id))";
  query = query.select(relacion);
  if (rol === "vendedor") query = query.eq("detalle_pedidos.productos.vendedor_id", usuarioId);
  else if (rol === "comprador") query = query.eq("comprador_id", usuarioId);
  else throw new AppError(403, "FORBIDDEN", "No tienes acceso a pedidos.");
  const { data, error } = await query.order("fecha_creacion", { ascending: false });
  if (error) throw conflicto(error);
  return (data || []).map((pedido) => ({
    ...pedido,
    productos: { ...detalleDe(pedido)?.productos,
      nombre: detalleDe(pedido)?.nombre_producto_compra || detalleDe(pedido)?.productos?.nombre },
  }));
}

export async function cancelarPedido(pedidoId, actor, motivo, db = supabaseAdmin) {
  exigirRol(actor, "comprador");
  const id = Number(pedidoId);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", "Pedido inválido.");
  const datos = validarCancelacion({ motivo });
  const { data, error } = await db.rpc("cancelar_pedido_transaccion", {
    p_pedido_id: id, p_comprador_id: actor.id, p_motivo: datos.motivo,
  });
  if (error) throw conflicto(error, "Este pedido no puede cancelarse.");
  return pedidoConfirmado(data);
}

export async function actualizarEstadoPedido(pedidoId, actor, nuevoEstado, db = supabaseAdmin) {
  if (!["comprador", "vendedor"].includes(actor?.rol)) throw new AppError(403, "FORBIDDEN", "No tienes acceso a pedidos.");
  const id = Number(pedidoId);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", "Pedido inválido.");
  const { estado } = validarCambioEstado({ estado: nuevoEstado });
  const { data: pedido, error: busquedaError } = await db.from("pedidos")
    .select("id, estado, comprador_id, detalle_pedidos!inner(productos!inner(vendedor_id))").eq("id", id).single();
  if (busquedaError || !pedido) throw new AppError(404, "ORDER_NOT_FOUND", "Pedido no encontrado.");
  if (estado === "completado") {
    if (actor.rol !== "comprador" || pedido.comprador_id !== actor.id) {
      throw new AppError(403, "FORBIDDEN", "Solo el comprador puede confirmar la recepción.");
    }
  } else if (actor.rol !== "vendedor" || detalleDe(pedido)?.productos?.vendedor_id !== actor.id) {
    throw new AppError(403, "FORBIDDEN", "Solo el vendedor del pedido puede preparar o marcar la entrega.");
  }
  if (!TRANSICIONES_PEDIDO[pedido.estado]?.includes(estado)) {
    throw new AppError(409, "INVALID_TRANSITION", `No se puede pasar de ${pedido.estado} a ${estado}.`);
  }
  const cambios = { estado };
  if (estado === "completado") cambios.fecha_finalizacion = new Date().toISOString();
  const { data, error } = await db.from("pedidos").update(cambios)
    .eq("id", id).eq("estado", pedido.estado).select().single();
  if (error || !data) throw conflicto(error, "El pedido cambió de estado. Recarga e intenta nuevamente.");
  return data;
}

export async function calificarPedido(pedidoId, actor, puntaje, comentario, db = supabaseAdmin) {
  exigirRol(actor, "comprador");
  const id = Number(pedidoId);
  if (!Number.isInteger(id) || id <= 0) throw new AppError(400, "VALIDATION_ERROR", "Pedido inválido.");
  const datos = validarCalificacion({ puntaje, comentario });
  const { data: pedido, error: busquedaError } = await db.from("pedidos")
    .select("estado, comprador_id").eq("id", id).single();
  if (busquedaError || !pedido) throw new AppError(404, "ORDER_NOT_FOUND", "Pedido no encontrado.");
  if (pedido.comprador_id !== actor.id) throw new AppError(403, "FORBIDDEN", "Este pedido no te pertenece.");
  if (pedido.estado !== "completado") throw conflicto(null, "Solo se puede calificar un pedido completado.");
  const { data, error } = await db.from("calificaciones").insert({ pedido_id: id, ...datos }).select().single();
  if (error) throw conflicto(error, "Este pedido ya fue calificado.");
  return data;
}

