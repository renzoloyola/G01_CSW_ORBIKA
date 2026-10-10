import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { Button } from "../components/ui";

export default function RecoverPassword() {
  const { register, handleSubmit } = useForm();
  const { recuperarContrasena } = useAuth();
  const { toast } = useToast();
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  async function alEnviar({ correo }) {
    setCargando(true);
    try {
      await recuperarContrasena(correo);
    } finally {
      setCargando(false);
      const msg = "Si el correo está registrado, te hemos enviado un enlace para restablecer tu contraseña.";
      setMensaje(msg);
      toast.info(msg);
    }
  }

  return (
    <div className="max-w-md mx-auto my-12 sm:my-16 px-4">
      <div className="bg-card border border-sage/40 rounded-3xl shadow-card p-6 sm:p-8">
        <div className="text-center mb-6">
          <h1 className="font-serif text-3xl font-bold text-forest-deep">
            Recuperar contraseña
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Ingresa tu correo para recibir un enlace de recuperación
          </p>
        </div>

        <form onSubmit={handleSubmit(alEnviar)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
              Correo electrónico registrado
            </label>
            <input
              type="email"
              placeholder="tu@correo.com"
              className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
              {...register("correo", { required: true })}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={cargando}
            >
              Enviar enlace de recuperación
            </Button>
          </div>

          {mensaje && (
            <div
              role="status"
              aria-live="polite"
              className="p-3.5 bg-moss/15 border border-moss/30 rounded-xl text-forest text-xs sm:text-sm font-medium mt-3"
            >
              {mensaje}
            </div>
          )}
        </form>

        <div className="mt-6 pt-5 border-t border-sage/30 text-center text-sm text-ink-soft">
          <Link to="/iniciar-sesion" className="text-forest font-semibold hover:underline">
            ← Volver a inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
