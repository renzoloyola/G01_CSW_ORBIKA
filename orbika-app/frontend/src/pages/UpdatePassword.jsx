import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { validarNuevaContrasena } from "../context/auth.helpers";
import { Button } from "../components/ui";

export default function UpdatePassword() {
  const { actualizarContrasena } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [contrasena, setContrasena] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function enviar(event) {
    event.preventDefault();
    const validacion = validarNuevaContrasena(contrasena, confirmacion);
    if (validacion) return setError(validacion);

    setGuardando(true);
    setError("");
    try {
      await actualizarContrasena(contrasena);
      toast.success("¡Tu contraseña ha sido actualizada correctamente!");
      navigate("/iniciar-sesion", {
        replace: true,
      });
    } catch {
      const msg = "El enlace de restablecimiento es inválido o ha expirado. Por favor solicita uno nuevo.";
      setError(msg);
      toast.error(msg);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="max-w-md mx-auto my-12 sm:my-16 px-4">
      <form
        onSubmit={enviar}
        className="bg-card border border-sage/40 rounded-3xl shadow-card p-6 sm:p-8 space-y-4"
      >
        <div className="text-center mb-6">
          <h1 className="font-serif text-3xl font-bold text-forest-deep">
            Nueva contraseña
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Crea una clave segura para proteger tu cuenta en ÓrbiKa
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
            Nueva contraseña
          </label>
          <input
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
            Confirmar nueva contraseña
          </label>
          <input
            type="password"
            placeholder="Repite la contraseña"
            value={confirmacion}
            onChange={(e) => setConfirmacion(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-terra text-xs font-semibold bg-terra-pale p-3 rounded-xl">
            {error}
          </p>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={guardando}
          >
            Actualizar contraseña
          </Button>
        </div>

        <div className="mt-6 pt-5 border-t border-sage/30 text-center text-sm text-ink-soft">
          <Link to="/iniciar-sesion" className="text-forest font-semibold hover:underline">
            ← Volver a inicio de sesión
          </Link>
        </div>
      </form>
    </div>
  );
}
