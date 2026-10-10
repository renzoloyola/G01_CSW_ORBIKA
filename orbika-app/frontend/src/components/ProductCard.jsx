import { Link } from "react-router-dom";
import {
  calcularAhorro,
  calcularEstadoVencimiento,
  calcularNivelStock,
} from "../pages/product.helpers";
import Badge from "./ui/Badge";

const ETIQUETAS_ESTADO = {
  disponible: { texto: "Disponible", variant: "success" },
  proximo_a_vencer: { texto: "Próximo a vencer", variant: "warning" },
  vendido: { texto: "Vendido", variant: "danger" },
  no_disponible: { texto: "No disponible", variant: "neutral" },
};

export default function ProductCard({ producto }) {
  const estadoInfo = ETIQUETAS_ESTADO[producto.estado] ?? ETIQUETAS_ESTADO.disponible;
  const ahorro = calcularAhorro(producto.precio_original, producto.precio_actual);
  const vencimiento = calcularEstadoVencimiento(producto.fecha_vencimiento);
  const stockInfo = calcularNivelStock(producto.stock);

  const porcentajeDescuento = producto.descuento_pct || ahorro.porcentaje;

  return (
    <Link
      to={`/productos/${producto.id}`}
      className="group bg-card border border-sage/40 hover:border-moss/50 rounded-2xl overflow-hidden shadow-card hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col focus-visible:ring-2 focus-visible:ring-moss focus-visible:ring-offset-2 focus:outline-none"
      aria-label={`Ver detalles de ${producto.nombre}, precio S/ ${Number(producto.precio_actual).toFixed(2)}`}
    >
      {/* Contenedor de Imagen y Badges superpuestos */}
      <div className="aspect-[4/3] bg-paper-warm flex items-center justify-center relative overflow-hidden select-none">
        {producto.foto_url ? (
          <img
            src={producto.foto_url}
            alt={producto.nombre}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-ink-soft/40 p-4">
            <svg
              className="w-12 h-12 mb-1.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-xs font-medium">Sin fotografía</span>
          </div>
        )}

        {/* Badge de Descuento estilo sello circular */}
        {porcentajeDescuento > 0 && (
          <div
            className="absolute top-2.5 right-2.5 bg-terra text-white px-2.5 py-1 rounded-full font-bold text-xs tracking-tight shadow-md flex items-center gap-1 -rotate-2"
            title={`Ahorras S/ ${ahorro.montoAhorro.toFixed(2)}`}
          >
            <span>-{porcentajeDescuento}%</span>
          </div>
        )}

        {/* Badge de Disponibilidad */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          <Badge
            variant={estadoInfo.variant}
            size="sm"
            dot
            className="bg-card/95 backdrop-blur-xs shadow-xs"
          >
            {estadoInfo.texto}
          </Badge>

          {/* Badge de Stock Crítico */}
          {stockInfo.nivel === "critico" && producto.estado !== "vendido" && (
            <span className="bg-amber text-forest-deep text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              {stockInfo.texto}
            </span>
          )}
        </div>
      </div>

      {/* Contenido de la Tarjeta */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Categoría o Zona */}
          <div className="flex items-center justify-between text-[11px] text-ink-soft mb-1 font-medium">
            <span className="text-moss font-semibold uppercase tracking-wider truncate max-w-[65%]">
              {producto.categorias?.nombre || "Alimento"}
            </span>
            {(producto.zona || producto.perfiles?.ubicacion) && (
              <span className="text-ink-soft/75 truncate max-w-[35%] flex items-center gap-0.5">
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {producto.zona || producto.perfiles?.ubicacion}
              </span>
            )}
          </div>

          {/* Título */}
          <h3 className="font-semibold text-forest-deep text-base group-hover:text-forest line-clamp-2 leading-snug">
            {producto.nombre}
          </h3>
        </div>

        <div className="pt-3 mt-3 border-t border-sage/20 space-y-2">
          {/* Precios y Ahorro */}
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-2">
              <span className="font-serif font-bold text-xl text-forest-deep">
                S/ {Number(producto.precio_actual).toFixed(2)}
              </span>
              {Number(producto.precio_original) > Number(producto.precio_actual) && (
                <span className="text-xs text-ink-soft/50 line-through">
                  S/ {Number(producto.precio_original).toFixed(2)}
                </span>
              )}
            </div>

            {ahorro.montoAhorro > 0 && (
              <span className="text-[11px] font-semibold text-moss bg-moss/10 px-2 py-0.5 rounded-md">
                Ahorras S/ {ahorro.montoAhorro.toFixed(2)}
              </span>
            )}
          </div>

          {/* Indicador de Vencimiento */}
          <div
            className={`text-xs flex items-center gap-1.5 font-medium ${
              vencimiento.esCritico ? "text-terra font-semibold" : "text-ink-soft"
            }`}
          >
            <svg
              className={`w-3.5 h-3.5 shrink-0 ${vencimiento.esCritico ? "text-terra" : "text-ink-soft/60"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="truncate">{vencimiento.texto}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
