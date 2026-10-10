import * as productoService from "../services/producto.service.js";

export async function listar(req, res, next) {
  try {
    const { busqueda, categoriaId, zona, maxPrecio, orden } = req.query;
    const productos = await productoService.buscarProductos({ busqueda, categoriaId, zona, maxPrecio, orden });
    res.json(productos);
  } catch (err) {
    next(err);
  }
}

export async function obtener(req, res, next) {
  try {
    const producto = await productoService.obtenerProducto(req.params.id);
    res.json(producto);
  } catch (err) {
    next(err);
  }
}

export async function publicar(req, res, next) {
  try {
    const producto = await productoService.publicarProducto(req.perfil, req.body);
    res.status(201).json(producto);
  } catch (err) {
    next(err);
  }
}

export async function editar(req, res, next) {
  try {
    const producto = await productoService.editarProducto(req.params.id, req.perfil, req.body);
    res.json(producto);
  } catch (err) {
    next(err);
  }
}
