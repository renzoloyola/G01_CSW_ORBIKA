import { DEMO_MODE } from "../services/marketplace";
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { validarDatosVendedor } from "../context/auth.helpers";
import { Button } from "../components/ui";
import { usePageTitle } from "../hooks/usePageTitle";

export default function Auth({ initialMode = "login" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { iniciarSesion, registrarse } = useAuth();
  const { toast } = useToast();

  // Determinar modo basado en la ruta actual o prop
  const esRutaRegistro = location.pathname === "/registrarse";
  const [modo, setModo] = useState(esRutaRegistro ? "register" : initialMode);
  usePageTitle(modo === "login" ? "Iniciar sesión" : "Crear cuenta");

  useEffect(() => {
    setModo(location.pathname === "/registrarse" ? "register" : "login");
  }, [location.pathname]);

  function cambiarModo(nuevoModo) {
    setModo(nuevoModo);
    navigate(nuevoModo === "register" ? "/registrarse" : "/iniciar-sesion", {
      replace: true,
    });
  }

  // Formulario de Login
  const {
    register: regLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: errorsLogin },
  } = useForm();
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [errorLogin, setErrorLogin] = useState("");

  async function onLogin(datos) {
    setErrorLogin("");
    setCargandoLogin(true);
    try {
      await iniciarSesion(datos.correo, datos.contrasena);
      toast.success("¡Bienvenido de vuelta a ÓrbiKa!");
      navigate("/");
    } catch {
      const msg = "Correo o contraseña incorrectos. Verifica tus credenciales.";
      setErrorLogin(msg);
      toast.error(msg);
    } finally {
      setCargandoLogin(false);
    }
  }

  // Formulario de Register
  const {
    register: regRegister,
    handleSubmit: handleRegisterSubmit,
    watch: watchRegister,
    setValue: setRegisterValue,
    formState: { errors: errorsRegister },
  } = useForm({
    defaultValues: { rol: "comprador" },
  });
  const rol = watchRegister("rol");
  const [cargandoRegister, setCargandoRegister] = useState(false);
  const [errorRegister, setErrorRegister] = useState("");
  const [registroExitoso, setRegistroExitoso] = useState(false);

  async function onRegister(datos) {
    setErrorRegister("");
    const errorVendedor = validarDatosVendedor(datos.rol, datos);
    if (errorVendedor) {
      setErrorRegister(errorVendedor);
      return;
    }

    setCargandoRegister(true);
    try {
      await registrarse(datos);
      setRegistroExitoso(true);
      toast.success("¡Tu cuenta fue creada con éxito!");
      setTimeout(() => {
        setRegistroExitoso(false);
        cambiarModo("login");
      }, 1500);
    } catch (err) {
      const msg = err.message?.includes("already registered")
        ? "Este correo electrónico ya se encuentra registrado."
        : "No se pudo crear la cuenta. Por favor verifica tus datos.";
      setErrorRegister(msg);
      toast.error(msg);
    } finally {
      setCargandoRegister(false);
    }
  }

  if (DEMO_MODE) return <div className="max-w-md mx-auto px-4 py-16 text-center">
    <h1 className="font-serif text-2xl">Demostración de solo lectura</h1>
    <p className="my-4">El registro y el inicio de sesión están deshabilitados en esta demostración.</p>
    <Link to="/catalogo" className="text-forest underline">Explorar catálogo de ejemplo</Link>
  </div>;

  return (
    <div className="max-w-md mx-auto my-8 sm:my-14 px-4 min-w-0">
      <div className="bg-card border border-sage/50 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-xs">
        {/* Decoración ambiental superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-forest via-amber to-moss" />

        {/* Encabezado con isotipo */}
        <div className="text-center mb-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber/20 text-forest-deep mx-auto mb-3 shadow-xs hover:scale-105 transition-transform"
            aria-label="Volver al inicio de ÓrbiKa"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#152A1F"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="M12 21c-4-2-7-6-7-10a7 7 0 0 1 14 0c0 4-3 8-7 10Z" />
              <path d="M12 11v6" />
            </svg>
          </Link>

          <h1 className="font-serif text-3xl font-bold text-forest-deep leading-tight">
            {modo === "login" ? "Iniciar sesión" : "Únete a ÓrbiKa"}
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            {modo === "login"
              ? "Accede a tus compras, ventas y alimentos rescatados"
              : "Crea tu cuenta de comprador o registra tu comercio"}
          </p>
        </div>

        {/* Switch / Slider animado de pestañas */}
        <div className="relative p-1 bg-paper-warm rounded-2xl border border-sage/40 mb-6 flex items-center">
          {/* Fondo deslizante activo */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-forest rounded-xl shadow-md transition-all duration-300 ease-out ${
              modo === "login" ? "left-1" : "left-[calc(50%+2px)]"
            }`}
            aria-hidden="true"
          />

          <button
            type="button"
            role="tab"
            aria-selected={modo === "login"}
            onClick={() => cambiarModo("login")}
            className={`relative z-10 flex-1 py-2.5 text-xs sm:text-sm font-semibold text-center transition-colors duration-200 cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-moss focus:outline-none ${
              modo === "login" ? "text-white" : "text-forest-deep hover:text-forest"
            }`}
          >
            Iniciar sesión
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={modo === "register"}
            onClick={() => cambiarModo("register")}
            className={`relative z-10 flex-1 py-2.5 text-xs sm:text-sm font-semibold text-center transition-colors duration-200 cursor-pointer rounded-xl focus-visible:ring-2 focus-visible:ring-moss focus:outline-none ${
              modo === "register" ? "text-white" : "text-forest-deep hover:text-forest"
            }`}
          >
            Crear cuenta
          </button>
        </div>

        {/* Contenedor animado de formularios */}
        <div className="relative transition-all duration-300">
          {/* VISTA 1: INICIAR SESIÓN */}
          {modo === "login" && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="tu@correo.com"
                    autoComplete="email"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
                    {...regLogin("correo", { required: "El correo es obligatorio" })}
                  />
                  {errorsLogin.correo && (
                    <p role="alert" className="text-terra text-xs mt-1 font-medium">
                      {errorsLogin.correo.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-ink-soft uppercase">
                      Contraseña
                    </label>
                    <Link
                      to="/recuperar-contrasena"
                      className="text-xs text-moss hover:text-forest underline"
                    >
                      ¿La olvidaste?
                    </Link>
                  </div>
                  <input
                    type="password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
                    {...regLogin("contrasena", { required: "La contraseña es obligatoria" })}
                  />
                  {errorsLogin.contrasena && (
                    <p role="alert" className="text-terra text-xs mt-1 font-medium">
                      {errorsLogin.contrasena.message}
                    </p>
                  )}
                </div>

                {errorLogin && (
                  <p role="alert" className="text-terra text-xs font-semibold bg-terra-pale p-3 rounded-xl">
                    {errorLogin}
                  </p>
                )}

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={cargandoLogin}
                  >
                    Ingresar a mi cuenta
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* VISTA 2: CREAR CUENTA */}
          {modo === "register" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {registroExitoso ? (
                <div className="py-8 text-center space-y-3 animate-in fade-in">
                  <div className="w-14 h-14 bg-moss/20 text-moss rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 className="font-serif text-xl font-bold text-forest-deep">
                    ¡Cuenta creada exitosamente!
                  </h2>
                  <p className="text-xs text-ink-soft">
                    Pasando al inicio de sesión…
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-4">
                  {/* Selector de rol Comprador / Vendedor */}
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase mb-1.5">
                      ¿Qué tipo de cuenta deseas?
                    </label>
                    <div
                      className="grid grid-cols-2 gap-2 p-1 bg-paper-warm rounded-2xl border border-gray-300"
                      role="radiogroup"
                      aria-label="Selecciona tu tipo de cuenta"
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={rol === "comprador"}
                        onClick={() => setRegisterValue("rol", "comprador")}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-moss focus:outline-none ${
                          rol === "comprador"
                            ? "bg-forest text-white shadow-xs"
                            : "text-forest-deep hover:bg-sage/30"
                        }`}
                      >
                        Comprador
                      </button>

                      <button
                        type="button"
                        role="radio"
                        aria-checked={rol === "vendedor"}
                        onClick={() => setRegisterValue("rol", "vendedor")}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-moss focus:outline-none ${
                          rol === "vendedor"
                            ? "bg-forest text-white shadow-xs"
                            : "text-forest-deep hover:bg-sage/30"
                        }`}
                      >
                        Comercio / Vendedor
                      </button>
                    </div>
                    <input type="hidden" {...regRegister("rol")} />


                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Carmen Mendoza"
                      autoComplete="name"
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
                      {...regRegister("nombre", { required: "El nombre es obligatorio" })}
                    />
                    {errorsRegister.nombre && (
                      <p role="alert" className="text-terra text-xs mt-1 font-medium">
                        {errorsRegister.nombre.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      placeholder="tu@correo.com"
                      autoComplete="email"
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
                      {...regRegister("correo", { required: "El correo es obligatorio" })}
                    />
                    {errorsRegister.correo && (
                      <p role="alert" className="text-terra text-xs mt-1 font-medium">
                        {errorsRegister.correo.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      placeholder="Mínimo 8 caracteres"
                      autoComplete="new-password"
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
                      {...regRegister("contrasena", {
                        required: "La contraseña es obligatoria",
                        minLength: { value: 8, message: "Mínimo 8 caracteres" },
                      })}
                    />
                    {errorsRegister.contrasena && (
                      <p role="alert" className="text-terra text-xs mt-1 font-medium">
                        {errorsRegister.contrasena.message}
                      </p>
                    )}
                  </div>

                  {/* Campos si es vendedor */}
                  {rol === "vendedor" && (
                    <div className="space-y-3 bg-paper-warm/80 border border-sage/40 rounded-2xl p-4 animate-in fade-in">
                      <span className="block text-xs font-bold text-forest-deep uppercase">
                        Datos del comercio en Tacna
                      </span>

                      <div>
                        <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                          Nombre del negocio *
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Panadería San Martín"
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-moss/40"
                          {...regRegister("nombreNegocio", {
                            required: rol === "vendedor" ? "El nombre del negocio es obligatorio" : false,
                          })}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                          Ubicación o zona comercial *
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. Calle San Martín 450, Cercado"
                          className="w-full border border-gray-300 rounded-xl px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-moss/40"
                          {...regRegister("ubicacion", {
                            required: rol === "vendedor" ? "La ubicación es obligatoria" : false,
                          })}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-ink-soft uppercase mb-1">
                      Teléfono de contacto (opcional)
                    </label>
                    <input
                      type="tel"
                      placeholder="Ej. 952123456"
                      autoComplete="tel"
                      className="w-full border border-gray-300 rounded-xl px-3.5 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss"
                      {...regRegister("telefono")}
                    />
                  </div>

                  {errorRegister && (
                    <p role="alert" className="text-terra text-xs font-semibold bg-terra-pale p-3 rounded-xl">
                      {errorRegister}
                    </p>
                  )}

                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={cargandoRegister}
                    >
                      Completar registro
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
