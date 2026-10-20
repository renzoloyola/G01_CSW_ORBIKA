import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/** Envuelve páginas que requieren sesión iniciada (y, opcionalmente, un rol). */
export default function ProtectedRoute({ children, rolRequerido }) {
  const { usuario, perfil, cargando } = useAuth();

  if (cargando) return <div className="text-center py-20 text-gray-500">Cargando…</div>;
  if (!usuario) return <Navigate to="/iniciar-sesion" replace />;
  if (rolRequerido && perfil?.rol !== rolRequerido) {
    return <Navigate to="/" replace />;
  }
  return children;
}
