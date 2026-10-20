import { DEMO_MODE } from "../services/marketplace";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

export default function Navbar() {
  const { usuario, perfil, cerrarSesion } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  // Cerrar con Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape" && menuAbierto) {
        setMenuAbierto(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuAbierto]);

  async function manejarSalir() {
    await cerrarSesion();
    toast.info("Has cerrado sesión. ¡Esperamos verte pronto!");
    navigate("/");
  }

  const esVendedor = perfil?.rol === "vendedor";

  return (
    <header className="sticky top-0 z-40 bg-forest text-paper border-b border-forest-deep shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Marca / Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 group rounded-xl p-1 -m-1 focus-visible:ring-2 focus-visible:ring-amber focus:outline-none"
          aria-label="ÓrbiKa, volver al inicio"
        >
          <span className="w-9 h-9 rounded-full bg-amber flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#152A1F"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5"
              aria-hidden="true"
            >
              <path d="M12 21c-4-2-7-6-7-10a7 7 0 0 1 14 0c0 4-3 8-7 10Z" />
              <path d="M12 11v6" />
            </svg>
          </span>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-bold tracking-tight text-white leading-none">
              ÓrbiKa
            </span>
            <span className="text-[10px] text-sage-pale/75 tracking-wider uppercase font-medium">
              Mercado Circular
            </span>
          </div>
        </Link>

        {/* Navegación de escritorio */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            to="/"
            className={`transition-colors py-1 focus-visible:ring-2 focus-visible:ring-amber rounded-md focus:outline-none ${
              location.pathname === "/"
                ? "text-amber font-semibold"
                : "text-paper/90 hover:text-white"
            }`}
          >
            Inicio
          </Link>

          <Link
            to="/catalogo"
            className={`transition-colors py-1 focus-visible:ring-2 focus-visible:ring-amber rounded-md focus:outline-none ${
              location.pathname.startsWith("/catalogo") || location.pathname.startsWith("/productos")
                ? "text-amber font-semibold"
                : "text-paper/90 hover:text-white"
            }`}
          >
            Catálogo
          </Link>

          {esVendedor && (
            <Link
              to="/publicar"
              className={`transition-colors py-1 flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-amber rounded-md focus:outline-none ${
                location.pathname === "/publicar"
                  ? "text-amber font-semibold"
                  : "text-paper/90 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              Publicar producto
            </Link>
          )}

          {usuario && (
            <Link
              to="/mis-pedidos"
              className={`transition-colors py-1 focus-visible:ring-2 focus-visible:ring-amber rounded-md focus:outline-none ${
                location.pathname === "/mis-pedidos"
                  ? "text-amber font-semibold"
                  : "text-paper/90 hover:text-white"
              }`}
            >
              {esVendedor ? "Mis ventas" : "Mis compras"}
            </Link>
          )}

          {usuario ? (
            <div className="flex items-center gap-3 pl-2 border-l border-forest-deep/60">
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold text-white truncate max-w-[140px]">
                  {perfil?.nombre || usuario.email}
                </span>
                <Badge
                  variant={esVendedor ? "warning" : "info"}
                  size="sm"
                  className="mt-0.5"
                >
                  {esVendedor ? "Vendedor" : "Comprador"}
                </Badge>
              </div>

              <button
                type="button"
                disabled={DEMO_MODE}
                onClick={manejarSalir}
                className="text-xs border border-paper/30 hover:border-paper hover:bg-forest-deep/40 text-paper font-medium px-3 py-1.5 rounded-lg transition-all focus-visible:ring-2 focus-visible:ring-amber focus:outline-none cursor-pointer"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/iniciar-sesion"
                className="text-paper/90 hover:text-white transition-colors py-1 focus-visible:ring-2 focus-visible:ring-amber rounded-md focus:outline-none"
              >
                Iniciar sesión
              </Link>
              <Link
                to="/registrarse"
                className="bg-amber hover:bg-amber-deep text-forest-deep hover:text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-xs focus-visible:ring-2 focus-visible:ring-white focus:outline-none"
              >
                Registrarse
              </Link>
            </div>
          )}
        </nav>

        {/* Botón menú móvil */}
        <div className="md:hidden flex items-center gap-2">
          {usuario && (
            <Badge
              variant={esVendedor ? "warning" : "info"}
              size="sm"
            >
              {esVendedor ? "Vendedor" : "Comprador"}
            </Badge>
          )}
          <button
            type="button"
            onClick={() => setMenuAbierto((prev) => !prev)}
            aria-expanded={menuAbierto}
            aria-label={menuAbierto ? "Cerrar menú principal" : "Abrir menú principal"}
            className="p-2 -mr-2 text-paper hover:bg-forest-deep/50 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-amber focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            {menuAbierto ? (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Menú desplegable móvil */}
      {menuAbierto && (
        <div className="md:hidden border-t border-forest-deep bg-forest-deep/95 backdrop-blur-md px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-150">
          {usuario && (
            <div className="pb-3 border-b border-forest/60">
              <p className="text-xs text-sage-pale/80">Sesión iniciada como</p>
              <p className="font-semibold text-white truncate text-sm mt-0.5">
                {perfil?.nombre || usuario.email}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 text-sm font-medium">
            <Link
              to="/"
              className={`p-2.5 rounded-xl transition-colors flex items-center justify-between ${
                location.pathname === "/"
                  ? "bg-forest text-amber font-semibold"
                  : "text-paper/90 hover:bg-forest"
              }`}
            >
              <span>Inicio</span>
              <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>

            <Link
              to="/catalogo"
              className={`p-2.5 rounded-xl transition-colors flex items-center justify-between ${
                location.pathname.startsWith("/catalogo") || location.pathname.startsWith("/productos")
                  ? "bg-forest text-amber font-semibold"
                  : "text-paper/90 hover:bg-forest"
              }`}
            >
              <span>Catálogo de alimentos</span>
              <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>

            {esVendedor && (
              <Link
                to="/publicar"
                className={`p-2.5 rounded-xl transition-colors flex items-center justify-between ${
                  location.pathname === "/publicar"
                    ? "bg-forest text-amber font-semibold"
                    : "text-paper/90 hover:bg-forest"
                }`}
              >
                <span>Publicar producto</span>
                <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            )}

            {usuario && (
              <Link
                to="/mis-pedidos"
                className={`p-2.5 rounded-xl transition-colors flex items-center justify-between ${
                  location.pathname === "/mis-pedidos"
                    ? "bg-forest text-amber font-semibold"
                    : "text-paper/90 hover:bg-forest"
                }`}
              >
                <span>{esVendedor ? "Mis ventas y pedidos" : "Mis compras y pedidos"}</span>
                <svg className="w-4 h-4 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            )}
          </div>

          <div className="pt-3 border-t border-forest/60">
            {usuario ? (
              <Button
                variant="secondary"
                fullWidth
                disabled={DEMO_MODE}
                onClick={manejarSalir}
                className="text-forest-deep bg-paper"
              >
                Cerrar sesión
              </Button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/iniciar-sesion"
                  className="text-center font-medium text-paper hover:text-white py-2.5 rounded-xl border border-paper/30 block"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/registrarse"
                  className="text-center font-semibold bg-amber hover:bg-amber-deep text-forest-deep py-2.5 rounded-xl block"
                >
                  Crear cuenta gratis
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
