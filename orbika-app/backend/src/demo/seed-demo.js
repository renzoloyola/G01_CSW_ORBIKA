import { buildDemoData } from "./demo-data.js";

export async function seedDemo({ repo, now = new Date() }) {
  const demo = buildDemoData(now);
  const seller = await repo.ensureUser("seller", demo.users.seller);
  const buyer = await repo.ensureUser("buyer", demo.users.buyer);
  const categoryIds = await repo.ensureCategories(demo.categories);
  const products = {};
  for (const item of demo.products) {
    products[item.key] = await repo.ensureProduct(item.key, {
      vendedor_id: seller.id, categoria_id: categoryIds[item.categoria], nombre: item.nombre,
      descripcion: item.descripcion, precio_original: item.precioOriginal, precio_actual: item.precioActual,
      fecha_vencimiento: item.fechaVencimiento, stock: item.stock, zona: item.zona,
      modalidad_entrega: item.modalidadEntrega, estado: item.estado, foto_url: item.fotoUrl,
    });
  }

  const orders = {};
  for (const item of demo.orders) {
    const product = products[item.product];
    const total = Number(product.precio_actual) * item.cantidad;
    const referenciasDemo = {
      nuevo: "Calle San Martín 450, Tacna Centro",
      preparando: "Av. Celestino Vargas 210, Pocollay",
      entregado: "Av. Bolognesi frente a la Glorieta",
      completado: "Mercado Central Puesto 18, Cercado",
      cancelado: "Av. Pinto 630, Alto de la Alianza",
    };
    orders[item.key] = await repo.ensureOrder(item.key, {
      comprador_id: buyer.id, cantidad: item.cantidad,
      monto_total: total, modalidad_entrega: "recojo", referencia_entrega: referenciasDemo[item.key] || "Tacna Centro",
      estado: item.estado, motivo_cancelacion: item.motivoCancelacion || null,
      fecha_cancelacion: item.estado === "cancelado" ? new Date(now).toISOString() : null,
      fecha_finalizacion: item.estado === "completado" ? new Date(now).toISOString() : null,
    });
    await repo.replaceOrderDetail(orders[item.key].id, {
      producto_id: product.id, cantidad: item.cantidad, precio_unitario: product.precio_actual, subtotal: total,
      precio_original_compra: product.precio_original, peso_unidad_kg_compra: product.peso_unidad_kg ?? null, nombre_producto_compra: product.nombre,
    });
  }

  await repo.ensureRating(orders.completado.id, { puntaje: 5, comentario: "Excelente producto y atención." });
  await repo.replaceNotifications([
    { usuario_id: seller.id, mensaje: "[DEMO] Tienes un nuevo pedido.", enlace_destino: "/mis-pedidos" },
    { usuario_id: seller.id, mensaje: "[DEMO] Una venta fue completada.", enlace_destino: "/mis-pedidos" },
    { usuario_id: buyer.id, mensaje: "[DEMO] Tu pedido está en preparación.", enlace_destino: "/mis-pedidos" },
  ]);

  return { usuarios: 2, categorias: demo.categories.length, productos: demo.products.length, pedidos: demo.orders.length, calificaciones: 1, notificaciones: 3 };
}
