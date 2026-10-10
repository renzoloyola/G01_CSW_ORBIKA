import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { DEMO_MODE } from "../services/marketplace";
import { normalizarRolPublico, rutaRecuperacion } from "./auth.helpers";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(DEMO_MODE ? { user: { id: "comprador-demo" } } : null);
  const [perfil, setPerfil] = useState(DEMO_MODE ? { id: "comprador-demo", nombre: "Cuenta de demostración", rol: "comprador" } : null);
  const [cargando, setCargando] = useState(!DEMO_MODE);
  const [sesionResuelta, setSesionResuelta] = useState(DEMO_MODE);

  useEffect(() => {
    if (DEMO_MODE) return;
    supabase.auth.getSession().then(({ data }) => {
      setSesionResuelta(true);
      setSession(data.session);
      if (!data.session) setCargando(false);
    });

    // Se actualiza solo cuando Supabase renueva o cierra la sesión.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nuevaSesion) => {
      setCargando(true);
      setSesionResuelta(true);
      setSession(nuevaSesion);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (DEMO_MODE || !sesionResuelta) return;
    if (!session?.user) {
      setPerfil(null);
      setCargando(false);
      return;
    }
    let cancelado = false;
    setCargando(true);
    supabase.from("perfiles").select("*").eq("id", session.user.id).single()
      .then(({ data }) => { if (!cancelado) setPerfil(data); })
      .catch(() => { if (!cancelado) setPerfil(null); })
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [session, sesionResuelta]);

  function exigirModoNormal() {
    if (DEMO_MODE) throw new Error("La demostración es de solo lectura.");
  }

  // CU-01: Registrar usuario. El rol y el nombre quedan en user_metadata;
  // el trigger manejar_nuevo_usuario() de Supabase crea la fila en "perfiles".
  async function registrarse({ nombre, correo, contrasena, rol, telefono, nombreNegocio, ubicacion }) {
    exigirModoNormal();
    const { error } = await supabase.auth.signUp({
      email: correo,
      password: contrasena,
      options: { data: {
        nombre,
        rol: normalizarRolPublico(rol),
        telefono,
        nombre_negocio: nombreNegocio?.trim() || null,
        ubicacion: ubicacion?.trim() || null,
      } },
    });
    if (error) throw error;
  }

  // CU-02: Iniciar sesión.
  async function iniciarSesion(correo, contrasena) {
    exigirModoNormal();
    const { error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena });
    if (error) throw error;
  }

  // CU-02: Cerrar sesión.
  async function cerrarSesion() {
    exigirModoNormal();
    await supabase.auth.signOut();
  }

  // CU-13: Recuperar contraseña (Supabase Auth envía el correo).
  async function recuperarContrasena(correo) {
    exigirModoNormal();
    const { error } = await supabase.auth.resetPasswordForEmail(correo, {
      redirectTo: rutaRecuperacion(),
    });
    if (error) throw error;
  }

  async function actualizarContrasena(contrasena) {
    exigirModoNormal();
    const { error } = await supabase.auth.updateUser({ password: contrasena });
    if (error) throw error;
    const { error: cierreError } = await supabase.auth.signOut({ scope: "global" });
    if (cierreError) throw cierreError;
  }

  const value = {
    session,
    usuario: session?.user ?? null,
    perfil,
    cargando,
    registrarse,
    iniciarSesion,
    cerrarSesion,
    recuperarContrasena,
    actualizarContrasena,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
