import { Router } from "express";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";
import * as pedidoController from "../controllers/pedido.controller.js";

const router = Router();

// Todas las operaciones de pedidos requieren sesión iniciada.
router.use(requireAuth);

router.post("/", requireRole("comprador"), pedidoController.crear); // CU-05
router.get("/", pedidoController.misPedidos); // CU-08
router.patch("/:id/cancelar", requireRole("comprador"), pedidoController.cancelar); // CU-17
router.patch("/:id/estado", requireRole("comprador", "vendedor"), pedidoController.actualizarEstado); // CU-08 (vendedor)
router.post("/:id/calificacion", requireRole("comprador"), pedidoController.calificar); // CU-06

export default router;
