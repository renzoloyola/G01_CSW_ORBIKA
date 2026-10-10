function addDays(now, days) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildDemoData(now = new Date()) {
  const products = [
    ["verduras", "Frutas y verduras", "Canasta de verduras frescas", "Selección de tomate, zanahoria, cebolla y lechuga.", 28, 16.8, 12, 4, "Centro", "ambas", "disponible", "https://images.unsplash.com/photo-1542838132-92c53300491e"],
    ["pan", "Panadería", "Pack de pan artesanal", "Seis panes de masa madre horneados hoy.", 15, 8.5, 8, 1, "Pocollay", "recojo", "proximo_a_vencer", "https://images.unsplash.com/photo-1509440159596-0249088772ff"],
    ["yogurt", "Lácteos", "Yogurt natural familiar", "Botella de yogurt natural de un litro.", 14, 7.9, 10, 5, "Alto de la Alianza", "coordinada", "disponible", "https://images.unsplash.com/photo-1488477181946-6428a0291777"],
    ["pollo", "Carnes", "Pollo marinado listo", "Pollo marinado con hierbas, empacado y refrigerado.", 38, 25, 6, 3, "Gregorio Albarracín", "ambas", "disponible", "https://images.unsplash.com/photo-1604503468506-a8da13d82791"],
    ["lasagna", "Alimentos preparados", "Lasaña casera", "Porción familiar lista para calentar.", 42, 27.5, 5, 2, "Centro", "recojo", "proximo_a_vencer", "https://images.unsplash.com/photo-1574894709920-11b28e7367e3"],
    ["manzanas", "Frutas y verduras", "Manzanas del valle", "Bolsa de dos kilos, fruta madura y dulce.", 20, 12, 15, 6, "Calana", "ambas", "disponible", "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6"],
    ["leche", "Lácteos", "Leche fresca", "Botella de un litro.", 7, 4, 0, 1, "Ciudad Nueva", "recojo", "vendido", "https://images.unsplash.com/photo-1563636619-e9143da7973b"],
    ["postres", "Otros", "Caja de postres variados", "Cuatro porciones surtidas del día.", 30, 18, 4, 3, "Pocollay", "coordinada", "disponible", "https://images.unsplash.com/photo-1551024506-0bccd828d307"],
  ].map(([key, categoria, nombre, descripcion, precioOriginal, precioActual, stock, dias, zona, modalidadEntrega, estado, fotoUrl]) => ({
    key, categoria, nombre, descripcion, precioOriginal, precioActual, stock,
    fechaVencimiento: addDays(now, dias), zona, modalidadEntrega, estado, fotoUrl,
  }));

  return {
    categories: ["Frutas y verduras", "Panadería", "Lácteos", "Carnes", "Alimentos preparados", "Otros"],
    users: {
      seller: { email: "vendedor@orbika.demo", password: "DemoVendedor2026!", profile: { nombre: "Rosa Mercado", rol: "vendedor", telefono: "999111222", nombre_negocio: "Mercado Circular", ubicacion: "Tacna Centro" } },
      buyer: { email: "comprador@orbika.demo", password: "DemoComprador2026!", profile: { nombre: "Luis Comprador", rol: "comprador", telefono: "999333444", nombre_negocio: null, ubicacion: "Pocollay" } },
    },
    products,
    orders: [
      { key: "nuevo", product: "verduras", cantidad: 1, estado: "creado" },
      { key: "preparando", product: "pollo", cantidad: 1, estado: "preparando" },
      { key: "entregado", product: "yogurt", cantidad: 2, estado: "entregado" },
      { key: "completado", product: "pan", cantidad: 1, estado: "completado" },
      { key: "cancelado", product: "postres", cantidad: 1, estado: "cancelado", motivoCancelacion: "Cambio de planes" },
    ],
  };
}

