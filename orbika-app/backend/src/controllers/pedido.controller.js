import * as pedidoService from "../services/pedido.service.js";

export async function crear(req, res, next) {
  try {
    const pedido = await pedidoService.crearPedido(req.perfil, req.body);
    res.status(201).json(pedido);
  } catch (err) {
    next(err);
  }
}

export async function misPedidos(req, res, next) {
  try {
    const pedidos = await pedidoService.listarPedidosDeUsuario(req.perfil.id, req.perfil.rol);
    res.json(pedidos);
  } catch (err) {
    next(err);
  }
}

export async function cancelar(req, res, next) {
  try {
    const pedido = await pedidoService.cancelarPedido(req.params.id, req.perfil, req.body.motivo);
    res.json(pedido);
  } catch (err) {
    next(err);
  }
}

export async function actualizarEstado(req, res, next) {
  try {
    const pedido = await pedidoService.actualizarEstadoPedido(req.params.id, req.perfil, req.body.estado);
    res.json(pedido);
  } catch (err) {
    next(err);
  }
}

export async function calificar(req, res, next) {
  try {
    const { puntaje, comentario } = req.body;
    const calificacion = await pedidoService.calificarPedido(req.params.id, req.perfil, puntaje, comentario);
    res.status(201).json(calificacion);
  } catch (err) {
    next(err);
  }
}
