import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import { marketplace } from "../services/marketplace";
import { useToast } from "../context/ToastContext";
import { StatePanel, SkeletonBase } from "../components/ui";
import { usePageTitle } from "../hooks/usePageTitle";

export default function EditProduct() {
  usePageTitle("Editar alimento");
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [valores, setValores] = useState(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    setError("");
    marketplace.obtenerProducto(id)
      .then((p) => {
        setValores({
          nombre: p.nombre,
          descripcion: p.descripcion || "",
          categoriaId: p.categoria_id,
          precioOriginal: p.precio_original,
          precioActual: p.precio_actual,
          stock: p.stock,
          fechaVencimiento: p.fecha_vencimiento,
          pesoUnidadKg: p.peso_unidad_kg || "",
          zona: p.zona,
          modalidadEntrega: p.modalidad_entrega,
          fotoUrl: p.foto_url || "",
        });
      })
      .catch(() => setError("No se pudo cargar la información del producto a editar."))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
        <SkeletonBase className="h-8 w-48" />
        <SkeletonBase className="h-4 w-72" />
        <SkeletonBase className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (error || !valores) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <StatePanel
          type="error"
          title="No se pudo cargar el producto"
          description={error}
          actionLabel="Volver al catálogo"
          onAction={() => navigate("/")}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-moss uppercase tracking-wider">
            Gestión de inventario
          </span>
          <h1 className="font-serif text-3xl font-bold text-forest-deep mt-1">
            Editar producto
          </h1>
        </div>
        <Link
          to={`/productos/${id}`}
          className="text-xs font-semibold text-moss hover:underline"
        >
          Ver producto publicado →
        </Link>
      </div>

      <ProductForm
        initialValues={valores}
        editing
        submitLabel="Guardar cambios"
        onSave={async (datos) => {
          await marketplace.editarProducto(id, datos);
          toast.success("¡Cambios del producto guardados con éxito!");
          navigate(`/productos/${id}`);
        }}
      />
    </div>
  );
}
