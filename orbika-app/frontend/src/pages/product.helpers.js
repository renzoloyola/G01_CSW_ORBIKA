export function serializarFiltros(filtros) {
  const params = {};
  const busqueda = filtros.busqueda?.trim();
  const zona = filtros.zona?.trim();
  if (busqueda) params.busqueda = busqueda;
  if (filtros.categoriaId) params.categoriaId = Number(filtros.categoriaId);
  if (zona) params.zona = zona;
  if (filtros.maxPrecio) params.maxPrecio = Number(filtros.maxPrecio);
  if (filtros.orden) params.orden = filtros.orden;
  return params;
}

export function modalidadesDisponibles(producto) {
  if (producto?.modalidad_entrega === "ambas") return ["recojo", "coordinada"];
  return [producto?.modalidad_entrega || "recojo"];
}

export function cantidadValida(cantidad, stock) {
  return Number.isInteger(Number(cantidad)) && Number(cantidad) >= 1 && Number(cantidad) <= Number(stock);
}

export function fechaLocal(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || "")) return "—";
  const [year, month, day] = fecha.split("-");
  return `${day}/${month}/${year}`;
}

/**
 * Calcula porcentaje y monto ahorrado en soles.
 */
export function calcularAhorro(precioOriginal, precioActual) {
  const orig = Number(precioOriginal) || 0;
  const act = Number(precioActual) || 0;
  if (orig <= 0 || act < 0 || act >= orig) {
    return { porcentaje: 0, montoAhorro: 0 };
  }
  const montoAhorro = Number((orig - act).toFixed(2));
  const porcentaje = Math.round(((orig - act) / orig) * 100);
  return { porcentaje, montoAhorro };
}

/**
 * Calcula días restantes de vencimiento respecto a una fecha de referencia.
 */
export function diasHastaVencimiento(fechaVencimiento, fechaReferencia = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaVencimiento || "")) return null;
  const hoy = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).format(fechaReferencia);
  return Math.round((Date.parse(`${fechaVencimiento}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / 86400000);
}

/**
 * Determina el estado de urgencia de vencimiento.
 */
export function calcularEstadoVencimiento(fechaVencimiento, fechaReferencia = new Date()) {
  const dias = diasHastaVencimiento(fechaVencimiento, fechaReferencia);
  if (dias === null) {
    return { dias: null, tipo: "desconocido", texto: "Fecha no especificada", esCritico: false };
  }
  if (dias < 0) {
    return { dias, tipo: "vencido", texto: `Venció el ${fechaLocal(fechaVencimiento)}`, esCritico: true };
  }
  if (dias === 0) {
    return { dias, tipo: "hoy", texto: "¡Vence hoy!", esCritico: true };
  }
  if (dias === 1) {
    return { dias, tipo: "urgente", texto: "¡Vence mañana!", esCritico: true };
  }
  if (dias <= 3) {
    return { dias, tipo: "urgente", texto: `Vence en ${dias} días`, esCritico: true };
  }
  if (dias <= 7) {
    return { dias, tipo: "proximo", texto: `Vence en ${dias} días`, esCritico: false };
  }
  return { dias, tipo: "normal", texto: `Consumir antes del ${fechaLocal(fechaVencimiento)}`, esCritico: false };
}

/**
 * Calcula el estado y nivel visual de stock.
 */
export function calcularNivelStock(stock) {
  const cantidad = Number(stock);
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    return { nivel: "agotado", texto: "Sin stock disponible", esCritico: true };
  }
  if (cantidad === 1) {
    return { nivel: "critico", texto: "¡Solo queda 1 unidad!", esCritico: true };
  }
  if (cantidad <= 3) {
    return { nivel: "critico", texto: `¡Últimas ${cantidad} unidades!`, esCritico: true };
  }
  return { nivel: "disponible", texto: `${cantidad} unidades disponibles`, esCritico: false };
}

