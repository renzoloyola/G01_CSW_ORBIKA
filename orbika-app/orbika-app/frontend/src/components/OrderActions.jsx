import { DEMO_MODE } from "../services/marketplace";
import { useState } from "react";
import { api } from "../services/api";
import { accionesPermitidas } from "../pages/order.helpers";
import { useToast } from "../context/ToastContext";
import { Button, PromptModal, Modal } from "./ui";

const ETIQUETAS = {
  preparando: "Marcar preparando",
  listo_para_entrega: "Marcar listo para entrega",
  entregado: "Marcar entregado",
  completado: "Confirmar recepción",
};

export default function OrderActions({ pedido, rol, onDone }) {
  const acciones = accionesPermitidas(rol, pedido.estado);
  const { toast } = useToast();

  const [modalCancelarAbierto, setModalCancelarAbierto] = useState(false);
  const [modalCalificarAbierto, setModalCalificarAbierto] = useState(false);
  const [puntaje, setPuntaje] = useState(5);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function ejecutarAccionEstado(nuevoEstado) {
    setError("");
    setOcupado(true);
    try {
      await api.patch(`/pedidos/${pedido.id}/estado`, { estado: nuevoEstado });
      toast.success(`Pedido N.° ${pedido.id} marcado como "${nuevoEstado}".`);
      await onDone();
    } catch (err) {
      const msg = err.response?.data?.error || "No se pudo actualizar el estado del pedido.";
      setError(msg);
      toast.error(msg);
    } finally {
      setOcupado(false);
    }
  }

  async function confirmarCancelacion(motivo) {
    setError("");
    setOcupado(true);
    try {
      await api.patch(`/pedidos/${pedido.id}/cancelar`, { motivo });
      setModalCancelarAbierto(false);
      toast.info(`Pedido N.° ${pedido.id} cancelado.`);
      await onDone();
    } catch (err) {
      const msg = err.response?.data?.error || "No se pudo cancelar el pedido.";
      setError(msg);
      toast.error(msg);
    } finally {
      setOcupado(false);
    }
  }

  async function enviarCalificacion(event) {
    if (event) event.preventDefault();
    setOcupado(true);
    setError("");
    try {
      await api.post(`/pedidos/${pedido.id}/calificacion`, {
        puntaje: Number(puntaje),
        comentario: comentario.trim() || undefined,
      });
      setModalCalificarAbierto(false);
      toast.success("¡Muchas gracias por calificar tu compra!");
      await onDone();
    } catch (err) {
      const msg = err.response?.data?.error || "No se pudo guardar la calificación.";
      setError(msg);
      toast.error(msg);
    } finally {
      setOcupado(false);
    }
  }

  if (DEMO_MODE || acciones.length === 0) return null;

  return (
    <div className="mt-4 pt-3 border-t border-sage/20">
      <div className="flex flex-wrap items-center gap-2">
        {/* Acciones de cambio de estado para el vendedor */}
        {acciones
          .filter((a) => a !== "cancelar" && a !== "calificar")
          .map((action) => (
            <Button
              key={action}
              size="sm"
              variant="outline"
              disabled={ocupado}
              loading={ocupado}
              onClick={() => ejecutarAccionEstado(action)}
            >
              {ETIQUETAS[action] || action}
            </Button>
          ))}

        {/* Acción de cancelar para el comprador */}
        {acciones.includes("cancelar") && (
          <Button
            size="sm"
            variant="danger"
            disabled={ocupado}
            onClick={() => setModalCancelarAbierto(true)}
          >
            Cancelar pedido
          </Button>
        )}

        {/* Acción de calificar para el comprador */}
        {acciones.includes("calificar") && (
          <Button
            size="sm"
            variant="amber"
            disabled={ocupado}
            onClick={() => setModalCalificarAbierto(true)}
            icon={
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
          >
            Calificar compra
          </Button>
        )}
      </div>

      {error && (
        <p role="alert" className="text-terra text-xs font-semibold mt-2 bg-terra-pale p-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Modal Accesible de Cancelación (Reemplaza window.prompt) */}
      <PromptModal
        isOpen={modalCancelarAbierto}
        onClose={() => setModalCancelarAbierto(false)}
        onSubmit={confirmarCancelacion}
        title="Cancelar pedido"
        description="Por favor indícanos el motivo de la cancelación para informar al comercio."
        label="Motivo de cancelación"
        placeholder="Ej. Surgió un imprevisto y no podré recoger el producto…"
        confirmLabel="Confirmar cancelación"
        cancelLabel="Conservar pedido"
        loading={ocupado}
        multiline
      />

      {/* Modal Accesible de Calificación */}
      <Modal
        isOpen={modalCalificarAbierto}
        onClose={() => setModalCalificarAbierto(false)}
        title="Calificar experiencia de compra"
        description={`Cuéntanos cómo fue tu experiencia con el pedido N.° ${pedido.id}.`}
      >
        <form onSubmit={enviarCalificacion} className="space-y-4 mt-3">
          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase mb-2">
              Puntuación (1 a 5 estrellas)
            </label>
            <div className="flex items-center gap-2" role="radiogroup" aria-label="Selecciona una puntuación">
              {[1, 2, 3, 4, 5].map((estrella) => (
                <button
                  key={estrella}
                  type="button"
                  role="radio"
                  aria-checked={puntaje === estrella}
                  aria-label={`${estrella} estrella${estrella > 1 ? "s" : ""}`}
                  onClick={() => setPuntaje(estrella)}
                  className={`p-2 rounded-xl transition-all focus-visible:ring-2 focus-visible:ring-moss focus:outline-none cursor-pointer ${
                    puntaje >= estrella ? "text-amber bg-amber/15 scale-105" : "text-gray-300 hover:text-amber/60"
                  }`}
                >
                  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>
              ))}
              <span className="text-sm font-semibold text-forest-deep ml-2">
                {puntaje} de 5
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="comentario-calificacion" className="block text-xs font-semibold text-ink-soft uppercase mb-1">
              Comentario opcional
            </label>
            <textarea
              id="comentario-calificacion"
              rows={3}
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              placeholder="¿Qué tal estuvo la atención o el estado del producto?"
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-moss/40"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-3 border-t border-sage/20">
            <Button
              variant="secondary"
              onClick={() => setModalCalificarAbierto(false)}
              disabled={ocupado}
            >
              Cerrar
            </Button>
            <Button
              type="submit"
              variant="amber"
              loading={ocupado}
            >
              Publicar calificación
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
