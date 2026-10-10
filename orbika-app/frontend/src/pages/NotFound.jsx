import { Link } from "react-router-dom";
import { Button } from "../components/ui";
import { usePageTitle } from "../hooks/usePageTitle";

export default function NotFound() {
  usePageTitle("Página no encontrada");
  return (
    <div className="max-w-lg mx-auto my-16 sm:my-24 px-4 text-center">
      <div className="bg-card border border-sage/40 rounded-3xl shadow-card p-8 sm:p-12 space-y-5">
        <div className="w-20 h-20 bg-paper-warm text-amber-deep rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
          🥫
        </div>

        <span className="font-mono text-xs font-bold text-moss tracking-widest uppercase block">
          Error 404 · Ruta no encontrada
        </span>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-forest-deep leading-tight">
          Parece que este alimento no está en el puesto
        </h1>

        <p className="text-ink-soft text-sm sm:text-base leading-relaxed max-w-sm mx-auto">
          La dirección que intentas visitar no existe o fue trasladada. Vuelve al mercado para seguir descubriendo ofertas de alimentos en Tacna.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <Link
            to="/catalogo"
            className="inline-flex items-center justify-center gap-2 bg-forest hover:bg-forest-deep text-white px-5 py-3 rounded-xl font-medium shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-moss focus:outline-none"
          >
            <span>Ver catálogo de alimentos</span>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 bg-paper-warm hover:bg-sage/30 text-forest-deep border border-sage/40 px-5 py-3 rounded-xl font-medium transition-colors focus-visible:ring-2 focus-visible:ring-moss focus:outline-none"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
