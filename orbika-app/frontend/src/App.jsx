import { lazy, Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { DEMO_MODE } from "./services/marketplace";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

const Home = lazy(() => import("./pages/Home"));
const ProductList = lazy(() => import("./pages/ProductList"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const RecoverPassword = lazy(() => import("./pages/RecoverPassword"));
const PublishProduct = lazy(() => import("./pages/PublishProduct"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const NotFound = lazy(() => import("./pages/NotFound"));

export default function App() {
  return (
    <div className="min-h-screen bg-paper flex flex-col selection:bg-moss/20 selection:text-forest-deep text-ink">
      {/* Enlace accesible de salto al contenido para usuarios con teclado */}
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 bg-amber text-forest-deep font-bold px-4 py-2 rounded-xl shadow-2xl border-2 border-forest-deep focus:outline-none"
      >
        Saltar al contenido principal
      </a>

      <Navbar />
      {DEMO_MODE && <div role="status" className="bg-amber/20 border-b border-amber/40 px-4 py-3 text-center text-sm text-forest-deep">
        Demostración de solo lectura · Productos y pedidos ficticios. Las operaciones están deshabilitadas.
      </div>}
      <main id="contenido-principal" tabIndex={-1} className="flex-1 w-full max-w-full overflow-x-hidden focus:outline-none">
        <Suspense fallback={<div role="status" className="text-center py-16">Cargando página…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<ProductList />} />
          <Route path="/productos" element={<ProductList />} />
          <Route path="/productos/:id" element={<ProductDetail />} />
          <Route path="/iniciar-sesion" element={<Login />} />
          <Route path="/registrarse" element={<Register />} />
          <Route path="/recuperar-contrasena" element={<RecoverPassword />} />
          <Route path="/actualizar-contrasena" element={<UpdatePassword />} />
          <Route
            path="/publicar"
            element={
              <ProtectedRoute rolRequerido="vendedor">
                <PublishProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/productos/:id/editar"
            element={
              <ProtectedRoute rolRequerido="vendedor">
                <EditProduct />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mis-pedidos"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          {/* Ruta 404 personalizada */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>

      {/* Footer Editorial Sostenible */}
      <footer className="bg-forest-deep text-sage-pale border-t border-forest mt-16">
        <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-amber flex items-center justify-center shrink-0">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#152A1F"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                  aria-hidden="true"
                >
                  <path d="M12 21c-4-2-7-6-7-10a7 7 0 0 1 14 0c0 4-3 8-7 10Z" />
                  <path d="M12 11v6" />
                </svg>
              </span>
              <span className="font-serif text-2xl font-bold tracking-tight text-white">
                ÓrbiKa
              </span>
            </div>
            <p className="text-xs text-sage-pale/80 leading-relaxed max-w-sm">
              Mercado circular de alimentos en Tacna. Conectamos negocios y consumidores para rescatar alimentos de calidad a precios justos, reduciendo el desperdicio orgánico.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Navegación
            </h3>
            <ul className="space-y-1.5 text-xs text-sage-pale/85">
              <li>
                <Link to="/catalogo" className="hover:text-amber transition-colors">
                  Explorar catálogo de alimentos
                </Link>
              </li>
              <li>
                <Link to="/registrarse" className="hover:text-amber transition-colors">
                  Registrar mi negocio como vendedor
                </Link>
              </li>
              <li>
                <Link to="/iniciar-sesion" className="hover:text-amber transition-colors">
                  Iniciar sesión en mi cuenta
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-white">
              Compromiso Ambiental
            </h3>
            <p className="text-xs text-sage-pale/80 leading-relaxed">
              Cada alimento rescatado a través de ÓrbiKa representa agua, energía y trabajo salvado de convertirse en desperdicio. Tacna unida por un consumo consciente.
            </p>
          </div>
        </div>

        <div className="border-t border-forest/60 max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-sage-pale/60 gap-2">
          <span>© {new Date().getFullYear()} ÓrbiKa · Tacna, Perú. Todos los derechos reservados.</span>
          <span>Desarrollado con compromiso local y sostenibilidad.</span>
        </div>
      </footer>
    </div>
  );
}
