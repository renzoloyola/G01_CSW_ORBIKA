import { useNavigate } from "react-router-dom";
import ProductForm from "../components/ProductForm";
import { marketplace } from "../services/marketplace";
import { useToast } from "../context/ToastContext";
import { usePageTitle } from "../hooks/usePageTitle";

const inicial = {
  modalidadEntrega: "recojo",
  stock: 1,
};

export default function PublishProduct() {
  usePageTitle("Publicar alimento");
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-6">
        <span className="text-xs font-semibold text-moss uppercase tracking-wider">
          Vendedor
        </span>
        <h1 className="font-serif text-3xl font-bold text-forest-deep mt-1">
          Publicar nuevo alimento
        </h1>
        <p className="text-ink-soft text-sm mt-1">
          Ofrece tus excedentes o alimentos cercanos a la fecha de vencimiento a la comunidad de Tacna.
        </p>
      </div>

      <ProductForm
        initialValues={inicial}
        submitLabel="Publicar en el catálogo"
        onSave={async (datos) => {
          await marketplace.publicarProducto(datos);
          toast.success("¡Producto publicado exitosamente en el catálogo!");
          navigate("/catalogo");
        }}
      />
    </div>
  );
}
