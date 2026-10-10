import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { DEMO_MODE, marketplace, mensajeError } from "../services/marketplace";
import { Button } from "./ui";
import { calcularAhorro, calcularEstadoVencimiento } from "../pages/product.helpers";

const campo =
  "w-full border border-gray-300 rounded-xl px-3.5 py-2.5 mt-1 bg-white text-ink text-sm placeholder:text-ink-soft/40 focus:outline-none focus:ring-2 focus:ring-moss/40 focus:border-moss transition-all";
const etiqueta = "block text-xs font-semibold text-ink-soft uppercase tracking-wider";

const FOTOS_SUGERIDAS = [
  {
    titulo: "Panadería",
    url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80",
  },
  {
    titulo: "Frutas y verduras",
    url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80",
  },
  {
    titulo: "Lácteos y quesos",
    url: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=80",
  },
  {
    titulo: "Comidas preparadas",
    url: "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=800&q=80",
  },
  {
    titulo: "Carnes seleccionadas",
    url: "https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=80",
  },
  {
    titulo: "Pasteles y postres",
    url: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80",
  },
];

export default function ProductForm({ initialValues, onSave, submitLabel = "Guardar producto", editing = false }) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: initialValues,
  });

  const [categorias, setCategorias] = useState([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const fileInputRef = useRef(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState("");

  useEffect(() => {
    if (!archivoFoto) { setVistaPrevia(""); return; }
    const url = URL.createObjectURL(archivoFoto);
    setVistaPrevia(url);
    return () => URL.revokeObjectURL(url);
  }, [archivoFoto]);

  useEffect(() => {
    if (initialValues) reset(initialValues);
  }, [initialValues, reset]);

  useEffect(() => {
    marketplace.listarCategorias().then(setCategorias)
      .catch((err) => setError(mensajeError(err, "No se pudieron cargar las categorías.")));
  }, []);

  const original = watch("precioOriginal");
  const actual = watch("precioActual");
  const fechaVenc = watch("fechaVencimiento");
  const fotoUrl = watch("fotoUrl");

  const ahorro = calcularAhorro(original, actual);
  const vencimiento = fechaVenc ? calcularEstadoVencimiento(fechaVenc) : null;

  function autocompletarDatosDemo() {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const fecha = d.toISOString().slice(0, 10);
    const cat = categorias[0]?.id || 1;

    setValue("nombre", "Pack de Pan Artesanal de Masa Madre (6 u)");
    setValue("descripcion", "Seis panes ciabatta y campesinos horneados hoy en horno de leña de Pocollay. Corteza dorada, miga tierna. Aptos para congelar o disfrutar hoy.");
    setValue("categoriaId", String(cat));
    setValue("precioOriginal", "16.00");
    setValue("precioActual", "8.00");
    setValue("stock", "5");
    setValue("fechaVencimiento", fecha);
    setValue("zona", "Pocollay");
    setValue("modalidadEntrega", "ambas");
    setValue("pesoUnidadKg", "0.8");
    setValue("fotoUrl", FOTOS_SUGERIDAS[0].url);
  }

  function manejarSubidaArchivo(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    if (!["image/jpeg", "image/png"].includes(archivo.type) || archivo.size > 5 * 1024 * 1024) {
      setError("Selecciona una imagen JPG o PNG de hasta 5 MB.");
      e.target.value = "";
      return;
    }
    setError("");
    setArchivoFoto(archivo);
    setValue("fotoUrl", "");
  }

  async function enviar(values) {
    setError("");
    setGuardando(true);
    try {
      let fotoGuardada = values.fotoUrl?.trim() || null;
      if (archivoFoto) {
        fotoGuardada = await marketplace.subirFoto(archivoFoto);
        setValue("fotoUrl", fotoGuardada);
        setArchivoFoto(null);
      }
      await onSave({
        nombre: values.nombre.trim(),
        descripcion: values.descripcion?.trim() || null,
        ...(!editing ? { categoriaId: Number(values.categoriaId), fechaVencimiento: values.fechaVencimiento, pesoUnidadKg: values.pesoUnidadKg ? Number(values.pesoUnidadKg) : null } : {}),
        precioOriginal: Number(values.precioOriginal),
        precioActual: Number(values.precioActual),
        stock: Number(values.stock),
        zona: values.zona.trim(),
        modalidadEntrega: values.modalidadEntrega,
        fotoUrl: fotoGuardada,
      });
    } catch (err) {
      setError(mensajeError(err, "No se pudieron guardar los cambios. Revisa los datos ingresados."));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit(enviar)}
      className="space-y-6 bg-card border border-sage/40 rounded-3xl shadow-card p-6 sm:p-8"
    >
      {/* Botón de Autocompletado rápido para demostración / grabación */}
      {DEMO_MODE && !editing && <div className="bg-amber/15 border border-amber/40 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🪄</span>
          <div>
            <p className="text-xs font-bold text-forest-deep uppercase tracking-wider">
              Asistente de grabación / Prototipo
            </p>
            <p className="text-xs text-ink-soft">
              Llena todos los campos con datos realistas de Tacna en 1 clic.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={autocompletarDatosDemo}
          className="bg-amber hover:bg-amber-deep text-forest-deep text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer shrink-0 focus-visible:ring-2 focus-visible:ring-moss focus:outline-none"
        >
          Autocompletar datos demo
        </button>
      </div>}

      {/* Sección 1: Información básica */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-semibold text-forest-deep pb-2 border-b border-sage/20">
          1. Información del alimento
        </h2>

        <div>
          <label className={etiqueta}>Nombre del producto *</label>
          <input
            className={campo}
            placeholder="Ej. Pan artesanal de masa madre"
            {...register("nombre", { required: "El nombre es obligatorio" })}
          />
          {errors.nombre && (
            <p className="text-terra text-xs mt-1 font-medium">{errors.nombre.message}</p>
          )}
        </div>

        <div>
          <label className={etiqueta}>Descripción o detalles de conservación</label>
          <textarea
            className={campo}
            rows={3}
            placeholder="Describe el estado del producto, ingredientes principales o recomendaciones de consumo…"
            {...register("descripcion")}
          />
        </div>

        <div>
          <label className={etiqueta}>Categoría *</label>
          <select
            className={campo}
            disabled={editing}
            {...register("categoriaId", { required: "Selecciona una categoría" })}
          >
            <option value="">Selecciona una categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {errors.categoriaId && (
            <p className="text-terra text-xs mt-1 font-medium">{errors.categoriaId.message}</p>
          )}
        </div>
      </div>

      {/* Sección 2: Precios y Stock */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-semibold text-forest-deep pb-2 border-b border-sage/20">
          2. Precios y disponibilidad
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={etiqueta}>Precio regular original (S/) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className={campo}
              {...register("precioOriginal", { required: true, min: 0.01 })}
            />
          </div>

          <div>
            <label className={etiqueta}>Precio con descuento ÓrbiKa (S/) *</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className={campo}
              {...register("precioActual", { required: true, min: 0.01 })}
            />
          </div>
        </div>

        {/* Resumen dinámico de descuento */}
        {ahorro.porcentaje > 0 && (
          <div className="bg-moss/10 border border-moss/20 rounded-xl p-3 flex items-center justify-between text-xs text-forest">
            <span>
              Descuento calculado para el comprador: <strong>{ahorro.porcentaje}% OFF</strong>
            </span>
            <span>
              Ahorro: <strong>S/ {ahorro.montoAhorro.toFixed(2)} por unidad</strong>
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={etiqueta}>Unidades disponibles (Stock) *</label>
            <input
              type="number"
              min={editing ? "0" : "1"}
              step="1"
              placeholder="1"
              className={campo}
              {...register("stock", { required: true, min: editing ? 0 : 1 })}
            />
          </div>

          <div>
            <label className={etiqueta}>Fecha de vencimiento *</label>
            <input
              type="date"
              disabled={editing}
              className={campo}
              {...register("fechaVencimiento", { required: true })}
            />
            {vencimiento && (
              <p
                className={`text-xs mt-1.5 font-medium ${
                  vencimiento.esCritico ? "text-terra" : "text-moss"
                }`}
              >
                {vencimiento.texto}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Sección 3: Entrega y Ubicación */}
      <div className="space-y-4">
        <h2 className="font-serif text-lg font-semibold text-forest-deep pb-2 border-b border-sage/20">
          3. Ubicación y entrega
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={etiqueta}>Zona o distrito en Tacna *</label>
            <input
              className={campo}
              placeholder="Ej. Pocollay / Cercado"
              {...register("zona", { required: true })}
            />
          </div>

          <div>
            <label className={etiqueta}>Modalidad de entrega *</label>
            <select className={campo} {...register("modalidadEntrega", { required: true })}>
              <option value="recojo">Solo recojo en tienda</option>
              <option value="coordinada">Solo entrega coordinada</option>
              <option value="ambas">Ambas modalidades (recojo o coordinada)</option>
            </select>
          </div>
        </div>

        <div>
          <label className={etiqueta}>Peso referencial por unidad (kg opcional)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Ej. 0.5"
            className={campo}
            disabled={editing}
            {...register("pesoUnidadKg")}
          />
        </div>
      </div>

      {/* Sección 4: Imagen referencial */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-sage/20">
          <h2 className="font-serif text-lg font-semibold text-forest-deep">
            4. Fotografía del alimento
          </h2>
          <span className="text-xs text-ink-soft">JPG o PNG hasta 5 MB, o URL web</span>
        </div>

        {/* Botón de subida de archivo local */}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={manejarSubidaArchivo}
            className="hidden"
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-paper-warm border border-forest/30 hover:border-forest text-forest-deep text-xs font-semibold px-4 py-2.5 rounded-xl transition-all cursor-pointer focus-visible:ring-2 focus-visible:ring-moss focus:outline-none"
            >
              <svg className="w-4 h-4 text-forest" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Subir imagen desde mi equipo</span>
            </button>

            {(fotoUrl || vistaPrevia) && (
              <button
                type="button"
                onClick={() => { setValue("fotoUrl", ""); setArchivoFoto(null); }}
                className="text-xs text-terra hover:underline px-2 py-1 font-medium cursor-pointer"
              >
                Quitar fotografía
              </button>
            )}
          </div>

          {/* Galería de fotos sugeridas */}
          <div>
            <label className="block text-[11px] font-semibold text-ink-soft uppercase mb-1.5">
              O selecciona una foto rápida de catálogo:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {FOTOS_SUGERIDAS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => { setArchivoFoto(null); setValue("fotoUrl", item.url); }}
                  className={`group relative aspect-square rounded-xl overflow-hidden border transition-all cursor-pointer ${
                    fotoUrl === item.url
                      ? "ring-2 ring-forest border-forest scale-95"
                      : "border-gray-200 hover:border-forest/50"
                  }`}
                  title={item.titulo}
                >
                  <img
                    src={item.url}
                    alt={item.titulo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-forest-deep/80 text-[10px] text-white font-medium p-1 text-center truncate">
                    {item.titulo}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Opción de URL manual */}
          <div>
            <label className={etiqueta}>O ingresa una URL web directa</label>
            <input
              type="text"
              className={campo}
              placeholder="https://ejemplo.com/foto-alimento.jpg"
              {...register("fotoUrl", { onChange: () => setArchivoFoto(null) })}
            />
          </div>

          {(fotoUrl || vistaPrevia) && (
            <div className="flex items-center gap-3 bg-paper-warm p-3 rounded-2xl border border-sage/30 animate-in fade-in">
              <img
                src={vistaPrevia || fotoUrl}
                alt="Vista previa"
                className="w-16 h-16 object-cover rounded-xl shrink-0 border border-gray-200 shadow-xs"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
              <div className="text-xs text-ink-soft">
                <p className="font-semibold text-forest-deep">Fotografía seleccionada correctamente</p>
                <p className="text-[11px]">Se mostrará en la tarjeta de producto del catálogo.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-terra text-sm bg-terra-pale p-3 rounded-xl font-medium">
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
