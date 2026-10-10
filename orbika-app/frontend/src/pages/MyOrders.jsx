import { useCallback, useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { marketplace, mensajeError } from "../services/marketplace";
import { useAuth } from "../context/AuthContext";
import OrderSummary from "../components/orders/OrderSummary";
import OrderCard from "../components/orders/OrderCard";
import { Button, StatePanel, SkeletonOrder } from "../components/ui";
import { usePageTitle } from "../hooks/usePageTitle";

export default function MyOrders() {
  const { perfil } = useAuth();
  const esVendedor = perfil?.rol === "vendedor";
  usePageTitle(esVendedor ? "Mis ventas y pedidos" : "Mis compras y pedidos");

  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [pestanaActiva, setPestanaActiva] = useState("todos");

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setPedidos(await marketplace.listarPedidos());
    } catch (err) {
      setPedidos([]);
      setError(mensajeError(err, "No se pudieron cargar los pedidos."));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Recuentos por estado
  const conteos = useMemo(() => {
    const todos = pedidos.length;
    const activos = pedidos.filter((p) => ["creado", "preparando", "listo_para_entrega", "entregado"].includes(p.estado)).length;
    const completados = pedidos.filter((p) => ["completado"].includes(p.estado)).length;
    const cancelados = pedidos.filter((p) => p.estado === "cancelado").length;
    return { todos, activos, completados, cancelados };
  }, [pedidos]);

  // Definición de pestañas según rol
  const pestanas = useMemo(() => {
    if (esVendedor) {
      return [
        { id: "todos", label: "Todos", count: conteos.todos },
        { id: "activos", label: "Por atender", count: conteos.activos, highlight: conteos.activos > 0 },
        { id: "completados", label: "Completados", count: conteos.completados },
        { id: "cancelados", label: "Cancelados", count: conteos.cancelados },
      ];
    }
    return [
      { id: "todos", label: "Todos", count: conteos.todos },
      { id: "activos", label: "En curso", count: conteos.activos, highlight: conteos.activos > 0 },
      { id: "completados", label: "Completados", count: conteos.completados },
      { id: "cancelados", label: "Cancelados", count: conteos.cancelados },
    ];
  }, [esVendedor, conteos]);

  // Filtrado de pedidos según pestaña
  const pedidosFiltrados = useMemo(() => {
    if (pestanaActiva === "activos") {
      return pedidos.filter((p) => ["creado", "preparando", "listo_para_entrega", "entregado"].includes(p.estado));
    }
    if (pestanaActiva === "completados") {
      return pedidos.filter((p) => ["completado"].includes(p.estado));
    }
    if (pestanaActiva === "cancelados") {
      return pedidos.filter((p) => p.estado === "cancelado");
    }
    return pedidos;
  }, [pedidos, pestanaActiva]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 min-w-0">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold text-moss uppercase tracking-wider">
            {esVendedor ? "Panel de Ventas" : "Historial de Compras"}
          </span>
          <h1 className="font-serif text-3xl font-bold text-forest-deep mt-1">
            {esVendedor ? "Mis ventas y pedidos" : "Mis compras y pedidos"}
          </h1>
          <p className="text-ink-soft text-sm mt-1">
            {esVendedor
              ? "Supervisa los pedidos de tus clientes y avanza sus estados de despacho."
              : "Revisa el estado de entrega de tus alimentos rescatados y califica tu experiencia."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {esVendedor ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/publicar")}
            >
              Publicar nuevo producto
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/catalogo")}
            >
              Explorar catálogo
            </Button>
          )}
        </div>
      </div>

      {/* Métricas de resumen */}
      {!cargando && !error && pedidos.length > 0 && (
        <OrderSummary pedidos={pedidos} rol={perfil?.rol} />
      )}

      {/* Pestañas de filtrado por estado */}
      {!cargando && !error && pedidos.length > 0 && (
        <div
          className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-sage/30 no-scrollbar"
          role="tablist"
          aria-label="Filtrar pedidos por estado"
        >
          {pestanas.map((tab) => {
            const activa = pestanaActiva === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => setPestanaActiva(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-moss focus:outline-none ${
                  activa
                    ? "bg-forest text-white shadow-xs"
                    : "bg-paper-warm hover:bg-sage/30 text-forest-deep"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                    activa
                      ? "bg-white/20 text-white"
                      : tab.highlight
                      ? "bg-amber text-forest-deep"
                      : "bg-sage/40 text-forest-deep"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Estados de Carga y Error */}
      {cargando && (
        <div className="space-y-4">
          <SkeletonOrder />
          <SkeletonOrder />
          <SkeletonOrder />
        </div>
      )}

      {error && (
        <StatePanel
          type="error"
          title="Inconveniente al cargar pedidos"
          description={error}
          actionLabel="Reintentar"
          onAction={cargar}
        />
      )}

      {!cargando && !error && pedidos.length === 0 && (
        <StatePanel
          type="empty"
          title={esVendedor ? "Aún no tienes ventas registradas" : "Todavía no tienes pedidos"}
          description={
            esVendedor
              ? "Cuando los compradores rescaten tus alimentos publicados, sus pedidos aparecerán aquí."
              : "Explora el catálogo de alimentos cercanos en Tacna y dale una segunda oportunidad a productos de calidad."
          }
          actionLabel={esVendedor ? "Publicar un producto" : "Explorar catálogo de alimentos"}
          onAction={() => navigate(esVendedor ? "/publicar" : "/catalogo")}
        />
      )}

      {!cargando && !error && pedidos.length > 0 && pedidosFiltrados.length === 0 && (
        <StatePanel
          type="empty"
          title="No hay pedidos en esta sección"
          description={`No encontramos pedidos con el filtro "${
            pestanas.find((t) => t.id === pestanaActiva)?.label
          }".`}
          actionLabel="Ver todos los pedidos"
          onAction={() => setPestanaActiva("todos")}
        />
      )}

      {/* Lista de pedidos filtrados */}
      {!cargando && !error && pedidosFiltrados.length > 0 && (
        <div className="space-y-4">
          {pedidosFiltrados.map((pedido) => (
            <OrderCard
              key={pedido.id}
              pedido={pedido}
              rol={perfil?.rol}
              onRefresh={cargar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
