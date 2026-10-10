export function accionesPermitidas(rol, estado) {
  if (rol === "comprador") {
    if (["creado", "preparando"].includes(estado)) return ["cancelar"];
    if (estado === "entregado") return ["completado"];
    if (estado === "completado") return ["calificar"];
    return [];
  }
  if (rol === "vendedor") {
    return { creado: ["preparando"], preparando: ["listo_para_entrega"], listo_para_entrega: ["entregado"] }[estado] || [];
  }
  return [];
}

