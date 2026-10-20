import OrderActions from "../OrderActions";
import { Badge } from "../ui";

const ESTADOS = {
  creado: {
    texto: "Creado",
    variant: "info",
    icono: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 14 14" />
      </svg>
    ),
  },
  preparando: {
    texto: "En preparación",
    variant: "warning",
    icono: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
      </svg>
    ),
  },
  listo_para_entrega: { texto: "Listo para entrega", variant: "info", icono: null },
  entregado: {
    texto: "Entregado",
    variant: "success",
    icono: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  completado: {
    texto: "Completado",
    variant: "brand",
    icono: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
  cancelado: {
    texto: "Cancelado",
    variant: "danger",
    icono: (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
};

export default function OrderCard({ pedido, rol, onRefresh }) {
  const estadoConfig = ESTADOS[pedido.estado] || ESTADOS.creado;
  const esVendedor = rol === "vendedor";

  return (
    <article className="bg-card border border-sage/40 rounded-3xl shadow-card p-5 sm:p-6 transition-all hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          {/* Cabecera del pedido */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-forest-deep bg-paper-warm px-2.5 py-1 rounded-lg border border-sage/30">
              N.° {pedido.id}
            </span>
            <h3 className="font-serif font-bold text-forest-deep text-lg leading-tight">
              {pedido.productos?.nombre || "Producto de ÓrbiKa"}
            </h3>
          </div>

          {/* Fecha y contraparte */}
          <p className="text-xs text-ink-soft">
            Solicitado el{" "}
            {new Date(pedido.fecha_creacion).toLocaleDateString("es-PE", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>

          {/* Ficha técnica del pedido */}
          <div className="flex items-center gap-4 text-xs text-ink-soft pt-1 flex-wrap">
            <div className="bg-paper-warm/80 px-3 py-1.5 rounded-xl border border-sage/20">
              <span>Cantidad: </span>
              <strong className="text-forest-deep font-semibold">
                {pedido.cantidad} {pedido.cantidad === 1 ? "unidad" : "unidades"}
              </strong>
            </div>

            <div className="bg-paper-warm/80 px-3 py-1.5 rounded-xl border border-sage/20">
              <span>Total: </span>
              <strong className="text-forest-deep font-serif font-bold text-sm">
                S/ {Number(pedido.monto_total).toFixed(2)}
              </strong>
            </div>

            <div className="bg-paper-warm/80 px-3 py-1.5 rounded-xl border border-sage/20">
              <span>Modalidad: </span>
              <span className="font-medium text-forest-deep capitalize">
                {pedido.modalidad_entrega === "recojo"
                  ? "Recojo en tienda"
                  : "Entrega coordinada"}
              </span>
            </div>
          </div>

          {/* Referencia de entrega si existe */}
          {pedido.referencia_entrega && (
            <p className="text-xs text-forest-deep bg-paper-warm/60 px-3 py-1.5 rounded-xl border border-sage/30 inline-block mt-1">
              📍 <strong>Referencia:</strong>{" "}
              {pedido.referencia_entrega.includes("[DEMO:")
                ? "Entrega coordinada en Tacna Centro (Av. San Martín)"
                : pedido.referencia_entrega}
            </p>
          )}

          {/* Motivo de cancelación si fue cancelado */}
          {pedido.motivo_cancelacion && (
            <div className="text-xs text-terra bg-terra-pale/60 px-3 py-2 rounded-xl border border-terra/30 mt-2">
              <strong>Motivo de cancelación:</strong> {pedido.motivo_cancelacion}
            </div>
          )}
        </div>

        {/* Badge de estado con icono */}
        <Badge
          variant={estadoConfig.variant}
          size="md"
          className="self-start font-semibold shadow-xs flex items-center gap-1.5 shrink-0"
        >
          {estadoConfig.icono}
          <span>{estadoConfig.texto}</span>
        </Badge>
      </div>

      {/* Acciones contextuales */}
      <OrderActions
        pedido={pedido}
        rol={rol}
        onDone={onRefresh}
      />
    </article>
  );
}
