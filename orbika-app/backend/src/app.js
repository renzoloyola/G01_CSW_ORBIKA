import express from "express";
import cors from "cors";
import productoRoutes from "./routes/producto.routes.js";
import imagenRoutes from "./routes/imagen.routes.js";
import pedidoRoutes from "./routes/pedido.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
  app.use("/api/imagenes", imagenRoutes);
  app.use(express.json({ limit: "100kb" }));
  app.get("/api/salud", (_req, res) => res.json({ ok: true, servicio: "ÓrbiKa API" }));
  app.use("/api/productos", productoRoutes);
  app.use("/api/pedidos", pedidoRoutes);
  app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada.", code: "NOT_FOUND" }));
  app.use(errorHandler);
  return app;
}

