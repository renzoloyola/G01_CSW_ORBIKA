import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { DEMO_MODE, mensajeError } from "../services/marketplace";
import { Button, StatePanel } from "../components/ui";
import { usePageTitle } from "../hooks/usePageTitle";
import { api } from "../services/api";

export default function Profile() {
  // La clave del perfil reinicia los campos al cambiar de cuenta.
  const { perfil, guardarPerfil } = useAuth();
  usePageTitle("Mi perfil");
  if (!perfil) return <StatePanel type="error" title="No se pudo cargar tu perfil" description="Vuelve a iniciar sesión para reintentar." />;
  return <ProfileForm key={perfil.id} perfil={perfil} guardar={guardarPerfil} />;
}

function ProfileForm({ perfil, guardar }) {
  const campos = [{ id: "nombre", label: "Nombre completo", max: 100, required: true },
    { id: "telefono", label: "Teléfono", max: 30, type: "tel" },
    { id: "direccion", label: "Dirección (opcional)", max: 300 },
    ...(perfil.rol === "vendedor" ? [{ id: "nombre_negocio", label: "Nombre del negocio", max: 150, required: true },
      { id: "ubicacion", label: "Ubicación del negocio", max: 200 }] : [])];
  const [datos, setDatos] = useState(() => Object.fromEntries(campos.map(c => [c.id, perfil[c.id] || ""])));
  const [ocupado, setOcupado] = useState(false);
  const [foto, setFoto] = useState(null);
  const [fotoUrl, setFotoUrl] = useState(perfil.foto_url || "");
  const enviando = useRef(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  async function enviar(event) {
    // Sube la imagen elegida y guarda su URL junto con el resto de datos.
    event.preventDefault();
    if (enviando.current || DEMO_MODE) return;
    enviando.current = true; setOcupado(true); setError(""); setExito(false);
    try {
      let url = fotoUrl;
      if (foto) {
        const { data } = await api.post("/perfil/foto", foto, { headers: { "Content-Type": foto.type }, timeout: 30000 });
        url = data.url; setFotoUrl(url); setFoto(null);
      }
      const actualizado = await guardar({ ...datos, foto_url: url || null });
      setDatos(Object.fromEntries(campos.map(c => [c.id, actualizado[c.id] || ""])));
      setExito(true);
    } catch (err) { setError(mensajeError(err, "No se pudo guardar el perfil.")); }
    finally { enviando.current = false; setOcupado(false); }
  }
  return <section className="max-w-xl mx-auto px-4 py-10">
    <h1 className="font-serif text-3xl text-forest-deep mb-2">Mi perfil</h1>
    <p className="text-ink-soft mb-6">Actualiza tus datos de contacto{perfil.rol === "vendedor" ? " y los de tu negocio" : ""}.</p>
    <form onSubmit={enviar} className="bg-card border border-sage/40 rounded-2xl p-6 space-y-5">
      <p className="text-sm text-ink-soft break-all">{perfil.correo} · {perfil.rol}</p>
      <fieldset disabled={ocupado || DEMO_MODE} className="space-y-4">
        {fotoUrl && <img src={fotoUrl} alt="Foto de perfil" className="w-24 h-24 rounded-full object-cover" />}
        <label className="block text-sm font-semibold">Fotografía opcional (JPG/PNG, hasta 5 MB)
          <input type="file" accept="image/jpeg,image/png" className="block w-full text-sm mt-2" onChange={e => {
            const file = e.target.files?.[0]; setExito(false);
            if (file && (!["image/jpeg", "image/png"].includes(file.type) || file.size > 5 * 1024 * 1024)) {
              setError("Selecciona una imagen JPG/PNG de hasta 5 MB."); e.target.value = ""; setFoto(null); return;
            }
            setError(""); setFoto(file || null);
          }} />
        </label>
        {campos.map(c => <div key={c.id}>
          <label htmlFor={`perfil-${c.id}`} className="block text-sm font-semibold mb-1">{c.label}</label>
          <input id={`perfil-${c.id}`} name={c.id} type={c.type || "text"} required={c.required} maxLength={c.max}
            value={datos[c.id]} onChange={e => { setDatos({ ...datos, [c.id]: e.target.value }); setExito(false); }}
            className="w-full border border-sage rounded-xl px-3 py-2 bg-white text-ink" />
        </div>)}
      </fieldset>
      {error && <p role="alert" className="text-terra">{error}</p>}
      {exito && <p role="status" className="text-forest">Tu perfil se actualizó correctamente.</p>}
      {/* El botón muestra el guardado en curso y queda inactivo en modo demo. */}
      <Button type="submit" loading={ocupado} disabled={DEMO_MODE}>Guardar cambios</Button>
    </form>
  </section>;
}
