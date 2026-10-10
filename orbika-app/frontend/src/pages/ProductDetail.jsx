import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { DEMO_MODE, marketplace, mensajeError } from "../services/marketplace";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  calcularAhorro,
  calcularEstadoVencimiento,
  calcularNivelStock,
  cantidadValida,
  fechaLocal,
  modalidadesDisponibles,
} from "./product.helpers";
import {
  Button,
  Badge,
  ConfirmModal,
  StatePanel,
  SkeletonDetail,
} from "../components/ui";
import { usePageTitle } from "../hooks/usePageTitle";

const ETIQUETAS_ESTADO = {
  disponible: { texto: "Disponible", variant: "success" },
  proximo_a_vencer: { texto: "Próximo a vencer", variant: "warning" },
  vendido: { texto: "Vendido", variant: "danger" },
  no_disponible: { texto: "No disponible", variant: "neutral" },
};

export default function ProductDetail() {
  const { id } = useParams();
  const { usuario, perfil } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [producto, setProducto] = useState(null);
  usePageTitle(producto ? producto.nombre : "Detalle de producto");
  const [cantidad, setCantidad] = useState(1);
  const [modalidad, setModalidad] = useState("recojo");
  const [referencia, setReferencia] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorCompra, setErrorCompra] = useState("");
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = useState(false);
  const [compraIntento, setCompraIntento] = useState(null);

  function cargarDetalle() {
    setCargando(true);
    setErrorCarga("");
    setProducto(null);
    setMensajeExito(null);
    setCompraIntento(null);
    marketplace.obtenerProducto(id)
      .then((data) => {
        setProducto(data);
        setModalidad(modalidadesDisponibles(data)[0] || "recojo");
      })
      .catch((err) => setErrorCarga(mensajeError(err, "No se pudo cargar el producto.")))
      .finally(() => setCargando(false));
  }

  useEffect(() => { cargarDetalle(); }, [id]);

  function abrirModalCompra() {
    if (!cantidadValida(cantidad, producto?.stock || 0)) {
      setErrorCompra("Por favor selecciona una cantidad válida dentro del stock.");
      return;
    }
    setErrorCompra("");
    const datos = {
      productoId: Number(id), cantidad: Number(cantidad), modalidadEntrega: modalidad,
      referenciaEntrega: referencia,
    };
    const firma = JSON.stringify(datos);
    if (compraIntento?.firma !== firma) {
      setCompraIntento({ firma, datos, claveIdempotencia: crypto.randomUUID() });
    }
    setModalConfirmarAbierto(true);
  }

  async function ejecutarCompra() {
    setEnviando(true);
    setErrorCompra("");
    setMensajeExito(null);

    try {
      const pedido = await marketplace.comprarProducto({
        ...compraIntento.datos, claveIdempotencia: compraIntento.claveIdempotencia,
      });

      setModalConfirmarAbierto(false);
      toast.success(`¡Pedido N.° ${pedido.id} registrado con éxito!`);
      setMensajeExito({
        id: pedido.id,
        estado: pedido.estado,
        montoTotal: pedido.monto_total,
      });

      // Actualizar el stock local restante del producto
      setProducto((prev) => {
        if (!prev) return prev;
        const nuevoStock = Math.max(0, prev.stock - cantidad);
        return {
          ...prev,
          stock: nuevoStock,
          estado: nuevoStock === 0 ? "vendido" : prev.estado,
        };
      });
      setCantidad(1);
      setCompraIntento(null);
    } catch (err) {
      const msg = mensajeError(err, "No se pudo completar la compra. Intenta nuevamente.");
      setErrorCompra(msg);
      toast.error(msg);
      setModalConfirmarAbierto(false);
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return <SkeletonDetail />;
  }

  if (errorCarga || !producto) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <StatePanel
          type="error"
          title="Producto no disponible"
          description={errorCarga || "No encontramos el producto que buscas."}
          actionLabel="Volver al catálogo"
          onAction={() => navigate("/")}
        />
      </div>
    );
  }

  const ahorro = calcularAhorro(producto.precio_original, producto.precio_actual);
  const vencimiento = calcularEstadoVencimiento(producto.fecha_vencimiento);
  const stockInfo = calcularNivelStock(producto.stock);
  const estadoInfo = ETIQUETAS_ESTADO[producto.estado] ?? ETIQUETAS_ESTADO.disponible;
  const esVendedorDuenio = perfil?.id === producto.vendedor_id;
  const esRolVendedor = perfil?.rol === "vendedor";
  const puedeComprar = !DEMO_MODE && perfil?.rol === "comprador" && perfil.activo !== false && ["disponible", "proximo_a_vencer"].includes(producto.estado) && producto.stock > 0 && vencimiento.dias > 0 && !esVendedorDuenio;

  const totalPagar = (Number(producto.precio_actual) * Number(cantidad || 1)).toFixed(2);
  const totalAhorrado = (ahorro.montoAhorro * Number(cantidad || 1)).toFixed(2);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10">
      {/* Migas de pan / Breadcrumb */}
      <nav aria-label="Ruta de navegación" className="mb-6">
        <ol className="flex items-center gap-2 text-xs sm:text-sm text-ink-soft">
          <li>
            <Link to="/" className="hover:text-forest transition-colors">
              Inicio
            </Link>
          </li>
          <li aria-hidden="true" className="text-sage">/</li>
          <li className="text-forest font-medium truncate max-w-[200px]">
            {producto.categorias?.nombre || "Alimentos"}
          </li>
          <li aria-hidden="true" className="text-sage">/</li>
          <li className="text-forest-deep font-semibold truncate max-w-[250px]" aria-current="page">
            {producto.nombre}
          </li>
        </ol>
      </nav>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Columna Izquierda: Imagen y sellos */}
        <div className="space-y-4">
          <div className="aspect-square bg-paper-warm border border-sage/40 rounded-3xl flex items-center justify-center overflow-hidden shadow-card relative">
            {producto.foto_url ? (
              <img
                src={producto.foto_url}
                alt={producto.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-ink-soft/40 p-6">
                <svg className="w-20 h-20 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-sm font-medium">Fotografía referencial no disponible</span>
              </div>
            )}

            {/* Sello de Descuento grande */}
            {ahorro.porcentaje > 0 && (
              <div className="absolute top-4 right-4 bg-terra text-white px-3.5 py-1.5 rounded-full font-serif font-bold text-sm tracking-tight shadow-md flex items-center gap-1 -rotate-3">
                <span>-{ahorro.porcentaje}% OFF</span>
              </div>
            )}

            {/* Badge de Estado */}
            <div className="absolute top-4 left-4">
              <Badge
                variant={estadoInfo.variant}
                size="md"
                dot
                className="bg-card/95 backdrop-blur-xs shadow-xs font-semibold"
              >
                {estadoInfo.texto}
              </Badge>
            </div>
          </div>

          {/* Información sobre la tienda / vendedor */}
          <div className="bg-card border border-sage/40 rounded-2xl p-4 shadow-xs">
            <h2 className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">
              Comercio responsable
            </h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-forest text-paper flex items-center justify-center font-serif font-bold text-base">
                {(producto.perfiles?.nombre_negocio || producto.perfiles?.nombre || "Ó").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-forest-deep text-sm truncate">
                  {producto.perfiles?.nombre_negocio || producto.perfiles?.nombre || "Comercio local aliado"}
                </p>
                <p className="text-xs text-ink-soft truncate flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-moss shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {producto.perfiles?.ubicacion || producto.zona || "Tacna, Perú"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Detalles del producto y panel de compra */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-moss">
                {producto.categorias?.nombre}
              </span>
              {esVendedorDuenio && (
                <Link
                  to={`/productos/${producto.id}/editar`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-moss hover:text-forest underline"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                  Editar producto
                </Link>
              )}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest-deep leading-tight">
              {producto.nombre}
            </h1>
          </div>

          {/* Bloque de Precios con Ahorro Visible */}
          <div className="bg-card border border-sage/40 rounded-2xl p-5 shadow-xs">
            <div className="flex items-baseline justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs text-ink-soft uppercase font-semibold block mb-0.5">
                  Precio con descuento
                </span>
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-4xl font-bold text-forest-deep">
                    S/ {Number(producto.precio_actual).toFixed(2)}
                  </span>
                  {Number(producto.precio_original) > Number(producto.precio_actual) && (
                    <span className="text-base text-ink-soft/50 line-through">
                      S/ {Number(producto.precio_original).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {ahorro.montoAhorro > 0 && (
                <div className="bg-moss/10 border border-moss/20 text-forest px-3 py-1.5 rounded-xl text-right">
                  <span className="text-xs block font-medium">Ahorro estimado</span>
                  <span className="text-sm font-bold">
                    S/ {ahorro.montoAhorro.toFixed(2)} por unidad
                  </span>
                </div>
              )}
            </div>

            {/* Banner de Vencimiento Inteligente */}
            <div
              className={`mt-4 rounded-xl p-3.5 flex items-start gap-2.5 text-xs sm:text-sm border ${
                vencimiento.esCritico
                  ? "bg-terra-pale/60 border-terra/30 text-terra"
                  : "bg-sage-pale/40 border-sage/60 text-forest-deep"
              }`}
            >
              <svg
                className="w-5 h-5 shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p className="font-semibold">{vencimiento.texto}</p>
                <p className="text-xs opacity-90 mt-0.5">
                  Fecha de vencimiento declarada por el comercio: {fechaLocal(producto.fecha_vencimiento)}.
                </p>
              </div>
            </div>

            {/* Stock y peso */}
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-sage/20 text-xs">
              <div>
                <span className="text-ink-soft block font-medium">Stock disponible:</span>
                <span className={`font-semibold text-sm ${stockInfo.esCritico ? "text-amber-deep" : "text-forest-deep"}`}>
                  {stockInfo.texto}
                </span>
              </div>
              <div>
                <span className="text-ink-soft block font-medium">Peso estimado:</span>
                <span className="font-semibold text-sm text-forest-deep">
                  {producto.peso_unidad_kg ? `${producto.peso_unidad_kg} kg / unidad` : "No especificado"}
                </span>
              </div>
            </div>
          </div>

          {/* Descripción del producto */}
          {producto.descripcion && (
            <div className="bg-card border border-sage/40 rounded-2xl p-5 shadow-xs">
              <h2 className="text-xs font-semibold text-ink-soft uppercase tracking-wider mb-2">
                Descripción
              </h2>
              <p className="text-ink-soft text-sm leading-relaxed whitespace-pre-line">
                {producto.descripcion}
              </p>
            </div>
          )}

          {/* Caja de Acción de Compra */}
          <div className="bg-card border-2 border-forest/20 rounded-2xl p-5 shadow-card space-y-4">
            <h2 className="font-serif text-lg font-semibold text-forest-deep">
              Realizar pedido
            </h2>

            {/* Selector de cantidad y modalidad */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Selector de cantidad con botones +/- */}
              <div>
                <label htmlFor="cantidad-input" className="block text-xs font-semibold text-ink-soft uppercase mb-1.5">
                  Cantidad
                </label>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.max(1, Number(c) - 1))}
                    disabled={cantidad <= 1 || !puedeComprar}
                    aria-label="Disminuir cantidad"
                    className="w-10 h-10 rounded-l-xl bg-paper-warm border border-r-0 border-gray-300 flex items-center justify-center text-forest-deep hover:bg-sage/30 disabled:opacity-40 transition-colors focus-visible:ring-2 focus-visible:ring-moss focus:outline-none"
                  >
                    –
                  </button>
                  <input
                    id="cantidad-input"
                    type="number"
                    min={1}
                    max={producto.stock}
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, Math.min(producto.stock, Number(e.target.value))))}
                    disabled={!puedeComprar}
                    className="w-16 h-10 text-center font-bold text-forest-deep border-y border-gray-300 bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCantidad((c) => Math.min(producto.stock, Number(c) + 1))}
                    disabled={cantidad >= producto.stock || !puedeComprar}
                    aria-label="Aumentar cantidad"
                    className="w-10 h-10 rounded-r-xl bg-paper-warm border border-l-0 border-gray-300 flex items-center justify-center text-forest-deep hover:bg-sage/30 disabled:opacity-40 transition-colors focus-visible:ring-2 focus-visible:ring-moss focus:outline-none"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Selector de Modalidad */}
              <div>
                <label htmlFor="modalidad-select" className="block text-xs font-semibold text-ink-soft uppercase mb-1.5">
                  Modalidad de entrega
                </label>
                <select
                  id="modalidad-select"
                  value={modalidad}
                  onChange={(e) => setModalidad(e.target.value)}
                  disabled={!puedeComprar}
                  className="w-full h-10 border border-gray-300 bg-white rounded-xl px-3 text-sm focus:outline-none focus:ring-2 focus:ring-moss/40"
                >
                  {modalidadesDisponibles(producto).map((val) => (
                    <option key={val} value={val}>
                      {val === "recojo" ? "Recojo en el local comercial" : "Entrega coordinada"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Referencia opcional para entrega coordinada */}
            {modalidad === "coordinada" && (
              <div>
                <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                  Referencia o dirección para entrega coordinada
                </label>
                <input
                  type="text"
                  placeholder="Ej. Calle San Martín 450, cerca al mercado central"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss/40"
                />
              </div>
            )}

            {/* Resumen del Monto a Pagar */}
            <div className="bg-paper-warm rounded-xl p-3.5 flex items-center justify-between border border-forest/10">
              <div>
                <span className="text-xs text-ink-soft block">Total a pagar:</span>
                <span className="font-serif text-2xl font-bold text-forest-deep">
                  S/ {totalPagar}
                </span>
              </div>
              {Number(totalAhorrado) > 0 && (
                <div className="text-right">
                  <span className="text-xs text-moss font-semibold block">Ahorro total:</span>
                  <span className="text-sm font-bold text-moss">
                    S/ {totalAhorrado}
                  </span>
                </div>
              )}
            </div>

            {/* Botón Principal de Compra */}
            {!usuario ? (
              <Link to="/iniciar-sesion" className="block text-center rounded-xl bg-forest text-white px-4 py-3 font-semibold">
                Inicia sesión para comprar
              </Link>
            ) : esRolVendedor ? (
              <div className="bg-amber/15 border border-amber/30 rounded-xl p-3 text-xs text-forest-deep text-center font-medium">
                Has iniciado sesión con cuenta de Vendedor. Los pedidos de compra están habilitados exclusivamente para cuentas de Comprador.
              </div>
            ) : (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                disabled={!puedeComprar}
                onClick={abrirModalCompra}
              >
                {producto.stock <= 0
                  ? "Producto agotado"
                  : producto.estado === "vendido"
                  ? "Producto ya vendido"
                  : DEMO_MODE
                  ? "Demostración: solo lectura"
                  : vencimiento.dias <= 0
                  ? "Producto no disponible por vencimiento"
                  : "Rescatar este alimento ahora"}
              </Button>
            )}

            {/* Mensajes de Éxito o Error de Compra */}
            {errorCompra && (
              <p role="alert" className="text-terra text-xs font-semibold bg-terra-pale p-3 rounded-xl">
                {errorCompra}
              </p>
            )}

            {mensajeExito && (
              <div
                role="status"
                aria-live="polite"
                className="bg-moss/15 border border-moss/30 text-forest p-4 rounded-xl space-y-2 animate-in fade-in"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-moss" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <p className="font-bold text-sm">
                    ¡Pedido N.° {mensajeExito.id} generado exitosamente!
                  </p>
                </div>
                <p className="text-xs text-forest/90">
                  Estado actual: <strong>{mensajeExito.estado}</strong> · Total: S/ {Number(mensajeExito.montoTotal).toFixed(2)}
                </p>
                <div className="pt-1">
                  <Link
                    to="/mis-pedidos"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-forest underline hover:text-forest-deep"
                  >
                    <span>Ir a Mis pedidos para ver el seguimiento</span>
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Accesible de Confirmación de Pedido */}
      <ConfirmModal
        isOpen={modalConfirmarAbierto}
        onClose={() => setModalConfirmarAbierto(false)}
        onConfirm={ejecutarCompra}
        title="Confirmar tu pedido"
        confirmLabel="Confirmar compra"
        cancelLabel="Revisar"
        loading={enviando}
        message={`¿Deseas confirmar la compra de ${cantidad} unidad(es) de "${producto.nombre}" por un total de S/ ${totalPagar} con modalidad "${modalidad === "recojo" ? "Recojo en tienda" : "Entrega coordinada"}"?`}
      />
    </div>
  );
}
