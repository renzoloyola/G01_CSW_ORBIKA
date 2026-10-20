import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import * as productoController from "../controllers/producto.controller.js";

const router = Router();

// CU-03 / CU-04: públicos, cualquier visitante puede buscar y ver productos.
router.get("/", productoController.listar);
router.get("/:id", productoController.obtener);

// CU-07 / CU-19: solo vendedores autenticados.
router.post("/", requireAuth, requireRole("vendedor"), productoController.publicar);
router.put("/:id", requireAuth, requireRole("vendedor"), productoController.editar);

export default router;
