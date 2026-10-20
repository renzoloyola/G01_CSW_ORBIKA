import { api } from "./api";
import { supabase } from "./supabaseClient";
import { PRODUCTOS_MOCK, PEDIDOS_MOCK, CATEGORIAS_MOCK } from "../data/mockProducts";

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export function createMarketplace({ client, loadCategories, demo = false }) {
  function requireLive() {
    if (demo) throw new Error("La demostración es de solo lectura. No se registran operaciones.");
  }
  return {
    async listarProductos(f = {}) {
      if (!demo) return (await client.get("/productos", { params: f })).data;
      return PRODUCTOS_MOCK.filter((p) =>
        (!f.busqueda || p.nombre.toLowerCase().includes(f.busqueda.toLowerCase())) &&
        (!f.categoriaId || p.categoria_id === Number(f.categoriaId)) &&
        (!f.zona || p.zona.toLowerCase() === f.zona.toLowerCase()) &&
        (!f.maxPrecio || Number(p.precio_actual) <= Number(f.maxPrecio))
      ).sort((a, b) => f.orden === "precio_asc" ? a.precio_actual - b.precio_actual
        : f.orden === "mayor_descuento" ? b.descuento_pct - a.descuento_pct : b.id - a.id);
    },
    async obtenerProducto(id) {
      if (!demo) return (await client.get(`/productos/${id}`)).data;
      const product = PRODUCTOS_MOCK.find((p) => String(p.id) === String(id));
      if (!product) throw new Error("Producto no encontrado.");
      return product;
    },
    async listarPedidos() {
      return demo ? PEDIDOS_MOCK : (await client.get("/pedidos")).data;
    },
    async listarCategorias() {
      return demo ? CATEGORIAS_MOCK : loadCategories();
    },
    async comprarProducto(datos) {
      requireLive();
      return (await client.post("/pedidos", datos)).data;
    },
    async publicarProducto(datos) {
      requireLive();
      return (await client.post("/productos", datos)).data;
    },
    async editarProducto(id, datos) {
      requireLive();
      return (await client.put(`/productos/${id}`, datos)).data;
    },
    async subirFoto(file) {
      requireLive();
      const { data } = await client.post("/imagenes", file, {
        headers: { "Content-Type": file.type },
        timeout: 30000,
      });
      return data.url;
    },
  };
}

export const marketplace = createMarketplace({
  client: api,
  demo: DEMO_MODE,
  loadCategories: async () => {
    const { data, error } = await supabase.from("categorias")
      .select("id, nombre").eq("activa", true).order("nombre");
    if (error) throw new Error("No se pudieron cargar las categorías.");
    return data || [];
  },
});

export function mensajeError(error, fallback) {
  return error.response?.data?.error || error.message || fallback;
}
