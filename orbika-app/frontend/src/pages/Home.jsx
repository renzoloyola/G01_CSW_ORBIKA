import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LandingHero from "../components/LandingHero";
import HowItWorks from "../components/HowItWorks";
import Testimonials from "../components/Testimonials";
import ProductCard from "../components/ProductCard";
import { usePageTitle } from "../hooks/usePageTitle";
import { DEMO_MODE, marketplace, mensajeError } from "../services/marketplace";
import { StatePanel } from "../components/ui";

export default function Home() {
  usePageTitle("Dale una segunda oportunidad a los alimentos");
  const [destacados, setDestacados] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    marketplace.listarProductos()
      .then((data) => setDestacados(data.slice(0, 4)))
      .catch((err) => setError(mensajeError(err, "No se pudo cargar el catálogo.")))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="min-w-0">
      {/* Portada Hero con escaparate interactivo animado */}
      <LandingHero />

      {/* Escaparate de Alimentos Destacados para Rescatar Hoy */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-semibold text-moss uppercase tracking-wider">
              Oportunidades del Día · Tacna
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest-deep mt-1">
              Alimentos disponibles hoy
            </h2>
            <p className="text-ink-soft text-sm sm:text-base mt-1.5 max-w-xl">
              Productos frescos y preparados de negocios tacneños a precios reducidos. Listos para ser rescatados hoy mismo.
            </p>
          </div>

          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:text-forest-deep hover:underline shrink-0"
          >
            <span>Ver todo el catálogo</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {cargando && <p role="status">Cargando alimentos disponibles…</p>}
        {error && <StatePanel type="error" title="Catálogo no disponible" description={error} />}
        {!cargando && !error && destacados.length === 0 && <StatePanel type="empty" title="Aún no hay productos disponibles" description="Vuelve a consultar más adelante." />}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {destacados.map((producto) => (
            <ProductCard key={producto.id} producto={producto} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/catalogo"
            className="inline-block w-full text-center font-semibold bg-paper-warm border border-forest/20 text-forest-deep px-5 py-3 rounded-xl hover:bg-sage/30 transition-colors"
          >
            Ver catálogo completo de productos
          </Link>
        </div>
      </section>

      {/* Cómo funciona el rescate circular en 3 pasos */}
      <HowItWorks />

      {/* Espacio de testimonios y experiencias reales en Tacna */}
      {DEMO_MODE && <Testimonials />}

      {/* Banner final de llamado a la acción hacia el catálogo */}
      <section className="bg-paper py-16 border-t border-sage/40">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-5">
          <span className="text-xs font-semibold text-moss uppercase tracking-wider">
            Mercado Activo en Tacna
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-forest-deep leading-tight">
            Descubre los alimentos disponibles hoy en tu zona
          </h2>
          <p className="text-ink-soft text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Panaderías, minimarkets y productores del valle de Tacna publican ofertas a diario. Filtra por distrito, categoría o precio y ahorra cuidando el planeta.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              to="/catalogo"
              className="inline-flex items-center justify-center gap-2 font-semibold bg-forest hover:bg-forest-deep text-white px-7 py-3.5 rounded-2xl shadow-md transition-all transform hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-moss focus:outline-none"
            >
              <span>Ver catálogo completo de productos</span>
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
