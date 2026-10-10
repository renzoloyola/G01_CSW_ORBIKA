import { useEffect, useState, useMemo } from "react";
import { marketplace, mensajeError } from "../services/marketplace";
import ProductCard from "../components/ProductCard";
import { serializarFiltros } from "./product.helpers";
import { Button, Badge, Modal, StatePanel, SkeletonGrid } from "../components/ui";
import { usePageTitle } from "../hooks/usePageTitle";
const filtrosIniciales = {
  busqueda: "",
  categoriaId: "",
  zona: "",
  maxPrecio: "",
  orden: "recientes",
};

export default function ProductList() {
  usePageTitle("Catálogo de alimentos");
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [aplicados, setAplicados] = useState(filtrosIniciales);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [modalFiltrosAbierto, setModalFiltrosAbierto] = useState(false);

  useEffect(() => {
    marketplace.listarCategorias().then(setCategorias)
      .catch((err) => setError(mensajeError(err, "No se pudieron cargar las categorías.")));
  }, []);

  function cargarCatalogo() {
    setCargando(true);
    setError("");
    marketplace.listarProductos(serializarFiltros(aplicados))
      .then(setProductos)
      .catch((err) => {
        setProductos([]);
        setError(mensajeError(err, "No se pudo cargar el catálogo."));
      })
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    cargarCatalogo();
  }, [aplicados]);

  function cambiar(event) {
    const { name, value } = event.target;
    setFiltros((actual) => ({ ...actual, [name]: value }));
  }

  function aplicarFiltros(event) {
    if (event) event.preventDefault();
    setAplicados(filtros);
    setModalFiltrosAbierto(false);
  }

  function limpiarFiltros() {
    setFiltros(filtrosIniciales);
    setAplicados(filtrosIniciales);
    setModalFiltrosAbierto(false);
  }

  function seleccionarCategoriaRapida(catId) {
    const nuevoId = filtros.categoriaId === String(catId) ? "" : String(catId);
    const nuevos = { ...filtros, categoriaId: nuevoId };
    setFiltros(nuevos);
    setAplicados(nuevos);
  }

  const cantidadFiltrosActivos = useMemo(() => {
    let count = 0;
    if (aplicados.busqueda?.trim()) count++;
    if (aplicados.categoriaId) count++;
    if (aplicados.zona?.trim()) count++;
    if (aplicados.maxPrecio) count++;
    return count;
  }, [aplicados]);

  return (
    <div className="min-w-0">
      {/* Encabezado editorial de la vista de catálogo */}
      <section className="bg-forest text-paper border-b border-forest-deep">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
          <span className="text-xs font-semibold text-amber uppercase tracking-wider">
            Mercado Circular en Tacna
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
            Catálogo de alimentos
          </h1>
          <p className="text-sage-pale/90 text-sm sm:text-base mt-2 max-w-xl">
            Encuentra y rescata alimentos en perfecto estado a precios reducidos, publicados hoy por comercios de la ciudad.
          </p>
        </div>
      </section>

      {/* Contenedor de filtros y productos */}
      <div id="catalogo-alimentos" className="max-w-6xl mx-auto px-4 py-8">
        {/* Barra superior de Búsqueda y Botón Filtros Móvil */}
        <div className="bg-card border border-sage/40 rounded-2xl p-4 sm:p-5 shadow-card mb-6">
          <form onSubmit={aplicarFiltros} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-soft/50">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="search"
                  name="busqueda"
                  value={filtros.busqueda}
                  onChange={cambiar}
                  placeholder="Buscar productos (ej. pan, yogurt, paltas)…"
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
                  aria-label="Buscar producto por nombre"
                />
              </div>

              {/* Botón Filtros en Móvil */}
              <button
                type="button"
                onClick={() => setModalFiltrosAbierto(true)}
                className="lg:hidden flex items-center gap-1.5 bg-paper-warm border border-forest/20 text-forest-deep px-3.5 py-2.5 rounded-xl text-sm font-medium hover:bg-sage/30 transition-colors focus-visible:ring-2 focus-visible:ring-moss focus:outline-none shrink-0"
                aria-label="Abrir panel de filtros"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                <span>Filtros</span>
                {cantidadFiltrosActivos > 0 && (
                  <span className="bg-forest text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cantidadFiltrosActivos}
                  </span>
                )}
              </button>

              <Button
                type="submit"
                variant="primary"
                className="hidden lg:inline-flex"
              >
                Buscar
              </Button>
            </div>

            {/* Filtros integrados en Escritorio */}
            <div className="hidden lg:grid grid-cols-4 gap-3 pt-3 border-t border-sage/20">
              <div>
                <label className="block text-[11px] font-semibold text-ink-soft uppercase mb-1">
                  Categoría
                </label>
                <select
                  name="categoriaId"
                  value={filtros.categoriaId}
                  onChange={cambiar}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss/40"
                >
                  <option value="">Todas las categorías</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-soft uppercase mb-1">
                  Zona / Distrito
                </label>
                <input
                  type="text"
                  name="zona"
                  value={filtros.zona}
                  onChange={cambiar}
                  placeholder="Ej. Cercado, Pocollay"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss/40"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-ink-soft uppercase mb-1">
                  Precio máximo (S/)
                </label>
                <input
                  type="number"
                  min="0.10"
                  step="0.50"
                  name="maxPrecio"
                  value={filtros.maxPrecio}
                  onChange={cambiar}
                  placeholder="Sin límite"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moss/40"
                />
              </div>

              <div className="flex items-end gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                >
                  Aplicar filtros
                </Button>

                {cantidadFiltrosActivos > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={limpiarFiltros}
                    title="Restablecer todos los filtros"
                    className="shrink-0"
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </div>

            {/* Chips rápidos de categorías */}
            {categorias.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 text-xs no-scrollbar">
                <span className="text-ink-soft/70 font-semibold shrink-0 mr-1 hidden sm:inline">
                  Categorías:
                </span>
                <button
                  type="button"
                  onClick={() => seleccionarCategoriaRapida("")}
                  className={`px-3 py-1 rounded-full border transition-all shrink-0 font-medium ${
                    !filtros.categoriaId
                      ? "bg-forest text-white border-forest shadow-xs"
                      : "bg-paper-warm border-sage/40 text-forest-deep hover:bg-sage/30"
                  }`}
                >
                  Todas
                </button>
                {categorias.map((c) => {
                  const activa = filtros.categoriaId === String(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => seleccionarCategoriaRapida(c.id)}
                      className={`px-3 py-1 rounded-full border transition-all shrink-0 font-medium ${
                        activa
                          ? "bg-forest text-white border-forest shadow-xs"
                          : "bg-paper-warm border-sage/40 text-forest-deep hover:bg-sage/30"
                      }`}
                    >
                      {c.nombre}
                    </button>
                  );
                })}
              </div>
            )}
          </form>
        </div>

        {/* Modal Accesible de Filtros Móviles */}
        <Modal
          isOpen={modalFiltrosAbierto}
          onClose={() => setModalFiltrosAbierto(false)}
          title="Filtrar catálogo"
          description="Ajusta tus preferencias para encontrar productos cercanos."
        >
          <form onSubmit={aplicarFiltros} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                Buscar por nombre
              </label>
              <input
                type="text"
                name="busqueda"
                value={filtros.busqueda}
                onChange={cambiar}
                placeholder="Nombre del alimento…"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                Categoría
              </label>
              <select
                name="categoriaId"
                value={filtros.categoriaId}
                onChange={cambiar}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white"
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                Zona o distrito
              </label>
              <input
                type="text"
                name="zona"
                value={filtros.zona}
                onChange={cambiar}
                placeholder="Ej. Pocollay, Cono Sur, Centro…"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                Precio máximo en soles
              </label>
              <input
                type="number"
                min="0.10"
                step="0.50"
                name="maxPrecio"
                value={filtros.maxPrecio}
                onChange={cambiar}
                placeholder="Sin tope de precio"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white"
              />
            </div>

            <div className="flex gap-2 pt-4 border-t border-sage/30">
              <Button
                type="button"
                variant="secondary"
                onClick={limpiarFiltros}
                className="flex-1"
              >
                Limpiar
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
              >
                Aplicar filtros
              </Button>
            </div>
          </form>
        </Modal>

        {/* Encabezado de Resultados y Ordenamiento */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="font-serif text-2xl font-semibold text-forest-deep">
              Catálogo disponible
            </h2>
            {!cargando && !error && (
              <Badge variant="neutral" size="sm">
                {productos.length} {productos.length === 1 ? "producto" : "productos"}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label htmlFor="ordenar-por" className="text-xs font-medium text-ink-soft shrink-0">
              Ordenar por:
            </label>
            <select
              id="ordenar-por"
              name="orden"
              value={filtros.orden}
              onChange={(e) => {
                cambiar(e);
                setAplicados((a) => ({ ...a, orden: e.target.value }));
              }}
              className="bg-card border border-sage/50 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-medium text-forest-deep focus:outline-none focus:ring-2 focus:ring-moss/40"
            >
              <option value="recientes">Más recientes</option>
              <option value="mayor_descuento">Mayor descuento</option>
              <option value="precio_asc">Menor precio</option>
            </select>
          </div>
        </div>

        {/* Estados de Carga, Error, Vacío y Lista */}
        {cargando && <SkeletonGrid count={8} />}

        {error && (
          <StatePanel
            type="error"
            title="Ocurrió un inconveniente"
            description={error}
            actionLabel="Reintentar carga"
            onAction={cargarCatalogo}
          />
        )}

        {!cargando && !error && productos.length === 0 && (
          <StatePanel
            type="empty"
            title="No se encontraron productos"
            description={
              cantidadFiltrosActivos > 0
                ? "Prueba cambiando los términos de búsqueda o eliminando los filtros activos."
                : "Aún no hay productos publicados en el mercado. Vuelve pronto para descubrir nuevas oportunidades."
            }
            actionLabel={cantidadFiltrosActivos > 0 ? "Restablecer filtros" : undefined}
            onAction={cantidadFiltrosActivos > 0 ? limpiarFiltros : undefined}
          />
        )}

        {!cargando && !error && productos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {productos.map((producto) => (
              <ProductCard key={producto.id} producto={producto} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
